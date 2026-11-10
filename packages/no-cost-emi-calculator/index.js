/**
 * no-cost-emi-calculator
 * Financial engine for calculating Standard Reducing-Balance EMI & No-Cost EMI
 */

/**
 * Calculate EMI plan for a given principal, APR, and duration.
 *
 * @param {Object} options
 * @param {number} options.principal - Checkout purchase amount
 * @param {number} [options.apr=16.0] - Annual Percentage Rate (e.g. 15.99)
 * @param {number} [options.months=6] - Installment tenure in months (3, 6, 9, 12, 18, 24)
 * @param {boolean} [options.isNoCost=false] - Whether the merchant sponsors No-Cost EMI
 * @param {number} [options.processingFee=0] - Bank one-time processing fee
 * @param {number} [options.gstRate=0.18] - GST rate applied to fee and interest (default: 18%)
 * @returns {Object}
 */
function calculateEmi({
  principal,
  apr = 16.0,
  months = 6,
  isNoCost = false,
  processingFee = 0,
  gstRate = 0.18
}) {
  const p = Number(principal) || 0;
  const m = Number(months) || 6;
  const annualRate = Number(apr) || 0;

  if (p <= 0 || m <= 0) {
    return { monthlyEmi: 0, totalInterest: 0, totalCost: 0, waivedInterest: 0 };
  }

  // Monthly interest rate
  const r = (annualRate / 100) / 12;

  // Standard Reducing Balance Nominal EMI Formula: P * r * (1+r)^m / ((1+r)^m - 1)
  let nominalMonthlyEmi = 0;
  if (r > 0) {
    const factor = Math.pow(1 + r, m);
    nominalMonthlyEmi = Math.round((p * r * factor) / (factor - 1));
  } else {
    nominalMonthlyEmi = Math.round(p / m);
  }

  const nominalTotalInterest = Math.max(0, (nominalMonthlyEmi * m) - p);

  // Fee calculation with GST
  const feeWithGst = Math.round(processingFee * (1 + gstRate));

  if (isNoCost || annualRate === 0) {
    // True No-Cost EMI: Customer pays exactly (Principal / Months)
    const monthlyEmi = Math.round(p / m);
    const waivedInterest = nominalTotalInterest;
    const totalCost = p + feeWithGst;

    return {
      monthlyEmi,
      totalInterest: 0,
      waivedInterest,
      totalCost,
      isNoCost: true,
      months: m,
      apr: annualRate,
      processingFeeTotal: feeWithGst,
      effectiveUpfrontDiscount: waivedInterest
    };
  }

  // Standard Interest-Bearing EMI
  const totalCost = (nominalMonthlyEmi * m) + feeWithGst;

  return {
    monthlyEmi: nominalMonthlyEmi,
    totalInterest: nominalTotalInterest,
    waivedInterest: 0,
    totalCost,
    isNoCost: false,
    months: m,
    apr: annualRate,
    processingFeeTotal: feeWithGst,
    effectiveUpfrontDiscount: 0
  };
}

module.exports = { calculateEmi };
