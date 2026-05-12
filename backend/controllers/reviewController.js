const Review = require("../models/reviewModel");
const scrapeReviews = require("../automation/reviewScraper");
const { prepareReviewSample } = require("../services/reviewProcessor");
const { analyzeReviews } = require("../services/aiAnalyzer");

async function getReviewInsights(req, res) {

    const { id } = req.params;

    try {

        let reviewData = await Review.findOne({ productId: id });

        // ✔ If reviews are not in DB → scrape them
        if (!reviewData) {

            const scraped = await scrapeReviews(id);

            reviewData = new Review({
                productId: id,
                positiveReviews: scraped.positiveReviews,
                negativeReviews: scraped.negativeReviews
            });

            await reviewData.save();
        }

        // ✔ If AI insights already exist → return them immediately
        if (
    reviewData.insights &&
    reviewData.insights.pros &&
    reviewData.insights.pros.length > 0
) {

    console.log("Returning cached AI insights");

    return res.json({
        productId: id,
        insights: reviewData.insights
    });

}

        // ✔ Otherwise run AI analysis
        const sample = prepareReviewSample(
            reviewData.positiveReviews,
            reviewData.negativeReviews
        );

        console.log("Running HuggingFace AI analysis...");

        const insights = await analyzeReviews(sample);

        // ✔ Save AI result to MongoDB
        reviewData.insights = insights;

        await reviewData.save();

        res.json({
            productId: id,
            insights
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Review analysis failed"
        });

    }
}

module.exports = {
    getReviewInsights
};