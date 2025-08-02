// utils/sendSMS.js
const twilio = require("twilio");

// 🧪 Dummy values (replace later with real credentials)
const accountSid = 'ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'; // Your Account SID
const authToken = 'your_auth_token'; // Your Auth Token
const fromPhone = '+1234567890'; // Your Twilio phone number (US/UK)

const client = twilio(accountSid, authToken);

const sendOrderSMS = async ({ to, name, orderId, txnId, address }) => {
  try {
    const messageBody = `Hi ${name}, your order has been placed successfully! 
Order ID: ${orderId}
Transaction ID: ${txnId}
Address: ${address}
Thank you for shopping with Husn Hira!`;

    const message = await client.messages.create({
      body: messageBody,
      from: fromPhone,
      to: to, // Recipient number (must be verified in trial)
    });

    console.log("✅ SMS sent:", message.sid);
    return message.sid;
  } catch (error) {
    console.error("❌ Failed to send SMS:", error.message);
    return null;
  }
};

module.exports = sendOrderSMS;
