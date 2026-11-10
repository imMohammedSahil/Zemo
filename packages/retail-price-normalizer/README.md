# retail-price-normalizer 🏷️🔍

> Zero-dependency e-commerce parsing utility for price extraction, currency cleanup, Amazon ASIN & Flipkart PID extraction, and search query sanitization.

[![npm version](https://img.shields.io/npm/v/retail-price-normalizer.svg?style=flat-square)](https://www.npmjs.com/package/retail-price-normalizer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## Why?

Scraping and analyzing e-commerce listings (Amazon, Flipkart) presents messy, non-standard text:
* Prices include localized symbols, commas, and trailing cents (`"₹43,999.00"`, `"Rs. 1,499"`, `"$ 299.99"`).
* Product titles are polluted with SEO keyword fluff (`"[SmartChoice] With S-Pen in-Box | Pre-loaded Pro Apps"`).
* Product IDs (ASINs, FSNs) are buried inside referral parameters and query strings.

`retail-price-normalizer` provides fast, regex-optimized normalization functions with **zero external dependencies**.

---

## Installation

```bash
npm install retail-price-normalizer
```

---

## Quickstart

```javascript
const {
  parsePrice,
  extractAmazonASIN,
  extractFlipkartPID,
  cleanProductTitle,
  calculateDiscount
} = require("retail-price-normalizer");

// 1. Clean messy currency strings into clean numbers
parsePrice("₹43,999.00"); // 43999
parsePrice("Rs. 1,499");  // 1499
parsePrice("$ 299.50", false); // 299.5

// 2. Extract Amazon ASIN from any URL
const asin = extractAmazonASIN("https://www.amazon.in/dp/B0DJMQ3N5F?ref=dp_vse_ibvc0");
console.log(asin); // "B0DJMQ3N5F"

// 3. Extract Flipkart Product ID (FSN)
const pid = extractFlipkartPID("https://www.flipkart.com/apple-ipad-10th-gen/p/itme?pid=TABGHZ7F");
console.log(pid); // "TABGHZ7F"

// 4. Strip noisy seller keywords into clean search queries
const cleanQuery = cleanProductTitle("Samsung Galaxy Tab S9 FE [SmartChoice] S-Pen in-Box, 128 GB Storage");
console.log(cleanQuery); // "Samsung Galaxy Tab S9 FE 128 GB"

// 5. Calculate discount metrics
const metrics = calculateDiscount(39999, 49999);
console.log(metrics); 
// { discountAmount: 10000, discountPercentage: 20, hasSavings: true }
```

---

## License

MIT © [Mohammed Sahil](https://github.com/imMohammedSahil)
Extracted from the retail normalization engine of [Zemo](https://github.com/imMohammedSahil/Zemo).
