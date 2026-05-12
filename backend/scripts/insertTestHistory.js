const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/zemo");

async function insert() {

  const PriceHistory = mongoose.model(
    "PriceHistory",
    new mongoose.Schema({
      productId: String,
      price: Number,
      source: String,
      recordedAt: Date
    }),
    "pricehistory"
  );

  await PriceHistory.insertMany([
    {
      productId: "69aac545156297223fcf2be5",
      price: 95000,
      source: "amazon",
      recordedAt: new Date("2025-12-01")
    },
    {
      productId: "69aac545156297223fcf2be5",
      price: 92000,
      source: "amazon",
      recordedAt: new Date("2026-01-01")
    },
    {
      productId: "69aac545156297223fcf2be5",
      price: 90000,
      source: "amazon",
      recordedAt: new Date("2026-02-01")
    },
    {
      productId: "69aac545156297223fcf2be5",
      price: 87999,
      source: "amazon",
      recordedAt: new Date("2026-03-01")
    }
  ]);

  console.log("Inserted test history");
  process.exit();
}

insert();
