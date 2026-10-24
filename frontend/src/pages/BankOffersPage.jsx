import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import ProductNavTabs from "../components/ProductNavTabs";
import AiProgressLoader, { LOADER_PRESETS } from "../components/AiProgressLoader";

// Persistent in-memory + sessionStorage cache for instant tab switching
const bankOffersMemoryCache = {};
const inFlightBankOffers = {};

function getCachedBankOffers(id) {
  if (!id) return null;
  if (bankOffersMemoryCache[id]) return bankOffersMemoryCache[id];
  try {
    const raw = sessionStorage.getItem(`zemo_offers_${id}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      bankOffersMemoryCache[id] = parsed;
      return parsed;
    }
  } catch (e) {}
  return null;
}

function setCachedBankOffers(id, data) {
  if (!id || !data) return;
  bankOffersMemoryCache[id] = data;
  try {
    sessionStorage.setItem(`zemo_offers_${id}`, JSON.stringify(data));
  } catch (e) {}
}

const BANK_CARD_EMI_PRESETS = [
  {
    id: "amazon_icici",
    name: "Amazon Pay ICICI",
    badge: "NO COST (3M)",
    fee: 299,
    hasNoCost3m: true,
    aprRates: { 3: 0, 6: 15.99, 9: 15.99, 12: 15.99, 18: 15.99, 24: 15.99 }
  },
  {
    id: "hdfc",
    name: "HDFC Bank",
    badge: "17-18% APR",
    fee: 299,
    hasNoCost3m: false,
    aprRates: { 3: 18.0, 6: 17.0, 9: 17.0, 12: 17.0, 18: 17.0, 24: 17.0 }
  },
  {
    id: "sbi",
    name: "SBI Card",
    badge: "LOW FEE ₹169",
    fee: 169,
    hasNoCost3m: false,
    aprRates: { 3: 17.25, 6: 17.0, 9: 17.0, 12: 17.0, 18: 17.0, 24: 17.0 }
  },
  {
    id: "icici",
    name: "ICICI Bank",
    badge: "15.99% APR",
    fee: 299,
    hasNoCost3m: false,
    aprRates: { 3: 15.99, 6: 15.99, 9: 15.99, 12: 15.99, 18: 15.99, 24: 15.99 }
  },
  {
    id: "axis",
    name: "Axis Bank",
    badge: "17% APR",
    fee: 299,
    hasNoCost3m: false,
    aprRates: { 3: 17.0, 6: 17.0, 9: 17.0, 12: 17.0, 18: 17.0, 24: 17.0 }
  },
  {
    id: "kotak",
    name: "Kotak Bank",
    badge: "16% APR",
    fee: 299,
    hasNoCost3m: false,
    aprRates: { 3: 16.0, 6: 16.0, 9: 16.0, 12: 16.0, 18: 16.0, 24: 16.0 }
  },
  {
    id: "amazon_pay_later",
    name: "Amazon Pay Later",
    badge: "CARDLESS",
    fee: 802,
    hasNoCost3m: false,
    aprRates: { 6: 24.0, 9: 24.0, 12: 24.0 }
  }
];

function calculateEmi(principal, apr, months, isNoCost = false) {
  if (isNoCost || apr === 0) {
    const monthlyEmi = Math.round(principal / months);
    const nominalApr = apr > 0 ? apr : 18.0;
    const r = (nominalApr / 100) / 12;
    const factor = Math.pow(1 + r, months);
    const nominalEmi = Math.round(principal * r * factor / (factor - 1));
    const waivedInterest = Math.max(0, (nominalEmi * months) - principal);

    return {
      durationMonths: months,
      monthlyEmi,
      totalInterest: 0,
      waivedInterest,
      totalCost: principal,
      isNoCost: true,
      apr: 0
    };
  }
  const r = (apr / 100) / 12;
  const factor = Math.pow(1 + r, months);
  const monthlyEmi = Math.round(principal * r * factor / (factor - 1));
  const totalCost = monthlyEmi * months;
  const totalInterest = totalCost - principal;
  return {
    durationMonths: months,
    monthlyEmi,
    totalInterest,
    waivedInterest: 0,
    totalCost,
    isNoCost: false,
    apr
  };
}

export default function BankOffersPage() {
  const { id: productId } = useParams();
  const navigate = useNavigate();

  const cached = getCachedBankOffers(productId);
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
  const [copiedCode, setCopiedCode] = useState(null);

  // Filters state
  const [selectedBankFilter, setSelectedBankFilter] = useState("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all");
  const [selectedEmiMonth, setSelectedEmiMonth] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState("amazon_icici");

  useEffect(() => {
    if (productId) {
      const existing = getCachedBankOffers(productId);
      if (!existing) {
        loadOffers();
      }
    }
  }, [productId]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  async function loadOffers(forceRefresh = false) {
    if (!forceRefresh) {
      const c = getCachedBankOffers(productId);
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
        ? `/product/offers/${productId}?refresh=true`
        : `/product/offers/${productId}`;

      let resData;
      if (!forceRefresh && inFlightBankOffers[productId]) {
        resData = await inFlightBankOffers[productId];
      } else {
        const fetchPromise = API.get(url)
          .then((res) => {
            delete inFlightBankOffers[productId];
            setCachedBankOffers(productId, res.data);
            return res.data;
          })
          .catch((err) => {
            delete inFlightBankOffers[productId];
            throw err;
          });

        if (!forceRefresh) {
          inFlightBankOffers[productId] = fetchPromise;
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

      if (forceRefresh) {
        showToast("Refreshed bank offers & discounts!");
        setRefreshing(false);
      } else {
        setIsLoaded(true);
      }
    } catch (error) {
      console.error("Failed to load bank offers:", error);
      showToast("Unable to fetch bank offers. Please try again.");
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleClearCache() {
    try {
      setClearingCache(true);
      delete bankOffersMemoryCache[productId];
      try { sessionStorage.removeItem(`zemo_offers_${productId}`); } catch (e) {}
      await API.post(`/product/offers/${productId}/clear-cache`);
      showToast("Bank offers cache cleared! Re-fetching fresh data...");
      await loadOffers(true);
    } catch (err) {
      console.error("Clear cache error:", err);
      showToast("Failed to clear offers cache");
    } finally {
      setClearingCache(false);
    }
  }

  const handleCopyCode = (code, offerId) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(offerId);
    showToast(`Copied promo code "${code}" to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const offers = data?.offers || [];
  const summary = data?.summary || {};
  const currentPrice = data?.currentTrackedPrice || product?.currentPrice || 0;

  // Real live bank discount & coupon extraction from verified offers
  const topVerifiedBankOffer = offers.find(o => o.badge === "LIVE AMAZON PROMO" && o.type === "bank_discount" && o.discountAmount > 0)
    || offers.find(o => o.type === "bank_discount" && o.discountAmount > 0 && o.discountAmount !== 3000)
    || offers.find(o => o.bank?.toLowerCase().includes("sbi") && o.discountAmount > 0)
    || null;

  const liveBankDiscount = summary.stackingFormula?.bankDiscount !== undefined
    ? summary.stackingFormula.bankDiscount
    : (topVerifiedBankOffer?.discountAmount || 0);

  const liveBankPartner = summary.bestBankPartner
    ? summary.bestBankPartner
    : (topVerifiedBankOffer?.bank || "None");

  const liveCouponSavings = summary.stackingFormula?.couponSavings !== undefined
    ? summary.stackingFormula.couponSavings
    : (product?.coupon?.amount || 0);

  const liveTotalStacked = liveBankDiscount + liveCouponSavings;
  const liveNetPrice = Math.max(0, currentPrice - liveTotalStacked);

  const activeCard = BANK_CARD_EMI_PRESETS.find(c => c.id === selectedCardId) || BANK_CARD_EMI_PRESETS[0];

  // Dynamically check if scraped listing offers include an active No Cost EMI promotion for this bank
  const checkCardNoCost = (card) => {
    return offers.some(o => {
      const isEmi = o.type === 'emi' || /no\s*cost\s*emi|emi\s*interest\s*savings|interest\s*savings/i.test((o.title || '') + ' ' + (o.description || ''));
      if (!isEmi) return false;
      const text = ((o.bank || '') + ' ' + (o.title || '') + ' ' + (o.description || '')).toLowerCase();
      if (card.id === 'amazon_icici') return text.includes('icici') || text.includes('amazon pay');
      if (card.id === 'hdfc') return text.includes('hdfc');
      if (card.id === 'sbi') return text.includes('sbi');
      if (card.id === 'icici') return text.includes('icici');
      if (card.id === 'axis') return text.includes('axis');
      if (card.id === 'kotak') return text.includes('kotak');
      if (card.id === 'amazon_pay_later') return text.includes('amazon pay later');
      return text.includes('select credit cards') || text.includes('partner bank');
    });
  };

  const hasActiveCardNoCost = checkCardNoCost(activeCard);

  const calculatedEmiPlans = Object.entries(activeCard.aprRates).map(([m, rate]) => {
    const months = parseInt(m, 10);
    const isNoCost = rate === 0 || (hasActiveCardNoCost && months <= 12);
    return {
      ...calculateEmi(currentPrice, rate, months, isNoCost),
      bank: activeCard.name
    };
  });

  // Filter bank offers
  const filteredOffers = offers.filter((offer) => {
    // Bank filter
    if (selectedBankFilter !== "all") {
      const matchesBank =
        offer.bankCode === selectedBankFilter ||
        offer.bank?.toLowerCase().includes(selectedBankFilter.toLowerCase()) ||
        offer.cardTypes?.some((c) => c.toLowerCase().includes(selectedBankFilter.toLowerCase()));
      if (!matchesBank) return false;
    }

    // Type filter
    if (selectedTypeFilter !== "all" && offer.type !== selectedTypeFilter) {
      return false;
    }

    return true;
  });

  const bankChips = [
    { id: "all", label: "All Banks & Cards" },
    { id: "hdfc", label: "HDFC Bank" },
    { id: "icici", label: "ICICI Bank" },
    { id: "sbi", label: "SBI Cards" },
    { id: "axis", label: "Axis Bank" },
    { id: "tata", label: "Tata Neu / Croma" },
    { id: "coupon", label: "Store Coupons" },
    { id: "exchange", label: "Exchange Bonus" }
  ];

  const typeTabs = [
    { id: "all", label: "All Offer Types" },
    { id: "bank_discount", label: "Instant Bank Off" },
    { id: "cashback", label: "Unlimited Cashback" },
    { id: "coupon", label: "Checkbox & Vouchers" },
    { id: "exchange", label: "Trade-in Bonuses" }
  ];

  return (
    <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-6 lg:px-10 py-1 pb-20 text-[#EAE5D9] space-y-6 animate-fadeIn">
      
      {/* Toast popup */}
      {toast && (
        <div className="fixed top-14 right-8 bg-[#0E2A1B] border border-[#CEFF00] text-[#EAE5D9] px-5 py-3 rounded-xl z-50 flex items-center gap-3 font-mono text-xs shadow-[0_0_25px_rgba(206,255,0,0.3)]">
          <span className="w-2 h-2 rounded-full bg-[#CEFF00] animate-ping"></span>
          <span>{toast}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. TOP PANORAMIC COMMAND & NAVIGATION BAR */}
      {/* ========================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left navigation controls */}
        <ProductNavTabs
          productId={productId}
          activeTab="offers"
          isLoading={loading}
          onClearCache={handleClearCache}
          isClearing={clearingCache}
        />
      </div>

      {loading ? (
        <AiProgressLoader
          trackingKey={`offers_${productId}`}
          {...LOADER_PRESETS.offers}
          isCompleted={isLoaded}
          onFinished={() => setLoading(false)}
        />
      ) : (
        <>
          {/* ========================================================= */}
          {/* 2. HERO PANORAMIC STACKING SAVINGS DECK */}
          {/* ========================================================= */}
          <div className="!mt-8 sm:!mt-12 rounded-3xl border border-[#184C2E]/80 hover:border-black bg-[#0C2417]/80 hover:bg-[#CEFF00] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] p-5 sm:p-7 transition-all duration-200 group/hero cursor-default">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Left 5 Cols: Live Base vs. Stacked Savings Deck */}
              <div className="lg:col-span-5 flex flex-col justify-start gap-3.5 lg:border-r lg:border-[#184C2E]/60 lg:group-hover/hero:border-black/20 lg:pr-6 transition-colors">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#CEFF00] group-hover/hero:text-black tracking-widest block transition-colors">
                    STACKABLE SAVINGS RADAR
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-white group-hover/hero:text-black tracking-tight mt-0.5 transition-colors">
                    Live Base vs. Stacked Savings
                  </h2>
                </div>

                {/* Two Distinct High-Contrast Cards with Matching Dimensions */}
                <div className="flex-1 flex flex-col justify-between gap-3">
                  {/* Base Retail Price */}
                  <div className="flex-1 p-4 sm:p-4.5 rounded-2xl bg-[#08150D]/90 group-hover/hero:bg-black/10 border border-[#184C2E]/60 group-hover/hero:border-black/20 flex items-center justify-between transition-all">
                    <div>
                      <span className="text-[11px] font-bold text-white/70 group-hover/hero:text-black/70 uppercase tracking-wider block transition-colors">
                        Base Retail Price
                      </span>
                      <span className="text-xl sm:text-2xl font-bold text-white group-hover/hero:text-black tracking-tight transition-colors">
                        ₹{currentPrice ? currentPrice.toLocaleString() : "--"}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#050B07] group-hover/hero:bg-black text-white group-hover/hero:text-[#CEFF00] border border-[#184C2E]/60 group-hover/hero:border-black/20 transition-colors">
                      Retail Price
                    </span>
                  </div>

                  {/* Max Stackable Savings */}
                  <div className="flex-1 p-4 sm:p-4.5 rounded-2xl bg-[#08150D]/90 group-hover/hero:bg-black/10 border border-[#184C2E]/60 group-hover/hero:border-black/20 flex items-center justify-between transition-all">
                    <div>
                      <span className="text-[11px] font-black text-[#CEFF00] group-hover/hero:text-black uppercase tracking-wider block transition-colors">
                        Max Stackable Savings
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-[#CEFF00] group-hover/hero:text-black tracking-tight transition-colors">
                        -₹{liveTotalStacked.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-[#CEFF00] text-black group-hover/hero:bg-black group-hover/hero:text-[#CEFF00] uppercase tracking-wider transition-colors shadow-sm">
                      Applied at Checkout
                    </span>
                  </div>
                </div>
              </div>

              {/* Right 7 Cols: How All Your Discounts Add Up (Step-by-Step Hierarchy) */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-4 lg:pl-2">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#CEFF00] group-hover/hero:text-black tracking-widest block transition-colors">
                    CHECKOUT CALCULATION
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-white group-hover/hero:text-black tracking-tight mt-0.5 transition-colors">
                    How All Your Discounts Add Up
                  </h2>
                </div>

                {/* Step-by-Step Waterfall Tiles */}
                <div className="space-y-2">
                  {(() => {
                    const steps = [
                      {
                        label: "Live Base Retail Price",
                        value: `₹${currentPrice.toLocaleString()}`,
                        isDiscount: false
                      }
                    ];
                    if (liveCouponSavings > 0) {
                      steps.push({
                        label: "Store Checkbox Voucher",
                        value: `-₹${liveCouponSavings.toLocaleString()}`,
                        isDiscount: true
                      });
                    }
                    if (liveBankDiscount > 0) {
                      steps.push({
                        label: `Best Bank Card Instant Discount (${liveBankPartner})`,
                        value: `-₹${liveBankDiscount.toLocaleString()}`,
                        isDiscount: true
                      });
                    }

                    return steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 sm:p-3 rounded-xl bg-[#08150D]/80 group-hover/hero:bg-black/10 border border-[#184C2E]/40 group-hover/hero:border-black/15 flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-md bg-[#0C2417] group-hover/hero:bg-black text-[#CEFF00] border border-[#184C2E] group-hover/hero:border-black flex items-center justify-center text-[10px] font-black shrink-0 transition-colors">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          <span className="text-xs font-semibold text-white group-hover/hero:text-black transition-colors">
                            {step.label}
                          </span>
                        </div>
                        <span className={`text-xs sm:text-sm font-bold ${step.isDiscount ? "text-[#CEFF00]" : "text-white"} group-hover/hero:text-black transition-colors`}>
                          {step.value}
                        </span>
                      </div>
                    ));
                  })()}
                </div>

                {/* Final Net Hero Ribbon */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#050B07] group-hover/hero:bg-black/20 border border-[#184C2E] group-hover/hero:border-black/30 flex items-center justify-between transition-all shadow-sm">
                  <div>
                    <span className="text-[10px] font-bold text-white/80 group-hover/hero:text-black/75 uppercase tracking-wider block transition-colors">
                      Net Final Checkout Cost
                    </span>
                    <span className="text-[11px] font-bold text-white group-hover/hero:text-black transition-colors">
                      You save ₹{liveTotalStacked.toLocaleString()} total
                    </span>
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-[#CEFF00] group-hover/hero:text-black tracking-tight transition-colors">
                    ₹{liveNetPrice.toLocaleString()}
                  </span>
                </div>

              </div>

            </div>
          </div>


          {/* ========================================================= */}
          {/* 4. INTERACTIVE NO-COST & CARD EMI CALCULATOR DECK */}
          {/* ========================================================= */}
          <div className="!mt-10 sm:!mt-14 rounded-3xl border border-[#184C2E]/80 hover:border-black bg-[#0C2417]/80 hover:bg-[#CEFF00] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] p-5 sm:p-7 transition-all duration-200 group/emi cursor-default space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-black text-[#CEFF00] group-hover/emi:text-black uppercase tracking-widest block transition-colors">
                  PERSONALIZED INSTALLMENT PLAN
                </span>
                <h3 className="text-base sm:text-lg font-black text-white group-hover/emi:text-black tracking-tight mt-0.5 transition-colors">
                  Shop Today, Pay Gently Over Time
                </h3>
                <p className="text-xs text-[#A6A095] group-hover/emi:text-black/70 font-sans transition-colors leading-relaxed">
                  Choose your card below and let's find the coziest installment plan that treats your wallet with care.
                </p>
              </div>

              {/* Processing fee info tag */}
              <div className="shrink-0 p-2.5 px-3.5 rounded-xl bg-[#08150D] group-hover/emi:bg-black/15 border border-[#184C2E]/60 group-hover/emi:border-black/20 text-[11px] font-mono transition-colors">
                <span className="text-zinc-400 group-hover/emi:text-black/70 block text-[9px] uppercase tracking-wider font-bold">
                  Card Processing Fee
                </span>
                <span className="text-white group-hover/emi:text-black font-bold">
                  {activeCard.fee ? `₹${activeCard.fee} (incl. GST)` : "Zero Processing Fee"}
                </span>
              </div>
            </div>

            {/* Credit Card Selector Pills */}
            <div className="space-y-2 pt-1 border-t border-[#184C2E]/60 group-hover/emi:border-black/20 transition-colors">
              <span className="text-[11px] font-mono font-bold text-zinc-300 group-hover/emi:text-black transition-colors block">
                Which credit card or payment plan do you have?
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {BANK_CARD_EMI_PRESETS.map((card) => {
                  const isSelected = selectedCardId === card.id;
                  const hasNoCost = checkCardNoCost(card);
                  return (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCardId(card.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-colors border ${
                        isSelected
                          ? "bg-[#CEFF00] text-black border-black font-black"
                          : "bg-[#08150D]/90 group-hover/emi:bg-black/10 border-[#184C2E]/60 group-hover/emi:border-black/20 text-zinc-300 group-hover/emi:text-black hover:border-[#CEFF00]/60 font-medium"
                      }`}
                    >
                      {card.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Calculated Dynamic Plans Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
              {calculatedEmiPlans.map((plan, i) => (
                <div
                  key={i}
                  className="relative p-4 rounded-2xl border transition-colors flex flex-col justify-between bg-[#08150D]/90 group-hover/emi:bg-black/10 border-[#184C2E]/60 group-hover/emi:border-black/20"
                >
                  {/* Top Row: Duration & Status Badge */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#143E26]/60 group-hover/emi:border-black/15 transition-colors">
                    <span className="text-xs font-mono font-bold text-white group-hover/emi:text-black tracking-wide transition-colors">
                      {plan.durationMonths} Months Plan
                    </span>
                    <span
                      className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors ${
                        plan.isNoCost
                          ? "bg-[#CEFF00] text-black font-black"
                          : "bg-black/60 group-hover/emi:bg-black/20 text-zinc-300 group-hover/emi:text-black border border-zinc-800 group-hover/emi:border-black/20"
                      }`}
                    >
                      {plan.isNoCost ? "0% Extra (No Cost)" : `${plan.apr}% p.a.`}
                    </span>
                  </div>

                  {/* Primary Hero: Large Monthly Amount */}
                  <div className="py-3">
                    <span className="text-[10px] uppercase font-mono text-zinc-400 group-hover/emi:text-black/70 block tracking-wider mb-0.5 transition-colors">
                      Monthly Payment
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-mono font-black text-white group-hover/emi:text-black transition-colors tracking-tight">
                        ₹{plan.monthlyEmi.toLocaleString()}
                      </span>
                      <span className="text-xs font-mono text-zinc-400 group-hover/emi:text-black/70 transition-colors">/mo</span>
                    </div>
                  </div>

                  {/* Bottom Metadata: Interest & Total Cost */}
                  <div className="pt-3 border-t border-[#143E26]/60 group-hover/emi:border-black/15 space-y-1.5 text-[11px] font-mono transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 group-hover/emi:text-black/70 transition-colors">Interest Added</span>
                      <span
                        className={`font-bold transition-colors ${
                          plan.isNoCost
                            ? "text-[#CEFF00] group-hover/emi:text-black"
                            : "text-zinc-200 group-hover/emi:text-black"
                        }`}
                      >
                        {plan.isNoCost
                          ? (plan.waivedInterest > 0 ? `₹0 (₹${plan.waivedInterest.toLocaleString()} Discount)` : "₹0 (Waived Upfront)")
                          : `+₹${plan.totalInterest.toLocaleString()}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-0.5">
                      <span className="text-zinc-500 group-hover/emi:text-black/60 transition-colors">Total Net Cost</span>
                      <span className="text-white group-hover/emi:text-black font-bold transition-colors">
                        ₹{plan.totalCost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================= */}
          {/* 5. PANORAMIC ACTIVE BANK & COUPON OFFERS GRID */}
          {/* ========================================================= */}
          <div className="!mt-10 sm:!mt-14 space-y-3">
            <div>
              <h3 className="text-xs sm:text-sm font-mono font-bold text-white uppercase tracking-wider">
                Thoughtful Savings on Every Card
              </h3>
              <p className="text-xs text-[#A6A095] font-sans mt-0.5 leading-relaxed">
                Every card you carry comes with its own perk. Compare real-time discounts and bring home what you love with extra smiles at checkout.
              </p>
            </div>



            {filteredOffers.length === 0 ? (
              <div className="p-12 text-center bg-[#060D09] border border-[#143E26] rounded-2xl space-y-2">
                <span className="text-2xl">💳</span>
                <p className="text-sm font-mono text-zinc-400">
                  No active offers found matching the selected card criteria.
                </p>
                <button
                  onClick={() => {
                    setSelectedBankFilter("all");
                    setSelectedTypeFilter("all");
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0E2A1B] text-[#CEFF00] border border-[#163E26] font-mono text-xs font-bold hover:bg-[#CEFF00] hover:text-black transition-all"
                >
                  View All Offers
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOffers.map((offer) => {
                  return (
                    <div
                      key={offer.id}
                      className="p-5 rounded-2xl bg-[#08150D] hover:bg-[#CEFF00] border border-[#143E26] hover:border-black transition-all duration-200 flex flex-col justify-between space-y-4 group/card cursor-default shadow-sm hover:shadow-[0_15px_35px_rgba(206,255,0,0.18)]"
                    >
                      {/* Level 1: Bank Header & Category Badge */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-black text-xs text-white group-hover/card:text-black tracking-wider uppercase transition-colors">
                            {offer.bank}
                          </span>
                          <span className="text-[9px] font-mono font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-[#0C2417] group-hover/card:bg-black text-[#CEFF00] border border-[#184C2E] group-hover/card:border-black transition-colors shrink-0">
                            {offer.discountAmount > 0
                              ? (offer.type === 'cashback' ? 'Cashback' : offer.type === 'emi' ? 'No-Cost EMI' : 'Instant Off')
                              : (offer.title?.toLowerCase().includes('gst') ? 'Tax Credit' : 'Partner Perk')}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-[#EAE5D9] group-hover/card:text-black transition-colors leading-relaxed break-words">
                          {offer.description || offer.title}
                        </h4>
                      </div>

                      {/* Level 2: Financial Breakdown / Benefit Metric */}
                      <div className="p-3.5 rounded-xl bg-[#0C2417]/90 group-hover/card:bg-black/10 border border-[#184C2E]/70 group-hover/card:border-black/15 flex items-center justify-between font-mono transition-colors">
                        {offer.discountAmount > 0 ? (
                          <>
                            <div>
                              <span className="text-[10px] uppercase text-[#A6A095] group-hover/card:text-black/70 tracking-wider block transition-colors">
                                {offer.type === 'cashback' ? 'Cashback Credit' : 'Instant Discount'}
                              </span>
                              <span className="text-base sm:text-lg font-black text-[#CEFF00] group-hover/card:text-black tracking-tight transition-colors">
                                -₹{offer.discountAmount.toLocaleString()}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] uppercase text-[#A6A095] group-hover/card:text-black/70 tracking-wider block transition-colors">
                                Net at Checkout
                              </span>
                              <span className="text-base sm:text-lg font-black text-white group-hover/card:text-black transition-colors tracking-tight">
                                ₹{offer.effectivePrice.toLocaleString()}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <span className="text-[10px] uppercase text-[#A6A095] group-hover/card:text-black/70 tracking-wider block transition-colors">
                                Business Benefit
                              </span>
                              <span className="text-xs sm:text-sm font-black text-[#CEFF00] group-hover/card:text-black tracking-tight transition-colors">
                                {offer.title?.toLowerCase().includes('gst') ? 'Up to 18% Input Tax Credit' : 'Special Partner Benefit'}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] uppercase text-[#A6A095] group-hover/card:text-black/70 tracking-wider block transition-colors">
                                Retail Price
                              </span>
                              <span className="text-base sm:text-lg font-black text-white group-hover/card:text-black transition-colors tracking-tight">
                                ₹{offer.effectivePrice.toLocaleString()}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>


      {/* ========================================================= */}
      {/* 5. HEARTWARMING MUSICAL CREDITS & TRIBUTE DECK */}
      {/* ========================================================= */}
      <div className="!mt-14 sm:!mt-20 pt-8 border-t border-[#184C2E]/50">
        <div className="relative overflow-hidden rounded-3xl border border-[#184C2E]/80 hover:border-black bg-[#0C2417]/80 hover:bg-[#CEFF00] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] p-6 sm:p-8 transition-all duration-200 group/credit cursor-default space-y-5 text-left">
          {/* Subtle top ambient glow */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#CEFF00]/40 to-transparent group-hover/credit:opacity-0 transition-opacity" />

          {/* 2-Column Responsive Layout: Story on the Left, Musical Showcase Card on the Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* LEFT COLUMN: The Story & Personal Solo Tribute (7-col) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Vinyl / Melody Icon Badge */}
              <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[#08180E] group-hover/credit:bg-black/15 border border-[#184C2E] group-hover/credit:border-black/20 shadow-sm transition-colors">
                <span className="text-[10px] font-mono font-black tracking-[0.2em] uppercase text-[#CEFF00] group-hover/credit:text-black transition-colors">
                  SOUNDTRACK OF PATIENCE
                </span>
              </div>

              {/* Primary Poetic Title */}
              <h3 className="font-prata text-xl sm:text-2xl text-[#F5F2EA] group-hover/credit:text-black tracking-wide transition-colors">
                “I Giorni” — The Days That Teach Us Stillness
              </h3>

              {/* Deeply Heartwarming Narrative */}
              <div className="space-y-3 text-xs sm:text-sm font-sans leading-relaxed text-pretty transition-colors">
                <p className="text-[#A6A095] group-hover/credit:text-black/85">
                  Composed by the Italian maestro <span className="text-white group-hover/credit:text-black font-semibold transition-colors">Ludovico Einaudi</span>, 
                  <em className="text-[#CEFF00] group-hover/credit:text-black font-semibold not-italic transition-colors"> I Giorni</em> was born from his solitary journey across Mali — 
                  a homage to the quiet passage of time and the beauty hidden in everyday hours.
                </p>

                <p className="text-[#A6A095] group-hover/credit:text-black/85">
                  Building Zemo on my own has had plenty of quiet, demanding late nights. Throughout all of them, Einaudi’s gentle piano has been my constant companion — giving me a sense of peace, focus, and perspective whenever things felt overwhelming. His profound contribution to music taught me that good things take time, and that patience isn’t passive waiting — it’s trusting the process with a calm heart.
                </p>

                <p className="text-[#A6A095] group-hover/credit:text-black/85">
                  Playing this piece here is my personal tribute to his timeless work. I hope it brings you the same quiet comfort while you explore, reminding you to breathe and let your dreams unfold without rush.
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: Musical Showcase Card & Watch Button (4-col) */}
            <div className="lg:col-span-4 w-full h-full flex flex-col justify-between p-5 rounded-2xl bg-[#08150D]/90 group-hover/credit:bg-black/10 border border-[#184C2E]/70 group-hover/credit:border-black/20 transition-all space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#CEFF00] group-hover/credit:text-black uppercase">
                    FEATURED RECORDING
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#A6A095] group-hover/credit:text-black/70">
                    Live at Royal Albert Hall
                  </span>
                </div>

                {/* Maestro Portrait & Metadata */}
                <div className="flex items-center gap-3.5 pt-1">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 shadow-md transition-all">
                    <img
                      src="/ludovico_einaudi.png"
                      alt="Ludovico Einaudi"
                      className="w-full h-full object-cover object-center group-hover/credit:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover/credit:text-black font-sans leading-tight">
                      Ludovico Einaudi
                    </h4>
                    <p className="text-xs font-mono text-[#CEFF00] group-hover/credit:text-black/80 font-bold mt-0.5">
                      I Giorni (Live)
                    </p>
                  </div>
                </div>

                <p className="text-[11px] font-sans text-[#8C9E92] group-hover/credit:text-black/70 leading-relaxed">
                  Recorded in London at the historic Royal Albert Hall — featuring his full transcendent solo piano performance.
                </p>
              </div>

              {/* Direct Watch Link Button */}
              <a
                href="https://youtu.be/blDWRt9-YPc?si=mp_IaUlGF43veWrK"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-[#0C2417] group-hover/credit:bg-black text-[#CEFF00] group-hover/credit:text-[#CEFF00] border border-[#184C2E] group-hover/credit:border-black font-mono text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 group/btn cursor-pointer shadow-sm"
              >
                <span>Watch Live Performance</span>
                <span className="transition-transform group-hover/btn:translate-x-1">↗</span>
              </a>
            </div>

          </div>

          {/* Quiet Dedication Note Bottom Row */}
          <div className="pt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#6D8274] group-hover/credit:text-black/75 border-t border-[#184C2E]/60 group-hover/credit:border-black/20 transition-colors">
            <div className="flex items-center gap-2">
              <span>Built with patience & gratitude</span>
              <span>•</span>
              <span className="text-[#CEFF00] group-hover/credit:text-black font-bold transition-colors">Ludovico Einaudi — “I Giorni” (2001)</span>
            </div>
            <span className="text-[10px] text-[#A6A095] group-hover/credit:text-black/70">Solo Tribute Edition</span>
          </div>
        </div>
      </div>
      </>
    )}

    </div>
  );
}
