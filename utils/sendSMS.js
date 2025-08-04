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
 */
const sendOrderSMS = async ({ to, name, orderId, address }) => {
  try {
    const formattedTo = to.startsWith("+") ? to : `+91${to}`;

    // ✅ Optimized for Twilio Trial (no emoji or excessive length)
    const messageBody = `Hi ${name}, your Husn Hira order (${orderId}) is confirmed.
Delivery to: ${address}
ETA: 3–5 working days.
Thank you for shopping with us!`;

    const messageOptions = {
      body: messageBody,
      to: formattedTo,
    };

    // ✅ Use Messaging Service SID if available
    if (process.env.MSG_SID) {
      messageOptions.messagingServiceSid = process.env.MSG_SID;
    } else if (process.env.TWILIO_PHONE) {
      messageOptions.from = process.env.TWILIO_PHONE;
    } else {
      throw new Error("Missing MSG_SID or TWILIO_PHONE in env");
    }

    const message = await client.messages.create(messageOptions);
    console.log("✅ SMS sent to", formattedTo, "SID:", message.sid);
    return message.sid;
  } catch (error) {
    console.error("❌ Failed to send SMS to", to, "| Error:", error.message || error);
    return null;
  }
};

module.exports = sendOrderSMS;
