require("dotenv").config();
const crypto = require("crypto");
const { createRazorpayInstance } = require("../config/razorpay.config");
const Order = require("../models/order");
const sendOrderSMS = require("../utils/sendSMS");

const razorpayInstance = createRazorpayInstance();

// ✅ Razorpay: Create Order
exports.createOrder = async (req, res) => {
  try {
    const { name, address, mobile_number, alternate_number, coupon } = req.body;

    if (!name || !address || !mobile_number) {
      return res.status(400).json({ success: false, msg: "Missing required fields" });
    }

    let amount = 249; // ✅
    const cleanedCoupon = coupon?.trim().toUpperCase();
    const isCouponApplied = cleanedCoupon === "HUSN40";

    if (isCouponApplied) {
      amount = Math.floor(amount * 0.6); // ₹149
    }

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);
    return res.status(200).json({ ...order, amount }); // Send amount back to frontend
  } catch (err) {
    console.error("❌ Razorpay order creation failed:", err);
    return res.status(500).json({ success: false, msg: "Failed to create Razorpay order" });
  }
};

// ✅ Razorpay: Verify & Save
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
      amount,
    } = req.body;

    if (!payment_id || !order_id || !signature) {
      return res.status(400).json({ success: false, msg: "Missing payment verification parameters" });
    }

    // Signature verification
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${order_id}|${payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== signature) {
      return res.status(400).json({ success: false, msg: "Invalid payment signature" });
    }

    const finalAmount = amount || 249;
    const cleanedCoupon = coupon?.trim().toUpperCase();
    const isCouponApplied = cleanedCoupon === "HUSN40";

    // ✅ Get current IST time
    const nowUtc = new Date();
    const istDate = new Date(nowUtc.getTime() + 5.5 * 60 * 60 * 1000);

    // Save to DB
    const newOrder = new Order({
      name: name.trim(),
      address: address.trim(),
      mobile_number,
      alternate_number,
      coupon: cleanedCoupon || "None",
      orderId: order_id,
      transactionId: payment_id,
      paymentMethod: "Online",
      status: "pending",
      price: finalAmount,
      orderedOn: istDate, // ✅ Save correct IST time
    });

    await newOrder.save();

    // Send SMS
    const smsSid = await sendOrderSMS({
      to: mobile_number,
      name: name.trim(),
      orderId: order_id,
      address: address.trim(),
      amount: finalAmount,
      paymentMethod: "Online",
      couponApplied: isCouponApplied,
    });

    smsSid
      ? console.log("✅ SMS sent with SID:", smsSid)
      : console.warn("⚠️ SMS failed to send");

    return res.status(200).json({ success: true, msg: "Payment verified and order saved" });
  } catch (err) {
    console.error("❌ Razorpay payment verification error:", err);
    return res.status(500).json({ success: false, msg: "Error verifying payment or saving order" });
  }
};

// ✅ COD Order
exports.createCODOrder = async (req, res) => {
  try {
    const { name, address, mobile, altNumber, coupon } = req.body;

    if (!name || !address || !mobile) {
      return res.status(400).json({ success: false, msg: "Missing required fields for COD" });
    }

    const orderId = "HH" + Date.now().toString().slice(-6);

    let baseAmount = 249;
    const cleanedCoupon = coupon?.trim().toUpperCase();
    const isCouponApplied = cleanedCoupon === "HUSN40";

    if (isCouponApplied) {
      baseAmount = Math.floor(baseAmount * 0.6); // ₹149
    }

    const totalAmount = baseAmount + 40; // COD extra fee

    // ✅ Get current IST time
    const nowUtc = new Date();
    const istDate = new Date(nowUtc.getTime() + 5.5 * 60 * 60 * 1000);

    // Save to DB
    const newOrder = new Order({
      name: name.trim(),
      address: address.trim(),
      mobile_number: mobile,
      alternate_number: altNumber,
      coupon: cleanedCoupon || "None",
      orderId,
      transactionId: "COD",
      paymentMethod: "COD",
      status: "pending",
      price: totalAmount,
      orderedOn: istDate, // ✅ Save correct IST time
    });

    await newOrder.save();

    // Send SMS
    const smsSid = await sendOrderSMS({
      to: mobile,
      name: name.trim(),
      orderId,
      address: address.trim(),
      amount: totalAmount,
      paymentMethod: "COD",
      couponApplied: isCouponApplied,
    });

    smsSid
      ? console.log("✅ SMS sent with SID:", smsSid)
      : console.warn("⚠️ SMS failed to send");

    return res.status(200).json({ success: true, msg: "COD order placed successfully" });
  } catch (err) {
    console.error("❌ COD Order Error:", err);
    return res.status(500).json({ success: false, msg: "Failed to place COD order" });
  }
};
