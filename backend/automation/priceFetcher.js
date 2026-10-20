const { chromium } = require("playwright");

async function fetchPrice(url, sourceType) {

    const browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.route(/\.(png|jpg|jpeg|webp|svg|gif|woff|woff2|ttf|css)($|\?)/, route => route.abort());

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

    let price;

    // Crypto testing (CoinGecko etc)
    if (sourceType === "crypto") {

        const priceElement = await page.waitForSelector('[data-coin-price]');
        price = await priceElement.innerText();

    }

    // Amazon price extraction
   if (sourceType === "amazon") {

  try {

    await page.waitForSelector(
      "#corePriceDisplay_desktop_feature_div .a-offscreen",
      { timeout: 10000 }
    );

    const priceElement = await page.$(
      "#corePriceDisplay_desktop_feature_div .a-offscreen"
    );

    price = await priceElement.innerText();

  } catch {

    console.log("Main price not found, trying fallback selector...");

    const fallback = await page.$(".a-price .a-offscreen");

    if (fallback) {
      price = await fallback.innerText();
    } else {
      price = "0";
    }

  }

}

    // Flipkart price extraction
    if (sourceType === "flipkart") {

        const priceElement = await page.waitForSelector("._30jeq3");
        price = await priceElement.innerText();

    }

    await browser.close();

    return price;
}

module.exports = fetchPrice;