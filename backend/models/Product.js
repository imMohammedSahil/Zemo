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

  shortTitle: {
    type: String,
    default: ""
  },

  warmPhrase: {
    type: String,
    default: ""
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
    type: Number,
    default: 0
  },

  historicLow: {
    type: Number,
    default: 0
  },

  mrp: {
    type: Number,
    default: 0
  },

  rating: {
    type: Number,
    default: 0
  },

  ratingsCount: {
    type: String,
    default: ""
  },

  ratingDistribution: {
    type: Object,
    default: {}
  },

  bankOffers: {
    type: Array,
    default: []
  },

  coupon: {
    type: Object,
    default: null
  },

  inStock: {
    type: Boolean,
    default: true
  },

  stockStatus: {
    type: String,
    default: "In Stock"
  },

  lastCheckedAt: {
    type: Date,
    default: Date.now
  },

  trackedBy: {
    type: [String],
    default: []
  },

  isDemo: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Product", ProductSchema);