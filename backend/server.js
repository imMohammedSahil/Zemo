require("dotenv").config();

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


/* Database Connection */

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB Connected");
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

/* Start Scheduler */

startScheduler();

/* Start Server */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});