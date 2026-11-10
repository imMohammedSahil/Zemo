const test = require("node:test");
const assert = require("node:assert");
const { validateEmail } = require("../index");

test("validateEmail catches domain typos like @gamil.com", async () => {
  const result = await validateEmail("sahil@gamil.com");
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.suggestion, "sahil@gmail.com");
  assert.strictEqual(result.isTypo, true);
});

test("validateEmail accepts valid domain MX records", async () => {
  const result = await validateEmail("test@gmail.com");
  assert.strictEqual(result.valid, true);
});

test("validateEmail rejects invalid syntax", async () => {
  const result = await validateEmail("invalid-email");
  assert.strictEqual(result.valid, false);
});

