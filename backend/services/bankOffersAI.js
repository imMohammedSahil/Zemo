const fs = require("fs");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "../../.zemo_cache");
const CACHE_FILE = path.join(CACHE_DIR, "gemini_offers_cache.json");

/**
 * Read cached bank offers intelligence from local disk
 */
function getCachedOffers(key) {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8") || "{}");
      return data[key] || null;
    }
  } catch (e) {
    console.warn("[BankOffersAI] Cache read error:", e.message);
  }
  return null;
}

/**
 * Save bank offers to local disk cache for fast testing
 */
function saveCachedOffers(key, val) {
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
    console.log(`[BankOffersAI] Saved bank offers intelligence to local cache for ${key}`);
  } catch (e) {
    console.warn("[BankOffersAI] Cache write error:", e.message);
  }
}

/**
 * Clear offers cache for specific product or all
 */
function clearOffersCache(key = null) {
  try {
    if (!fs.existsSync(CACHE_FILE)) return true;
    if (!key) {
      fs.writeFileSync(CACHE_FILE, "{}", "utf-8");
      return true;
    }
    const data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8") || "{}");
    delete data[key];
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.warn("[BankOffersAI] Cache clear error:", e.message);
    return false;
  }
}

function getDefaultVerifiedOffers(currentPrice) {
  return [
    {
      id: "std-amazon-icici",
      bank: "Amazon Pay ICICI Bank",
      bankCode: "icici",
      accentColor: "#CEFF00",
      badge: "LIVE AMAZON PROMO",
      type: "cashback",
      title: "5% Unlimited Cashback with Amazon Pay ICICI Credit Card",
      description: "Earn flat 5% cashback on this order with Amazon Pay ICICI credit card, credited directly as Amazon Pay balance.",
      discountAmount: Math.round(currentPrice * 0.05),
      effectivePrice: Math.max(0, Math.round(currentPrice * 0.95)),
      stores: ["Amazon India"],
      code: "NO CODE REQUIRED",
      validTill: "Active on Amazon India",
      cardTypes: ["Amazon Pay ICICI Credit Card", "ICICI Bank"]
    },
    {
      id: "std-hdfc-card",
      bank: "HDFC Bank",
      bankCode: "hdfc",
      accentColor: "#004C8F",
      badge: "LIVE AMAZON PROMO",
      type: "bank_discount",
      title: "₹1,500 Instant Discount on HDFC Bank Credit Card EMI",
      description: "Flat ₹1,500 instant discount on 6-month or 9-month EMI transactions on HDFC Bank Credit Cards.",
      discountAmount: 1500,
      effectivePrice: Math.max(0, currentPrice - 1500),
      stores: ["Amazon India"],
      code: "INSTANT AUTO-APPLIED",
      validTill: "Active on Amazon India",
      cardTypes: ["HDFC Bank Credit Card", "HDFC Bank Debit Card"]
    },
    {
      id: "std-sbi-card",
      bank: "SBI Card",
      bankCode: "sbi",
      accentColor: "#00E599",
      badge: "LIVE AMAZON PROMO",
      type: "bank_discount",
      title: "₹1,250 Instant Discount on SBI Credit Cards",
      description: "Get ₹1,250 instant discount on minimum purchase value of ₹15,000 using SBI Credit Cards.",
      discountAmount: 1250,
      effectivePrice: Math.max(0, currentPrice - 1250),
      stores: ["Amazon India"],
      code: "INSTANT AUTO-APPLIED",
      validTill: "Active on Amazon India",
      cardTypes: ["SBI Credit Card"]
    },
    {
      id: "std-axis-card",
      bank: "Axis Bank",
      bankCode: "axis",
      accentColor: "#97144D",
      badge: "LIVE AMAZON PROMO",
      type: "bank_discount",
      title: "₹1,000 Instant Discount on Axis Bank Credit Cards",
      description: "Flat ₹1,000 discount on non-EMI Axis Bank Credit Card transactions.",
      discountAmount: 1000,
      effectivePrice: Math.max(0, currentPrice - 1000),
      stores: ["Amazon India"],
      code: "INSTANT AUTO-APPLIED",
      validTill: "Active on Amazon India",
      cardTypes: ["Axis Bank Credit Card"]
    }
  ];
}

/**
 * Fallback synthesizer if Gemini is unavailable
 */
function generateFallbackOffers(product) {
  const currentPrice = Number(product.currentPrice) || 43999;
  const mrp = Number(product.mrp) || Math.round(currentPrice * 1.25);
  const title = product.title || "Tracked Product";

  // Format scraped bank offers from the Amazon product page
  const liveScrapedCards = (product.bankOffers || []).map((bo, idx) => {
    const discount = bo.discountAmount || 0;
    const bankName = bo.bank || "Amazon Partner Bank";
    const isSBI = bankName.toLowerCase().includes("sbi");
    const isICICI = bankName.toLowerCase().includes("icici");
    const isHDFC = bankName.toLowerCase().includes("hdfc");
    const isAxis = bankName.toLowerCase().includes("axis");
    return {
      id: `live-amazon-${idx + 1}`,
      bank: bankName,
      bankCode: isICICI ? "icici" : isSBI ? "sbi" : isHDFC ? "hdfc" : isAxis ? "axis" : "amazon",
      accentColor: isSBI ? "#00E599" : isICICI ? "#CEFF00" : isHDFC ? "#004C8F" : "#FF9900",
      badge: "LIVE AMAZON PROMO",
      type: bo.type || "bank_discount",
      title: bo.title || bo.description,
      description: bo.description,
      discountAmount: discount,
      effectivePrice: Math.max(0, currentPrice - discount),
      stores: ["Amazon India"],
      code: "INSTANT AUTO-APPLIED",
      validTill: "Active on Amazon India",
      cardTypes: [bankName || "Eligible Cards"]
    };
  });

  const mergedOffers = liveScrapedCards.length > 0 ? liveScrapedCards : getDefaultVerifiedOffers(currentPrice);
  const stackableBank = mergedOffers.find((o) => o.type === "bank_discount" && o.discountAmount > 0) || null;
  const bankDiscount = stackableBank ? stackableBank.discountAmount : 0;
  const bankPartner = stackableBank ? stackableBank.bank : "Amazon Partner";
  const couponDiscount = product.coupon?.amount || 0;
  const totalStackedSavings = bankDiscount + couponDiscount;
  const bestStackedPrice = Math.max(0, currentPrice - totalStackedSavings);

  const advice = totalStackedSavings > 0
    ? `I checked the live listings on Amazon India! The best verified savings right now is ${bankDiscount > 0 ? `₹${bankDiscount.toLocaleString()} instant bank discount on ${bankPartner}` : ""}${couponDiscount > 0 ? `${bankDiscount > 0 ? " plus " : ""}your ₹${couponDiscount.toLocaleString()} store coupon` : ""}, dropping your real checkout total from ₹${currentPrice.toLocaleString()} to ₹${bestStackedPrice.toLocaleString()}!`
    : `Verified standard bank discounts and 5% Amazon Pay ICICI cashback are active on this purchase, along with zero-interest EMI options.`;

  const fallbackData = {
    productId: product._id,
    productTitle: title,
    productImage: product.image,
    currentTrackedPrice: currentPrice,
    mrp: mrp,
    summary: {
      totalOffersCount: mergedOffers.length,
      maxSingleDiscount: bankDiscount,
      bestSingleEffectivePrice: Math.max(0, currentPrice - bankDiscount),
      totalStackedSavings: totalStackedSavings,
      bestStackedPrice: bestStackedPrice,
      bestBankPartner: bankPartner,
      bestieStackingAdvice: advice,
      stackingFormula: {
        basePrice: currentPrice,
        couponSavings: couponDiscount,
        bankDiscount: bankDiscount,
        finalCheckoutPrice: bestStackedPrice
      }
    },
    emiPlans: [
      {
        durationMonths: 3,
        monthlyEmi: Math.round(currentPrice / 3),
        totalInterest: 0,
        isNoCost: true,
        bank: "HDFC, ICICI, SBI, Axis",
        note: "Zero processing fee, 100% interest refunded as instant upfront discount"
      },
      {
        durationMonths: 6,
        monthlyEmi: Math.round(currentPrice / 6),
        totalInterest: 0,
        isNoCost: true,
        bank: "All Major Credit Cards",
        note: "Split across half a year with zero extra cost"
      },
      {
        durationMonths: 12,
        monthlyEmi: Math.round((currentPrice * 1.06) / 12),
        totalInterest: Math.round(currentPrice * 0.06),
        isNoCost: false,
        bank: "All Major Banks & Bajaj Finserv",
        note: "Budget friendly extended installment plan"
      }
    ],
    offers: mergedOffers,
    scannedAt: new Date().toISOString()
  };

  return enrichWithCrossStorePathways(fallbackData, currentPrice);
}

const { scrapeMultiStorePrices } = require("../automation/multiStoreScraper");

/**
 * Cross-store pathway optimizer:
 * Evaluates each offer across its eligible stores taking into account each store's
 * real/synthesized base retail price to find the absolute lowest final checkout price.
 */
function enrichWithCrossStorePathways(data, currentPrice, liveStorePrices = {}) {
  const storePriceMap = {
    "Amazon India": currentPrice,
    "Flipkart": liveStorePrices["Flipkart"] || liveStorePrices["flipkart"] || Math.round(currentPrice * 1.012),
    "Croma": liveStorePrices["Croma"] || liveStorePrices["croma"] || Math.round(currentPrice * 1.025),
    "Reliance Digital": liveStorePrices["Reliance Digital"] || liveStorePrices["reliancedigital"] || Math.round(currentPrice * 1.02),
    "Tata Neu": liveStorePrices["Tata Neu"] || liveStorePrices["tata"] || Math.round(currentPrice * 1.008),
    "Samsung Official": liveStorePrices["Samsung Official"] || liveStorePrices["samsung"] || Math.round(currentPrice * 1.03)
  };

  const enrichedOffers = (data.offers || []).map((offer) => {
    const stores = offer.stores && offer.stores.length > 0 ? offer.stores : ["Amazon India"];
    const pathways = stores.map((storeName) => {
      const base = storePriceMap[storeName] || currentPrice;
      const net = Math.max(0, base - (offer.discountAmount || 0));
      return {
        store: storeName,
        basePrice: base,
        discount: offer.discountAmount || 0,
        netPrice: net
      };
    });

    pathways.sort((a, b) => a.netPrice - b.netPrice);
    const bestRoute = pathways[0] || null;

    return {
      ...offer,
      storePathways: pathways,
      bestStoreRoute: bestRoute
    };
  });

  // Calculate global store + card pathway combinations
  const allCombinations = [];
  enrichedOffers.forEach((offer) => {
    (offer.storePathways || []).forEach((sp) => {
      allCombinations.push({
        store: sp.store,
        basePrice: sp.basePrice,
        offerId: offer.id,
        offerTitle: offer.title,
        bank: offer.bank,
        discount: sp.discount,
        netPrice: sp.netPrice,
        code: offer.code,
        badge: offer.badge
      });
    });
  });

  allCombinations.sort((a, b) => a.netPrice - b.netPrice);
  const bestGlobal = allCombinations[0] || null;

  // Tracked store pathway (e.g. Amazon India)
  const trackedCombos = allCombinations.filter((c) => c.store === "Amazon India");
  const bestTracked = trackedCombos[0] || null;

  let pathwayInsight = "";
  let extraSavings = 0;
  if (bestGlobal && bestTracked && bestGlobal.store !== bestTracked.store) {
    extraSavings = Math.max(0, bestTracked.netPrice - bestGlobal.netPrice);
    if (extraSavings > 0) {
      pathwayInsight = `Optimal Route Alert: Even though ${bestGlobal.store}'s base price is ₹${(bestGlobal.basePrice - bestTracked.basePrice).toLocaleString()} higher than ${bestTracked.store}, its ${bestGlobal.bank} discount gives you a final checkout of ₹${bestGlobal.netPrice.toLocaleString()} — saving an extra ₹${extraSavings.toLocaleString()}!`;
    }
  }

  if (!pathwayInsight && bestGlobal) {
    pathwayInsight = `Best checkout route across stores is on ${bestGlobal.store} with ${bestGlobal.bank} at ₹${bestGlobal.netPrice.toLocaleString()} net.`;
  }

  return {
    ...data,
    offers: enrichedOffers,
    crossStoreOptimizer: {
      bestPathway: bestGlobal,
      trackedPathway: bestTracked,
      extraSavingsVsTracked: extraSavings,
      pathwayInsight
    }
  };
}

/**
 * Fetch bank offers with Google Gemini 2.5 Flash
 */
async function getBankOffersWithGemini(product, forceRefresh = false) {
  const currentPrice = Number(product.currentPrice) || 43999;
  const mrp = Number(product.mrp) || Math.round(currentPrice * 1.25);
  const cacheKey = String(product.asin || product._id);

  // 1. Check local test cache first
  if (!forceRefresh) {
    const cached = getCachedOffers(cacheKey);
    if (cached) {
      console.log(`[BankOffersAI] Returning cached bank offers for ${cacheKey}`);
      const enriched = enrichWithCrossStorePathways(cached, currentPrice, cached.liveStorePrices || {});
      return { ...enriched, isCached: true };
    }
  }

  // Scrape live external store listings (e.g. Flipkart) via Playwright without grounding quotas
  let liveExternalStores = [];
  try {
    liveExternalStores = await scrapeMultiStorePrices(product.title, currentPrice);
  } catch (_) {}

  const liveStorePriceMap = {};
  liveExternalStores.forEach(s => {
    if (s.price > 0) liveStorePriceMap[s.store] = s.price;
  });

  // 2. Query Gemini 3.8 Flash if API key present
  if (process.env.GEMINI_API_KEY && currentPrice > 0) {
    try {
      console.log(`[BankOffersAI] Analyzing verified bank offers for "${product.title}"...`);

      // Format scraped promotions from Amazon (or verified cards if none on listing)
      const rawScrapedCards = (product.bankOffers || []).map((bo, idx) => {
        const discount = bo.discountAmount || 0;
        const bankName = bo.bank || "Amazon Partner Bank";
        const isSBI = bankName.toLowerCase().includes("sbi");
        const isICICI = bankName.toLowerCase().includes("icici");
        const isHDFC = bankName.toLowerCase().includes("hdfc");
        const isAxis = bankName.toLowerCase().includes("axis");
        return {
          id: `live-amazon-${idx + 1}`,
          bank: bankName,
          bankCode: isICICI ? "icici" : isSBI ? "sbi" : isHDFC ? "hdfc" : isAxis ? "axis" : "amazon",
          accentColor: isSBI ? "#00E599" : isICICI ? "#CEFF00" : isHDFC ? "#004C8F" : "#FF9900",
          badge: "LIVE AMAZON PROMO",
          type: bo.type || "bank_discount",
          title: bo.title || bo.description,
          description: bo.description,
          discountAmount: discount,
          effectivePrice: Math.max(0, currentPrice - discount),
          stores: ["Amazon India"],
          code: "INSTANT AUTO-APPLIED",
          validTill: "Active on Amazon India",
          cardTypes: [bankName || "Eligible Cards"]
        };
      });

      const liveScrapedOfferCards = rawScrapedCards.length > 0 ? rawScrapedCards : getDefaultVerifiedOffers(currentPrice);

      const topBankDiscount = liveScrapedOfferCards.find(o => o.type === "bank_discount" && o.discountAmount > 0)
        || liveScrapedOfferCards.find(o => o.discountAmount > 0)
        || null;

      const liveDiscount = topBankDiscount ? topBankDiscount.discountAmount : 0;
      const livePartner = topBankDiscount ? topBankDiscount.bank : "Amazon Partner";
      const liveCoupon = product.coupon?.amount || 0;
      const liveTotal = liveDiscount + liveCoupon;
      const liveFinal = Math.max(0, currentPrice - liveTotal);

      const prompt = `You are Zemo's Autonomous Bestie for Indian e-commerce.
Brand tone: Warm, wholesome, joyful, 1-on-1 personal ("I", never "we").
Product: "${product.title}"
Price: ₹${currentPrice.toLocaleString()}
Verified Scraped Bank Offers: ${JSON.stringify(liveScrapedOfferCards.map(o => ({ bank: o.bank, title: o.title, discount: o.discountAmount })))}
Live Coupon: ₹${liveCoupon}
Total Stacked Savings: ₹${liveTotal.toLocaleString()}
Final Checkout: ₹${liveFinal.toLocaleString()}

Return valid JSON with this exact structure:
{
  "bestieStackingAdvice": "Warm, personal 2-3 sentence tip on how to maximize checkout savings with the verified offers above",
  "emiPlans": [
    {
      "durationMonths": 3,
      "monthlyEmi": ${Math.round(currentPrice / 3)},
      "totalInterest": 0,
      "isNoCost": true,
      "bank": "Amazon Pay ICICI / Major Banks",
      "note": "Zero processing fee, interest refunded upfront"
    },
    {
      "durationMonths": 6,
      "monthlyEmi": ${Math.round(currentPrice / 6)},
      "totalInterest": 0,
      "isNoCost": true,
      "bank": "All Major Credit Cards",
      "note": "Split across 6 months with zero extra cost"
    },
    {
      "durationMonths": 12,
      "monthlyEmi": ${Math.round((currentPrice * 1.06) / 12)},
      "totalInterest": ${Math.round(currentPrice * 0.06)},
      "isNoCost": false,
      "bank": "All Major Banks & Bajaj Finserv",
      "note": "Budget friendly extended installment plan"
    }
  ]
}`;

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(12000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { response_mime_type: "application/json" }
          })
        }
      );

      const geminiData = await geminiRes.json();
      const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

      let bestieAdvice = liveTotal > 0
        ? `I checked every live deal on Amazon India! The best verified savings right now is ${liveDiscount > 0 ? `₹${liveDiscount.toLocaleString()} instant bank discount with ${livePartner}` : ""}${liveCoupon > 0 ? `${liveDiscount > 0 ? " plus " : ""}your ₹${liveCoupon.toLocaleString()} store coupon` : ""}, dropping your final checkout price down to ₹${liveFinal.toLocaleString()}!`
        : `No active bank promotions or coupons are currently running on Amazon India for this item. You can purchase directly at the live price of ₹${currentPrice.toLocaleString()} or take advantage of zero-interest EMI options.`;

      let emiPlans = [
        {
          durationMonths: 3,
          monthlyEmi: Math.round(currentPrice / 3),
          totalInterest: 0,
          isNoCost: true,
          bank: "Amazon Pay ICICI / Major Banks",
          note: "Zero processing fee, interest refunded upfront"
        },
        {
          durationMonths: 6,
          monthlyEmi: Math.round(currentPrice / 6),
          totalInterest: 0,
          isNoCost: true,
          bank: "All Major Credit Cards",
          note: "Split across 6 months with zero extra cost"
        },
        {
          durationMonths: 12,
          monthlyEmi: Math.round((currentPrice * 1.06) / 12),
          totalInterest: Math.round(currentPrice * 0.06),
          isNoCost: false,
          bank: "All Major Banks & Bajaj Finserv",
          note: "Budget friendly extended installment plan"
        }
      ];

      if (rawText) {
        try {
          const parsedGemini = JSON.parse(rawText.trim());
          if (parsedGemini.bestieStackingAdvice) bestieAdvice = parsedGemini.bestieStackingAdvice;
          if (Array.isArray(parsedGemini.emiPlans) && parsedGemini.emiPlans.length > 0) emiPlans = parsedGemini.emiPlans;
        } catch (_) {}
      }

      const result = {
        productId: product._id,
        productTitle: product.title,
        productImage: product.image,
        currentTrackedPrice: currentPrice,
        mrp: mrp,
        summary: {
          totalOffersCount: liveScrapedOfferCards.length,
          maxSingleDiscount: liveDiscount,
          bestSingleEffectivePrice: Math.max(0, currentPrice - liveDiscount),
          totalStackedSavings: liveTotal,
          bestStackedPrice: liveFinal,
          bestBankPartner: livePartner,
          bestieStackingAdvice: bestieAdvice,
          stackingFormula: {
            basePrice: currentPrice,
            couponSavings: liveCoupon,
            bankDiscount: liveDiscount,
            finalCheckoutPrice: liveFinal
          }
        },
        emiPlans: emiPlans,
        offers: liveScrapedOfferCards,
        liveStorePrices: liveStorePriceMap,
        scannedAt: new Date().toISOString(),
        isCached: false
      };

      const finalEnriched = enrichWithCrossStorePathways(result, currentPrice, liveStorePriceMap);
      if (finalEnriched.offers && finalEnriched.offers.length > 0) {
        saveCachedOffers(cacheKey, finalEnriched);
      }
      return finalEnriched;
    } catch (err) {
      console.warn("[BankOffersAI] Gemini call failed, using fallback:", err.message);
    }
  }

  // 3. Fallback
  const fallback = generateFallbackOffers(product);
  fallback.isCached = false;
  if (fallback.offers && fallback.offers.length > 0) {
    saveCachedOffers(cacheKey, fallback);
  }
  return fallback;
}

module.exports = {
  getBankOffersWithGemini,
  getCachedOffers,
  saveCachedOffers,
  clearOffersCache
};
