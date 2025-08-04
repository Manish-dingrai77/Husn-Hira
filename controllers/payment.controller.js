const { createRazorpayInstance } = require("../config/razorpay.config");
const crypto = require("crypto");
const Order = require("../models/order");
const sendOrderSMS = require("../utils/sendSMS");
require("dotenv").config();

const razorpayInstance = createRazorpayInstance();

// ✅ Razorpay: Create Order
exports.createOrder = async (req, res) => {
  try {
    const { name, address, mobile_number, alternate_number, coupon } = req.body;

    if (!name || !address || !mobile_number) {
      return res.status(400).json({ success: false, msg: "Missing required fields" });
    }

    let amount = 249;

    // Apply 40% off if coupon is HUSN40
    if (coupon && coupon.toUpperCase() === "HUSN40") {
      amount = Math.floor(amount * 0.6);
    }

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
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

// ✅ Razorpay: Verify Signature & Save to DB
exports.verifyPayment = async (req, res) => {
  try {
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

    if (!payment_id || !order_id || !signature) {
      return res.status(400).json({
        success: false,
        msg: "Missing payment verification parameters",
      });
    }

    // Verify Signature
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${order_id}|${payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== signature) {
      return res.status(400).json({
        success: false,
        msg: "Invalid payment signature",
      });
    }

    // Save Order to DB
    const newOrder = new Order({
      name,
      address,
      mobile_number,
      alternate_number,
      coupon,
      orderId: order_id,
      transactionId: payment_id,
      paymentMethod: "Online",
      status: "pending",
    });

    await newOrder.save();

    // ✅ Send SMS Notification
    console.log("📨 Attempting to send SMS to:", mobile_number);
    const smsSid = await sendOrderSMS({
      to: mobile_number?.startsWith("+") ? mobile_number : `+91${mobile_number}`,
      name: name?.trim(),
      orderId: order_id,
      address: address?.trim(),
    });

    smsSid
      ? console.log("✅ SMS sent with SID:", smsSid)
      : console.warn("⚠️ SMS failed to send");

    return res.status(200).json({
      success: true,
      msg: "Payment verified and order saved",
    });
  } catch (err) {
    console.error("❌ Razorpay payment verification error:", err);
    return res.status(500).json({
      success: false,
      msg: "Error verifying payment or saving order",
    });
  }
};

// ✅ COD Order Handling
exports.createCODOrder = async (req, res) => {
  try {
    const { name, address, mobile, altNumber, coupon } = req.body;

    if (!name || !address || !mobile) {
      return res.status(400).json({
        success: false,
        msg: "Missing required fields for COD",
      });
    }

    const orderId = "HH" + Date.now().toString().slice(-6);

    const newOrder = new Order({
      name,
      address,
      mobile_number: mobile,
      alternate_number: altNumber,
      coupon,
      orderId,
      transactionId: "COD",
      paymentMethod: "COD",
      status: "pending",
    });

    await newOrder.save();

    // ✅ Send SMS Notification
    console.log("📨 Attempting to send SMS to:", mobile);
    const smsSid = await sendOrderSMS({
      to: mobile?.startsWith("+") ? mobile : `+91${mobile}`,
      name: name?.trim(),
      orderId,
      address: address?.trim(),
    });

    smsSid
      ? console.log("✅ SMS sent with SID:", smsSid)
      : console.warn("⚠️ SMS failed to send");

    return res.status(200).json({
      success: true,
      msg: "COD order placed successfully",
    });
  } catch (err) {
    console.error("❌ COD Order Error:", err);
    return res.status(500).json({
      success: false,
      msg: "Failed to place COD order",
    });
  }
};
