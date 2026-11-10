/**
 * ecommerce-title-condenser
 * Strips bracketed tags, marketing buzzwords, and seller spam into clean product names.
 */

function condenseTitle(fullTitle = "", maxWords = 5) {
  if (!fullTitle || typeof fullTitle !== "string") return "Product";

  // 1. Remove bracketed / parenthesized noise like [Smartchoice], (Black, 128GB)
  let clean = fullTitle.replace(/\[.*?\]|\(.*?\)/g, " ");

  // 2. Remove seller marketing buzzwords
  const buzzwords = [
    "Racing Edition", "Ergonomic", "with 3D Armrests", "Breathable Fabric",
    "High Performance", "Wi-Fi", "In-Box", "Industry Leading",
    "SmartChoice", "Liquid Retina", "FaceTime HD", "All-Day Battery",
    "Free Delivery", "Original", "Genuine", "Upgraded"
  ];
  const buzzRegex = new RegExp(`\\b(${buzzwords.join("|")})\\b`, "gi");
  clean = clean.replace(buzzRegex, " ");

  // 3. Remove stray punctuation, specs, and separators
  const words = clean
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0 && !/^[,|\-–—:;/]+$/.test(w));

  const shortTitle = words.slice(0, maxWords).join(" ").replace(/[,|\-–—:;/]+$/, "").trim();
  return shortTitle || fullTitle.slice(0, 35);
}

module.exports = { condenseTitle };

