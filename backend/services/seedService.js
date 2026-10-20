const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const Product = require("../models/Product");
const PriceHistory = require("../models/PriceHistory");

async function seedDemoProductIfEmpty() {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      const seedFile = path.join(__dirname, "../data/demoSeed.json");
      if (fs.existsSync(seedFile)) {
        const { product, priceHistory } = JSON.parse(fs.readFileSync(seedFile, "utf8"));
        
        product._id = new mongoose.Types.ObjectId(product._id);
        await Product.collection.insertOne(product);
        
        if (Array.isArray(priceHistory) && priceHistory.length > 0) {
          const formattedHistory = priceHistory.map((h) => ({
            ...h,
            _id: new mongoose.Types.ObjectId(h._id),
            productId: new mongoose.Types.ObjectId(h.productId),
            recordedAt: new Date(h.recordedAt)
          }));
          await PriceHistory.collection.insertMany(formattedHistory);
        }
        console.log("Successfully seeded demo showcase product and 30-point price trajectory");
      }
    }
  } catch (err) {
    console.warn("Demo seeding non-blocking note:", err.message);
  }
}

module.exports = { seedDemoProductIfEmpty };
