const { chromium } = require("playwright");

async function fetchProductMetadata(url) {

  let browser;

  try {

    browser = await chromium.launch({ headless: true });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    });

    const page = await context.newPage();

    console.log("Scraping product:", url);

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(2000); // allow dynamic content

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

    console.log("SCRAPED RESULT:", { title, image });

    return {
      title,
      image
    };

  } catch (error) {

    console.error("Metadata scraping error:", error);

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