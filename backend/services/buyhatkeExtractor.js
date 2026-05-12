const { chromium } = require("playwright");
const PriceHistory = require("../models/PriceHistory");

async function extractBuyhatkeHistory(productId, url) {

    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "networkidle" });

    await page.waitForTimeout(4000);

    const data = await page.evaluate(() => {

        const rows = document.querySelectorAll("table tbody tr");

        const results = [];

        rows.forEach(row => {

            const cols = row.querySelectorAll("td");

            if (cols.length >= 2) {

                const dateText = cols[0].innerText.trim();
                const priceText = cols[1].innerText.replace(/[^\d]/g, "");

                const price = Number(priceText);

                if (price && dateText) {
                    results.push({
                        price: price,
                        date: new Date(dateText).toISOString()
                    });
                }

            }

        });

        return results;
    });

    await browser.close();

    if (!data.length) {
        console.log("No price table data found.");
        return;
    }

    let inserted = 0;

    for (const point of data) {

        const recordedAt = new Date(point.date);

        const exists = await PriceHistory.findOne({
            productId,
            recordedAt
        });

        if (exists) continue;

        await PriceHistory.create({
            productId,
            price: point.price,
            source: "amazon",
            recordedAt
        });

        inserted++;

        console.log("Inserted:", point);
    }

    console.log(`Imported ${inserted} historic price points.`);
}

module.exports = extractBuyhatkeHistory;