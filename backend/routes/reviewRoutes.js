const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

router.use(reviewLimiter);

const Review = require("../models/reviewModel");

router.get("/insights/:productId", async (req, res) => {

  try {

    const insights = await Review.findOne({
      productId: req.params.productId
    });

    res.json(insights);

  } catch (error) {

    res.status(500).json({ error: error.message });

  }

});

module.exports = router;