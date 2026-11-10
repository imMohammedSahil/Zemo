/**
 * retail-price-normalizer
 * Zero-dependency e-commerce parsing utility for price cleaning, ASIN/FSN extraction, and title sanitization.
 */

/**
 * Clean messy price strings (e.g., "₹43,999.00", "Rs. 1,499", "12,999 INR", "$ 299.99") into a clean integer/float.
 * @param {string|number} rawPrice
 * @param {boolean} [asInteger=true]
 * @returns {number}
 */
function parsePrice(rawPrice, asInteger = true) {
  if (typeof rawPrice === "number") return asInteger ? Math.round(rawPrice) : rawPrice;
  if (!rawPrice || typeof rawPrice !== "string") return 0;

  // Split off trailing decimal or cents if integer requested
  const cleaned = rawPrice.replace(/[^\d.,]/g, "").trim();
  if (!cleaned) return 0;

  // Handle standard thousand commas: "43,999.00" -> 43999
  const normalized = cleaned.replace(/,/g, "");
  const num = parseFloat(normalized);

  if (isNaN(num)) return 0;
  return asInteger ? Math.round(num) : num;
}

/**
 * Extract canonical Amazon ASIN (10 alphanumeric characters) from an Amazon URL or string
 * @param {string} urlOrString
 * @returns {string|null}
 */
function extractAmazonASIN(urlOrString) {
  if (!urlOrString || typeof urlOrString !== "string") return null;

  // Matches /dp/B0..., /gp/product/B0..., /gp/aw/d/B0..., or raw ASIN
  const patterns = [
    /(?:\/dp\/|\/gp\/product\/|\/gp\/aw\/d\/|asin=)([A-Z0-9]{10})/i,
    /\b(B0[A-Z0-9]{8})\b/i
  ];

  for (const regex of patterns) {
    const match = urlOrString.match(regex);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
  }

  return null;
}

/**
 * Extract canonical Flipkart FSN or Product ID from a Flipkart URL
 * @param {string} urlOrString
 * @returns {string|null}
 */
function extractFlipkartPID(urlOrString) {
  if (!urlOrString || typeof urlOrString !== "string") return null;

  // Matches ?pid=... or /p/itm...
  const pidMatch = urlOrString.match(/[?&]pid=([A-Z0-9]{16})/i);
  if (pidMatch && pidMatch[1]) return pidMatch[1].toUpperCase();

  const itmMatch = urlOrString.match(/\/p\/(itm[a-z0-9]+)/i);
  if (itmMatch && itmMatch[1]) return itmMatch[1];

  return null;
}

/**
 * Clean noisy retail product titles (strip promo labels, accessories, bracketed tags)
 * to produce clean keywords for cross-store search comparison.
 * @param {string} title
 * @returns {string}
 */
function cleanProductTitle(title) {
  if (!title || typeof title !== "string") return "";

  // 1. Tablet pattern: Preserve core model and storage
  const tabletMatch = title.match(/^(Samsung\s+Galaxy\s+Tab\s+[A-Za-z0-9\s+]+?)(?=[,\[]|\b\d{1,2}\.?\d?\s*(?:cm|inch|Display)|\s*S\s*Pen)/i);
  if (tabletMatch) {
    const storageMatch = title.match(/(\d{2,4}\s*GB\s*Storage|\d{2,4}\s*GB)/i);
    return `${tabletMatch[1].trim()} ${storageMatch ? storageMatch[1].replace(/Storage/i, '').trim() : ""}`.trim();
  }

  // 2. TV pattern: Preserve brand, model code, and screen size
  const tvSizeMatch = title.match(/(\d{2,3})\s*(?:inch|inches|\")/i);
  const tvModelMatch = title.match(/\b([A-Z0-9]{1,4}-[A-Z0-9]{4,10})\b/i);
  if (tvModelMatch && tvSizeMatch) {
    const brand = (title.match(/^(Sony|Samsung|LG|TCL|OnePlus|Xiaomi|Vu|Hisense|Acer)/i) || [""])[0];
    return `${brand} ${tvModelMatch[1]} ${tvSizeMatch[1]} inch`.trim();
  }

  let cleaned = title
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\([^)]*colour[^)]*\)/gi, "")
    .replace(/SmartChoice\s*/gi, "")
    .replace(/S\s*Pen in-Box\s*/gi, "")
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

/**
 * Calculate financial metrics: discount amount and percentage
 * @param {number} currentPrice
 * @param {number} mrp
 * @returns {{ discountAmount: number, discountPercentage: number, hasSavings: boolean }}
 */
function calculateDiscount(currentPrice, mrp) {
  const current = Number(currentPrice) || 0;
  const original = Number(mrp) || 0;

  if (original <= current || original === 0) {
    return { discountAmount: 0, discountPercentage: 0, hasSavings: false };
  }

  const discountAmount = original - current;
  const discountPercentage = Math.round((discountAmount / original) * 100);

  return {
    discountAmount,
    discountPercentage,
    hasSavings: true
  };
}

module.exports = {
  parsePrice,
  extractAmazonASIN,
  extractFlipkartPID,
  cleanProductTitle,
  calculateDiscount
};
