/**
 * cross-store-arbitrage-matrix
 * Calculates the absolute lowest net checkout route across multiple competing retailers.
 */

function calculateBestRoute(stores = []) {
  if (!Array.isArray(stores) || stores.length === 0) {
    return { bestRoute: null, allRoutes: [], maxSavingsVsHighest: 0 };
  }

  const evaluated = stores
    .map((s) => {
      const base = Number(s.basePrice) || 0;
      const discount = Number(s.discount) || 0;
      const shipping = Number(s.shippingFee) || 0;
      const net = Math.max(0, base - discount + shipping);

      return {
        store: s.name || "Unknown Store",
        basePrice: base,
        discount,
        shippingFee: shipping,
        netCheckoutPrice: net,
        url: s.url || ""
      };
    })
    .filter((s) => s.basePrice > 0);

  evaluated.sort((a, b) => a.netCheckoutPrice - b.netCheckoutPrice);

  const best = evaluated[0] || null;
  const worst = evaluated[evaluated.length - 1] || null;
  const maxSavings = best && worst ? Math.max(0, worst.netCheckoutPrice - best.netCheckoutPrice) : 0;

  return {
    bestRoute: best,
    allRoutes: evaluated,
    maxSavingsVsHighest: maxSavings
  };
}

module.exports = { calculateBestRoute };
