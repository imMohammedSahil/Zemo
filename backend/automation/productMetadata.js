const { chromium } = require("playwright");
const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeWithCheerio(url) {
  try {
    const res = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
      },
      timeout: 12000
    });

    const $ = cheerio.load(res.data);
    const title =
      $("#productTitle").text().trim() ||
      $('meta[name="title"]').attr("content") ||
      $("title").text().trim();

    if (!title || title.includes("Robot Check") || title.includes("Sorry! Something went wrong")) {
      return null;
    }

    let image =
      $("#landingImage").attr("src") ||
      $("#landingImage").attr("data-old-hires") ||
      $('meta[property="og:image"]').attr("content") ||
      "";

    let currentPrice = 0;
    const priceText = $(
      ".a-price .a-offscreen, #corePriceDisplay_desktop_feature_div .a-price-whole, #priceblock_ourprice"
    )
      .first()
      .text()
      .trim();

    if (priceText) {
      const num = parseInt(priceText.split(".")[0].replace(/[^0-9]/g, ""), 10);
      if (num > 0) currentPrice = num;
    }

    let mrp = 0;
    const mrpText = $(
      ".a-price[data-a-strike='true'] .a-offscreen, span.a-price.a-text-price span.a-offscreen"
    )
      .first()
      .text()
      .trim();

    if (mrpText) {
      const num = parseInt(mrpText.split(".")[0].replace(/[^0-9]/g, ""), 10);
      if (num > 0) mrp = num;
    }

    return {
      title,
      image,
      currentPrice,
      mrp: mrp || (currentPrice > 0 ? Math.round(currentPrice * 1.18) : 0),
      rating: 4.2,
      ratingsCount: "",
      ratingDistribution: {},
      bankOffers: [],
      coupon: null
    };
  } catch (_) {
    return null;
  }
}

async function fetchProductMetadata(url) {
  // Fast path: try Cheerio first to save memory & bypass Playwright timeouts on low-spec cloud servers
  const quickResult = await scrapeWithCheerio(url);
  if (quickResult && quickResult.title && quickResult.title !== "Unknown Product") {
    console.log("Cheerio scrape succeeded:", quickResult.title);
    return quickResult;
  }

  let browser;

  try {

    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ]
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      extraHTTPHeaders: {
        "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7"
      }
    });

    const page = await context.newPage();

    // Block only media and fonts (do NOT abort CSS as it prevents domcontentloaded from firing)
    await page.route(/\.(png|jpg|jpeg|webp|svg|gif|woff|woff2|ttf)($|\?)/, route => route.abort());

    console.log("Scraping product:", url);

    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 25000
      });
    } catch (navErr) {
      // If domcontentloaded hangs, fallback to commit
      await page.goto(url, {
        waitUntil: "commit",
        timeout: 15000
      }).catch(() => {});
    }

    try {
      await page.waitForSelector("#productTitle, #title, h1", { timeout: 4000 });
    } catch (_) {}

    let title = "Unknown Product";
    let image = "";

    /* PRODUCT TITLE */

    try {

      if (await page.$("#productTitle")) {

        title = await page.$eval(
          "#productTitle",
          el => el.textContent.trim()
        );

      }

    } catch (err) {

      console.log("Title scrape failed");

    }

    /* PRODUCT IMAGE */

    try {

      if (await page.$("#landingImage")) {

        image = await page.$eval("#landingImage", el => el.src);

      } 
      
      else if (await page.$("#imgTagWrapperId img")) {

        image = await page.$eval("#imgTagWrapperId img", el => el.src);

      } 
      
      else if (await page.$("img[data-old-hires]")) {

        image = await page.$eval(
          "img[data-old-hires]",
          el => el.getAttribute("data-old-hires")
        );

      }

      /* META IMAGE FALLBACK (very reliable) */

      if (!image) {

        const metaImage = await page.$('meta[property="og:image"]');

        if (metaImage) {
          image = await metaImage.getAttribute("content");
        }

      }

    } catch (err) {

      console.log("Image scrape failed");

    }

    /* CURRENT PRICE EXTRACTION */
    let currentPrice = 0;
    try {
      const priceSelectors = [
        "#corePriceDisplay_desktop_feature_div .a-price-whole",
        "#corePriceDisplay_desktop_feature_div .a-offscreen",
        "#corePrice_desktop .a-offscreen",
        ".a-price .a-offscreen",
        "#priceblock_ourprice",
        "#priceblock_dealprice"
      ];
      for (const sel of priceSelectors) {
        const el = await page.$(sel);
        if (el) {
          const raw = await el.innerText().catch(() => "");
          // Handle decimals (e.g. "82,990.00" -> "82,990" before stripping non-digits)
          const integerPart = raw.split(".")[0] || "";
          const num = parseInt(integerPart.replace(/[^0-9]/g, ""), 10);
          if (num > 0) {
            currentPrice = num;
            break;
          }
        }
      }
    } catch (err) {
      console.log("Price scrape failed:", err.message);
    }

    /* MRP EXTRACTION */
    let mrp = 0;
    try {
      const mrpSelectors = [
        ".a-price[data-a-strike='true'] .a-offscreen",
        "span.a-price.a-text-price span.a-offscreen",
        "#listPrice",
        "#corePriceDisplay_desktop_feature_div .a-text-price .a-offscreen"
      ];
      for (const sel of mrpSelectors) {
        const el = await page.$(sel);
        if (el) {
          const raw = await el.innerText().catch(() => "");
          const integerPart = raw.split(".")[0] || "";
          const num = parseInt(integerPart.replace(/[^0-9]/g, ""), 10);
          if (num > 0 && num >= currentPrice) {
            mrp = num;
            break;
          }
        }
      }
      if (!mrp && currentPrice > 0) {
        mrp = Math.round(currentPrice * 1.18);
      }
    } catch (err) {
      console.log("MRP scrape failed:", err.message);
    }

    /* RATINGS COUNT & RATING EXTRACTION */
    let ratingsCount = "";
    let rating = 0;
    let ratingDistribution = {};
    try {
      const reviewText = await page.$eval(
        "#acrCustomerReviewText, [data-hook='total-review-count'], #averageCustomerReviews #acrCustomerReviewText",
        el => el.innerText.trim()
      ).catch(() => "");

      if (reviewText) {
        const cleanCount = reviewText.replace(/[()]/g, "").trim();
        ratingsCount = cleanCount.toLowerCase().includes("rating") || cleanCount.toLowerCase().includes("review")
          ? cleanCount
          : `${cleanCount} reviews`;
      }

      const ratingText = await page.$eval(
        "#acrPopover, span[data-hook='rating-out-of-text'], #averageCustomerReviews .a-icon-alt",
        el => el.innerText.trim()
      ).catch(() => "");

      if (ratingText) {
        const match = ratingText.match(/([0-9.]+)/);
        if (match && match[1]) {
          rating = parseFloat(match[1]);
        }
      }

      /* HISTOGRAM / STAR RATING BREAKDOWN EXTRACTION */
      try {
        const medley = await page.$("#reviewsMedley, #histogramTable, [data-hook='reviews-medley-footer'], #cm_cr_dp_d_rating_histogram, [data-hook='total-review-count']");
        if (medley) {
          await medley.scrollIntoViewIfNeeded().catch(() => {});
          await page.waitForTimeout(1000);
        }

        ratingDistribution = await page.evaluate(() => {
          const dist = {};
          const elements = Array.from(document.querySelectorAll(
            "#histogramTable tr, [data-hook='histogram-entry'], .a-histogram-row, [class*='histogram-row'], #cm_cr_dp_d_rating_histogram li, #reviewsMedley li, [data-hook='reviews-medley-footer'] li, tr[class*='histogram']"
          ));

          elements.forEach(el => {
            const text = (el.innerText || "") + " " + (el.getAttribute("aria-label") || "") + " " + (el.title || "");
            const starMatch = text.match(/([1-5])\s*(?:star|stars|★)/i);
            const percentMatch = text.match(/(\d+)\s*%/);
            if (starMatch && percentMatch) {
              dist[parseInt(starMatch[1], 10)] = parseInt(percentMatch[1], 10);
            }
          });

          if (Object.keys(dist).length === 0) {
            const container = document.querySelector("#reviewsMedley, #cm_cr_dp_d_rating_histogram, #histogramTable");
            if (container) {
              const fullText = (container.innerText || "") + " " + (container.getAttribute("aria-label") || "");
              const regex = /([1-5])\s*(?:star|stars|★)[\s\S]*?(\d+)\s*%/gi;
              let match;
              while ((match = regex.exec(fullText)) !== null) {
                dist[parseInt(match[1], 10)] = parseInt(match[2], 10);
              }
            }
          }

          return dist;
        });
      } catch (_) {}

    } catch (err) {
      console.log("Ratings scrape warning:", err.message);
    }

    /* LIVE BANK OFFERS & COUPONS EXTRACTION */
    let bankOffers = [];
    let coupon = null;
    try {
      // 1. Coupon checkbox extraction
      const couponElement = await page.$("#vpcButton, [id*='couponText'], .couponBadge, [data-csa-c-slot-id='coupon']");
      if (couponElement) {
        const cText = await couponElement.innerText().catch(() => "");
        const cMatch = cText.match(/₹?\s*(\d[\d,]*)/);
        if (cMatch) {
          coupon = {
            amount: parseInt(cMatch[1].replace(/,/g, ""), 10),
            text: cText.trim()
          };
        }
      }

      // 2. Bank promotions accordion & carousel extraction
      bankOffers = await page.evaluate(() => {
        const found = [];
        const seen = new Set();

        // Target modern Amazon India .offers-items-title cards
        document.querySelectorAll('.offers-items-title').forEach(titleEl => {
          const type = titleEl.innerText.trim();
          const parent = titleEl.parentElement;
          const rawText = parent ? parent.innerText.replace(/\s+/g, ' ').trim() : '';
          let cleanDesc = rawText.replace(type, '').replace(/\d+\s+offers?/gi, '').trim();
          const half = Math.floor(cleanDesc.length / 2);
          if (half > 15 && cleanDesc.slice(0, half).trim() === cleanDesc.slice(half).trim()) {
            cleanDesc = cleanDesc.slice(0, half).trim();
          }

          const amountMatch = cleanDesc.match(/₹\s*([0-9,.]+)/);
          const discountAmount = amountMatch ? Math.round(parseFloat(amountMatch[1].replace(/,/g, ''))) : 0;

          let bank = "Amazon Partner Bank";
          if (/icici/i.test(cleanDesc)) bank = "ICICI Bank";
          else if (/sbi/i.test(cleanDesc)) bank = "SBI Card";
          else if (/hdfc/i.test(cleanDesc)) bank = "HDFC Bank";
          else if (/axis/i.test(cleanDesc)) bank = "Axis Bank";
          else if (/amazon pay/i.test(cleanDesc)) bank = "Amazon Pay";

          const key = type + cleanDesc.slice(0, 30);
          if (!seen.has(key) && cleanDesc.length > 5) {
            seen.add(key);
            found.push({
              title: `${type}: ${cleanDesc.slice(0, 70)}`,
              description: cleanDesc,
              type: type.toLowerCase().includes('cashback') ? 'cashback' : type.toLowerCase().includes('emi') ? 'emi' : 'bank_discount',
              bank,
              discountAmount
            });
          }
        });

        // Fallback for older Amazon or Flipkart layouts
        if (found.length === 0) {
          const rows = Array.from(document.querySelectorAll(
            "#sopp-accordion .a-accordion-row, [data-feature-name='sopp'] .a-box, #item_details_sopp .a-section, #tier-1-offers .a-carousel-card, .vsx-offers-holder .a-carousel-card, [id*='bankOffer'], [id*='BankOffer'], #promotions_feature_div .a-section, #instantBankDiscount"
          ));

          rows.forEach(r => {
            const txt = (r.innerText || "").trim();
            if (txt && (txt.includes("Bank") || txt.includes("Discount") || txt.includes("Cashback") || txt.includes("EMI") || txt.includes("₹"))) {
              const amountMatch = txt.match(/₹\s*(\d[\d,]*)/);
              const discountAmount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, ""), 10) : 0;
              const firstLine = txt.split("\n")[0].trim();
              if (firstLine.length > 5 && !seen.has(firstLine)) {
                seen.add(firstLine);
                found.push({
                  title: firstLine,
                  description: txt.slice(0, 180).replace(/\s+/g, " "),
                  type: 'bank_discount',
                  bank: 'Partner Bank',
                  discountAmount
                });
              }
            }
          });
        }

        return found.slice(0, 8);
      });
    } catch (err) {
      console.log("Bank offers scrape warning:", err.message);
    }

    console.log("SCRAPED RESULT:", { title, image, currentPrice, mrp, rating, ratingsCount, ratingDistribution, bankOffersCount: bankOffers.length, coupon });

    return {
      title,
      image,
      currentPrice,
      mrp,
      rating,
      ratingsCount,
      ratingDistribution,
      bankOffers,
      coupon
    };

  } catch (error) {

    console.error("Metadata scraping error:", error);

    const fallback = await scrapeWithCheerio(url);
    if (fallback) return fallback;

    return {
      title: "Unknown Product",
      image: ""
    };

  } finally {

    if (browser) {
      await browser.close();
    }

  }

}

module.exports = fetchProductMetadata;