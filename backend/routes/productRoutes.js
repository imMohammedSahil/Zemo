const express = require("express");
const router = express.Router();

const Product = require("../models/Product");
const PriceHistory = require("../models/PriceHistory");
const Review = require("../models/reviewModel");

const fetchProductMetadata = require("../automation/productMetadata");
const importHistoricPrices = require("../services/importPriceHistory");

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

  const match = url.match(/[A-Z0-9]{10}/);

  return match ? match[0] : null;

}


function normalizeAmazonUrl(url) {

  const asin = extractASIN(url);

  if (!asin) return null;

  return `https://www.amazon.in/dp/${asin}`;

}


/* ADD PRODUCT FOR TRACKING */

router.post("/add", async (req, res) => {

  try {

    const { productUrl } = req.body;

    if (!productUrl) {
      return res.status(400).json({ message: "Product URL required" });
    }

    const source = detectSource(productUrl);

    if (!source) {
      return res.status(400).json({ message: "Unsupported website" });
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

    console.log("Tracking product:", cleanUrl);

    const existingProduct = asin
      ? await Product.findOne({ asin })
      : null;

    if (existingProduct) {
      return res.json(existingProduct);
    }

    const metadata = await fetchProductMetadata(cleanUrl);

    console.log("Scraped metadata:", metadata);

    const newProduct = await Product.create({
      asin,
      title: metadata.title || "Unknown Product",
      image: metadata.image || "",
      productUrl,
      source
    });

    await importHistoricPrices(newProduct._id, asin);

    res.json(newProduct);

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

router.get("/", async (req, res) => {

  try {

    const products = await Product.find();

    const result = [];

    for (const product of products) {

      const alert = await Alert
  .findOne({
    productId: product._id,
    triggered: false
  })
  .sort({ createdAt: -1 });   // get newest alert
      
    
console.log(
  "DEBUG ALERT SENT TO FRONTEND:",
  alert?.targetPrice,
  alert?.tolerance
);  
      result.push({
        ...product.toObject(),
        activeAlert: alert || null
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

    await Product.deleteOne({ _id: productId });

    res.json({ message: "Product removed successfully" });

  } catch (error) {

    console.error(error);

    res.status(500).json({ message: "Failed to remove product" });

  }

});




module.exports = router;