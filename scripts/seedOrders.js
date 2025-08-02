const mongoose = require("mongoose");
require("dotenv").config();

const Order = require("../models/order");

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    return seedData();
  })
  .catch(err => {
    console.error("❌ MongoDB connection failed:", err);
  });

async function seedData() {
  const dummyOrders = [
    {
      name: "Ayesha Khan",
      address: "Bandra West, Mumbai",
      mobile_number: "9876543210",
      alternate_number: "9123456789",
      coupon: "HUSN40",
      order_id: "order_1001",
      payment_id: "pay_abc123",
      status: "pending"
    },
    {
      name: "Rohan Mehta",
      address: "Andheri East, Mumbai",
      mobile_number: "9988776655",
      order_id: "order_1002",
      payment_id: "pay_def456",
      status: "delivering"
    },
    {
      name: "Sneha Iyer",
      address: "Powai, Mumbai",
      mobile_number: "9898989898",
      order_id: "order_1003",
      payment_id: "pay_xyz789",
      coupon: "HUSN40",
      status: "done"
    },
    {
      name: "Zaid Sheikh",
      address: "Colaba, Mumbai",
      mobile_number: "9900112233",
      alternate_number: "9988776655",
      order_id: "order_1004",
      payment_id: "pay_ghj789",
      status: "pending"
    }
  ];

  try {
    await Order.insertMany(dummyOrders);
    console.log("✅ Dummy orders inserted successfully.");
    process.exit();
  } catch (err) {
    console.error("❌ Failed to insert dummy orders:", err);
    process.exit(1);
  }
}
