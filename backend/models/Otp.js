const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  senderName: {
    type: String,
    default: null
  },
  attempts: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // 10 minutes TTL index (auto-removed by MongoDB)
  }
});

module.exports = mongoose.model("Otp", OtpSchema);
