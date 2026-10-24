const express = require("express");
const router = express.Router();

const Alert = require("../models/Alert");
const Product = require("../models/Product");
const Notification = require("../models/Notification");
const { sendWishSetEmail } = require("../services/emailService");

/* CREATE ALERT */

router.post("/create", async (req, res) => {
  try {
    const { productId, targetPrice, tolerance, email } = req.body;
    console.log("[Alert] /create called with payload:", { productId, targetPrice, tolerance, email });

    const cleanEmail = email ? email.toLowerCase().trim() : undefined;
    const alertQuery = { productId };
    if (cleanEmail) {
      alertQuery.email = cleanEmail;
    }

    const alert = await Alert.findOneAndUpdate(
      alertQuery,
      {
        productId,
        ...(cleanEmail ? { email: cleanEmail } : {}),
        targetPrice,
        tolerance,
        triggered: false
      },
      {
        returnDocument: "after",
        upsert: true
      }
    );

    console.log("[Alert] Alert saved to DB:", alert._id);

    // Create warm feel-good notification for the top-right Wish Bell
    const prod = await Product.findById(productId);
    if (prod) {
      const { getOrGenerateShortName } = require("../services/productShortNameAI");
      const { shortTitle, warmPhrase } = await getOrGenerateShortName(prod);
      const formattedTarget = Number(targetPrice).toLocaleString();
      const message = warmPhrase
        ? `${warmPhrase} at ₹${formattedTarget} — all eyes on it, left a little postcard in your Gmail.`
        : `Chasing ${shortTitle} around the clock until it surrenders at ₹${formattedTarget} — all eyes on it, left a little postcard in your Gmail.`;

      await Notification.create({
        productId,
        title: "",
        message,
        sentAt: new Date()
      });

      // Find recipient email: check req.body first, then latest saved user, then env
      let recipientEmail = email;
      if (!recipientEmail) {
        try {
          const User = require("../models/user");
          const latestUser = await User.findOne({ email: { $exists: true, $ne: "" } }).sort({ createdAt: -1 });
          if (latestUser && latestUser.email) {
            recipientEmail = latestUser.email;
            console.log("[Alert] Found fallback user email from DB:", recipientEmail);
          }
        } catch (e) {
          console.warn("[Alert] Failed to find fallback user:", e.message);
        }
      }
      if (!recipientEmail) {
        recipientEmail = process.env.NOTIFICATION_EMAIL || process.env.EMAIL_USER;
        console.log("[Alert] Falling back to env email:", recipientEmail);
      }

      console.log(`[Alert] Dispatching sendWishSetEmail to: "${recipientEmail}"`);

      // Dispatch warm feel-good email notification
      sendWishSetEmail({
        to: recipientEmail || null,
        productTitle: shortTitle || prod.title,
        warmPhrase: message,
        targetPrice: Number(targetPrice),
        currentPrice: prod.currentPrice,
        mrp: prod.mrp,
        productImage: prod.image,
        productUrl: prod.productUrl,
        source: prod.source
      }).then(result => {
        console.log("[Alert] sendWishSetEmail result:", result);
      }).catch(err => console.error("[Alert] Email send warning:", err));
    } else {
      console.warn("[Alert] Product not found in DB for productId:", productId);
    }

    res.json(alert);
  } catch (error) {

    console.error(error);
    res.status(500).json({ message: "Failed to create alert" });

  }

});

/* GET ALERTS FOR PRODUCT */

router.get("/:productId", async (req, res) => {

  try {

    const alerts = await Alert.find({
      productId: req.params.productId
    });

    res.json(alerts);

  } catch (error) {

    console.error(error);

    res.status(500).json({ message: "Failed to fetch alerts" });

  }

});

/* DELETE ALERT */

router.delete("/:alertId", async (req, res) => {

  try {

    await Alert.findByIdAndDelete(req.params.alertId);

    res.json({ message: "Alert deleted" });

  } catch (error) {

    console.error(error);

    res.status(500).json({ message: "Failed to delete alert" });

  }

});

module.exports = router;