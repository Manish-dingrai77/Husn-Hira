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
const otpRoutes = require("./routes/otp.routes");

const sanitize = require("./middlewares/sanitize"); // custom sanitizer

dotenv.config();
const app = express();

// ✅ Step 1: Validate .env Variables
const envSchema = Joi.object({
  MONGO_URI: Joi.string().required(),
  SESSION_SECRET: Joi.string().min(10).required(),
  NODE_ENV: Joi.string().valid("development", "production").default("development"),
  PORT: Joi.number().default(8080),
  RAZORPAY_KEY_ID: Joi.string().required(), // ✅ Razorpay Key validation
  RAZORPAY_KEY_SECRET: Joi.string().required()
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);
if (error) {
  console.error("❌ Invalid .env configuration:", error.message);
  process.exit(1);
}

// ✅ Step 2: Connect MongoDB
mongoose.connect(envVars.MOGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ✅ Step 3: Logging (Only in dev)
if (envVars.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ✅ Step 4: Security Headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false // ✅ Important for Razorpay
}));

app.set('trust proxy', 1); 

// ✅ Step 5: Admin Login Rate Limit
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "⚠ Too many login attempts. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/admin-portal-1024/login-secret", loginLimiter);

// ✅ Step 6: Session with MongoStore
app.use(session({
  name: "hh_admin_sid",
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
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

// ✅ Step 7: Request Parsing and CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(sanitize);

// ✅ Step 8: Views and Static Files
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// ✅ Step 9: Routes
const paymentRoutes = require("./routes/payments.routes");
const adminRoutes = require("./routes/admin.routes");

app.use("/api", paymentRoutes);
app.use("/admin-portal-1024", adminRoutes);
app.use("/api", otpRoutes);

// ✅ Step 10: Static Frontend Pages with Razorpay Key
app.get("/", (req, res) => res.render("home"));
app.get("/product", (req, res) => res.render("product"));
app.get("/form", (req, res) => res.render("form", {
  razorpayKey: envVars.RAZORPAY_KEY_ID // ✅ Inject into EJS template
}));
app.get("/about", (req, res) => res.render("about"));
app.get("/reviews", (req, res) => res.render("reviews"));
app.get("/T&C", (req, res) => res.render("T&C"));

// ✅ Step 11: 404 Page
app.use((req, res) => {
  res.status(404).render("404", { title: "Page Not Found" });
});

// ✅ Step 12: Central Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err.stack || err);
  res.status(500).render("500", { title: "Internal Server Error" });
});

// ✅ Step 13: Start Server
const PORT = envVars.PORT || process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
