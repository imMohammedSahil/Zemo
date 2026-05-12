function getRandomReviews(reviews, count) {

    const shuffled = [...reviews].sort(() => 0.5 - Math.random());

    return shuffled.slice(0, count);

}

function prepareReviewSample(positiveReviews, negativeReviews) {

    const positiveSample = getRandomReviews(positiveReviews, 5);

    const negativeSample = getRandomReviews(negativeReviews, 5);

    return {
        positive: positiveSample,
        negative: negativeSample
    };

}

module.exports = {
    prepareReviewSample
};