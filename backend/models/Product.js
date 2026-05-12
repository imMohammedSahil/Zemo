const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({

  asin: {
    type: String,
    required: true,
    unique: true
  },

  title: {
    type: String,
    required: true
  },

  image: {
    type: String
  },

  productUrl: {
    type: String,
    required: true
  },

  source: {
    type: String,
    enum: ["amazon", "flipkart"],
    required: true
  },

  currentPrice: {
    type: Number
  },

  historicLow: {
    type: Number
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  currentPrice: {
  type: Number,
  default: 0
},
historicLow: {
  type: Number,
  default: 0
}

});

module.exports = mongoose.model("Product", ProductSchema);