const test = require("node:test");
const assert = require("node:assert");
const { calculateDealScore } = require("../index");

test("calculateDealScore awards high score when price equals historic low", () => {
  const result = calculateDealScore({
    currentPrice: 39999,
    historicLow: 39999,
    mrp: 49999
  });
  assert.ok(result.dealScore >= 7.0);
  assert.strictEqual(result.verdict, "SWEET_DEAL");
  assert.strictEqual(result.dropProbability, 15);
});

test("calculateDealScore recommends waiting when price is inflated", () => {
  const result = calculateDealScore({
    currentPrice: 48000,
    historicLow: 30000,
    mrp: 49000
  });
  assert.ok(result.dealScore <= 5.0);
  assert.strictEqual(result.verdict, "WAIT_FOR_DROP");
});

