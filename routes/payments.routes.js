const express = require("express");
const {
  createOrder,
  verifyPayment,
  createCODOrder, // ✅ COD controller
} = require("../controllers/payment.controller");

const { body } = require("express-validator");

const router = express.Router();

// ✅ Route: Create Razorpay Order
router.post(
  "/createOrder",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 3 })
      .withMessage("Name must be at least 3 characters"),

    body("address")
      .trim()
      .notEmpty()
      .withMessage("Address is required")
      .isLength({ min: 10 })
      .withMessage("Address must be at least 10 characters"),

    body("mobile_number")
      .trim()
      .notEmpty()
      .withMessage("Mobile number is required")
      .matches(/^\d{10}$/)
      .withMessage("Mobile number must be 10 digits"),

    body("alternate_number")
      .optional()
      .trim()
      .matches(/^\d{10}$/)
      .withMessage("Alternate number must be 10 digits"),

    body("coupon").optional().trim().escape(),
  ],
  createOrder
);

// ✅ Route: Verify Razorpay Payment
router.post(
  "/verifyPayment",
  [
    body("order_id").notEmpty().withMessage("Order ID is required").trim().escape(),
    body("payment_id").notEmpty().withMessage("Payment ID is required").trim().escape(),
    body("signature").notEmpty().withMessage("Signature is required").trim().escape(),
    body("name").notEmpty().withMessage("Name is required").trim().escape(),
    body("address").notEmpty().withMessage("Address is required").trim(),
    body("mobile_number").notEmpty().matches(/^\d{10}$/).withMessage("Mobile number must be 10 digits"),
    body("alternate_number").optional().matches(/^\d{10}$/),
    body("coupon").optional().trim().escape(),
  ],
  verifyPayment
);

// ✅ Route: Cash on Delivery Order
router.post(
  "/cod-order",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 3 })
      .withMessage("Name must be at least 3 characters"),

    body("address")
      .trim()
      .notEmpty()
      .withMessage("Address is required")
      .isLength({ min: 10 })
      .withMessage("Address must be at least 10 characters"),

    body("mobile")
      .trim()
      .notEmpty()
      .withMessage("Mobile number is required")
      .matches(/^\d{10}$/)
      .withMessage("Mobile number must be 10 digits"),

    body("altNumber")
      .optional()
      .trim()
      .matches(/^\d{10}$/)
      .withMessage("Alternate number must be 10 digits"),

    body("coupon").optional().trim().escape(),
  ],
  createCODOrder
);

module.exports = router;
