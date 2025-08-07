require("dotenv").config();
const crypto = require("crypto");
const twilio = require("twilio");

// ✅ Twilio Config (based on your .env)
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_FROM = process.env.TWILIO_PHONE;

// ✅ In-memory OTP store: Map<mobile, { otp, expiresAt }>
const otpStore = new Map();

// ✅ Send OTP via Twilio
const sendOtpSMS = async (mobile, otp) => {
  const message = `Your Husn Hira OTP is: ${otp}. Do not share it with anyone.`;

  try {
    const response = await twilioClient.messages.create({
      body: message,
      from: TWILIO_FROM,
      to: `+91${mobile}`
    });

    console.log(`✅ OTP sent to ${mobile} | SID: ${response.sid}`);
    return true;
  } catch (err) {
    console.error("❌ Twilio SMS Error:", err.message);
    throw new Error("Failed to send OTP via SMS");
  }
};

// ✅ Generate and send OTP
exports.sendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ success: false, message: "Invalid mobile number" });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // Valid for 5 min

    otpStore.set(mobile, { otp, expiresAt });

    await sendOtpSMS(mobile, otp);

    return res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("❌ OTP Send Error:", err);
    return res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

// ✅ Verify OTP
exports.verifyOtp = (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!/^\d{10}$/.test(mobile) || !otp) {
      return res.status(400).json({ success: false, message: "Invalid mobile number or OTP" });
    }

    const record = otpStore.get(mobile);

    if (!record) {
      return res.status(400).json({ success: false, message: "OTP not requested" });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(mobile);
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    if (record.otp !== otp) {
      return res.status(401).json({ success: false, message: "Incorrect OTP" });
    }

    otpStore.delete(mobile); // ✅ Delete after success

    return res.status(200).json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    console.error("❌ OTP Verification Error:", err);
    return res.status(500).json({ success: false, message: "OTP verification failed" });
  }
};
