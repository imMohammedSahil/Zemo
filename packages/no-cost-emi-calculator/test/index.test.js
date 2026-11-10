const test = require("node:test");
const assert = require("node:assert");
const { calculateEmi } = require("../index");

test("calculateEmi computes True No-Cost EMI with waived interest", () => {
  const result = calculateEmi({
    principal: 60000,
    apr: 16.0,
    months: 6,
    isNoCost: true
  });

  assert.strictEqual(result.monthlyEmi, 10000);
  assert.strictEqual(result.totalInterest, 0);
  assert.ok(result.waivedInterest > 0);
  assert.strictEqual(result.totalCost, 60000);
  assert.strictEqual(result.isNoCost, true);
});

test("calculateEmi computes standard interest-bearing EMI with processing fee GST", () => {
  const result = calculateEmi({
    principal: 60000,
    apr: 16.0,
    months: 6,
    isNoCost: false,
    processingFee: 199
  });

  assert.ok(result.monthlyEmi > 10000);
  assert.ok(result.totalInterest > 0);
  assert.strictEqual(result.waivedInterest, 0);
  assert.strictEqual(result.processingFeeTotal, Math.round(199 * 1.18));
  assert.strictEqual(result.isNoCost, false);
});

