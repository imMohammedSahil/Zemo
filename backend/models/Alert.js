const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema({

  userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: false
},

  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },

  targetPrice: {
    type: Number,
    required: true
  },

  tolerance: {
    type: Number,
    default: 0
  },

  triggered: {
    type: Boolean,
    default: false
  },

  acknowledged: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Alert", AlertSchema);