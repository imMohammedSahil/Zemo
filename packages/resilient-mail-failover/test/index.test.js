const test = require("node:test");
const assert = require("node:assert");
const ResilientMailer = require("../index");

test("ResilientMailer initializes with config or process.env", () => {
  const mailer = new ResilientMailer({
    senderEmail: "test@domain.com",
    senderName: "Test App"
  });
  assert.strictEqual(mailer.config.senderEmail, "test@domain.com");
  assert.strictEqual(mailer.config.senderName, "Test App");
});

test("ResilientMailer throws if recipient 'to' is missing", async () => {
  const mailer = new ResilientMailer();
  await assert.rejects(
    async () => {
      await mailer.send({ subject: "Hi", html: "Hello" });
    },
    /recipient email is required/
  );
});
