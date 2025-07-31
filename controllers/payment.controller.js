const { createRazorpayInstance } = require("../config/razorpay.config");
const crypto = require("crypto");
require("dotenv").config();

const razorpayInstance = createRazorpayInstance();

// Create Razorpay Order
exports.createOrder = async (req, res) => {
  const { name, address, mobile_number, alternate_number, coupon } = req.body;

  try {
    // Validate required fields
    if (!name || !address || !mobile_number) {
      return res.status(400).json({
        success: false,
        msg: "Missing required fields",
      });
    }

    // Base price
    let amount = 249;

    // Apply discount if valid coupon
    if (coupon && coupon.toUpperCase() === "HUSN40") {
      amount = Math.floor(amount * 0.6); // 40% off
    }

    // Razorpay expects amount in paise
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);
    return res.status(200).json(order);
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    return res.status(500).json({
      success: false,
      msg: "Failed to create Razorpay order",
    });
  }
};

// Verify Razorpay Payment
exports.verifyPayment = async (req, res) => {
  const { order_id, payment_id, signature } = req.body;

  try {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(`${order_id}|${payment_id}`);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature === signature) {
      return res.status(200).json({
        success: true,
        msg: "Payment Verified Successfully",
      });
    } else {
      return res.status(400).json({
        success: false,
        msg: "Invalid Payment Signature",
      });
    }
  } catch (err) {
    console.error("Signature verification error:", err);
    return res.status(500).json({
      success: false,
      msg: "Server Error in Verifying Payment",
    });
  }
};
