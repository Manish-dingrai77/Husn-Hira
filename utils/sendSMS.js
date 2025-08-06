require("dotenv").config();
const twilio = require("twilio");

// Initialize Twilio client
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * Send order confirmation SMS via Twilio
 * @param {Object} param0
 * @param {string} param0.to - Recipient number (with or without +91)
 * @param {string} param0.name - Customer name
 * @param {string} param0.orderId - Order ID
 * @param {string} param0.address - Delivery address
 * @param {string} param0.paymentMethod - 'Online' or 'COD'
 * @param {boolean} param0.couponApplied - true if coupon was used
 */
const sendOrderSMS = async ({ to, name, orderId, address, paymentMethod, couponApplied }) => {
  try {
    const formattedTo = to.startsWith("+") ? to : `+91${to}`;
    
    // Base price logic
    const basePrice = 249;
    const discountedPrice = Math.floor(basePrice * 0.6); // 149
    const isCOD = paymentMethod === "COD";

    const amount = isCOD
      ? (couponApplied ? discountedPrice : basePrice) + 40
      : (couponApplied ? discountedPrice : basePrice);

    const priceLine = isCOD
      ? `Amount to be paid on delivery: ₹${amount} (COD charges included)`
      : `Amount Paid: ₹${amount}`;

    const messageBody = `Hi ${name}, your order (${orderId}) with Husn Hira is confirmed.
${priceLine}
We'll deliver to: ${address}.
Expected delivery: 3–5 working days.
To cancel your order, kindly contact us on WhatsApp.
Thanks for choosing Husn Hira 💛`;

    const messageOptions = {
      body: messageBody,
      to: formattedTo,
      from: process.env.TWILIO_PHONE,
    };

    const message = await client.messages.create(messageOptions);
    console.log("✅ SMS sent to", formattedTo, "| SID:", message.sid);
    return message.sid;
  } catch (error) {
    console.error("❌ Failed to send SMS to", to, "| Error:", error.message || error);
    return null;
  }
};

module.exports = sendOrderSMS;
