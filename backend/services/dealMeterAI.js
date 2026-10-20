const fs = require("fs");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "../../.zemo_cache");
const CACHE_FILE = path.join(CACHE_DIR, "grab_meter_cache.json");

function getCachedMeter(key) {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8") || "{}");
      return data[key] || null;
    }
  } catch (e) {
    console.warn("[GrabMeterAI] Cache read error:", e.message);
  }
  return null;
}

function saveCachedMeter(key, val) {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    let data = {};
    if (fs.existsSync(CACHE_FILE)) {
      data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8") || "{}");
    }
    data[key] = val;
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), "utf-8");
    console.log(`[GrabMeterAI] Saved deal analysis to local disk cache for ${key}`);
  } catch (e) {
    console.warn("[GrabMeterAI] Cache write error:", e.message);
  }
}

function clearMeterCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
      console.log("[GrabMeterAI] Midnight cache purge completed.");
    }
  } catch (e) {
    console.warn("[GrabMeterAI] Cache clear error:", e.message);
  }
}

async function analyzeDealWithGemini(product) {
  const currentPrice = Number(product.currentPrice) || 0;
  const historicLow = Number(product.historicLow) || currentPrice;
  const mrp = Number(product.mrp) || Math.round(currentPrice * 1.25);
  const cacheKey = `${product.asin || product._id}_${currentPrice}`;

  // 1. Check disk cache first to prevent repeated Gemini API calls during testing
  const cached = getCachedMeter(cacheKey);
  if (cached) {
    return cached;
  }

  // 2. Call Gemini API if available
  if (process.env.GEMINI_API_KEY && currentPrice > 0) {
    try {
      const todayStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
      const prompt = `Search Google for live and upcoming major retail sales, discounts, and price trends for: "${product.title}" in India.
Today's Date: ${todayStr}.
You are Zemo's Autonomous Deal Intelligence Engine (Grab-o-Meter).
Your tone is warm, friendly, feel-good, reassuring, and playful like a thoughtful companion who loves saving you money.
Analyze this product in India:
Product: "${product.title}"
Current Live Price: ₹${currentPrice.toLocaleString()}
All-Time Recorded Low: ₹${historicLow.toLocaleString()}
MRP: ₹${mrp.toLocaleString()}

Calculate an accurate deal score (0.0 to 10.0), deal verdict, and timing signals grounded in real retail dates relative to Today (${todayStr}).
IMPORTANT RULES FOR "nextSaleEta":
- If the Amazon Great Indian Festival, Diwali Sale, or any festival sale is active in India today, you MUST set "nextSaleEta" to "Live: Great Indian Festival" or "Live Festival Sale" (NEVER say "1-2 weeks away" if it is happening now!).
- Only specify "X Days Away" if no major sale is currently active.

Ensure "dealAdvice" is concise (1-2 sentences), genuinely warm, calming, and feel-good.
- Speak like a caring friend who loves seeing you smile and save money.
- Avoid robotic marketing clichés like "Hey there, savvy shopper!", "exciting sale!", "steal you won't want to miss", or generic ad hype.
- Example tone: "Sitting at its sweetest price right now for the festival. If it's been on your wishlist, today is a lovely day to welcome it home."
Output strictly a valid JSON code block:
\`\`\`json
{
  "dealScore": 8.5,
  "dealVerdict": "SWEET VALUE",
  "dealAdvice": "Sitting at its sweetest price right now for the festival. If it's been on your wishlist, today is a lovely day to welcome it home.",
  "urgencyText": "Festival Deal Live",
  "dropProbability": 25,
  "predictedSavings": ${(currentPrice - historicLow) > 0 ? (currentPrice - historicLow) : 3000},
  "bestWindowText": "Active Festival Sale",
  "nextSaleEta": "Live: Great Indian Festival"
}
\`\`\``;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            tools: [{ googleSearch: {} }],
            generationConfig: {
              temperature: 0.2
            }
          })
        }
      );

      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        let jsonStr = rawText;
        const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (codeBlockMatch) {
          jsonStr = codeBlockMatch[1];
        } else {
          const firstBrace = rawText.indexOf("{");
          const lastBrace = rawText.lastIndexOf("}");
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonStr = rawText.substring(firstBrace, lastBrace + 1);
          }
        }
        const parsed = JSON.parse(jsonStr);
        if (parsed && typeof parsed.dealScore === "number") {
          saveCachedMeter(cacheKey, parsed);
          return parsed;
        }
      }
    } catch (err) {
      console.warn("[GrabMeterAI] Grounded Gemini call failed, falling back to local calculation:", err.message);
    }
  }

  // 3. Deterministic Fallback if Gemini unavailable or offline
  const diff = currentPrice - historicLow;
  const hikePct = historicLow > 0 ? Math.round((diff / historicLow) * 100) : 0;
  let fallback = {
    dealScore: 7.5,
    dealVerdict: "FAIR VALUE",
    dealAdvice: "Patience pays off. Let's wait together for the next sweet price dip.",
    urgencyText: "Calm Hold",
    dropProbability: 45,
    predictedSavings: Math.round(currentPrice * 0.15),
    bestWindowText: "Weekend Window",
    nextSaleEta: "Live Festival Sale"
  };

  if (currentPrice <= historicLow && currentPrice > 0) {
    fallback = {
      dealScore: 9.8,
      dealVerdict: "SWEET SPOT",
      dealAdvice: "Sitting at its all-time lowest price. Today is a lovely day to welcome it home.",
      urgencyText: "Record Low Today",
      dropProbability: 12,
      predictedSavings: Math.round(currentPrice * 0.25),
      bestWindowText: "Today (Lowest Ever)",
      nextSaleEta: "Live: Great Indian Festival"
    };
  } else if (hikePct <= 5) {
    fallback = {
      dealScore: 9.0,
      dealVerdict: "GREAT TIMING",
      dealAdvice: "Within a whisper of its record low. A really comforting time to buy.",
      urgencyText: "Sweet Window",
      dropProbability: 24,
      predictedSavings: Math.round(currentPrice * 0.20),
      bestWindowText: "Today's Window",
      nextSaleEta: "Live: Great Indian Festival"
    };
  } else if (hikePct <= 15) {
    fallback = {
      dealScore: 8.1,
      dealVerdict: "GOOD VALUE",
      dealAdvice: "Solid discount. Good value for money.",
      urgencyText: "Steady (2-3 Days)",
      dropProbability: 42,
      predictedSavings: Math.round(currentPrice * 0.15),
      bestWindowText: "Weekend Prime Window",
      nextSaleEta: "1-2 Weeks Away"
    };
  }

  saveCachedMeter(cacheKey, fallback);
  return fallback;
}

module.exports = { analyzeDealWithGemini, getCachedMeter, saveCachedMeter, clearMeterCache };
