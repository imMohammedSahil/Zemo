#!/usr/bin/env node

const { parsePrice, extractAmazonASIN, extractFlipkartPID, cleanProductTitle, calculateDiscount } = require("../index");

const args = process.argv.slice(2);
const input = args[0];

if (!input || input === "--help" || input === "-h") {
  console.log(`
retail-price-normalizer CLI 🏷️

Usage:
  npx retail-price-normalizer <url_or_price_or_title>

Examples:
  npx retail-price-normalizer "https://www.amazon.in/dp/B0DJMQ3N5F"
  npx retail-price-normalizer "₹43,999.00"
  npx retail-price-normalizer "Samsung Galaxy Tab S9 FE [SmartChoice] S-Pen in-Box"
`);
  process.exit(0);
}

const result = {};

// 1. Check if input is a URL
if (input.startsWith("http://") || input.startsWith("https://")) {
  const asin = extractAmazonASIN(input);
  const pid = extractFlipkartPID(input);
  result.url = input;
  if (asin) {
    result.store = "Amazon";
    result.asin = asin;
  } else if (pid) {
    result.store = "Flipkart";
    result.productId = pid;
  } else {
    result.store = "Generic";
  }
} else if (/^[₹$€£]|^\d+/.test(input.trim())) {
  result.rawPrice = input;
  result.parsedPrice = parsePrice(input);
} else {
  result.rawTitle = input;
  result.cleanedSearchQuery = cleanProductTitle(input);
}

console.log(JSON.stringify(result, null, 2));
