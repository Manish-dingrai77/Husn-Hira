const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  mobile_number: {
    type: String,
    required: true
  },
  alternate_number: {
    type: String
  },
  coupon: {
    type: String
  },
  order_id: {
    type: String,
    required: true
  },
  payment_id: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'delivering', 'done'],
    default: 'pending'
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Order", orderSchema);
