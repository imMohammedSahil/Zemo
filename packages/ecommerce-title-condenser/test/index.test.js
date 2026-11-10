const test = require("node:test");
const assert = require("node:assert");
const { condenseTitle } = require("../index");

test("condenseTitle strips bracketed fluff and buzzwords", () => {
  const input = "Apple iPad (10th Generation) [Smartchoice] High Performance Liquid Retina Wi-Fi Blue";
  const result = condenseTitle(input, 4);
  assert.strictEqual(result, "Apple iPad Blue");
});

test("condenseTitle handles fallback strings gracefully", () => {
  assert.strictEqual(condenseTitle(""), "Product");
  assert.strictEqual(condenseTitle(null), "Product");
});

