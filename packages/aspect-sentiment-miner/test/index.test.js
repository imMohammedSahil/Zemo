const test = require("node:test");
const assert = require("node:assert");
const AspectSentimentMiner = require("../index");

test("AspectSentimentMiner initializes with config", () => {
  const miner = new AspectSentimentMiner({ apiKey: "test-key" });
  assert.strictEqual(miner.apiKey, "test-key");
  assert.strictEqual(miner.model, "gemini-2.5-flash");
});

test("AspectSentimentMiner generates structured fallback when offline", async () => {
  const miner = new AspectSentimentMiner();
  const res = await miner.analyze({
    productName: "Sony WH-1000XM5",
    overallRating: 4.5
  });

  assert.strictEqual(res.success, true);
  assert.strictEqual(res.provider, "heuristic-fallback");
  assert.ok(Array.isArray(res.pros));
  assert.ok(Array.isArray(res.cons));
  assert.ok(res.pros.length > 0);
  assert.ok(typeof res.verdict === "string");
});
