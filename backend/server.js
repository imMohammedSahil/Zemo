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

const path = require("path");
const pkg = require("../package.json");
const appVersion = pkg.version || "1.0.0";
const { renderLandingPage } = require("./views/landingPage");

const app = express();

/* Middleware */

app.use("/uploads", express.static("uploads"));
app.use("/assets", express.static(path.join(__dirname, "assets")));

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

/* Zero-Dependency Sliding-Window Rate Limiter for Public Endpoints */
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60; // 60 requests per minute

function publicRateLimiter(req, res, next) {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "client";
    const now = Date.now();

    let record = rateLimitMap.get(ip);
    if (!record || now - record.startTime > RATE_LIMIT_WINDOW_MS) {
        record = { count: 1, startTime: now };
        rateLimitMap.set(ip, record);
    } else {
        record.count++;
    }

    if (record.count > MAX_REQUESTS_PER_WINDOW) {
        res.setHeader("Retry-After", "60");
        return res.status(429).json({
            error: "Too Many Requests",
            message: "Rate limit exceeded. Please wait a moment before trying again."
        });
    }

    next();
}

// Periodic cleanup of stale rate-limit IP records every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
        if (now - record.startTime > RATE_LIMIT_WINDOW_MS) {
            rateLimitMap.delete(ip);
        }
    }
}, 5 * 60 * 1000);

/* Routes */

app.use("/product", publicRateLimiter, productRoutes);

app.use("/price-history", priceRoutes);

app.use("/alert", alertRoutes);

app.use("/notifications", notificationRoutes);

app.use("/reviews", reviewRoutes);

app.use("/user", userRoutes);

/* System Health Diagnostics Route */

app.get("/health", publicRateLimiter, (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    res.json({
        status: "operational",
        service: "Zemo Backend API",
        version: appVersion,
        environment: process.env.NODE_ENV || "production",
        uptimeSeconds: Math.floor(process.uptime()),
        database: {
            status: isDbConnected ? "connected" : "connecting",
            name: mongoose.connection.name || "zemo"
        },
        services: {
            browserAutomation: "Playwright Chromium (v1.58.2)",
            cognitivePipeline: "Google Gemini 2.5 Flash + Meta-Llama-3-8B",
            scheduler: "Node-Cron 15-Minute Surveillance Mutex Daemon",
            emailEngine: "Nodemailer SMTP Transactional Engine"
        },
        timestamp: new Date().toISOString()
    });
});

/* Root Route - Rich Developer Dashboard / Status Portal */

app.get("/", (req, res) => {
    const wantsJson = (req.headers.accept && req.headers.accept.includes("application/json") && !req.headers.accept.includes("text/html")) || req.query.format === "json";

    if (wantsJson) {
        return res.json({
            status: "operational",
            service: "Zemo Backend API",
            version: appVersion,
            docs: "/health",
            catalog: "/product",
            frontend: "https://zemo-official.vercel.app",
            timestamp: new Date().toISOString()
        });
    }

    const html = renderLandingPage({
        dbConnected: mongoose.connection.readyState === 1,
        port: PORT,
        nodeVersion: process.version,
        uptime: Math.floor(process.uptime()),
        env: process.env.NODE_ENV || "production",
        version: appVersion
    });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
});

/* Start Server */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});