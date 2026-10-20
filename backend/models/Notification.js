const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
  },

  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: false
  },

  title: {
    type: String
  },

  message: {
    type: String,
    required: true
  },

  acknowledged: {
    type: Boolean,
    default: false
  },

  emailSent: {
    type: Boolean,
    default: false
  },

  reminderSent: {
    type: Boolean,
    default: false
  },

  sentAt: {
    type: Date,
    default: Date.now
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Notification", NotificationSchema);