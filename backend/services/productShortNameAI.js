const fs = require("fs");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "../../.zemo_cache");
const CACHE_FILE = path.join(CACHE_DIR, "gemini_short_names_cache.json");

/**
 * Read cached short names from local disk
 */
function getCachedShortName(key) {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8") || "{}");
      return data[key] || null;
    }
  } catch (e) {
    console.warn("[ProductShortNameAI] Cache read error:", e.message);
  }
  return null;
}

/**
 * Save shortened product name to disk cache
 */
function saveCachedShortName(key, val) {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    let data = {};
    if (fs.existsSync(CACHE_FILE)) {
      data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8") || "{}");
    }
    data[key] = {
      ...val,
      cachedAt: new Date().toISOString()
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), "utf-8");
    console.log(`[ProductShortNameAI] Cached short name for "${key}":`, val.shortTitle);
  } catch (e) {
    console.warn("[ProductShortNameAI] Cache write error:", e.message);
  }
}

/**
 * Instant deterministic fallback title cleaner (no AI call)
 */
function localFallbackShortName(fullTitle = "") {
  if (!fullTitle) return "Product";

  // Remove content in brackets like [Smartchoice], (Black, 128GB)
  let clean = fullTitle.replace(/\[.*?\]|\(.*?\)/g, " ");

  // Remove common marketing/spec buzzwords
  clean = clean.replace(/\b(Racing Edition|Ergonomic|with 3D Armrests|Breathable Fabric|High Performance|Wi-Fi|GB RAM|Storage|Display|In-Box|Industry Leading)\b/gi, " ");

  // Clean trailing punctuation and split words
  const words = clean.trim().split(/\s+/).filter(w => w.length > 0 && !/^[,|\-–—:]+$/.test(w));
  const shortTitle = words.slice(0, 4).join(" ").replace(/[,|\-–—:]+$/, "").trim() || fullTitle.slice(0, 35);
  const warmPhrase = `Chasing ${shortTitle} around the clock until it surrenders`;

  return { shortTitle, warmPhrase };
}

/**
 * Get or generate short name & feel-good warm phrase with Gemini
 * Caches once per product to prevent rate limits on repeat requests
 */
async function getOrGenerateShortName(product) {
  if (!product) return { shortTitle: "Product", warmPhrase: "Chasing Product around the clock until it surrenders" };

  const cacheKey = String(product._id || product.asin || product.title);

  // 1. Check MongoDB document fields first
  if (product.shortTitle && product.shortTitle.trim()) {
    return {
      shortTitle: product.shortTitle,
      warmPhrase: product.warmPhrase || `Chasing ${product.shortTitle} around the clock until it surrenders`
    };
  }

  // 2. Check disk cache
  const cached = getCachedShortName(cacheKey);
  if (cached && cached.shortTitle) {
    // Sync to MongoDB doc asynchronously if possible
    if (product.save && (!product.shortTitle || product.shortTitle !== cached.shortTitle)) {
      product.shortTitle = cached.shortTitle;
      product.warmPhrase = cached.warmPhrase || `Chasing ${cached.shortTitle} around the clock until it surrenders`;
      product.save().catch(() => {});
    }
    return cached;
  }

  // 3. Query Gemini once per product if API key is configured
  if (process.env.GEMINI_API_KEY && product.title) {
    try {
      console.log(`[ProductShortNameAI] Querying Gemini once to shorten: "${product.title.slice(0, 50)}"...`);
      const prompt = `You are Zemo's Product Intelligence Assistant.
Given this full e-commerce product title in India:
"${product.title}"

Tasks:
1. "shortTitle": Return a clean, recognizable, concise short brand & model name (2-5 words max). Strip out all filler SEO specs, seller labels like [Smartchoice], color codes, fluff words like "Ergonomic Gaming Chair with 3D Armrests", "Racing Edition", "with S Pen", etc.
Examples:
- "Green Soul Raptor 2.0 Racing Edition Ergonomic Gaming Chair with 3D Armrests, Breathable Fabric..." -> "Green Soul Raptor 2.0"
- "Samsung Galaxy Tab S10 FE [Smartchoice], S Pen in-Box, 10.9 inch Display, Wi-Fi, 6GB RAM..." -> "Samsung Galaxy Tab S10 FE"
- "Apple iPhone 15 (128 GB) - Black with Dynamic Island..." -> "iPhone 15"
- "Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones..." -> "Sony WH-1000XM5"

2. "warmPhrase": Create a playful, feel-good, warm sentence prefix (no emojis at all) following this exact style: "Chasing [shortTitle] around the clock until it surrenders"
Example:
"Chasing Green Soul Raptor 2.0 around the clock until it surrenders"

Output strictly a JSON block:
\`\`\`json
{
  "shortTitle": "Green Soul Raptor 2.0",
  "warmPhrase": "Chasing Green Soul Raptor 2.0 around the clock until it surrenders"
}
\`\`\``;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        const jsonStr = jsonMatch ? jsonMatch[1] : rawText.trim();
        const parsed = JSON.parse(jsonStr);

        if (parsed && parsed.shortTitle) {
          // Remove any stray emojis from AI output
          const cleanShortTitle = parsed.shortTitle.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").trim();
          const cleanWarmPhrase = (parsed.warmPhrase || `Chasing ${cleanShortTitle} around the clock until it surrenders`).replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").trim();

          const result = {
            shortTitle: cleanShortTitle,
            warmPhrase: cleanWarmPhrase
          };

          // Save to disk cache
          saveCachedShortName(cacheKey, result);

          // Save to MongoDB doc
          if (product.save) {
            product.shortTitle = result.shortTitle;
            product.warmPhrase = result.warmPhrase;
            product.save().catch(() => {});
          }

          return result;
        }
      }
    } catch (err) {
      console.warn("[ProductShortNameAI] Gemini call failed, using local cleaner:", err.message);
    }
  }

  // 4. Fallback if Gemini offline or failed
  const fallback = localFallbackShortName(product.title);
  saveCachedShortName(cacheKey, fallback);
  if (product.save) {
    product.shortTitle = fallback.shortTitle;
    product.warmPhrase = fallback.warmPhrase;
    product.save().catch(() => {});
  }
  return fallback;
}

module.exports = {
  getOrGenerateShortName,
  localFallbackShortName,
  getCachedShortName,
  saveCachedShortName
};
