const dns = require("dns").promises;

const POPULAR_DOMAINS = [
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
  "icloud.com", "proton.me", "protonmail.com"
];

const COMMON_TYPOS = {
  "gamil.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmial.com": "gmail.com",
  "hotmial.com": "hotmail.com",
  "yaho.com": "yahoo.com",
  "outlok.com": "outlook.com"
};

/**
 * Validate email deliverability with fail-open safety
 * @param {string} email
 * @param {Object} [options]
 * @param {number} [options.timeoutMs=3500]
 * @returns {Promise<{ valid: boolean, reason?: string, suggestion?: string, isTypo?: boolean }>}
 */
async function validateEmail(email, { timeoutMs = 3500 } = {}) {
  if (!email || typeof email !== "string") {
    return { valid: false, reason: "Email is required." };
  }

  const trimmed = email.trim().toLowerCase();
  const parts = trimmed.split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { valid: false, reason: "Invalid email syntax format." };
  }

  const [user, domain] = parts;

  // 1. Immediate Typo Detection
  if (COMMON_TYPOS[domain]) {
    return {
      valid: false,
      reason: `Did you mean @${COMMON_TYPOS[domain]}?`,
      suggestion: `${user}@${COMMON_TYPOS[domain]}`,
      isTypo: true
    };
  }

  // 2. DNS MX Record Lookup with strict Fail-Open Timeout
  const mxCheckPromise = (async () => {
    try {
      const records = await dns.resolveMx(domain);
      if (!records || records.length === 0) {
        return { valid: false, reason: `No mail servers found for domain @${domain}.` };
      }
      return { valid: true };
    } catch (dnsErr) {
      if (dnsErr.code === "ENOTFOUND" || dnsErr.code === "ENODATA") {
        return { valid: false, reason: `Domain @${domain} does not accept emails.` };
      }
      // Transient DNS error -> Fail Open
      return { valid: true, failOpen: true };
    }
  })();

  const timeoutPromise = new Promise((resolve) =>
    setTimeout(() => resolve({ valid: true, failOpen: true, timedOut: true }), timeoutMs)
  );

  return Promise.race([mxCheckPromise, timeoutPromise]);
}

module.exports = { validateEmail };

