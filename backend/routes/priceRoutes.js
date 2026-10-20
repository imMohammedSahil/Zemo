const express = require("express");
const router = express.Router();

const PriceHistory = require("../models/PriceHistory");
const Product = require("../models/Product");
const Alert = require("../models/Alert");

const importHistoricPrices = require("../services/importPriceHistory");

router.get("/:productId", async (req, res) => {
  try {
    const force = req.query.refresh === "true";
    let product = await Product.findById(req.params.productId);

    if (force && product) {
      await PriceHistory.deleteMany({ productId: product._id });
      await importHistoricPrices(product._id, product.asin, product.source, true);
    }

    const history = await PriceHistory.find({
      productId: req.params.productId
    })
    .sort({ recordedAt: 1 })
    .select("price recordedAt");

    let alert = null;
    try {
      if (product) {
        alert = await Alert.findOne({
          productId: product._id,
          triggered: false
        }).sort({ createdAt: -1 });
      }
    } catch (e) {
      console.warn("Product lookup error in price-history:", e.message);
    }

    if (!history.length) {
      return res.json({
        history: [],
        currentPrice: product?.currentPrice || null,
        historicLow: product?.historicLow || null,
        productTitle: product?.title || "Tracked Product",
        product: product ? {
          ...product.toObject(),
          activeAlert: alert || null
        } : null
      });
    }

    const validHistoryPrices = history.map((p) => Number(p.price)).filter((p) => p > 0);
    const historicLow = validHistoryPrices.length ? Math.min(...validHistoryPrices) : (product?.currentPrice || null);
    const currentPrice = product?.currentPrice || (validHistoryPrices.length ? history[history.length - 1].price : null);

    if (product && (product.historicLow !== historicLow || force)) {
      product.historicLow = historicLow;
      await product.save();
    }

    res.json({
      history,
      currentPrice,
      historicLow,
      productTitle: product?.title || "Tracked Product",
      product: product ? {
        ...product.toObject(),
        activeAlert: alert || null
      } : null
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error"
    });
  }
});

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const { extractPriceHistoryFromChartImage } = require("../services/importPriceHistory");

/**
 * POST /api/prices/:productId/upload-chart
 * Accepts a screenshot/image of Rufus AI or any price chart and converts it into data points via Gemini Vision
 */
router.post("/:productId/upload-chart", upload.single("chartImage"), async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    let imageBase64 = "";
    let mimeType = "image/png";

    if (req.file) {
      imageBase64 = req.file.buffer.toString("base64");
      mimeType = req.file.mimetype || "image/png";
    } else if (req.body.imageBase64) {
      imageBase64 = req.body.imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
      mimeType = req.body.mimeType || "image/png";
    } else {
      return res.status(400).json({ error: "No chart image provided" });
    }

    const points = await extractPriceHistoryFromChartImage(productId, imageBase64, mimeType, product.currentPrice);
    res.json({ success: true, count: points.length, points });
  } catch (err) {
    console.error("Upload chart error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;