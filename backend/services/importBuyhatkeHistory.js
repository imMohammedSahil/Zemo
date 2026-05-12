const PriceHistory = require("../models/PriceHistory");

async function importBuyhatkeHistory(productId) {

    const historicData = [
        { price: 91999, date: "2026-02-25" },
        { price: 90999, date: "2026-02-27" },
        { price: 89999, date: "2026-03-01" },
        { price: 87999, date: "2026-03-05" }
    ];

    for (const point of historicData) {

        await PriceHistory.create({
            productId: productId,
            price: point.price,
            source: "amazon",
            recordedAt: new Date(point.date)
        });

        console.log("Inserted historic point:", point);
    }

}

module.exports = importBuyhatkeHistory;