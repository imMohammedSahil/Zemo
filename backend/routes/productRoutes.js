const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const PriceHistory = require("../models/PriceHistory");
const Review = require("../models/reviewModel");

const fetchProductMetadata = require("../automation/productMetadata");

const scrapeReviews = require("../automation/reviewScraper");
const { analyzeReviews } = require("../services/aiAnalyzer");



/* TEST ROUTE */

router.get("/test", (req, res) => {
  res.send("product route working");
});


/* HELPER FUNCTIONS */

function detectSource(url) {

  if (!url) return null;

  if (url.includes("amazon")) return "amazon";

  if (url.includes("flipkart")) return "flipkart";

  return null;

}


function extractASIN(url) {
  if (!url) return null;
  // Look for /dp/ASIN or /gp/product/ASIN
  const match = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
  return match ? match[1].toUpperCase() : null;
}


function normalizeAmazonUrl(url) {

  const asin = extractASIN(url);

  if (!asin) return null;

  return `https://www.amazon.in/dp/${asin}`;

}


/* ADD PRODUCT FOR TRACKING */

router.post("/add", async (req, res) => {

  try {

    const { productUrl, email } = req.body;
    const cleanEmail = email ? email.toLowerCase().trim() : null;

    if (!productUrl) {
      return res.status(400).json({ message: "Product URL required" });
    }

    const source = detectSource(productUrl);

    if (!source || source !== "amazon") {
      return res.status(400).json({
        message: "Drop an Amazon link here — I'll compare the other stores for you"
      });
    }

    let asin = null;
    let cleanUrl = productUrl;

    if (source === "amazon") {

      asin = extractASIN(productUrl);

      if (!asin) {
        return res.status(400).json({ message: "Invalid Amazon product URL" });
      }

      cleanUrl = normalizeAmazonUrl(productUrl);

    }

    console.log("Tracking product:", cleanUrl, "for user:", cleanEmail || "anonymous");

    const existingProduct = asin
      ? await Product.findOne({ asin })
      : null;

    if (existingProduct) {
      if (cleanEmail) {
        await Product.findByIdAndUpdate(existingProduct._id, {
          $addToSet: { trackedBy: cleanEmail }
        });
      }
      return res.json({ ...existingProduct.toObject(), alreadyTracked: true });
    }

    const metadata = await fetchProductMetadata(cleanUrl);

    console.log("Scraped metadata:", metadata);

    if (!metadata || metadata.title === "Unknown Product") {
      return res.status(422).json({ message: "Unable to resolve product details from listing. Please verify the link." });
    }

    const currentPrice = Number(metadata.currentPrice) || 0;
    const mrp = Number(metadata.mrp) || (currentPrice > 0 ? Math.round(currentPrice * 1.18) : 0);

    const newProduct = await Product.create({
      asin,
      title: metadata.title || "Unknown Product",
      image: metadata.image || "",
      productUrl,
      source,
      currentPrice,
      mrp,
      rating: Number(metadata.rating) || 0,
      ratingsCount: metadata.ratingsCount || "",
      ratingDistribution: metadata.ratingDistribution || {},
      bankOffers: metadata.bankOffers || [],
      coupon: metadata.coupon || null,
      historicLow: currentPrice,
      trackedBy: cleanEmail ? [cleanEmail] : []
    });

    const freshProduct = await Product.findById(newProduct._id);
    res.json(freshProduct || newProduct);

  } catch (error) {

    console.error(error);

    res.status(500).json({ message: "Server error" });

  }

});


/* AI INSIGHTS */

router.get("/insights/:productId", async (req, res) => {

  try {

    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.json({ pros: [], cons: [] });
    }

    // 1️⃣ check cache
    let reviewDoc = await Review.findOne({
      productId: product.asin
    });

    if (reviewDoc) {

      console.log("Using cached insights");

      return res.json(reviewDoc.insights);
    }

    console.log("No cached insights → scraping reviews");

    // 2️⃣ scrape reviews
    const { positiveReviews, negativeReviews } =
      await scrapeReviews(product.asin);

    console.log(
      "Reviews scraped:",
      positiveReviews.length,
      negativeReviews.length
    );

    // 3️⃣ convert to analyzer format
    const reviewSample = {
      positive: positiveReviews.slice(0,5),
      negative: negativeReviews.slice(0,5)
    };

    console.log("Sending reviews to AI:", reviewSample);
    console.log("Calling AI analyzer...");

    // 4️⃣ AI analysis
    const insights =
      await analyzeReviews(reviewSample);

    console.log("AI insights generated");

    // 5️⃣ save to DB
    await Review.create({
      productId: product.asin,
      reviews: reviewSample,
      insights
    });

    res.json(insights);

  } catch (error) {

    console.error("Insights error:", error);

    res.status(500).json({
      pros: [],
      cons: []
    });

  }

});


/* METADATA SCRAPER */

router.post("/metadata", async (req, res) => {

  try {

    const { productUrl } = req.body;

    if (!productUrl) {
      return res.status(400).json({ error: "Product URL required" });
    }

    const source = detectSource(productUrl);

    let cleanUrl = productUrl;

    if (source === "amazon") {

      const asin = extractASIN(productUrl);

      if (!asin) {
        return res.status(400).json({ error: "Invalid Amazon URL" });
      }

      cleanUrl = normalizeAmazonUrl(productUrl);

    }

    console.log("Fetching metadata for:", cleanUrl);

    const metadata = await fetchProductMetadata(cleanUrl);

    console.log("Metadata received:", metadata);

    return res.json({
      title: metadata.title || "Unknown Product",
      image: metadata.image || "",
      productUrl: cleanUrl,
      source: source || "unknown"
    });

  } catch (error) {

    console.error("Metadata error:", error);

    return res.status(500).json({
      title: "Unknown Product",
      image: "",
      source: "unknown"
    });

  }

});

const Alert = require("../models/Alert");
const { analyzeDealWithGemini } = require("../services/dealMeterAI");
const { compareStoresWithGemini, clearStoresCache } = require("../services/compareStoresAI");
const { getReviewIntelligenceWithGemini, clearReviewsCache } = require("../services/reviewIntelligenceAI");

router.get("/grab-meter/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    const meter = await analyzeDealWithGemini(product);
    res.json(meter);
  } catch (err) {
    res.status(500).json({ message: "Error calculating deal meter" });
  }
});

router.get("/compare-stores/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    const forceRefresh = req.query.refresh === "true";
    const comparison = await compareStoresWithGemini(product, forceRefresh);
    res.json(comparison);
  } catch (err) {
    console.error("[compare-stores error]:", err);
    res.status(500).json({ message: "Failed to compare stores" });
  }
});

router.post("/compare-stores/:id/clear-cache", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    const key = product ? String(product.asin || product._id) : String(req.params.id);
    clearStoresCache(key);
    res.json({ success: true, message: "Store comparison cache cleared successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear cache" });
  }
});

router.get("/reviews/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    const forceRefresh = req.query.refresh === "true";
    const reviews = await getReviewIntelligenceWithGemini(product, forceRefresh);
    res.json(reviews);
  } catch (err) {
    console.error("[reviews error]:", err);
    res.status(500).json({ message: "Failed to load review intelligence" });
  }
});

router.get("/insights/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    const forceRefresh = req.query.refresh === "true";
    const reviews = await getReviewIntelligenceWithGemini(product, forceRefresh);
    res.json(reviews);
  } catch (err) {
    console.error("[insights error]:", err);
    res.status(500).json({ message: "Failed to load review insights" });
  }
});

router.post("/reviews/:id/clear-cache", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    const key = product ? String(product.asin || product._id) : String(req.params.id);
    clearReviewsCache(key);
    res.json({ success: true, message: "Review cache cleared successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear review cache" });
  }
});

const { getBankOffersWithGemini, clearOffersCache } = require("../services/bankOffersAI");

router.get("/offers/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    const forceRefresh = req.query.refresh === "true";
    const offers = await getBankOffersWithGemini(product, forceRefresh);
    res.json(offers);
  } catch (err) {
    console.error("[bank offers error]:", err);
    res.status(500).json({ message: "Failed to load bank offers" });
  }
});

router.post("/offers/:id/clear-cache", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    const key = product ? String(product.asin || product._id) : String(req.params.id);
    clearOffersCache(key);
    res.json({ success: true, message: "Bank offers cache cleared successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear offers cache" });
  }
});

/* Reset Customer Reviews & Bank Offers cache specifically for a product (keeps Compare Stores intact) */
router.post("/reset-product-cache/:id", async (req, res) => {
  try {
    const id = req.params.id;
    let product = null;
    const mongoose = require("mongoose");
    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id);
    }
    if (!product) {
      product = await Product.findOne({
        $or: [{ asin: id }, { title: new RegExp(id, "i") }]
      });
    }

    const keysToPurge = [
      id,
      product?._id ? String(product._id) : null,
      product?.asin ? String(product.asin) : null
    ].filter(Boolean);

    // 1. Purge Reviews Cache
    keysToPurge.forEach(k => clearReviewsCache(k));

    // 2. Purge Bank Offers Cache
    keysToPurge.forEach(k => clearOffersCache(k));

    // 3. Clear scraped bankOffers in DB document
    if (product) {
      product.bankOffers = [];
      await product.save();
    }

    res.json({
      success: true,
      message: `Cleared reviews and bank offers cache for: ${product?.title || id}`,
      product: product ? { id: product._id, asin: product.asin, title: product.title } : null
    });
  } catch (err) {
    console.error("[reset-product-cache error]:", err);
    res.status(500).json({ message: "Failed to reset product cache", error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const userEmail = req.query.email ? req.query.email.toLowerCase().trim() : null;

    let query = {};
    if (userEmail) {
      query = {
        $or: [
          { trackedBy: userEmail },
          { isDemo: true }
        ]
      };
    }

    let products = await Product.find(query);

    // If a user has 0 products and no demo product marked yet, let's treat the first product as demo
    if (products.length === 0 && userEmail) {
      const anyProd = await Product.findOne();
      if (anyProd && (!anyProd.trackedBy || anyProd.trackedBy.length === 0)) {
        anyProd.isDemo = true;
        await anyProd.save();
        products = [anyProd];
      }
    }

    const result = [];

    for (const product of products) {
      const alertQuery = {
        productId: product._id,
        triggered: false
      };
      if (userEmail) {
        alertQuery.email = userEmail;
      }

      const alert = await Alert
        .findOne(alertQuery)
        .sort({ createdAt: -1 });

      let grabMeter = null;
      try {
        grabMeter = await analyzeDealWithGemini(product);
      } catch (e) {
        // graceful fallback handled inside service
      }

      result.push({
        ...product.toObject(),
        activeAlert: alert || null,
        grabMeter: grabMeter || null
      });
    }

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load products" });
  }
});

router.delete("/remove/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const userEmail = (req.query.email || req.body.email)
      ? (req.query.email || req.body.email).toLowerCase().trim()
      : null;

    if (userEmail) {
      await Product.findByIdAndUpdate(productId, {
        $pull: { trackedBy: userEmail }
      });
      await Alert.deleteMany({ productId, email: userEmail });
      return res.json({ message: "Product removed from your watchlist" });
    }

    const product = await Product.findById(productId);
    const keysToPurge = [productId, product?.asin].filter(Boolean);

    await Product.deleteOne({ _id: productId });
    await Alert.deleteMany({ productId });

    // Clean up disk caches for this product
    const fs = require("fs");
    const path = require("path");
    const cacheDir = path.join(__dirname, "../../.zemo_cache");
    const cacheFiles = [
      "gemini_stores_cache.json",
      "gemini_offers_cache.json",
      "gemini_reviews_cache.json",
      "grab_meter_cache.json"
    ];

    cacheFiles.forEach(file => {
      const fullPath = path.join(cacheDir, file);
      if (fs.existsSync(fullPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(fullPath, "utf-8") || "{}");
          keysToPurge.forEach(k => delete data[k]);
          fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), "utf-8");
        } catch (_) {}
      }
    });

    res.json({ message: "Product removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to remove product" });
  }
});

/* ON-DEMAND REALTIME PRICE SYNC */
const fetchPrice = require("../automation/priceFetcher");

router.post("/sync/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const rawPrice = await fetchPrice(product.productUrl, product.source);
    const cleaned = rawPrice ? String(rawPrice).replace(/[^0-9.]/g, "") : null;
    const price = Number(cleaned);

    if (price && price > 0) {
      await PriceHistory.create({
        productId: product._id,
        price: price,
        source: product.source,
        recordedAt: new Date()
      });

      let historicLow = product.historicLow;
      if (!historicLow || price < historicLow) {
        historicLow = price;
      }

      product.currentPrice = price;
      product.historicLow = historicLow;
      await product.save();

      return res.json({
        success: true,
        currentPrice: price,
        historicLow: historicLow,
        message: "Price synced successfully"
      });
    }

    return res.json({
      success: true,
      currentPrice: product.currentPrice,
      historicLow: product.historicLow,
      message: "Scraper confirmed active price"
    });
  } catch (error) {
    console.error("Manual sync error:", error);
    res.status(500).json({ message: "Failed to sync price on-demand" });
  }
});

module.exports = router;