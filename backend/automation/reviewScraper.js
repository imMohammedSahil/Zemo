const { chromium } = require("playwright");

async function scrapeReviews(asin) {

    const context = await chromium.launchPersistentContext(
    "./browser-data",
    {
        headless: true,
        viewport: null,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    }
);
    const page = await context.newPage();

    const positiveUrl =
`https://www.amazon.in/product-reviews/${asin}/ref=cm_cr_arp_d_viewopt_sr?reviewerType=all_reviews&filterByStar=five_star&pageNumber=1`;

const negativeUrl =
`https://www.amazon.in/product-reviews/${asin}/ref=cm_cr_arp_d_viewopt_sr?reviewerType=all_reviews&filterByStar=one_star&pageNumber=1`;

    const positiveReviews = [];
    const negativeReviews = [];

    try {

        // -------- POSITIVE --------

        await page.goto(positiveUrl);

        await page.waitForSelector("[data-hook='review']", { timeout: 15000 });

        const pos = await page.$$eval("[data-hook='review']", reviews =>
            reviews.map(r => {

                const title =
                    r.querySelector("[data-hook='review-title']")?.innerText || "";

                const body =
                    r.querySelector("[data-hook='review-body']")?.innerText || "";

                return `${title} - ${body}`;
            })
        );

        pos.forEach(r => {
            if (r.length > 20) positiveReviews.push(r);
        });

        // -------- NEGATIVE --------

        await page.goto(negativeUrl);

        await page.waitForSelector("[data-hook='review']", { timeout: 15000 });

        const neg = await page.$$eval("[data-hook='review']", reviews =>
            reviews.map(r => {

                const title =
                    r.querySelector("[data-hook='review-title']")?.innerText || "";

                const body =
                    r.querySelector("[data-hook='review-body']")?.innerText || "";

                return `${title} - ${body}`;
            })
        );

        neg.forEach(r => {
            if (r.length > 20) negativeReviews.push(r);
        });

    } catch (err) {

        console.error("Scraping error:", err);

    }

     await context.close();

    return {
        positiveReviews: positiveReviews.slice(0,25),
        negativeReviews: negativeReviews.slice(0,25)
    };
}

module.exports = scrapeReviews;