const express = require("express");
const router = express.Router();

const Alert = require("../models/Alert");

/* CREATE ALERT */

router.post("/create", async (req, res) => {

  try {

    const { productId, targetPrice, tolerance } = req.body;

    const alert = await Alert.findOneAndUpdate(
      { productId },
      {
        productId,
        targetPrice,
        tolerance,
        triggered: false
      },
      {
        new: true,
        upsert: true
      }
    );

    console.log("ALERT UPSERTED:", alert);

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