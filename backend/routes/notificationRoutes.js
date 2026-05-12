const express = require("express");
const router = express.Router();

const Notification = require("../models/Notification");


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