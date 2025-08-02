const { createRazorpayInstance } = require("../config/razorpay.config");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const Order = require("../models/order"); // Make sure this path is correct
require("dotenv").config();

const razorpayInstance = createRazorpayInstance();

// ✅ Create Razorpay Order
exports.createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, address, mobile_number, alternate_number, coupon } = req.body;

  try {
    let amount = 249;

    // ✅ Apply 40% off coupon
    if (coupon && coupon.toUpperCase() === "HUSN40") {
      amount = Math.floor(amount * 0.6); // 40% off
    }

    const options = {
      amount: amount * 100, // Razorpay uses paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);
    return res.status(200).json(order);
  } catch (err) {
    console.error("❌ Razorpay order creation failed:", err);
    return res.status(500).json({
      success: false,
      msg: "Failed to create Razorpay order",
    });
  }
};

// ✅ Verify Payment & Save Order
exports.verifyPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

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
    // ✅ Verify Razorpay Signature
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${order_id}|${payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== signature) {
      return res.status(400).json({
        success: false,
        msg: "Invalid Payment Signature",
      });
    }

    // ✅ Save Order to MongoDB
    const newOrder = new Order({
      name,
      address,
      mobile_number,
      alternate_number,
      coupon,
      order_id,
      payment_id,
      status: "pending", // initial status for admin tracking
    });

    await newOrder.save();

    return res.status(200).json({
      success: true,
      msg: "Payment verified and order saved",
    });
  } catch (err) {
    console.error("❌ Signature verification or DB save error:", err);
    return res.status(500).json({
      success: false,
      msg: "Server Error while verifying or saving payment",
    });
  }
};
