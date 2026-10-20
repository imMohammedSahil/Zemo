require("dotenv").config();
// Zemo Server - Email Surveillance Active
// NOTE FOR PRODUCTION DEPLOYMENT:
// The demo product (Samsung Galaxy Tab S10 FE, ID: 6ad71e366b2c6422ae682ab4) and its pre-generated
// AI cache in /.zemo_cache must be deployed as-is so recruiters see instant, zero-delay Gemini intelligence
// (Store Comparison, Reviews, Bank Offers, Short Title) without burning API tokens or scraping live.

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

/* Route Imports */

const productRoutes = require("./routes/productRoutes");
const priceRoutes = require("./routes/priceRoutes");
const alertRoutes = require("./routes/alertRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");


/* Scheduler */

const startScheduler = require("./scheduler/priceScheduler");

const app = express();

/* Middleware */

app.use("/uploads", express.static("uploads"));

app.use(cors());
app.use(express.json());
app.use("/user", authRoutes);


const { seedDemoProductIfEmpty } = require("./services/seedService");

const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
mongoose.connect(mongoUri)
.then(async () => {
    console.log("MongoDB Connected");
    await seedDemoProductIfEmpty();
    startScheduler();
})
.catch((err) => {
    console.error("MongoDB Connection Error:", err);
});

/* Routes */

app.use("/product", productRoutes);

app.use("/price-history", priceRoutes);

app.use("/alert", alertRoutes);

app.use("/notifications", notificationRoutes);

app.use("/reviews", reviewRoutes);

app.use("/user", userRoutes);

/* Root Test Route */

app.get("/", (req, res) => {
    res.send("Zemo backend running");
});

/* Start Server */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});