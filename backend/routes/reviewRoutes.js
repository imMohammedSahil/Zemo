const express = require("express");
const router = express.Router();

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