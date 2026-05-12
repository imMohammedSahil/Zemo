const cron = require("node-cron");

const Product = require("../models/Product");
const PriceHistory = require("../models/PriceHistory");
const Alert = require("../models/Alert");
const Notification = require("../models/Notification");

const fetchPrice = require("../automation/priceFetcher");

let running = false;

async function checkAlerts(product, currentPrice) {

    const alerts = await Alert.find({
        productId: product._id,
        triggered: false
    });

    for (const alert of alerts) {

        const triggerPrice = alert.targetPrice + alert.tolerance;

        if (currentPrice <= triggerPrice) {

            const message = `${product.title} dropped to ₹${currentPrice}`;

            const existing = await Notification.findOne({
                userId: alert.userId,
                productId: product._id,
                message: message
            });

            if (!existing) {

                await Notification.create({
                    userId: alert.userId,
                    productId: product._id,
                    message: message,
                    sentAt: new Date()
                });

            }

            alert.triggered = true;
            await alert.save();

            console.log("ALERT TRIGGERED:", message);
        }
    }
}

async function runPriceCheck() {

    if (running) {
        console.log("Previous price check still running...");
        return;
    }

    running = true;

    console.log("Running price check...");

    const products = await Product.find();

    for (const product of products) {

        try {

            const rawPrice = await fetchPrice(product.productUrl, product.source);

            const cleaned = rawPrice.replace(/[^0-9.]/g, "");
            const price = Number(cleaned);
            console.log("DEBUG PRICE EXTRACTED:", price);

            if (!price || price <= 0) {
                console.log("Invalid price detected:", rawPrice);
                continue;
            }

            /* SAVE PRICE SNAPSHOT */

            console.log("Saving price snapshot");

            await PriceHistory.create({
                productId: product._id,
                price: price,
                source: product.source,
                recordedAt: new Date()
            });

            /* UPDATE PRODUCT CURRENT PRICE */

            let historicLow = product.historicLow;

            if (!historicLow || price < historicLow) {
                historicLow = price;
            }

            console.log("Updating product price:", product.title, price);

            console.log("DEBUG UPDATING PRODUCT:", {
    id: product._id,
    price: price
});

            await Product.updateOne(
                { _id: product._id },
                {
                    $set: {
                        currentPrice: price,
                        historicLow: historicLow
                    }
                }
            );

            const updated = await Product.findById(product._id);
console.log("DEBUG PRODUCT AFTER UPDATE:", updated.currentPrice);

            await checkAlerts(product, price);

            console.log(`${product.title} → ${price}`);

        } catch (error) {

            console.error("Price fetch failed:", error.message);

        }

    }

    running = false;
}

function startScheduler() {
    console.log("Price scheduler started");
    /* TEST MODE: every 15 seconds */

    cron.schedule("*/15 * * * *", () => {
        runPriceCheck();
    });

}

module.exports = startScheduler;