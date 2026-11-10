const test = require("node:test");
const assert = require("node:assert");
const { calculateBestRoute } = require("../index");

test("calculateBestRoute finds lowest net price taking into account discounts and shipping", () => {
  const stores = [
    { name: "Store A", basePrice: 40000, discount: 0, shippingFee: 0 },
    { name: "Store B", basePrice: 42000, discount: 5000, shippingFee: 200 },
    { name: "Store C", basePrice: 41000, discount: 1000, shippingFee: 0 }
  ];

  const result = calculateBestRoute(stores);
  assert.strictEqual(result.bestRoute.store, "Store B");
  assert.strictEqual(result.bestRoute.netCheckoutPrice, 37200);
  assert.strictEqual(result.maxSavingsVsHighest, 40000 - 37200);
});

