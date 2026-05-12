const scrapeReviews = require("./automation/reviewScraper");

async function test() {

    const asin = "B0CHX1W1XY"; // example ASIN

    const data = await scrapeReviews(asin);

    console.log(data);

}

test();