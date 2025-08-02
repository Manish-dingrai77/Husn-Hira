const Order = require("../models/order");
const mongoose = require("mongoose");
const { createRazorpayInstance } = require("../config/razorpay.config");
const crypto = require("crypto");
require("dotenv").config();

const razorpayInstance = createRazorpayInstance();

const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;

// Middleware to check login
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.adminLoggedIn) return next();
  return res.redirect("/admin-portal-1024/login-secret");
};

// Helper for escaping regex input
const escapeRegex = (str) => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

// Razorpay: Create order
exports.createOrder = async (req, res) => {
  const { name, address, mobile_number, alternate_number, coupon } = req.body;

  try {
    if (!name || !address || !mobile_number) {
      return res.status(400).json({ success: false, msg: "Missing required fields" });
    }

    let amount = 249;
    if (coupon && coupon.toUpperCase() === "HUSN40") {
      amount = Math.floor(amount * 0.6);
    }

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);
    return res.status(200).json(order);
  } catch (err) {
    console.error("❌ Razorpay order creation failed:", err);
    return res.status(500).json({ success: false, msg: "Failed to create Razorpay order" });
  }
};

// Razorpay: Verify payment & save to DB
exports.verifyPayment = async (req, res) => {
  const {
    name,
    address,
    mobile_number,
    alternate_number,
    coupon,
    order_id,
    payment_id,
    signature,
  } = req.body;

  try {
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${order_id}|${payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== signature) {
      return res.status(400).json({ success: false, msg: "Invalid Payment Signature" });
    }

    const newOrder = new Order({
      name,
      address,
      mobile_number,
      alternate_number,
      coupon,
      order_id,
      payment_id,
      status: "pending",
      date: new Date(),
    });

    await newOrder.save();
    return res.status(200).json({ success: true, msg: "Payment verified and order saved successfully" });
  } catch (err) {
    console.error("❌ Payment verification or DB save failed:", err);
    return res.status(500).json({ success: false, msg: "Server error while verifying payment or saving order" });
  }
};

// Admin login screen
exports.getLoginPage = (req, res) => {
  res.render("login", { error: null });
};

// Admin login handler
exports.login = (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.adminLoggedIn = true;
    return res.redirect("/admin-portal-1024/dashboard");
  }
  res.render("login", { error: "Invalid credentials" });
};

// Logout
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin-portal-1024/login-secret");
  });
};

// GET: Pending Orders with optional search + date
exports.getDashboard = async (req, res) => {
  try {
    const { search, date } = req.query;
    const query = { status: "pending" };

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [
        { name: regex },
        { mobile_number: regex },
        { order_id: regex }
      ];
    }

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.date = { $gte: start, $lt: end };
    }

    const orders = await Order.find(query).sort({ date: -1 });
    res.render("dashboard", { orders, currentTab: "pending", search, selectedDate: date });
  } catch (err) {
    console.error("❌ Failed to fetch pending orders:", err);
    res.status(500).send("Failed to fetch orders");
  }
};

// GET: Delivering Orders with optional search + date
exports.getDeliveringOrders = async (req, res) => {
  try {
    const { search, date } = req.query;
    const query = { status: "delivering" };

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [
        { name: regex },
        { mobile_number: regex },
        { order_id: regex }
      ];
    }

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.date = { $gte: start, $lt: end };
    }

    const orders = await Order.find(query).sort({ date: -1 });
    res.render("dashboard", { orders, currentTab: "delivering", search, selectedDate: date });
  } catch (err) {
    console.error("❌ Failed to fetch delivering orders:", err);
    res.status(500).send("Failed to fetch delivering orders");
  }
};

// GET: Done Orders with optional search + date
exports.getDoneOrders = async (req, res) => {
  try {
    const { search, date } = req.query;
    const query = { status: "done" };

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [
        { name: regex },
        { mobile_number: regex },
        { order_id: regex }
      ];
    }

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.date = { $gte: start, $lt: end };
    }

    const orders = await Order.find(query).sort({ date: -1 });
    res.render("dashboard", { orders, currentTab: "done", search, selectedDate: date });
  } catch (err) {
    console.error("❌ Failed to fetch history orders:", err);
    res.status(500).send("Failed to fetch completed orders");
  }
};

// Cancel Order
exports.cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).send("Invalid order ID");
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).send("Order not found");

    const redirectPath = getRedirectPath(order.status);
    await Order.findByIdAndDelete(orderId);
    res.redirect(redirectPath);
  } catch (err) {
    console.error("❌ Failed to cancel order:", err);
    res.status(500).send("Failed to cancel order");
  }
};

// Move to Delivering
exports.markAsDelivering = async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).send("Invalid order ID");
    }

    await Order.findByIdAndUpdate(orderId, { status: "delivering" });
    res.redirect("/admin-portal-1024/dashboard");
  } catch (err) {
    console.error("❌ Failed to mark as delivering:", err);
    res.status(500).send("Failed to update order status");
  }
};

// Mark as Done
exports.markAsDone = async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).send("Invalid order ID");
    }

    await Order.findByIdAndUpdate(orderId, { status: "done" });
    res.redirect("/admin-portal-1024/delivering");
  } catch (err) {
    console.error("❌ Failed to mark as done:", err);
    res.status(500).send("Failed to mark order as done");
  }
};

// Delete from History
exports.deleteFromHistory = async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).send("Invalid order ID");
    }

    await Order.findByIdAndDelete(orderId);
    res.redirect("/admin-portal-1024/history");
  } catch (err) {
    console.error("❌ Failed to delete from history:", err);
    res.status(500).send("Failed to delete order from history");
  }
};

// ✅ Clear Entire History
exports.clearHistory = async (req, res) => {
  try {
    await Order.deleteMany({ status: "done" });
    res.redirect("/admin-portal-1024/history");
  } catch (err) {
    console.error("❌ Failed to clear history:", err);
    res.status(500).send("Failed to clear history");
  }
};

// Redirect Helper
function getRedirectPath(status) {
  switch (status) {
    case "delivering":
      return "/admin-portal-1024/delivering";
    case "done":
      return "/admin-portal-1024/history";
    default:
      return "/admin-portal-1024/dashboard";
  }
}
