const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({

    productId: {
        type: String,
        required: true,
        unique: true
    },

    positiveReviews: {
        type: [String],
        default: []
    },

    negativeReviews: {
        type: [String],
        default: []
    },

    // ✔ AI insights cache (so we don't call HuggingFace again)
    insights: {
        pros: [
            {
                aspect: String,
                percentage: Number,
                explanation: String
            }
        ],
        cons: [
            {
                aspect: String,
                percentage: Number,
                explanation: String
            }
        ]
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Review", reviewSchema);