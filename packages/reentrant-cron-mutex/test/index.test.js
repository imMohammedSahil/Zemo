const test = require("node:test");
const assert = require("node:assert");
const { CronMutex, createCronMutex } = require("../index");

test("CronMutex executes single task cleanly", async () => {
  const mutex = new CronMutex("scrape-test");
  const res = await mutex.run(async () => {
    return 42;
  });

  assert.strictEqual(res.executed, true);
  assert.strictEqual(res.skipped, false);
  assert.strictEqual(res.result, 42);
  assert.strictEqual(mutex.runCount, 1);
  assert.strictEqual(mutex.skippedCount, 0);
});

test("CronMutex safely skips overlapping parallel calls", async () => {
  const mutex = new CronMutex("long-job");

  // Fire a slow job
  const slowPromise = mutex.run(async () => {
    await new Promise((r) => setTimeout(r, 80));
    return "done";
  });

  // Immediately fire a second job while first is running
  const overlapPromise = mutex.run(async () => {
    return "should-be-skipped";
  });

  const [slowRes, overlapRes] = await Promise.all([slowPromise, overlapPromise]);

  assert.strictEqual(slowRes.executed, true);
  assert.strictEqual(slowRes.result, "done");

  assert.strictEqual(overlapRes.executed, false);
  assert.strictEqual(overlapRes.skipped, true);
  assert.strictEqual(mutex.skippedCount, 1);
});
