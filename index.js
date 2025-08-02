const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const dotenv = require("dotenv");
const Joi = require("joi");
const helmet = require("helmet");
const MongoStore = require("connect-mongo");
const sanitize = require("./middlewares/sanitize");

dotenv.config();
const app = express();

// ✅ Trust proxy for Render deployment
app.set("trust proxy", 1);

// ✅ Step 1: Validate Environment Variables
const envSchema = Joi.object({
  MONGO_URI: Joi.string().required(),
  SESSION_SECRET: Joi.string().min(10).required(),
  NODE_ENV: Joi.string().valid("development", "production").default("development"),
  PORT: Joi.number().default(8080),
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);
if (error) {
  console.error("❌ Invalid .env configuration:", error.message);
  process.exit(1);
}

// ✅ Step 2: Connect MongoDB
mongoose.connect(envVars.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ✅ Step 3: Logging
app.use(morgan("dev"));

// ✅ Step 4: Helmet
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// ✅ Step 5: Rate Limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "⚠ Too many login attempts. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/admin-portal-1024/login-secret", loginLimiter);

// ✅ Step 6: Session Handling
app.use(session({
  secret: envVars.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  store: MongoStore.create({
    mongoUrl: envVars.MONGO_URI,
    collectionName: "adminSessions",
    ttl: 7 * 24 * 60 * 60
  }),
  cookie: {
    httpOnly: true,
    secure: envVars.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

// ✅ Step 7: Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(sanitize); // custom sanitization logic

// ✅ Step 8: Static Files & Views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// ✅ Step 9: Routes
const paymentRoutes = require("./routes/payments.routes");
const adminRoutes = require("./routes/admin.routes");

app.use("/api", paymentRoutes);
app.use("/admin-portal-1024", adminRoutes);

// ✅ Step 10: Page Routes
app.get("/", (req, res) => res.render("home"));
app.get("/product", (req, res) => res.render("product"));
app.get("/form", (req, res) => res.render("form"));
app.get("/about", (req, res) => res.render("about"));
app.get("/reviews", (req, res) => res.render("reviews"));
app.get("/T&C", (req, res) => res.render("T&C"));

// ✅ Step 11: Health Check
app.get("/health", (req, res) => res.send("OK"));

// ✅ Step 12: 404 Fallback
app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API route not found" });
  }
  res.status(404).render("404", { title: "Page Not Found" });
});

// ✅ Step 13: Start Server
const PORT = envVars.PORT;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
