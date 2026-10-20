const { chromium } = require("playwright");

/**
 * Clean product title into focused retail search query keywords
 */
/**
 * Clean product title into focused retail search query keywords without stripping critical specs
 */
function cleanSearchQuery(title) {
  if (!title) return "";

  // 1. Smart device extraction: Extract clean core name for tablets/iPads
  const tabletMatch = title.match(/^(Samsung\s+Galaxy\s+Tab\s+[A-Za-z0-9\s+]+?)(?=[,\[]|\b\d{1,2}\.?\d?\s*(?:cm|inch|Display)|\s*S\s*Pen)/i);
  if (tabletMatch) {
    const storageMatch = title.match(/(\d{2,4}\s*GB\s*Storage|\d{2,4}\s*GB)/i);
    return `${tabletMatch[1].trim()} ${storageMatch ? storageMatch[1].replace(/Storage/i, '').trim() : ""}`.trim();
  }

  // 2. TV pattern: Preserve brand, size, and model
  const tvSizeMatch = title.match(/(\d{2,3})\s*(?:inch|inches|\")/i);
  const tvModelMatch = title.match(/\b([A-Z0-9]{1,4}-[A-Z0-9]{4,10})\b/i);
  if (tvModelMatch && tvSizeMatch) {
    const brand = (title.match(/^(Sony|Samsung|LG|TCL|OnePlus|Xiaomi|Vu|Hisense|Acer)/i) || [""])[0];
    return `${brand} ${tvModelMatch[1]} ${tvSizeMatch[1]} inch`.trim();
  }

  let cleaned = title
    .replace(/\[[^\]]*\]/g, "")
    .replace(/Smartchoice\s*/gi, "")
    .replace(/S Pen in-Box\s*/gi, "")
    .replace(/AI Writing\s*/gi, "")
    .replace(/Desktop Mode\s*/gi, "")
    .replace(/Pre Loaded Pro Apps\s*/gi, "")
    .replace(/Built for AI.*$/i, "")
    .replace(/with Apple Intelligence.*$/i, "")
    .replace(/Liquid Retina Display\s*/gi, "")
    .replace(/FaceTime HD Camera\s*/gi, "")
    .replace(/[|,;]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.slice(0, 90).trim();
}

// In-flight request deduplication map to prevent parallel Chromium instances
const inFlightScrapes = new Map();

/**
 * Live scrape external Indian retail stores (Flipkart, etc.) without API search grounding limits
 */
async function scrapeMultiStorePrices(productTitle, targetPrice = 0) {
  const query = cleanSearchQuery(productTitle);
  if (!query) return [];

  const dedupeKey = `${query}_${Math.round(targetPrice)}`;
  if (inFlightScrapes.has(dedupeKey)) {
    return inFlightScrapes.get(dedupeKey);
  }

  const scrapeTask = (async () => {
    // Extract critical identifiers to prevent cross-variant drift (e.g., 55" matching a 65" TV)
    const targetSizeMatch = productTitle.match(/(\d{2,3})\s*(?:inch|inches|\")/i);
    const targetSize = targetSizeMatch ? targetSizeMatch[1] : null;

    const targetModelMatch = productTitle.match(/\b([A-Z0-9]{1,4}-[A-Z0-9]{4,10})\b/i);
    const targetModel = targetModelMatch ? targetModelMatch[1].toLowerCase() : null;

    const isMainDevice = /tablet|ipad|laptop|phone|tv|television|macbook|galaxy tab/i.test(productTitle);

    let browser;
    const scrapedStores = [];

    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    });
    const page = await context.newPage();

    // Abort heavy media to keep scraper blazing fast (< 3 seconds)
    await page.route(/\.(png|jpg|jpeg|webp|svg|gif|woff|woff2|ttf|css)($|\?)/, route => route.abort());

    // 1. Live Flipkart Search Scraping
    try {
      const flipkartUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
      console.log(`[MultiStoreScraper] Searching Flipkart live for: "${query}"...`);

      await page.goto(flipkartUrl, { waitUntil: "domcontentloaded", timeout: 12000 });

      const flipkartMatch = await page.evaluate(({ targetSize, targetModel, isMainDevice, targetPrice }) => {
        const links = Array.from(document.querySelectorAll('a[href*="/p/"]'));
        for (const a of links) {
          let p = a.parentElement;
          for (let i = 0; i < 6; i++) {
            if (!p) break;
            const text = p.innerText || "";
            const priceMatch = text.match(/₹\s*([0-9,]+)/);
            if (priceMatch) {
              const cleanTitle = (a.innerText || "").replace(/Add to Compare/gi, "").trim();
              const lowerTitle = cleanTitle.toLowerCase();
              const price = parseInt(priceMatch[1].replace(/,/g, ""), 10);

              // 1. Price Sanity Check: If target is expensive (e.g. ₹40k tablet), reject absurdly cheap accessories (< 45% of price)
              if (targetPrice > 5000 && price < targetPrice * 0.45) {
                break;
              }

              // 2. Anti-Accessory Filter: Never match a pencil, case, cover, or screen protector when tracking a main device
              if (isMainDevice && /pencil|stylus|cover|case|tempered|guard|protector|skin|sleeve|pouch|stand|strap|cable|adapter/i.test(lowerTitle)) {
                break;
              }

              // 3. Screen Size Protection: If searching for a specific screen size (e.g. 65"), reject mismatching sizes (e.g. 55")
              if (targetSize) {
                const resultSizeMatch = cleanTitle.match(/(\d{2,3})\s*(?:inch|inches|\")/i);
                if (resultSizeMatch && resultSizeMatch[1] !== targetSize) {
                  break;
                }
              }

              // 4. Model Protection: If searching for a specific model code, ensure no conflict
              if (targetModel && !lowerTitle.includes(targetModel)) {
                const resultModelMatch = cleanTitle.match(/\b([A-Z0-9]{1,4}-[A-Z0-9]{4,10})\b/i);
                if (resultModelMatch && resultModelMatch[1].toLowerCase() !== targetModel) {
                  break;
                }
              }

              const lines = text.split("\n").map(s => s.trim()).filter(Boolean);
              
              // Extract genuine bank/card offers only (strictly exclude exchange offers)
              const bankOfferLine = lines.find(l => 
                !/exchange/i.test(l) && /bank offer|cashback|instant discount|axis|hDFC|icici|sbi|credit card/i.test(l)
              ) || "";
              const exchangeLine = lines.find(l => /exchange/i.test(l)) || "";

              return {
                store: "Flipkart",
                storeId: "flipkart",
                title: cleanTitle.slice(0, 100),
                price,
                bankOffer: bankOfferLine,
                exchange: exchangeLine,
                productUrl: a.href,
                inStock: !text.toLowerCase().includes("out of stock")
              };
            }
            p = p.parentElement;
          }
        }
        return null;
      }, { targetSize, targetModel });

      if (flipkartMatch && flipkartMatch.price > 0) {
        console.log(`[MultiStoreScraper] Found live Flipkart listing: ₹${flipkartMatch.price.toLocaleString()} (${flipkartMatch.title})`);
        scrapedStores.push(flipkartMatch);
      }
    } catch (fkErr) {
      console.log("[MultiStoreScraper] Flipkart scrape notice:", fkErr.message);
    }

  } catch (err) {
    console.error("[MultiStoreScraper] General scraper error:", err.message);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }

  return scrapedStores;
  })();

  inFlightScrapes.set(query, scrapeTask);

  try {
    return await scrapeTask;
  } finally {
    // Keep cached in-memory for 15s to serve any near-simultaneous user clicks
    setTimeout(() => inFlightScrapes.delete(query), 15000);
  }
}

module.exports = {
  scrapeMultiStorePrices,
  cleanSearchQuery
};
