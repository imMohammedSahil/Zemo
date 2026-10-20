const express = require("express");
const router = express.Router();

const Notification = require("../models/Notification");


// GET all recent notifications and active wishes
router.get("/", async (req, res) => {
    try {
        const Product = require("../models/Product");
        const Alert = require("../models/Alert");

        const rawNotifications = await Notification.find().sort({ sentAt: -1, createdAt: -1 }).limit(30);
        const activeAlerts = await Alert.find({}).sort({ updatedAt: -1, createdAt: -1 }).limit(15);

        // Sanitize and shorten notification entries on the fly
        const notifications = rawNotifications.map(n => {
            const obj = n.toObject ? n.toObject() : { ...n };
            let msg = obj.message || "";
            const match = msg.match(/keeping watch on (.+?) for (₹[\d,]+)/i);
            if (match) {
                msg = `Tracking ${match[1]} at ${match[2]}`;
            } else {
                msg = msg.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").trim();
            }

            let title = obj.title || "";
            if (/wish bell/i.test(title)) {
                title = "";
            } else {
                title = title.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").trim();
            }

            return {
                ...obj,
                title,
                message: msg
            };
        });

        const { getOrGenerateShortName } = require("../services/productShortNameAI");

        const combined = [...notifications];
        for (const a of activeAlerts) {
            const prod = await Product.findById(a.productId);
            if (prod) {
                const alreadyPresent = combined.some(n => String(n.productId) === String(a.productId));
                if (!alreadyPresent) {
                    const { shortTitle, warmPhrase } = await getOrGenerateShortName(prod);
                    const formattedTarget = Number(a.targetPrice).toLocaleString();
                    const message = warmPhrase
                        ? `${warmPhrase} at ₹${formattedTarget}`
                        : `Chasing ${shortTitle} around the clock until it surrenders at ₹${formattedTarget}`;

                    combined.push({
                        _id: `wish_${a._id}`,
                        productId: a.productId,
                        title: "",
                        message,
                        sentAt: a.createdAt || new Date(),
                        targetPrice: a.targetPrice,
                        currentPrice: prod.currentPrice
                    });
                }
            }
        }

        combined.sort((a, b) => new Date(b.sentAt || b.createdAt || 0) - new Date(a.sentAt || a.createdAt || 0));
        res.json(combined);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET unread notifications
router.get("/unread/:userId", async (req, res) => {

    try {

        const notifications = await Notification.find({
            userId: req.params.userId,
            acknowledged: false
        }).sort({ sentAt: -1 });

        res.json(notifications);

    } catch (error) {

        res.status(500).json({ error: error.message });

    }

});


// GET all notifications for a user
router.get("/:userId", async (req, res) => {

    try {

        const notifications = await Notification.find({
            userId: req.params.userId
        }).sort({ sentAt: -1 });

        res.json(notifications);

    } catch (error) {

        res.status(500).json({ error: error.message });

    }

});


// mark notification as read
router.patch("/read/:id", async (req, res) => {

    try {

        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { acknowledged: true },
            { new: true }
        );

        res.json(notification);

    } catch (error) {

        res.status(500).json({ error: error.message });

    }

});

module.exports = router;