/**
 * deal-score-calculator
 * Algorithmic deal scoring and buy/wait recommendation engine.
 */

function calculateDealScore({ currentPrice, historicLow, mrp, priceHistory = [] }) {
  const current = Number(currentPrice) || 0;
  const lowest = Number(historicLow) || current;
  const original = Number(mrp) || Math.round(current * 1.25);

  if (current <= 0) {
    return { dealScore: 0, verdict: "UNKNOWN", dropProbability: 50 };
  }

  // 1. Discount vs MRP (Weight: 40%)
  const discountFromMrp = Math.max(0, original - current);
  const mrpDiscountRatio = original > 0 ? discountFromMrp / original : 0;
  const mrpScore = Math.min(10, mrpDiscountRatio * 20); // 50% discount = 10 pts

  // 2. Proximity to Historic Low (Weight: 60%)
  const deltaFromLow = Math.max(0, current - lowest);
  const lowRatio = lowest > 0 ? deltaFromLow / lowest : 0;
  let lowScore = 10;
  if (lowRatio > 0) {
    lowScore = Math.max(0, 10 - lowRatio * 25);
  }

  // Blended deal score out of 10
  const rawScore = (mrpScore * 0.4) + (lowScore * 0.6);
  const dealScore = Math.round(Math.min(10, Math.max(1, rawScore)) * 10) / 10;

  // Drop probability calculation
  let dropProbability = 30;
  if (dealScore >= 7.5) {
    dropProbability = 15; // Low chance of falling further
  } else if (dealScore <= 5.0) {
    dropProbability = 75; // High chance of better sale
  } else {
    dropProbability = 45;
  }

  // Verdict designation
  let verdict = "FAIR_VALUE";
  let recommendation = "Price is fair. Grab if needed today, or wait for an upcoming festival sale.";
  if (dealScore >= 7.5) {
    verdict = "SWEET_DEAL";
    recommendation = "Near all-time historic low. Excellent time to buy.";
  } else if (dealScore <= 5.0) {
    verdict = "WAIT_FOR_DROP";
    recommendation = "Price is elevated. Strong chance of an upcoming price dip.";
  }

  return {
    dealScore,
    verdict,
    recommendation,
    dropProbability,
    metrics: {
      currentPrice: current,
      historicLow: lowest,
      mrp: original,
      savingsVsMrp: discountFromMrp,
      overLowestPrice: deltaFromLow
    }
  };
}

module.exports = { calculateDealScore };
