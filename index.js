const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan"); // ✅ Optional logging
require("dotenv").config();

const app = express();

// ✅ MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ✅ Optional Logging Middleware
app.use(morgan("dev")); // Logs method, URL, and response time

// ✅ Rate Limiting: Protect login routes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 10,
  message: "⚠ Too many login attempts. Please try again later."
});
app.use("/admin-portal-1024/login-secret", loginLimiter);

// ✅ Session: Persistent & secure
app.use(session({
  secret: process.env.SESSION_SECRET || "keyboard_cat",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // true in production (HTTPS)
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000 // ✅ 7 days persistence
  }
}));

// ✅ Core Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ Views and static
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// ✅ Routes
const paymentRoutes = require("./routes/payments.routes");
const adminRoutes = require("./routes/admin.routes");

app.use("/api", paymentRoutes);
app.use("/admin-portal-1024", adminRoutes);

// ✅ Page Routes
app.get("/", (req, res) => res.render("home"));
app.get("/product", (req, res) => res.render("product"));
app.get("/form", (req, res) => res.render("form"));
app.get("/about", (req, res) => res.render("about"));
app.get("/reviews", (req, res) => res.render("reviews"));
app.get("/T&C", (req, res) => res.render("T&C"));

// ✅ 404 Handler
app.use((req, res) => {
  res.status(404).render("404", { title: "Page Not Found" });
});

// ✅ Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
