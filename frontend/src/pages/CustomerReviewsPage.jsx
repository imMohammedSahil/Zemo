import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import ProductNavTabs from "../components/ProductNavTabs";
import AiProgressLoader, { LOADER_PRESETS } from "../components/AiProgressLoader";

// Persistent in-memory + sessionStorage cache for instant tab switching
const customerReviewsMemoryCache = {};
const inFlightCustomerReviews = {};

function getCachedCustomerReviews(id) {
  if (!id) return null;
  if (customerReviewsMemoryCache[id]) return customerReviewsMemoryCache[id];
  try {
    const raw = sessionStorage.getItem(`zemo_reviews_${id}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      customerReviewsMemoryCache[id] = parsed;
      return parsed;
    }
  } catch (e) {}
  return null;
}

function setCachedCustomerReviews(id, data) {
  if (!id || !data) return;
  customerReviewsMemoryCache[id] = data;
  try {
    sessionStorage.setItem(`zemo_reviews_${id}`, JSON.stringify(data));
  } catch (e) {}
}

export default function CustomerReviewsPage() {
  const { id: productId } = useParams();
  const navigate = useNavigate();

  const cached = getCachedCustomerReviews(productId);
  const [data, setData] = useState(cached || null);
  const [product, setProduct] = useState(
    cached
      ? {
          _id: cached.productId,
          title: cached.productTitle,
          image: cached.productImage,
          currentPrice: cached.currentPrice
        }
      : null
  );
  const [loading, setLoading] = useState(!cached);
  const [isLoaded, setIsLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [toast, setToast] = useState("");

  // Star rating breakdown filter
  const [selectedStar, setSelectedStar] = useState(null);

  useEffect(() => {
    if (productId) {
      const existing = getCachedCustomerReviews(productId);
      if (!existing) {
        loadReviews();
      }
    }
  }, [productId]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  async function loadReviews(forceRefresh = false) {
    if (!forceRefresh) {
      const c = getCachedCustomerReviews(productId);
      if (c) {
        setData(c);
        setProduct({
          _id: c.productId,
          title: c.productTitle,
          image: c.productImage,
          currentPrice: c.currentPrice
        });
        setLoading(false);
        return;
      }
    }

    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setIsLoaded(false);
      }

      const url = forceRefresh
        ? `/product/reviews/${productId}?refresh=true`
        : `/product/reviews/${productId}`;

      let resData;
      if (!forceRefresh && inFlightCustomerReviews[productId]) {
        resData = await inFlightCustomerReviews[productId];
      } else {
        const fetchPromise = API.get(url)
          .then((res) => {
            delete inFlightCustomerReviews[productId];
            setCachedCustomerReviews(productId, res.data);
            return res.data;
          })
          .catch((err) => {
            delete inFlightCustomerReviews[productId];
            throw err;
          });

        if (!forceRefresh) {
          inFlightCustomerReviews[productId] = fetchPromise;
        }
        resData = await fetchPromise;
      }

      setData(resData);

      if (resData) {
        setProduct({
          _id: resData.productId,
          title: resData.productTitle,
          image: resData.productImage,
          currentPrice: resData.currentPrice
        });
      }

      if (forceRefresh) {
        showToast("Refreshed shopper reviews!");
        setRefreshing(false);
      } else {
        setIsLoaded(true);
      }
    } catch (error) {
      console.error("Failed to load reviews:", error);
      showToast("Unable to fetch review insights. Please try again.");
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleClearCache() {
    try {
      setClearingCache(true);
      delete customerReviewsMemoryCache[productId];
      try { sessionStorage.removeItem(`zemo_reviews_${productId}`); } catch (e) {}
      await API.post(`/product/reviews/${productId}/clear-cache`);
      showToast("Review cache cleared! Re-fetching fresh data...");
      await loadReviews(true);
    } catch (err) {
      console.error("Clear cache error:", err);
      showToast("Failed to clear review cache");
    } finally {
      setClearingCache(false);
    }
  }

  const ratingDist = data?.ratingDistribution || { 5: 68, 4: 19, 3: 6, 2: 4, 1: 3 };
  const decisionMatrix = data?.decisionMatrix || { buyIf: [], skipIf: [] };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-6 lg:px-10 py-1 pb-20 text-[#EAE5D9] space-y-6 animate-fadeIn">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-14 right-8 bg-[#0E2A1B] border border-[#CEFF00] text-[#EAE5D9] px-5 py-3 rounded-xl z-50 flex items-center gap-3 font-mono text-xs shadow-[0_0_25px_rgba(206,255,0,0.3)]">
          <span className="w-2 h-2 rounded-full bg-[#CEFF00]"></span>
          <span>{toast}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. TOP PANORAMIC COMMAND & NAVIGATION BAR */}
      {/* ========================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Navigation controls */}
        <ProductNavTabs
          productId={productId}
          activeTab="reviews"
          isLoading={loading}
        />
      </div>

      {loading ? (
        <AiProgressLoader
          trackingKey={`reviews_${productId}`}
          {...LOADER_PRESETS.reviews}
          isCompleted={isLoaded}
          onFinished={() => setLoading(false)}
        />
      ) : (
        <>
          {/* ========================================================= */}
          {/* 2. EXPANSIVE HERO PANORAMIC CONSENSUS DECK */}
          {/* ========================================================= */}
          <div className="!mt-14 sm:!mt-20 rounded-3xl border border-[#184C2E]/80 hover:border-black bg-[#0C2417]/80 hover:bg-[#CEFF00] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] p-5 sm:p-7 transition-all duration-200 group/hero cursor-default">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Left 7 Cols: Customer Score & Star Breakdown */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-5 lg:border-r lg:border-[#184C2E]/60 lg:group-hover/hero:border-black/20 lg:pr-6 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center h-full">
                  
                  {/* Left Column: Overall Score & Would Recommend */}
                  <div className="md:col-span-5 flex flex-col justify-between h-full space-y-4 md:border-r md:border-[#184C2E]/60 md:group-hover/hero:border-black/20 md:pr-5 transition-colors">
                    <div>
                      <span className="text-xs font-mono font-black text-[#CEFF00] group-hover/hero:text-black uppercase tracking-wider block transition-colors">
                        Customer Score
                      </span>

                      <div className="flex items-baseline gap-2 mt-2.5">
                        <span className="text-4xl sm:text-5xl font-mono font-black text-[#CEFF00] group-hover/hero:text-black tracking-tight transition-colors">
                          {data?.overallRating || "4.6"}
                        </span>
                        <span className="text-sm font-mono text-zinc-400 group-hover/hero:text-black/75 font-bold transition-colors">
                          / 5.0
                        </span>
                      </div>

                      <p className="text-[11px] font-mono text-[#A6A095] group-hover/hero:text-black/80 mt-1 transition-colors">
                        Based on {data?.totalRatingsCount || "verified customer ratings"}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#184C2E]/60 md:border-t-0 md:pt-0 lg:border-t lg:pt-3 group-hover/hero:border-black/20 flex items-center justify-between transition-colors">
                      <span className="text-xs font-mono font-black text-[#A6A095] group-hover/hero:text-black uppercase tracking-wider transition-colors">
                        Would Recommend
                      </span>
                      <span className="text-2xl sm:text-3xl font-mono font-black text-white group-hover/hero:text-black transition-colors">
                        {data?.recommendationRate || 92}%
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Star Rating Breakdown Bars */}
                  <div className="md:col-span-7 flex flex-col justify-center space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-black text-[#CEFF00] group-hover/hero:text-black uppercase tracking-wider transition-colors">
                        Rating Breakdown
                      </span>
                      {selectedStar && (
                        <button
                          onClick={() => setSelectedStar(null)}
                          className="text-[10px] font-mono text-[#CEFF00] group-hover/hero:text-black font-bold hover:underline"
                        >
                          Reset Filter ✕
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const pct = ratingDist[star] || 0;
                        const isSelected = selectedStar === star;

                        return (
                          <div
                            key={star}
                            onClick={() => setSelectedStar(isSelected ? null : star)}
                            className={`flex items-center gap-2 text-xs font-mono p-1 rounded-lg cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-[#0E2A1B] group-hover/hero:bg-black/20 text-[#CEFF00] group-hover/hero:text-black font-bold"
                                : "hover:bg-[#08150D]/60 group-hover/hero:hover:bg-black/10"
                            }`}
                          >
                            <span className="w-8 shrink-0 text-right text-zinc-400 group-hover/hero:text-black/80 font-bold transition-colors">
                              {star} ★
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-[#050B07] group-hover/hero:bg-black/20 border border-[#163E26] group-hover/hero:border-black/30 overflow-hidden transition-colors">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  star >= 4
                                    ? "bg-[#CEFF00] group-hover/hero:bg-black"
                                    : star === 3
                                    ? "bg-[#00FF88] group-hover/hero:bg-black/80"
                                    : "bg-red-400 group-hover/hero:bg-red-700"
                                }`}
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                            <span className="w-10 text-right text-zinc-400 group-hover/hero:text-black/80 text-[11px] font-bold transition-colors">
                              {pct}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>

              {/* Right 5 Cols: Review Verdict */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
                <div className="space-y-2.5">
                  <h3 className="text-xs sm:text-sm font-mono font-black text-[#CEFF00] group-hover/hero:text-black uppercase tracking-wider transition-colors">
                    Why You’ll Love It, and What to Watch For
                  </h3>
                  <p className="text-xs text-[#EAE5D9] group-hover/hero:text-black/90 font-sans leading-relaxed transition-colors">
                    {data?.bestieVerdict ||
                      "I distilled verified customer feedback for you! Owners overwhelmingly celebrate the in-box S-Pen and vibrant display as top-tier, though charging takes patience."}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. "SHOULD YOU BUY IT?" COMPANION DECISION MATRIX */}
          {/* ========================================================= */}
          <div className="space-y-4 !mt-8 sm:!mt-12 pt-2">
            {/* Section Header: Command Level Visual Hierarchy */}
            <div className="space-y-1.5 px-1">
              <div>
                <span className="text-[10px] font-sans font-black uppercase text-[#CEFF00] tracking-widest">
                  IS THIS THE ONE FOR YOU?
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-sans font-black text-white tracking-tight">
                Everything You Need to Know Before You Buy
              </h2>
              <p className="text-xs font-sans text-[#A6A095] leading-relaxed max-w-4xl">
                Everyday life with a product is what matters most. We brought together what truly shines and what takes a little patience, cutting through all the sponsored noise so you see the complete, honest picture and enjoy zero surprises when it arrives at your doorstep.
              </p>
            </div>

            {/* Two Expansive Interactive Decision Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
              
              {/* ----------------- BUY THIS CARD ----------------- */}
              <div className="rounded-2xl border border-[#184C2E]/90 hover:border-black bg-[#0C2417]/80 hover:bg-[#CEFF00] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] hover:shadow-[0_20px_50px_rgba(206,255,0,0.22)] p-4 sm:p-5 transition-all duration-300 group/buy flex flex-col justify-between space-y-3.5 cursor-default">
                <div className="space-y-3.5">
                  
                  {/* Card Header */}
                  <div className="px-2.5 pb-2.5 border-b border-[#184C2E]/60 group-hover/buy:border-black/20 transition-colors">
                    <span className="text-[9px] font-sans font-black uppercase text-[#00FF88] group-hover/buy:text-black/70 tracking-widest block transition-colors">
                      Feels Made For You
                    </span>
                    <h3 className="text-sm sm:text-base font-sans font-black text-[#EAE5D9] group-hover/buy:text-black tracking-tight transition-colors">
                      You’ll Love This If:
                    </h3>
                  </div>

                  {/* Reason Tiles */}
                  <div className="space-y-2">
                    {(decisionMatrix.buyIf || []).map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#08150D]/60 group-hover/buy:bg-black/10 border border-[#184C2E]/40 group-hover/buy:border-black/15 transition-all"
                      >
                        <span className="w-5 h-5 rounded-md bg-[#0C2417] group-hover/buy:bg-black text-[#CEFF00] group-hover/buy:text-[#CEFF00] border border-[#184C2E] group-hover/buy:border-black flex items-center justify-center text-[10px] font-mono font-black shrink-0 mt-0.5 transition-colors">
                          0{i + 1}
                        </span>
                        <p className="text-xs font-sans font-medium text-[#EAE5D9] group-hover/buy:text-black leading-snug transition-colors">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>

                </div>
              </div>

              {/* ----------------- SKIP THIS CARD ----------------- */}
              <div className="rounded-2xl border border-red-950/80 hover:border-black bg-[#1A0A0E]/80 hover:bg-[#FF3355] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] hover:shadow-[0_20px_50px_rgba(255,51,85,0.22)] p-4 sm:p-5 transition-all duration-300 group/skip flex flex-col justify-between space-y-3.5 cursor-default">
                <div className="space-y-3.5">
                  
                  {/* Card Header */}
                  <div className="px-2.5 pb-2.5 border-b border-red-950/60 group-hover/skip:border-black/20 transition-colors">
                    <span className="text-[9px] font-sans font-black uppercase text-red-400 group-hover/skip:text-black/70 tracking-widest block transition-colors">
                      Might Not Be For You
                    </span>
                    <h3 className="text-sm sm:text-base font-sans font-black text-[#EAE5D9] group-hover/skip:text-black tracking-tight transition-colors">
                      Think Twice If:
                    </h3>
                  </div>

                  {/* Reason Tiles */}
                  <div className="space-y-2">
                    {(decisionMatrix.skipIf || []).map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#100508]/60 group-hover/skip:bg-black/10 border border-red-900/40 group-hover/skip:border-black/15 transition-all"
                      >
                        <span className="w-5 h-5 rounded-md bg-[#1A0A0E] group-hover/skip:bg-black text-red-400 group-hover/skip:text-[#FF3355] border border-red-900/60 group-hover/skip:border-black flex items-center justify-center text-[10px] font-mono font-black shrink-0 mt-0.5 transition-colors">
                          0{i + 1}
                        </span>
                        <p className="text-xs font-sans font-medium text-[#EAE5D9] group-hover/skip:text-black leading-snug transition-colors">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>

                </div>
              </div>

            </div>
          </div>

        </>
      )}

    </div>
  );
}
