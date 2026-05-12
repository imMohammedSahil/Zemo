const { chromium } = require("playwright");
const PriceHistory = require("../models/PriceHistory");

async function importHistoricPrices(productId, asin) {

  const exists = await PriceHistory.findOne({ productId });

  if (exists) {
    console.log("History already exists — skipping import");
    return;
  }

  console.log("Importing historic prices for:", asin);

  let browser;

  try {

    browser = await chromium.launch({ headless: true });

    const page = await browser.newPage();

    const url = `https://pricehistory.in/product/${asin}`;

    let historyData = [];

    /* Capture network response */

    page.on("response", async (response) => {

      const responseUrl = response.url();

      if (
        responseUrl.includes("pricehistory") ||
        responseUrl.includes("chart")
      ) {

        try {

          const json = await response.json();

          if (Array.isArray(json)) {
            historyData = json;
          }

        } catch (err) {}

      }

    });

    await page.goto(url, { waitUntil: "domcontentloaded" });

    await page.waitForTimeout(6000);

    const formatted = historyData.map(entry => ({
      productId,
      price: entry.price || entry[1],
      source: "amazon",
      recordedAt: new Date(entry.date || entry[0])
    }))
    .filter(entry => entry.price && entry.price > 0);

    console.log("Fetched historic points:", formatted.length);

    if (formatted.length > 0) {

      await PriceHistory.insertMany(formatted, { ordered: false });

    }

    console.log("Historic import complete");

  } catch (error) {

    console.error("Historic import failed:", error);

  } finally {

    if (browser) await browser.close();

  }

}

module.exports = importHistoricPrices;