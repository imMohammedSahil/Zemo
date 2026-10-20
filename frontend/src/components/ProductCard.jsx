import { useState, useEffect } from "react";

/**
 * PRODUCTION LOCK DIRECTIVE:
 * DO NOT MODIFY OR STRIP THIS CARD LAYOUT WHEN PUSHING TO PRODUCTION.
 * This exact card layout, pill configuration, and demo/preview presentation
 * is locked for recruiters and live production demos. Push as-is.
 */
export default function ProductCard({
  product,
  onSync,
  isSyncing,
  onSaveAlert,
  onRemove,
  onNavigateInsights,
  onNavigateCompare,
  onNavigateOffers
}) {
  const currentPrice = product.currentPrice || 0;
  const historicLow = product.historicLow || 0;
  const mrp = product.mrp || product.originalPrice || (currentPrice > 0 ? Math.round(currentPrice * 1.25) : 0);
  const mrpSavingsPercent = mrp > currentPrice && currentPrice > 0 ? Math.round(((mrp - currentPrice) / mrp) * 100) : 0;
  const isInStock = product.inStock !== false && product.stockStatus !== "Out of Stock";
  const stockLabel = product.stockStatus || (isInStock ? "In Stock" : "Out of Stock");

  const formatLastChecked = (date) => {
    if (!date) return "Just now";
    const now = new Date();
    const past = new Date(date);
    const diffMins = Math.max(0, Math.floor((now - past) / 60000));
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };
  const lastCheckedText = formatLastChecked(product.lastCheckedAt || product.updatedAt || product.createdAt);

  const hasAlert = Boolean(product.activeAlert);
  const activeTargetPrice = product.activeAlert?.targetPrice;
  const isTargetMet =
    hasAlert &&
    currentPrice > 0 &&
    activeTargetPrice &&
    currentPrice <= activeTargetPrice + (product.activeAlert.tolerance || 0);

  // Default target price: existing alert or 15% discount from current
  const initialTarget = activeTargetPrice || (currentPrice > 0 ? Math.round(currentPrice * 0.85) : 0);
  const [targetPrice, setTargetPrice] = useState(initialTarget);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);
  const [savingAlert, setSavingAlert] = useState(false);

  // Internal Flash Deal Countdown Timer (starts at 3h 45m = 13500s and updates minute by minute)
  const [flashSeconds, setFlashSeconds] = useState(13500);

  useEffect(() => {
    const timer = setInterval(() => {
      setFlashSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (activeTargetPrice) {
      setTargetPrice(activeTargetPrice);
    } else if (currentPrice > 0 && !targetPrice) {
      setTargetPrice(Math.round(currentPrice * 0.85));
    }
  }, [activeTargetPrice, currentPrice]);

  // Calculate percentage drop
  const discountPercent =
    currentPrice > 0 && targetPrice < currentPrice
      ? Math.round(((currentPrice - targetPrice) / currentPrice) * 100)
      : 0;

  // Slider bounds
  const minSlider = currentPrice > 0 ? Math.round(currentPrice * 0.3) : 0;
  const maxSlider = currentPrice > 0 ? currentPrice : 1000;
  const sliderStep = currentPrice > 10000 ? 50 : 10;

  // Preset discount shortcuts (Deduplicated so record low replaces matching percentage)
  let presets = [
    { label: "-10%", percent: 10, value: Math.round(currentPrice * 0.9) },
    { label: "-20%", percent: 20, value: Math.round(currentPrice * 0.8) },
    { label: "-30%", percent: 30, value: Math.round(currentPrice * 0.7) },
    { label: "-40%", percent: 40, value: Math.round(currentPrice * 0.6) },
  ];

  if (historicLow > 0 && historicLow < currentPrice) {
    const lowPercent = Math.round(((currentPrice - historicLow) / currentPrice) * 100);
    // Deduplicate: replace generic percent if it coincides with record low
    presets = presets.filter((p) => Math.abs(p.percent - lowPercent) > 2);
    presets.push({
      label: `Record Low (-${lowPercent}%)`,
      percent: lowPercent,
      value: historicLow,
      isLow: true
    });
    presets.sort((a, b) => a.percent - b.percent);
  }

  const isWishSaved = isSavedFeedback || (hasAlert && activeTargetPrice && targetPrice === activeTargetPrice);

  const handlePresetClick = (preset) => {
    setTargetPrice(preset.value);
    setSelectedPreset(preset.percent);
    setIsSavedFeedback(false);
  };

  const handleSliderChange = (e) => {
    const val = Number(e.target.value);
    setTargetPrice(val);
    setSelectedPreset(null);
    setIsSavedFeedback(false);
  };

  const handleInputChange = (e) => {
    const val = Number(e.target.value);
    setTargetPrice(val);
    setSelectedPreset(null);
    setIsSavedFeedback(false);
  };

  const handleSave = async () => {
    if (!targetPrice || targetPrice <= 0) return;
    setSavingAlert(true);
    try {
      await onSaveAlert(product._id, targetPrice, 0);
      setIsSavedFeedback(true);
    } finally {
      setSavingAlert(false);
    }
  };

  const isAmazon = product.source === "amazon";

  // Grab-o-Meter Score & Predictive Signals (Powered by Gemini AI + Cache)
  const gm = product.grabMeter;
  let dealScore = gm?.dealScore ?? 7.5;
  let dealVerdict = gm?.dealVerdict ?? "FAIR VALUE";
  let dealAdvice = gm?.dealAdvice ?? "Steady pricing • Consistent market level.";
  let urgencyText = gm?.urgencyText ?? "Moderate Hold";
  let dropProbability = gm?.dropProbability ?? 45;
  let predictedSavings = gm?.predictedSavings ?? (currentPrice > 0 ? Math.round(currentPrice * 0.15) : 0);
  let bestWindowText = gm?.bestWindowText ?? "Weekend Prime Window";
  let priceVolatility = "Moderate";
  const flashHours = Math.floor(flashSeconds / 3600);
  const flashMinutes = Math.floor((flashSeconds % 3600) / 60);
  const flashLiveText =
    flashSeconds > 0
      ? `Ends in ${flashHours}h ${flashMinutes}m`
      : "Ending Soon";
  let flashCountdown = flashLiveText;
  let stockWarning = "Healthy Inventory";
  let nextSaleEta = gm?.nextSaleEta ?? "2-3 Weeks Away";

  if (!gm && currentPrice > 0 && historicLow > 0) {
    if (currentPrice <= historicLow) {
      dealScore = 10;
      dealVerdict = "STRONG BUY";
      dealAdvice = "A happy little miracle for your cart. Today's the perfect day to grab it.";
      urgencyText = "Flash Low (< 24h)";
      dropProbability = 12;
      predictedSavings = Math.round(currentPrice * 0.25);
      bestWindowText = "Right Now (All-Time Low)";
      priceVolatility = "Low Risk";
      flashCountdown = flashLiveText;
      stockWarning = "Low Stock (< 4 left)";
      nextSaleEta = "Active Flash Deal";
    } else {
      const diff = currentPrice - historicLow;
      const hikePct = Math.round((diff / historicLow) * 100);
      if (hikePct <= 5) {
        dealScore = 9.2;
        dealVerdict = "GREAT DEAL";
        dealAdvice = "Within 5% of historic low. Prime time to buy.";
        urgencyText = "High Rebound Risk";
        dropProbability = 24;
        predictedSavings = Math.round(currentPrice * 0.20);
        bestWindowText = "Flash Window / Today";
        priceVolatility = "Low Risk";
        flashCountdown = flashLiveText;
        stockWarning = "Selling Fast (8 left)";
        nextSaleEta = "4-6 Days Away";
      } else if (hikePct <= 15) {
        dealScore = 8.1;
        dealVerdict = "GOOD VALUE";
        dealAdvice = "Solid discount. Good value for money.";
        urgencyText = "Steady (2-3 Days)";
        dropProbability = 42;
        predictedSavings = Math.round(currentPrice * 0.15);
        bestWindowText = "Weekend Prime Window";
        priceVolatility = "Low-Mod Risk";
        flashCountdown = flashLiveText;
        stockWarning = "High Demand";
        nextSaleEta = "1-2 Weeks Away";
      } else if (hikePct <= 30) {
        dealScore = 6.4;
        dealVerdict = "MODERATE";
        dealAdvice = "A little patience will go a long way here. Better savings are ahead.";
        urgencyText = "Stable Pricing";
        dropProbability = 68;
        predictedSavings = Math.round(currentPrice * 0.10);
        bestWindowText = "Mid-Month Sales";
        priceVolatility = "Moderate Risk";
        flashCountdown = "No Flash Active";
        stockWarning = "Normal Stock";
        nextSaleEta = "2-3 Weeks Away";
      } else {
        dealScore = 4.2;
        dealVerdict = "WAIT FOR DROP";
        dealAdvice = "Definitely too high right now! Set a Wish Bell and I'll jump in the moment it tumbles.";
        urgencyText = "Safe to Wait";
        dropProbability = 86;
        predictedSavings = Math.round(diff);
        bestWindowText = "Upcoming Festival Cut";
        priceVolatility = "High Volatility";
        flashCountdown = "Regular Pricing";
        stockWarning = "Ample Stock";
        nextSaleEta = "3+ Weeks Away";
      }
    }
  }

  return (
    <div
      id={`product-${product._id}`}
      data-product-id={product._id}
      className="group relative p-[1.5px] rounded-[28px] bg-gradient-to-br from-[#CEFF00]/80 via-[#184C2E] to-[#CEFF00]/50 hover:from-[#CEFF00] hover:via-[#227A4E] hover:to-[#CEFF00] transition-all duration-300 scroll-mt-24"
    >
      <div className="relative bg-[#08100C] rounded-[26.5px] p-5 sm:p-6 overflow-hidden flex flex-col lg:flex-row gap-4 lg:gap-5">

      {/* LEFT COLUMN: HERO IMAGE STAGE + AI DEAL METER */}
      <div className="shrink-0 self-start w-52 sm:w-56 lg:w-[228px] flex flex-col gap-3">
        <div className="w-[96%] mx-auto h-44 sm:h-48 lg:h-[195px] rounded-2xl overflow-hidden bg-white border border-[#163E26]/40 shadow-sm flex items-center justify-center p-3">
          {/* Hero Product Image */}
          <img
            src={
              product.image && product.image.trim().length > 0
                ? product.image
                : "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg"
            }
            alt={product.title}
            className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Grab-o-Meter */}
        <div className="p-[1.5px] rounded-2xl bg-gradient-to-br from-[#1B5734] via-[#CEFF00]/60 to-[#1B5734] shadow-sm">
          <div className="p-3 rounded-[15px] bg-[#050B07] flex flex-col gap-2.5">
          {/* Header Row: Title & Score */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-black tracking-wider text-[#CEFF00]">
              Grab-o-Meter
            </span>
            <span className="font-mono font-black text-[#CEFF00] px-2 py-0.5 rounded-md bg-[#0E2A1B] border border-[#163E26] text-[11px] shadow-[0_0_8px_rgba(206,255,0,0.15)]">
              {dealScore}/10
            </span>
          </div>

          {/* Visual Score Track Bar */}
          <div className="w-full h-1.5 bg-[#0E2A1B] rounded-full overflow-hidden border border-[#163E26]/60">
            <div
              className="h-full bg-gradient-to-r from-[#184C2E] via-[#227A4E] to-[#CEFF00] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(206,255,0,0.3)]"
              style={{ width: `${Math.min(100, Math.max(10, dealScore * 10))}%` }}
            />
          </div>

          {/* Signals (Matched Color Palette, No Emojis) */}
          <div className="space-y-2 font-mono text-[10px]">
            {/* Best Window */}
            <div className="group/pill py-2 px-2.5 rounded-lg bg-[#08130C] border border-[#163E26]/60 hover:bg-[#CEFF00] hover:border-[#CEFF00] transition-all duration-150 cursor-default">
              <span className="text-[#A6A095] group-hover/pill:text-black text-[9px] block font-semibold uppercase tracking-wider transition-colors">
                Best Window
              </span>
              <span className="font-bold text-[#CEFF00] group-hover/pill:text-black text-[10.5px] block leading-snug transition-colors">
                {bestWindowText}
              </span>
            </div>

            {/* Stock Scarcity Warning */}
            <div className="group/pill py-2 px-2.5 rounded-lg bg-[#08130C] border border-[#163E26]/60 hover:bg-[#CEFF00] hover:border-[#CEFF00] transition-all duration-150 cursor-default">
              <span className="text-[#A6A095] group-hover/pill:text-black text-[9px] block font-semibold uppercase tracking-wider transition-colors">
                Stock Alert
              </span>
              <span className="font-bold text-[#CEFF00] group-hover/pill:text-black text-[10.5px] block leading-snug transition-colors">
                {stockWarning}
              </span>
            </div>

            {/* Drop Odds */}
            <div className="group/pill py-2 px-2.5 rounded-lg bg-[#08130C] border border-[#163E26]/60 hover:bg-[#CEFF00] hover:border-[#CEFF00] transition-all duration-150 cursor-default">
              <span className="text-[#A6A095] group-hover/pill:text-black text-[9px] block font-semibold uppercase tracking-wider transition-colors">
                Drop Odds (7d)
              </span>
              <span className="font-bold text-[#CEFF00] group-hover/pill:text-black text-[10.5px] block leading-snug transition-colors">
                {dropProbability}%
              </span>
            </div>

            {/* Next Sale ETA */}
            <div className="group/pill py-2 px-2.5 rounded-lg bg-[#08130C] border border-[#163E26]/60 hover:bg-[#CEFF00] hover:border-[#CEFF00] transition-all duration-150 cursor-default">
              <span className="text-[#A6A095] group-hover/pill:text-black text-[9px] block font-semibold uppercase tracking-wider transition-colors">
                Next Sale ETA
              </span>
              <span className="font-bold text-[#CEFF00] group-hover/pill:text-black text-[10.5px] block leading-snug transition-colors">
                {nextSaleEta}
              </span>
            </div>

            {/* Verdict */}
            <div className="group/pill py-2 px-2.5 rounded-lg bg-[#08130C] border border-[#163E26]/60 hover:bg-[#CEFF00] hover:border-[#CEFF00] transition-all duration-150 cursor-default">
              <span className="text-[#A6A095] group-hover/pill:text-black text-[9px] block font-semibold uppercase tracking-wider transition-colors">
                Verdict
              </span>
              <span className="font-black text-[#CEFF00] group-hover/pill:text-black text-[10.5px] block tracking-wide transition-colors">
                {dealVerdict}
              </span>
              {dealAdvice && (
                <p className="text-[9px] text-[#EAE5D9] group-hover/pill:text-black/80 mt-1 leading-relaxed transition-colors">
                  {dealAdvice}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* RIGHT COLUMN: COMMAND CENTER (METRICS, SLIDER, ACTIONS) */}
      <div className="flex-1 flex flex-col justify-between space-y-2.5">
        
        {/* TOP ROW: Header Title + Live Status + Actions */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-2">
            
            {/* Title - Full, untruncated, permanently green */}
            <h3 className="text-base sm:text-lg font-bold text-[#CEFF00] leading-snug flex-1 pr-2">
              {product.title}
            </h3>

            {/* Quick Actions (Unified Checked/Sync, Platform Outbound Link, Remove) */}
            <div className="flex items-center gap-1.5 shrink-0 pt-0.5 flex-wrap justify-end">
              {/* Unified Sync & Last Checked Button */}
              <button
                onClick={() => onSync(product._id)}
                disabled={isSyncing}
                className="px-2.5 py-1 rounded-full border border-[#163E26] bg-[#0E2A1B] text-[10px] font-mono font-bold flex items-center gap-1.5 shadow-sm hover:bg-[#CEFF00] hover:border-[#CEFF00] hover:text-black transition-all cursor-pointer active:scale-95 disabled:opacity-50 group/sync"
              >
                <span className="text-[#A6A095] group-hover/sync:text-black/80 transition-colors">Checked:</span>
                <span className="text-[#CEFF00] group-hover/sync:text-black transition-colors">{lastCheckedText}</span>
                <svg
                  className={`w-3 h-3 text-[#CEFF00] group-hover/sync:text-black ml-0.5 transition-all ${isSyncing ? "animate-spin" : "group-hover/sync:rotate-180 duration-300"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>

              {/* Platform Outbound Redirect Pill */}
              {product.productUrl && (
                <a
                  href={product.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 ${
                    isAmazon
                      ? "bg-[#0E2A1B] border-[#CEFF00]/40 text-[#CEFF00] hover:bg-[#CEFF00] hover:text-black hover:border-[#CEFF00]"
                      : "bg-[#07172E] border-[#2874F0]/40 text-[#5B9BFF] hover:bg-[#2874F0] hover:text-white hover:border-[#2874F0]"
                  }`}
                >
                  <span>{isAmazon ? "Amazon" : "Flipkart"}</span>
                  <svg className="w-3 h-3 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}

              {/* Remove Button */}
              <button
                onClick={() => onRemove(product)}
                className="p-1.5 rounded-xl text-[#A6A095] hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900/40 transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* TARGET REACHED CELEBRATION BANNER */}
          {isTargetMet && (
            <div className="mb-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#CEFF00] to-[#A3E000] text-black font-mono font-black text-xs sm:text-sm flex items-center justify-between shadow-[0_4px_25px_rgba(206,255,0,0.35)] animate-pulse">
              <span className="flex items-center gap-2 tracking-wider">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>PRICE DROP TRIGGERED! TARGET REACHED</span>
              </span>
              <span className="text-base font-black">₹{currentPrice.toLocaleString()}</span>
            </div>
          )}

          {/* AUTO-SYNCING STATUS BANNER WHEN PRICING IS INITIALIZING */}
          {(!currentPrice || currentPrice === 0) && (
            <div className="my-2.5 p-3 rounded-2xl bg-[#08170D] border border-[#163E26] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs font-mono shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#CEFF00] animate-ping shrink-0" />
                <span className="text-[#EAE5D9] font-medium">Resolving live retailer price & discount history...</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <div className="w-24 sm:w-28 h-2 rounded-full bg-[#0D2415] border border-[#184C2E] overflow-hidden p-[1px]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#184C2E] to-[#CEFF00] animate-pulse w-3/4" />
                </div>
                <span className="text-[10px] text-[#CEFF00] font-bold uppercase tracking-wider shrink-0 bg-[#0E2A1B] px-2 py-0.5 rounded-md border border-[#1F5636]">
                  ~3s Auto-Update
                </span>
              </div>
            </div>
          )}

          {/* TRIPLE PRICE METRICS: Live Price vs Historic Low vs Original MRP with sudden Acid fill on hover */}
          <div className="p-[1.5px] rounded-2xl bg-gradient-to-br from-[#1B5734] via-[#CEFF00]/60 to-[#1B5734] hover:from-[#CEFF00] hover:to-[#CEFF00] my-3 shadow-sm transition-all duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-[15px] bg-[#050B07] hover:bg-[#CEFF00] transition-colors duration-150 group/price cursor-default">
              {/* Live Price */}
              <div className="sm:border-r border-[#163E26]/60 group-hover/price:border-black/20 pr-2 transition-colors duration-150 flex flex-col justify-start">
                <div className="flex items-center gap-1.5 min-h-[18px]">
                  <span className="w-2 h-2 rounded-full bg-[#CEFF00] group-hover/price:bg-black transition-colors duration-150 shrink-0"></span>
                  <span className="text-[11px] font-mono text-[#A6A095] group-hover/price:text-black/80 uppercase font-bold tracking-wider transition-colors duration-150">
                    Live Current Price
                  </span>
                </div>
                <div className="mt-1.5 flex items-baseline">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-black text-[#CEFF00] group-hover/price:text-black font-mono leading-none tracking-tight transition-colors duration-150">
                    {currentPrice > 0 ? (
                      `₹${currentPrice.toLocaleString()}`
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#CEFF00] group-hover/price:text-black">
                        <span className="w-2 h-2 rounded-full bg-[#CEFF00] group-hover/price:bg-black animate-ping" />
                        Syncing (~3s)...
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Historic Low */}
              <div className="sm:border-r border-[#163E26]/60 group-hover/price:border-black/20 px-0 sm:px-2 transition-colors duration-150 flex flex-col justify-start">
                <div className="flex items-center min-h-[18px]">
                  <span className="text-[11px] font-mono text-[#A6A095] group-hover/price:text-black/80 uppercase font-bold tracking-wider transition-colors duration-150">
                    Historic All-Time Low
                  </span>
                </div>
                <div className="mt-1.5 flex items-baseline">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-black text-[#CEFF00] group-hover/price:text-black font-mono leading-none tracking-tight transition-colors duration-150">
                    {historicLow > 0 ? (
                      `₹${historicLow.toLocaleString()}`
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#CEFF00] group-hover/price:text-black">
                        <span className="w-2 h-2 rounded-full bg-[#CEFF00] group-hover/price:bg-black animate-ping" />
                        Syncing...
                      </span>
                    )}
                  </span>
                </div>
                {currentPrice > 0 && historicLow > 0 && currentPrice > historicLow && (
                  <span className="text-[10px] font-mono text-[#8FA693] group-hover/price:text-black/75 font-semibold block mt-1 transition-colors duration-150">
                    +₹{(currentPrice - historicLow).toLocaleString()} above low
                  </span>
                )}
              </div>

              {/* Original MRP */}
              <div className="pl-0 sm:pl-2 transition-colors duration-150 flex flex-col justify-start">
                <div className="flex items-center min-h-[18px]">
                  <span className="text-[11px] font-mono text-[#A6A095] group-hover/price:text-black/80 uppercase font-bold tracking-wider transition-colors duration-150">
                    Original MRP
                  </span>
                </div>
                <div className="mt-1.5 flex items-baseline flex-wrap gap-x-2 gap-y-1">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-black text-[#A6A095] group-hover/price:text-black/70 font-mono leading-none tracking-tight transition-colors duration-150">
                    {mrp > 0 ? (
                      <span className="line-through">₹{mrp.toLocaleString()}</span>
                    ) : (
                      <span className="text-xs font-mono text-zinc-400 group-hover/price:text-black/60 font-medium">
                        Syncing...
                      </span>
                    )}
                  </span>
                  {mrp > currentPrice && currentPrice > 0 && (
                    <span className="text-[11px] font-mono text-[#CEFF00] group-hover/price:text-black font-bold transition-colors duration-150 whitespace-nowrap">
                      Save ₹{(mrp - currentPrice).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* WISH BELL THRESHOLD SECTION with sudden Acid fill on hover */}
          <div className="p-[1.5px] rounded-2xl bg-gradient-to-br from-[#1B5734] via-[#CEFF00]/60 to-[#1B5734] hover:from-[#CEFF00] hover:to-[#CEFF00] shadow-sm transition-all duration-150 flex-1 flex flex-col mt-1">
            <div className="p-4.5 sm:p-[22px] rounded-[15px] bg-[#060D09] hover:bg-[#CEFF00] transition-colors duration-150 group/bell flex-1 flex flex-col justify-between cursor-default">
            
              {/* Threshold Section Header with Live Target Calculated */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-sm sm:text-base font-mono font-bold text-[#CEFF00] group-hover/bell:text-black transition-colors duration-150">
                    <span>Make a Little Wish</span>
                  </div>

                  {/* Target Price Highlight */}
                  <div className="flex items-center gap-2 text-right font-mono">
                    <span className="text-lg sm:text-xl font-black text-[#CEFF00] group-hover/bell:text-black transition-colors duration-150">
                      ₹{targetPrice > 0 ? targetPrice.toLocaleString() : 0}
                    </span>
                    {discountPercent > 0 && (
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-[#CEFF00]/15 group-hover/bell:bg-black/10 text-[#CEFF00] group-hover/bell:text-black border border-[#CEFF00]/30 group-hover/bell:border-black/30 shadow-sm transition-colors duration-150">
                        -{discountPercent}% OFF
                      </span>
                    )}
                  </div>
                </div>

                {/* Subtext starting below the bell icon */}
                <p className="text-[11.5px] font-sans text-[#A6A095] group-hover/bell:text-black/85 leading-relaxed">
                  Choose your target discount. Leave the watching to me — I'll happily notify you the exact second it's ready to make you smile!
                </p>
              </div>

              {/* Quick Preset Shortcut Chips - Unified cohesive grouping */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <span className="text-xs font-mono text-[#A6A095] group-hover/bell:text-black/80 font-medium transition-colors duration-150 shrink-0">
                  Instant Discount Target:
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {presets.map((preset) => {
                    const isActive = selectedPreset === preset.percent || targetPrice === preset.value;
                    return (
                      <button
                        key={preset.label}
                        onClick={() => handlePresetClick(preset)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 border ${
                          isActive
                            ? "bg-[#CEFF00] group-hover/bell:bg-black text-black group-hover/bell:text-[#CEFF00] border-[#CEFF00] group-hover/bell:border-black"
                            : "bg-[#0E2A1B] group-hover/bell:bg-black/10 text-[#EAE5D9] group-hover/bell:text-black border-[#163E26] group-hover/bell:border-black/20 hover:border-[#227A4E] hover:text-[#CEFF00]"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range Slider */}
              <div className="space-y-1.5 pt-1.5 pb-1 px-0.5">
                <input
                  type="range"
                  min={minSlider}
                  max={maxSlider}
                  step={sliderStep}
                  value={targetPrice || minSlider}
                  onChange={handleSliderChange}
                  className="slider-acid group-hover/bell:accent-black"
                />
              </div>

              {/* Fine-Tune Manual Input + Save Tactile Button */}
              <div className="flex items-center gap-2.5 pt-1.5 transition-colors duration-150">
                <div className="relative flex-1">
                  <div className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-[#050B07] group-hover/bell:bg-black/10 border border-[#163E26] group-hover/bell:border-black/25 flex items-center transition-colors">
                    {isWishSaved ? (
                      <span className="font-mono text-xs sm:text-sm font-bold text-[#CEFF00] group-hover/bell:text-black transition-colors">
                        Ready to ring the bell at ₹{targetPrice > 0 ? targetPrice.toLocaleString() : 0}.
                      </span>
                    ) : (
                      <span className="font-mono text-xs sm:text-sm font-bold text-[#A6A095] group-hover/bell:text-black/80 transition-colors">
                        Your wish is waiting — pick your happy deal above!
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={savingAlert || !targetPrice || isWishSaved}
                  className={`px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-mono text-xs sm:text-sm font-black transition-all cursor-pointer active:scale-95 border flex items-center justify-center whitespace-nowrap shadow-md shrink-0 ${
                    isWishSaved
                      ? "bg-[#CEFF00] group-hover/bell:bg-black text-black group-hover/bell:text-[#CEFF00] border-[#CEFF00] group-hover/bell:border-black cursor-default shadow-[0_0_15px_rgba(206,255,0,0.35)]"
                      : "bg-[#CEFF00] group-hover/bell:bg-black text-black group-hover/bell:text-[#CEFF00] border-[#CEFF00] group-hover/bell:border-black shadow-[0_0_15px_rgba(206,255,0,0.35)] hover:bg-[#D9FF33] group-hover/bell:hover:bg-black/90"
                  }`}
                >
                  {savingAlert ? (
                    <span className="inline-block w-4 h-4 border-2 border-black group-hover/bell:border-[#CEFF00] border-t-transparent rounded-full animate-spin"></span>
                  ) : isWishSaved ? (
                    <span>Wish Set!</span>
                  ) : (
                    <span>Save Wish Bell</span>
                  )}
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* BOTTOM ROW: CARD ACTION HUB (3 CORE ANALYSIS BUTTONS) */}
        <div className="pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {/* 1. Multi-Store Price Comparison */}
            <button
              onClick={() => {
                sessionStorage.setItem("last_viewed_product_id", product._id);
                sessionStorage.setItem("last_dashboard_scroll_y", String(window.scrollY));
                if (onNavigateCompare) onNavigateCompare(product._id);
              }}
              className="p-[1px] rounded-xl bg-gradient-to-br from-[#184C2E] via-[#CEFF00]/20 to-[#184C2E] transition-all duration-150 hover:via-[#CEFF00]/40 cursor-pointer active:scale-95 block w-full group/btn1"
            >
              <div className="w-full py-2.5 sm:py-3 px-3.5 rounded-[11px] bg-[#0E2A1B] group-hover/btn1:bg-[#CEFF00] text-[#EAE5D9] group-hover/btn1:text-black font-mono text-xs sm:text-sm font-bold transition-all duration-150 flex items-center justify-center">
                <span className="truncate">Compare Stores</span>
              </div>
            </button>

            {/* 2. AI Review Insights */}
            <button
              onClick={() => {
                sessionStorage.setItem("last_viewed_product_id", product._id);
                sessionStorage.setItem("last_dashboard_scroll_y", String(window.scrollY));
                if (onNavigateInsights) onNavigateInsights(product._id);
              }}
              className="p-[1px] rounded-xl bg-gradient-to-br from-[#184C2E] via-[#CEFF00]/20 to-[#184C2E] transition-all duration-150 hover:via-[#CEFF00]/40 cursor-pointer active:scale-95 block w-full group/btn3"
            >
              <div className="w-full py-2.5 sm:py-3 px-3.5 rounded-[11px] bg-[#0E2A1B] group-hover/btn3:bg-[#CEFF00] text-[#EAE5D9] group-hover/btn3:text-black font-mono text-xs sm:text-sm font-bold transition-all duration-150 flex items-center justify-center">
                <span className="truncate">Customer Reviews</span>
              </div>
            </button>

            {/* 3. Bank Offers & Coupon Stacker */}
            <button
              onClick={() => {
                sessionStorage.setItem("last_viewed_product_id", product._id);
                sessionStorage.setItem("last_dashboard_scroll_y", String(window.scrollY));
                if (onNavigateOffers) onNavigateOffers(product._id);
              }}
              className="p-[1px] rounded-xl bg-gradient-to-br from-[#184C2E] via-[#CEFF00]/20 to-[#184C2E] transition-all duration-150 hover:via-[#CEFF00]/40 cursor-pointer active:scale-95 block w-full group/btn4"
            >
              <div className="w-full py-2.5 sm:py-3 px-3.5 rounded-[11px] bg-[#0E2A1B] group-hover/btn4:bg-[#CEFF00] text-[#EAE5D9] group-hover/btn4:text-black font-mono text-xs sm:text-sm font-bold transition-all duration-150 flex items-center justify-center">
                <span className="truncate">Bank Offers</span>
              </div>
            </button>
          </div>
        </div>

      </div>

      </div>
    </div>
  );
}
