import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import ProductNavTabs from "../components/ProductNavTabs";
import AiProgressLoader, { LOADER_PRESETS } from "../components/AiProgressLoader";

// Persistent in-memory + sessionStorage cache for instant tab switching
const compareStoresMemoryCache = {};
const inFlightCompareStores = {};

function getCachedCompareStores(id) {
  if (!id) return null;
  if (compareStoresMemoryCache[id]) return compareStoresMemoryCache[id];
  try {
    const raw = sessionStorage.getItem(`zemo_stores_${id}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      compareStoresMemoryCache[id] = parsed;
      return parsed;
    }
  } catch (e) {}
  return null;
}

function setCachedCompareStores(id, data) {
  if (!id || !data) return;
  compareStoresMemoryCache[id] = data;
  try {
    sessionStorage.setItem(`zemo_stores_${id}`, JSON.stringify(data));
  } catch (e) {}
}

export default function CompareStoresPage() {
  const { id: productId } = useParams();
  const navigate = useNavigate();

  const cached = getCachedCompareStores(productId);
  const [data, setData] = useState(cached || null);
  const [product, setProduct] = useState(
    cached
      ? {
          _id: cached.productId,
          title: cached.productTitle,
          image: cached.productImage,
          currentPrice: cached.currentTrackedPrice,
          mrp: cached.mrp
        }
      : null
  );
  const [loading, setLoading] = useState(!cached);
  const [isLoaded, setIsLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (productId) {
      const existing = getCachedCompareStores(productId);
      if (!existing) {
        loadComparison();
      }
    }
  }, [productId]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  async function loadComparison(forceRefresh = false) {
    if (!forceRefresh) {
      const c = getCachedCompareStores(productId);
      if (c) {
        setData(c);
        setProduct({
          _id: c.productId,
          title: c.productTitle,
          image: c.productImage,
          currentPrice: c.currentTrackedPrice,
          mrp: c.mrp
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
        ? `/product/compare-stores/${productId}?refresh=true`
        : `/product/compare-stores/${productId}`;

      let resData;
      if (!forceRefresh && inFlightCompareStores[productId]) {
        resData = await inFlightCompareStores[productId];
      } else {
        const fetchPromise = API.get(url)
          .then((res) => {
            delete inFlightCompareStores[productId];
            setCachedCompareStores(productId, res.data);
            return res.data;
          })
          .catch((err) => {
            delete inFlightCompareStores[productId];
            throw err;
          });

        if (!forceRefresh) {
          inFlightCompareStores[productId] = fetchPromise;
        }
        resData = await fetchPromise;
      }

      setData(resData);

      if (resData) {
        setProduct({
          _id: resData.productId,
          title: resData.productTitle,
          image: resData.productImage,
          currentPrice: resData.currentTrackedPrice,
          mrp: resData.mrp
        });
      }

      // Signal 100% completion to loader to hold 5th message for 2.5s
      setIsLoaded(true);

      if (forceRefresh) {
        showToast("Refreshed live from Gemini 2.5 Flash intelligence!");
        setRefreshing(false);
        setLoading(false);
      }
    } catch (error) {
      console.error("Failed to load store comparison:", error);
      showToast("Unable to fetch store comparison. Retrying...");
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleClearCache() {
    try {
      setClearingCache(true);
      delete compareStoresMemoryCache[productId];
      try { sessionStorage.removeItem(`zemo_stores_${productId}`); } catch (e) {}
      await API.post(`/product/compare-stores/${productId}/clear-cache`);
      showToast("Testing cache cleared! Re-fetching fresh data...");
      await loadComparison(true);
    } catch (err) {
      console.error("Clear cache error:", err);
      showToast("Failed to clear cache");
    } finally {
      setClearingCache(false);
    }
  }

  const stores = data?.stores || [];
  const summary = data?.summary || {};
  const currentPrice = data?.currentTrackedPrice || product?.currentPrice || 0;
  const lowestPrice = summary.lowestPrice || (stores.length ? Math.min(...stores.map((s) => s.price)) : currentPrice);

  // Single True Source of Truth: Store with lowest effective checkout price (using cards/offers)
  const inStockStores = stores.filter((s) => {
    const isOutOfStock =
      s.inStock === false ||
      s.stockStatus?.toLowerCase().includes("out of stock") ||
      s.stockStatus?.toLowerCase().includes("unavailable") ||
      s.stockStatus?.toLowerCase().includes("not listed");
    return !isOutOfStock && s.price > 0;
  });

  const getEffectivePrice = (s) => {
    if (s && s.effectivePriceWithOffer && s.effectivePriceWithOffer > 0 && s.effectivePriceWithOffer < s.price) {
      return s.effectivePriceWithOffer;
    }
    return s?.price || 0;
  };

  const topPickStore = inStockStores.slice().sort((a, b) => {
    const effA = getEffectivePrice(a);
    const effB = getEffectivePrice(b);
    if (effA !== effB) return effA - effB;
    return a.price - b.price;
  })[0] || stores[0];

  const topPickPrice = topPickStore ? getEffectivePrice(topPickStore) : lowestPrice;
  const maxSavings = Math.max(0, currentPrice - topPickPrice);
  const savingsPercent = currentPrice > 0 && maxSavings > 0 ? Math.round((maxSavings / currentPrice) * 100) : 0;

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-6 lg:px-10 py-1 pb-20 text-[#EAE5D9] space-y-5 animate-fadeIn">
      
      {/* Toast popup */}
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
        {/* Left navigation controls */}
        <ProductNavTabs productId={productId} activeTab="compare" isLoading={loading} />
      </div>

      {loading ? (
        <AiProgressLoader
          trackingKey={`compare_${productId}`}
          {...LOADER_PRESETS.compare}
          isCompleted={isLoaded}
          onFinished={() => setLoading(false)}
        />
      ) : (
        <>
          {/* ========================================================= */}
          {/* 2. EXPANSIVE HERO PANORAMIC INTELLIGENCE DECK */}
          {/* ========================================================= */}
          <div className="!mt-8 sm:!mt-10 mb-10 sm:mb-14 rounded-3xl border border-[#184C2E]/80 hover:border-black bg-[#0C2417]/80 hover:bg-[#CEFF00] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] p-4 sm:p-7 space-y-6 transition-all duration-200 group/hero cursor-default">
              
              {/* Zemo Bestie Deal Verdict & Instant Savings */}
              <div className="space-y-4">
                {/* Big Headline */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono text-[#A6A095] group-hover/hero:text-black/80 font-bold block transition-colors">
                      Top Pick Lowest Checkout Price:
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black font-mono text-[#CEFF00] group-hover/hero:text-black tracking-tight transition-colors">
                      ₹{topPickPrice ? topPickPrice.toLocaleString() : "--"}
                      <span className="text-sm font-sans font-medium text-[#EAE5D9] group-hover/hero:text-black/80 ml-2.5 inline-flex items-baseline gap-1.5 transition-colors">
                        <span>on</span>
                        <span className="text-white group-hover/hero:text-black font-bold transition-colors">
                          {topPickStore?.name || summary.cheapestStore}
                        </span>
                        {topPickStore && getEffectivePrice(topPickStore) < topPickStore.price && (
                          <span className="text-[10px] font-mono text-black bg-[#CEFF00] group-hover/hero:bg-black group-hover/hero:text-[#CEFF00] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ml-1">
                            Card Deal
                          </span>
                        )}
                      </span>
                    </h2>
                  </div>

                  {maxSavings > 0 ? (
                    <div className="px-4 py-2 rounded-2xl bg-[#CEFF00] group-hover/hero:bg-black border-2 border-[#CEFF00] group-hover/hero:border-black self-start sm:self-auto shrink-0 transition-all">
                      <span className="text-[10px] font-mono uppercase text-black/80 group-hover/hero:text-[#CEFF00] font-black block transition-colors">
                        Instant Savings vs Tracked
                      </span>
                      <span className="text-base sm:text-lg font-mono font-black text-black group-hover/hero:text-[#CEFF00] transition-colors">
                        Save ₹{maxSavings.toLocaleString()} ({savingsPercent}%)
                      </span>
                    </div>
                  ) : (
                    <div className="px-4 py-2 rounded-2xl bg-[#CEFF00] group-hover/hero:bg-black border-2 border-[#CEFF00] group-hover/hero:border-black self-start sm:self-auto shrink-0 transition-all">
                      <span className="text-[10px] font-mono uppercase text-black group-hover/hero:text-[#CEFF00] font-black block transition-colors">
                        Best Rate Verified
                      </span>
                      <span className="text-[10px] font-mono uppercase font-black text-black group-hover/hero:text-[#CEFF00] transition-colors block">
                        Cheapest rate across stores
                      </span>
                    </div>
                  )}
                </div>

              </div>

              {/* 4-Metric Fast Ribbon */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-4 border-t border-[#143E26]/60 group-hover/hero:border-black/15 transition-colors">
                <div className="p-3 rounded-xl bg-[#08150D] group-hover/hero:bg-black/10 border border-[#143E26] group-hover/hero:border-black/20 transition-all duration-200">
                  <span className="text-[10px] font-mono uppercase text-[#A6A095] group-hover/hero:text-black/75 block font-bold transition-colors">
                    Top Pick Price (Cards)
                  </span>
                  <span className="text-base sm:text-lg font-mono font-black text-[#CEFF00] group-hover/hero:text-black transition-colors">
                    ₹{topPickPrice.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 group-hover/hero:text-black/70 block truncate transition-colors">
                    {topPickStore?.name}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#08150D] group-hover/hero:bg-black/10 border border-[#143E26] group-hover/hero:border-black/20 transition-all duration-200">
                  <span className="text-[10px] font-mono uppercase text-[#A6A095] group-hover/hero:text-black/75 block font-bold transition-colors">
                    Lowest Base Rate
                  </span>
                  <span className="text-base sm:text-lg font-mono font-black text-[#CEFF00] group-hover/hero:text-black transition-colors">
                    ₹{lowestPrice.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 group-hover/hero:text-black/70 block truncate transition-colors">
                    {summary.cheapestStore} (Sticker)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#08150D] group-hover/hero:bg-black/10 border border-[#143E26] group-hover/hero:border-black/20 transition-all duration-200">
                  <span className="text-[10px] font-mono uppercase text-[#A6A095] group-hover/hero:text-black/75 block font-bold transition-colors">
                    Market Average
                  </span>
                  <span className="text-base sm:text-lg font-mono font-black text-white group-hover/hero:text-black transition-colors">
                    ₹{(summary.averagePrice || currentPrice).toLocaleString()}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 group-hover/hero:text-black/70 block transition-colors">
                    Across 6 retailers
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#08150D] group-hover/hero:bg-black/10 border border-[#143E26] group-hover/hero:border-black/20 transition-all duration-200">
                  <span className="text-[10px] font-mono uppercase text-[#A6A095] group-hover/hero:text-black/75 block font-bold transition-colors">
                    Market Price Spread
                  </span>
                  <span className="text-base sm:text-lg font-mono font-black text-white group-hover/hero:text-black transition-colors">
                    ₹{((summary.highestPrice || currentPrice) - lowestPrice).toLocaleString()}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 group-hover/hero:text-black/70 block transition-colors">
                    Spread range across stores
                  </span>
                </div>
              </div>

            </div>

          {/* ========================================================= */}
          {/* 3. EXPANSIVE MULTI-STORE PANORAMIC CARDS GRID */}
          {/* ========================================================= */}
          <div className="pt-4 sm:pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-mono font-black text-white uppercase tracking-wider">
                  Your Stores, One Place
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stores.map((store) => {
                    const isOutOfStock =
                      store.inStock === false ||
                      store.stockStatus?.toLowerCase().includes("out of stock") ||
                      store.stockStatus?.toLowerCase().includes("unavailable") ||
                      store.stockStatus?.toLowerCase().includes("not listed");

                    const isAvailable = !isOutOfStock && store.price > 0;
                    const isTopPick = isAvailable && topPickStore && store.id === topPickStore.id;
                    const diff = store.price - currentPrice;
                    const isCheaper = diff < 0;
                    const isMoreExpensive = diff > 0;

                    return (
                      <div
                        key={store.id}
                        className="rounded-2xl border border-[#184C2E]/80 hover:border-black bg-[#0C2417]/80 hover:bg-[#CEFF00] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] p-5 flex flex-col justify-between h-full space-y-4 transition-all duration-200 group cursor-default"
                      >
                        {/* 1. Top Header: Store Identity, Stock & Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="font-sans font-bold text-sm sm:text-base text-white group-hover:text-black tracking-tight transition-colors">
                              {store.name}
                            </span>
                            {(() => {
                              const displayStatus = store.stockStatus || (store.price > 0 && !isOutOfStock ? "In Stock" : "Unavailable");
                              return (
                                <span className="text-[10px] font-mono font-bold transition-colors flex items-center gap-1 text-[#CEFF00] group-hover:text-black">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#CEFF00] group-hover:bg-black"></span>
                                  {displayStatus}
                                </span>
                              );
                            })()}
                          </div>

                          {/* Highlight Badge - Solely for the single lowest effective checkout price store */}
                          {isTopPick && (
                            <span className="px-2.5 py-0.5 rounded-full bg-[#CEFF00] group-hover:bg-black text-black group-hover:text-[#CEFF00] font-mono text-[10px] font-black uppercase tracking-wider shadow-sm transition-colors">
                              TOP PICK
                            </span>
                          )}
                        </div>

                    {/* 2. Hero Pricing & Variance */}
                    <div className="space-y-3">
                      <div className="flex items-baseline justify-between gap-2 flex-wrap">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl sm:text-2xl font-mono font-black text-[#CEFF00] group-hover:text-black transition-colors">
                            ₹{store.price.toLocaleString()}
                          </span>
                          {store.mrp > store.price && (
                            <span className="text-xs font-mono text-zinc-500 group-hover:text-black/50 line-through transition-colors">
                              ₹{store.mrp.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Tracked Difference Badge */}
                        {isCheaper ? (
                          <span className="font-mono font-bold text-[11px] text-[#CEFF00] group-hover:text-black bg-[#CEFF00]/15 group-hover:bg-black/15 px-2.5 py-0.5 rounded-full border border-[#CEFF00]/40 group-hover:border-black/30 transition-colors">
                            ▼ ₹{Math.abs(diff).toLocaleString()} Cheaper
                          </span>
                        ) : isMoreExpensive ? (
                          <span className="font-mono text-[11px] text-zinc-400 group-hover:text-black/75 px-1 transition-colors">
                            ▲ +₹{diff.toLocaleString()} vs tracked
                          </span>
                        ) : null}
                      </div>

                      {/* Best Credit Card Offer Callout or Explicit Note */}
                      {store.effectivePriceWithOffer && store.effectivePriceWithOffer < store.price ? (
                        <div className="px-3.5 py-2.5 rounded-xl bg-[#050B07] group-hover:bg-black/10 border border-[#143E26] group-hover:border-black/20 text-xs font-mono transition-colors space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-zinc-400 group-hover:text-black/75 font-medium text-[11px]">Best Credit Card Price:</span>
                            <span className="font-mono font-black text-[#CEFF00] group-hover:text-black text-sm transition-colors">
                              ₹{store.effectivePriceWithOffer.toLocaleString()}
                            </span>
                          </div>
                          {store.offers?.[0]?.text && (
                            <p className="font-sans text-[11px] text-[#A6A095] group-hover:text-black/80 leading-snug line-clamp-2 pt-0.5">
                              {store.offers[0].text}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="px-3.5 py-2.5 rounded-xl bg-[#07130A] group-hover:bg-black/10 border border-[#163E26]/60 group-hover:border-black/20 text-xs font-mono transition-colors space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-zinc-400 group-hover:text-black/75 font-medium flex items-center gap-1.5 text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 group-hover:bg-black/50"></span>
                              Credit Card Deal
                            </span>
                            {store.offers?.[0]?.badge && (
                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#A6A095] group-hover:text-black/70">
                                {store.offers[0].badge}
                              </span>
                            )}
                          </div>
                          <p className="font-sans text-[11px] text-[#A6A095] group-hover:text-black/85 leading-snug font-medium line-clamp-2">
                            {store.offers?.[0]?.text || "No Extra Card Discount (Standard Price)"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
      </div>



        </>
      )}

    </div>
  );
}
