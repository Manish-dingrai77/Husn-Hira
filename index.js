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

const sanitize = require("./middlewares/sanitize"); // custom sanitizer

dotenv.config();
const app = express();

// ✅ Step 1: Validate .env Variables
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

// ✅ Step 4: Helmet (CSP & Cross-Origin Relaxed)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false // 🔥 Important for Razorpay Netbanking
}));

// ✅ Step 5: Rate Limiting on Admin Login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "⚠ Too many login attempts. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/admin-portal-1024/login-secret", loginLimiter);

// ✅ Step 6: Session Handling (SameSite = lax)
app.use(session({
  secret: envVars.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  store: MongoStore.create({
    mongoUrl: envVars.MONGO_URI,
    collectionName: "adminSessions",
    ttl: 7 * 24 * 60 * 60 // 7 days
  }),
  cookie: {
    httpOnly: true,
    secure: envVars.NODE_ENV === "production",
    sameSite: "lax", // 🔥 Fix for Razorpay net banking redirects
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

// ✅ Step 7: Parsing and Sanitizing Input
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true // 🔥 Important for session/cookie flows
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(sanitize); // 👈 custom input sanitizer

// ✅ Step 8: Views and Static Files
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// ✅ Step 9: Routes
const paymentRoutes = require("./routes/payments.routes");
const adminRoutes = require("./routes/admin.routes");

app.use("/api", paymentRoutes);
app.use("/admin-portal-1024", adminRoutes);

// ✅ Step 10: Frontend Pages
app.get("/", (req, res) => res.render("home"));
app.get("/product", (req, res) => res.render("product"));
app.get("/form", (req, res) => res.render("form"));
app.get("/about", (req, res) => res.render("about"));
app.get("/reviews", (req, res) => res.render("reviews"));
app.get("/T&C", (req, res) => res.render("T&C"));

// ✅ Step 11: 404 Page
app.use((req, res) => {
  res.status(404).render("404", { title: "Page Not Found" });
});

// ✅ Step 12: Start Server
const PORT = envVars.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
