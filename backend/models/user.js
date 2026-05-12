const mongoose = require("mongoose");

const WishlistItemSchema = new mongoose.Schema({

  productUrl: {
    type: String,
    required: true
  },

  title: {
    type: String,
    default: "Unknown Product"
  },

  image: {
    type: String,
    default: ""
  },

  source: {
    type: String,
    default: "unknown"
  }

}, { _id: true });


const UserSchema = new mongoose.Schema({

  googleId: {
    type: String,
    required: true,
    unique: true
  },

  name: {
    type: String,
    required: true
  },

  username: {
    type: String,
    default: ""
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  location: {
    type: String,
    default: ""
  },

  profilePicture: {
    type: String,
    default: ""
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  trackedProducts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    }
  ],

  wishlist: [WishlistItemSchema]

});

module.exports = mongoose.model("User", UserSchema);