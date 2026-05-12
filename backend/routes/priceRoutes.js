const express = require("express");
const router = express.Router();

const PriceHistory = require("../models/PriceHistory");

router.get("/:productId", async (req, res) => {

  try {

    const history = await PriceHistory.find({
      productId: req.params.productId
    })
    .sort({ recordedAt: 1 })
    .select("price recordedAt");

    if (!history.length) {
      return res.json({
        history: [],
        currentPrice: null,
        historicLow: null
      });
    }

    const currentPrice = history[history.length - 1].price;

    const historicLow = Math.min(
      ...history.map(p => p.price)
    );

    res.json({
      history,
      currentPrice,
      historicLow
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error"
    });

  }

});

module.exports = router;