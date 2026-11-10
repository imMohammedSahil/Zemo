const test = require("node:test");
const assert = require("node:assert");
const {
  parsePrice,
  extractAmazonASIN,
  extractFlipkartPID,
  cleanProductTitle,
  calculateDiscount
} = require("../index");

test("parsePrice correctly strips currency symbols and decimals", () => {
  assert.strictEqual(parsePrice("₹43,999.00"), 43999);
  assert.strictEqual(parsePrice("Rs. 1,499"), 1499);
  assert.strictEqual(parsePrice("$ 299.50", false), 299.5);
  assert.strictEqual(parsePrice("invalid"), 0);
});

test("extractAmazonASIN extracts 10-char alphanumeric ASIN", () => {
  assert.strictEqual(
    extractAmazonASIN("https://www.amazon.in/dp/B0DJMQ3N5F?ref=dp_vse_ibvc0"),
    "B0DJMQ3N5F"
  );
  assert.strictEqual(
    extractAmazonASIN("https://amazon.com/gp/product/B08N5WRWNW"),
    "B08N5WRWNW"
  );
});

test("extractFlipkartPID extracts FSN/PID from URL", () => {
  assert.strictEqual(
    extractFlipkartPID("https://www.flipkart.com/apple-ipad/p/itme?pid=TABGHZ7FAAAAABBB"),
    "TABGHZ7FAAAAABBB"
  );
});

test("cleanProductTitle cleans noisy tags", () => {
  const noisy = "Samsung Galaxy Tab S9 FE [SmartChoice] S-Pen in-Box, 128 GB Storage";
  const cleaned = cleanProductTitle(noisy);
  assert.strictEqual(cleaned, "Samsung Galaxy Tab S9 FE 128 GB");
});

test("calculateDiscount returns correct metrics", () => {
  const result = calculateDiscount(39999, 49999);
  assert.strictEqual(result.discountAmount, 10000);
  assert.strictEqual(result.discountPercentage, 20);
  assert.strictEqual(result.hasSavings, true);
});
