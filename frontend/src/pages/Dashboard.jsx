import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";
import ProductCard from "../components/ProductCard";

// Persistent module-level and session cache so product cards are immediately rendered on return navigation
let cachedProducts = [];
try {
  const stored = sessionStorage.getItem("zemo_cached_products");
  if (stored) cachedProducts = JSON.parse(stored);
} catch (e) {}

export default function Dashboard() {
  const [url, setUrl] = useState("");
  const [products, setProducts] = useState(cachedProducts);
  const [loading, setLoading] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [toast, setToast] = useState("");
  const [waitingDots, setWaitingDots] = useState(".");

  const [alertPrices, setAlertPrices] = useState({});
  const [alertTolerances, setAlertTolerances] = useState({});

  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [trackProgress, setTrackProgress] = useState(0);
  const [trackStage, setTrackStage] = useState("");
  const [trackEta, setTrackEta] = useState("");
  const progressTimerRef = useRef(null);
  const trackCompletedRef = useRef(false);
  const [inputNotice, setInputNotice] = useState("");
  const inputNoticeTimerRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const [scrollReady, setScrollReady] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const targetId =
        params.get("focusProduct") ||
        sessionStorage.getItem("last_viewed_product_id");
      return !targetId;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    // Ensure console is fresh and ready on entry
    setLoading(false);
    setTrackProgress(0);
    setTrackStage("");
    setTrackEta("");
    trackCompletedRef.current = false;

    loadProducts();
    const dotTimer = setInterval(() => {
      setWaitingDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 850);
    return () => {
      clearInterval(dotTimer);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  // Keyboard shortcut: close delete modal on Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && productToDelete && !isDeleting) {
        setProductToDelete(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [productToDelete, isDeleting]);

  // Real-time tracking progress inside the input console
  useEffect(() => {
    if (!loading) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setTrackProgress(0);
      setTrackStage("");
      setTrackEta("");
      trackCompletedRef.current = false;
      return;
    }

    if (trackCompletedRef.current) return;

    const stages = [
      "Scouting store details...",
      "Checking live price...",
      "Reading verified reviews...",
      "Uncovering bank offers...",
      "Tucking into watchlist..."
    ];

    setTrackProgress(8);
    setTrackStage(stages[0]);
    setTrackEta("ETA ~15s");

    const startTime = Date.now();
    // Calibrated to ~16s realistic expectation for scraper & metadata
    const duration = 16000;

    progressTimerRef.current = setInterval(() => {
      if (trackCompletedRef.current) {
        clearInterval(progressTimerRef.current);
        return;
      }

      const elapsed = Date.now() - startTime;
      
      let pct;
      if (elapsed < duration) {
        // Smooth progression from 8% up to 88%
        pct = Math.min(88, Math.round(8 + Math.pow(elapsed / duration, 0.8) * 80));
        const remSec = Math.max(1, Math.ceil((duration - elapsed) / 1000));
        setTrackEta(`ETA ~${remSec}s`);
      } else {
        const overtime = (elapsed - duration) / 1000;
        // Gently ease between 88% and 94% without freezing
        pct = Math.min(94, Math.round(88 + (1 - Math.exp(-overtime / 12)) * 6));
        setTrackEta("Almost ready...");
      }

      // CRITICAL: Progress strictly monotonically increases - never jumps backwards!
      setTrackProgress((prev) => Math.max(prev, pct));

      const stageIdx = Math.min(
        stages.length - 1,
        Math.floor((pct / 94) * stages.length)
      );
      setTrackStage(stages[stageIdx]);
    }, 120);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [loading]);

  const scrollRestoredRef = useRef(false);
  const pollCountRef = useRef(0);

  // Auto-poll if any product has pending price/mrp so user never has to click refresh (capped to 5 retries)
  useEffect(() => {
    const hasPending = products.some(p => !p.currentPrice || p.currentPrice === 0);
    if (!hasPending || pollCountRef.current >= 5) return;

    const pollTimer = setInterval(() => {
      pollCountRef.current += 1;
      loadProducts();
    }, 2500);

    return () => clearInterval(pollTimer);
  }, [products]);

  // Return precisely to previous product card position once when returning to dashboard
  useLayoutEffect(() => {
    if (scrollRestoredRef.current || loading) {
      setScrollReady(true);
      return;
    }

    const params = new URLSearchParams(location.search);
    const targetId =
      location.state?.scrollToProductId ||
      params.get("focusProduct") ||
      sessionStorage.getItem("last_viewed_product_id");

    if (!targetId) {
      window.scrollTo({ top: 0, behavior: "instant" });
      if (window.__lenis) {
        window.__lenis.scrollTo(0, { immediate: true });
      }
      setScrollReady(true);
      scrollRestoredRef.current = true;
      return;
    }

    // Reset filter to 'all' so the targeted card is guaranteed to be rendered
    setSelectedFilter("all");

    const savedY = Number(sessionStorage.getItem("last_dashboard_scroll_y"));
    if (savedY && !isNaN(savedY)) {
      if (window.__lenis) {
        window.__lenis.resize();
        window.__lenis.scrollTo(savedY, { immediate: true });
      }
      window.scrollTo({ top: savedY, behavior: "instant" });
    }

    const finalizeScroll = () => {
      scrollRestoredRef.current = true;
      setScrollReady(true);
      sessionStorage.removeItem("last_viewed_product_id");
      sessionStorage.removeItem("last_dashboard_scroll_y");
      if (location.state?.scrollToProductId || params.get("focusProduct")) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    const scrollToTarget = () => {
      const el = document.getElementById(`product-${targetId}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetY = Math.max(0, Math.round(rect.top + scrollTop - 25));

        if (window.__lenis) {
          window.__lenis.resize();
          window.__lenis.scrollTo(targetY, { immediate: true });
        }
        window.scrollTo({ top: targetY, behavior: "instant" });
        el.classList.add("ring-2", "ring-[#CEFF00]/60", "transition-all", "duration-500");
        setTimeout(() => {
          el.classList.remove("ring-2", "ring-[#CEFF00]/60");
        }, 1200);
        return true;
      }
      return false;
    };

    // 1. Synchronous attempt before first paint
    if (scrollToTarget()) {
      finalizeScroll();
      return;
    }

    // 2. High frequency requestAnimationFrame retry for fast settling
    let attempts = 0;
    const maxAttempts = 40;
    let rafId = null;

    const check = () => {
      attempts++;
      if (scrollToTarget() || attempts >= maxAttempts) {
        finalizeScroll();
      } else {
        rafId = requestAnimationFrame(check);
      }
    };

    rafId = requestAnimationFrame(check);

    const safetyTimer = setTimeout(() => {
      finalizeScroll();
    }, 350);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(safetyTimer);
    };
  }, [location.state, location.search, products, loading]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4500);
  };

  async function loadProducts() {
    try {
      const res = await API.get("/product");
      cachedProducts = res.data;
      try {
        sessionStorage.setItem("zemo_cached_products", JSON.stringify(res.data));
      } catch (e) {}
      setProducts([...res.data]);
    } catch (error) {
      console.error("PRODUCT LOAD ERROR:", error);
    }
  }

  async function handleTrack(customUrl = null) {
    const targetUrl = (customUrl || url).trim();
    if (!targetUrl) {
      setInputNotice("Drop an Amazon link here to get started");
      if (inputNoticeTimerRef.current) clearTimeout(inputNoticeTimerRef.current);
      inputNoticeTimerRef.current = setTimeout(() => setInputNotice(""), 3500);
      return;
    }

    if (!targetUrl.includes("amazon")) {
      setUrl("");
      setInputNotice("Drop an Amazon link here — I'll compare the other stores for you");
      if (inputNoticeTimerRef.current) clearTimeout(inputNoticeTimerRef.current);
      inputNoticeTimerRef.current = setTimeout(() => {
        setInputNotice("");
      }, 4000);
      return;
    }

    setInputNotice("");
    const detectedSource = "amazon";

    setLoading(true);
    trackCompletedRef.current = false;
    try {
      const res = await API.post("/product/add", {
        productUrl: targetUrl,
        source: detectedSource
      });

      // 1. Immediately cancel the timer interval so it can never overwrite 100%!
      trackCompletedRef.current = true;
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);

      const isAlreadyTracked = res.data?.alreadyTracked;

      // 2. Set 100% completion state
      if (isAlreadyTracked) {
        setTrackEta("Found!");
        setTrackStage("Already in your surveillance matrix!");
        showToast("Already tracking this product!");
      } else {
        setTrackEta("Ready!");
        setTrackStage("Product secured! Keeping watch.");
      }
      setTrackProgress(100);

      // 3. Reload products
      await loadProducts();

      // 4. Hold briefly so the user sees completion, then reset console
      await new Promise((r) => setTimeout(r, 1200));

      setUrl("");
    } catch (error) {
      console.error(error);
      showToast("Scraper failed to resolve product metadata");
    } finally {
      trackCompletedRef.current = false;
      setLoading(false);
      setTrackProgress(0);
      setTrackStage("");
      setTrackEta("");
    }
  }

  async function syncProductPrice(productId) {
    try {
      setSyncingId(productId);
      const res = await API.post(`/product/sync/${productId}`);
      showToast(res.data.message || "Price synchronized live!");
      await loadProducts();
    } catch (err) {
      console.error(err);
      showToast("Realtime sync encountered a timeout");
    } finally {
      setSyncingId(null);
    }
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        showToast("URL pasted from clipboard");
      }
    } catch (err) {
      showToast("Clipboard read permission required");
    }
  }

  async function handleSaveAlert(productId, targetPrice, tolerance = 0) {
    if (!targetPrice) {
      showToast("Enter a target price threshold");
      return;
    }

    try {
      let savedEmail = localStorage.getItem("zemo_user_email");
      if (!savedEmail) {
        try {
          const userObj = JSON.parse(localStorage.getItem("user") || "null");
          savedEmail = userObj?.email;
        } catch (_) {}
      }
      await API.post("/alert/create", {
        productId,
        targetPrice: Number(targetPrice),
        tolerance: Number(tolerance),
        email: savedEmail || undefined
      });

      window.dispatchEvent(new Event("notificationUpdated"));
      await loadProducts();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async function createAlert(productId) {
    const price = alertPrices[productId];
    const tolerance =
      alertTolerances[productId] ??
      products.find((p) => p._id === productId)?.activeAlert?.tolerance ??
      0;

    if (!price) {
      return;
    }

    try {
      let savedEmail = localStorage.getItem("zemo_user_email");
      if (!savedEmail) {
        try {
          const userObj = JSON.parse(localStorage.getItem("user") || "null");
          savedEmail = userObj?.email;
        } catch (_) {}
      }
      await API.post("/alert/create", {
        productId,
        targetPrice: Number(price),
        tolerance: Number(tolerance),
        email: savedEmail || undefined
      });

      window.dispatchEvent(new Event("notificationUpdated"));
      await loadProducts();
    } catch (error) {
      console.error(error);
    }
  }

  function requestDeleteProduct(productOrId) {
    if (!productOrId) return;
    if (typeof productOrId === "object") {
      setProductToDelete(productOrId);
    } else {
      const found = products.find((p) => p._id === productOrId);
      setProductToDelete(found || { _id: productOrId });
    }
  }

  async function handleConfirmDelete() {
    if (!productToDelete) return;
    const targetId = productToDelete._id;
    setIsDeleting(true);

    try {
      await API.delete(`/product/remove/${targetId}`);
      showToast("Product purged from surveillance");
      setProductToDelete(null);
      await loadProducts();
    } catch (error) {
      console.error(error);
      showToast("Failed to remove product");
    } finally {
      setIsDeleting(false);
    }
  }

  // Filter and search logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch = true;
    if (selectedFilter === "amazon") return matchesSearch && p.source === "amazon";
    if (selectedFilter === "flipkart") return matchesSearch && p.source === "flipkart";
    if (selectedFilter === "alerts") return matchesSearch && Boolean(p.activeAlert);
    return matchesSearch;
  });

  const amazonCount = products.filter((p) => p.source === "amazon").length;
  const flipkartCount = products.filter((p) => p.source === "flipkart").length;
  const alertsCount = products.filter((p) => Boolean(p.activeAlert)).length;
  const targetHitsCount = products.filter(
    (p) =>
      Boolean(p.activeAlert?.targetPrice) &&
      p.currentPrice > 0 &&
      p.currentPrice <= (p.activeAlert.targetPrice + (p.activeAlert.tolerance || 0))
  ).length;
  const allTimeLowsCount = products.filter(
    (p) => p.currentPrice > 0 && p.historicLow > 0 && p.currentPrice <= p.historicLow
  ).length;

  return (
    <div 
      style={{ 
        opacity: scrollReady ? 1 : 0, 
        transition: "opacity 160ms cubic-bezier(0.16, 1, 0.3, 1)" 
      }}
      className="space-y-12 pb-10 sm:pb-14"
    >

      {/* Floating Toast Notification (Lower-right corner, non-intrusive) */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#07130A]/95 border border-[#CEFF00] text-[#EAE5D9] px-5 py-3 rounded-2xl z-[9999] flex items-center gap-3 font-mono text-xs sm:text-sm shadow-[0_0_25px_rgba(206,255,0,0.3)] backdrop-blur-md animate-fadeIn">
          <span className="w-2.5 h-2.5 rounded-full bg-[#CEFF00] shrink-0"></span>
          <span className="font-medium text-[#EAE5D9]">{toast}</span>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {productToDelete && createPortal(
        <div 
          className="fixed inset-0 w-screen h-screen bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fadeIn"
          onClick={() => {
            if (!isDeleting) setProductToDelete(null);
          }}
        >
          <div 
            className="relative p-[1.5px] rounded-[28px] bg-gradient-to-br from-red-500/80 via-[#350A0E] to-red-500/50 max-w-md w-full shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#07110A] rounded-[26.5px] p-6 sm:p-7 space-y-5 relative text-left">
              {/* Top accent glow line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>

              {/* Header */}
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg sm:text-xl font-bold text-[#EAE5D9] font-mono tracking-tight">
                  Remove Product?
                </h3>

                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setProductToDelete(null)}
                  className="text-[#A6A095] hover:text-[#EAE5D9] p-1.5 rounded-xl hover:bg-white/5 transition-colors text-sm disabled:opacity-50 cursor-pointer"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              {/* Feel-good warm description */}
              <p className="text-xs sm:text-sm text-[#A6A095] leading-relaxed">
                Are you sure you want to let this one go? You can always track it again anytime you're looking for sweet deals and good feels!
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 bg-[#0E2A1B] text-[#CEFF00] hover:bg-[#CEFF00] hover:text-black font-mono text-xs font-bold py-3.5 px-4 rounded-xl transition-all duration-200 cursor-pointer text-center disabled:opacity-50"
                >
                  Keep Tracking
                </button>

                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="flex-1 bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white font-mono font-bold text-xs py-3.5 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Purging...</span>
                    </>
                  ) : (
                    <span>Delete Product</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Grand Hero Scraper Console */}
      <section className="min-h-[78vh] flex flex-col justify-center items-center text-center relative py-10 sm:py-20 px-2 sm:px-4">
        
        <div className="relative z-10 max-w-4xl w-full flex flex-col items-center">
          
          {/* Status Badge */}
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#0E2A1B] border border-[#163E26] hover:border-[#CEFF00]/50 mb-5 transition-colors">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#CEFF00] font-bold">
              SWEET DEALS, GOOD FEELS
            </span>
          </div>
          
          {/* Main Hero Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#EAE5D9] tracking-tight leading-[1.3] sm:leading-[1.32]">
            <span className="block pb-1">Buy what makes you happy.</span>
            <span className="block mt-1 sm:mt-1.5 pb-2 bg-gradient-to-r from-[#227A4E] via-[#CEFF00] to-[#227A4E] bg-clip-text text-transparent">
              At prices that make you smile.
            </span>
          </h1>
          
          {/* Subtitle Description */}
          <p className="text-sm sm:text-base text-[#A6A095] mt-4 max-w-2xl leading-relaxed font-normal">
            Go ahead, drop that Amazon link you’ve been loving. I’ll keep a sweet eye on the price drops and read all the reviews so every purchase feels like a little celebration.
          </p>

          {/* Upgraded Architectural Precision Input Console */}
          <div className="mt-8 w-full max-w-3xl">
            <div className={`relative group p-[2px] rounded-2xl sm:rounded-3xl transition-all duration-300 ${
              inputNotice 
                ? "bg-gradient-to-r from-[#227A4E] via-[#CEFF00] to-[#227A4E] shadow-[0_0_25px_rgba(206,255,0,0.3)]" 
                : "bg-gradient-to-r from-[#163E26] via-[#227A4E] to-[#163E26] hover:from-[#227A4E] hover:via-[#CEFF00] hover:to-[#227A4E] focus-within:from-[#227A4E] focus-within:via-[#CEFF00] focus-within:to-[#227A4E]"
            }`}>
              <div className="bg-[#050D08] rounded-[14px] sm:rounded-[22px] p-1.5 sm:p-2 flex flex-col sm:flex-row items-center gap-2 w-full ring-1 ring-inset ring-[#163E26]/50 relative overflow-hidden">
                
                {/* Real-time Integrated Progress Bar Fill (Inside Input Bar) */}
                {loading && (
                  <>
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#184C2E]/35 via-[#227A4E]/25 to-[#CEFF00]/15 transition-all duration-300 ease-out pointer-events-none rounded-[14px] sm:rounded-[22px]"
                      style={{ width: `${trackProgress}%` }}
                    />
                    <div 
                      className="absolute left-0 bottom-0 h-[2.5px] bg-gradient-to-r from-[#184C2E] via-[#A3E000] to-[#CEFF00] transition-all duration-300 ease-out shadow-[0_0_10px_#CEFF00] pointer-events-none"
                      style={{ width: `${trackProgress}%` }}
                    />
                  </>
                )}

                {/* Left Link Icon & Text Input / Live Progress */}
                <div className="flex-1 w-full relative flex items-center pl-3.5 sm:pl-5 z-10 min-w-0">
                  <div className="flex items-center text-[#CEFF00] mr-3.5 sm:mr-4 shrink-0">
                    <svg className="w-5 h-5 opacity-90 group-focus-within:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>

                  {loading ? (
                    <div className="w-full py-3.5 sm:py-4 flex items-center justify-between pr-3 select-none min-w-0">
                      <div className="flex items-center min-w-0 pr-2">
                        <span className="text-xs sm:text-sm font-mono text-[#CEFF00] font-semibold truncate">
                          {trackStage}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#CEFF00] shrink-0 bg-[#0E2A1B] px-2.5 py-1 rounded-lg border border-[#163E26] flex items-center gap-1.5">
                        {trackProgress >= 100 ? (
                          "Ready!"
                        ) : (
                          <>
                            <span className="text-zinc-400 font-normal">{trackEta}</span>
                            <span>{trackProgress}%</span>
                          </>
                        )}
                      </span>
                    </div>
                  ) : inputNotice ? (
                    <div 
                      onClick={() => setInputNotice("")}
                      className="w-full py-3.5 sm:py-4 flex items-center justify-between pr-2 min-w-0 animate-fadeIn cursor-pointer"
                      title="Click to enter new link"
                    >
                      <span className="text-xs sm:text-[13px] font-mono text-[#CEFF00] font-semibold leading-relaxed truncate sm:whitespace-normal pr-2">
                        {inputNotice}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInputNotice("");
                        }}
                        type="button"
                        className="p-1 text-[#A6A095] hover:text-[#EAE5D9] rounded-lg hover:bg-white/10 transition-colors shrink-0"
                        title="Dismiss"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder={`What’s sitting on your Amazon wishlist? Drop the link here${waitingDots}`}
                        value={url}
                        onChange={(e) => {
                          if (inputNotice) setInputNotice("");
                          setUrl(e.target.value);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleTrack()}
                        className="w-full py-3.5 sm:py-4 bg-transparent text-[#EAE5D9] placeholder-[#A6A095]/50 outline-none text-sm sm:text-base font-medium pr-10 transition-all"
                      />

                      {/* Inside Input Action (Clear) */}
                      {url && (
                        <div className="absolute right-2 flex items-center">
                          <button
                            onClick={() => setUrl("")}
                            type="button"
                            className="p-1 text-[#A6A095] hover:text-[#EAE5D9] rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Docked Inside Track Target Button - Tactile 3D Mechanical Button */}
                <button
                  onClick={() => handleTrack()}
                  disabled={loading}
                  className="btn-3d-track group/btn w-full sm:w-auto relative z-10 shrink-0"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      {trackProgress === 100 ? (
                        <>
                          <svg className="w-4 h-4 text-black stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Secured!</span>
                        </>
                      ) : (
                        <>
                          <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                          <span>Securing...</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <>
                      <span>Track Target</span>
                      <svg 
                        className="w-4 h-4 transition-transform duration-200 ease-out group-hover/btn:translate-x-1.5" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Sample Links Chips */}
          <div className="mt-5 flex items-center justify-center gap-2 sm:gap-2.5 flex-wrap">
            <span className="text-[11px] sm:text-xs font-mono tracking-wide text-[#A6A095] font-medium">
              Just browsing? Pick a treat to watch:
            </span>
            
            <button
              onClick={() => handleTrack("https://www.amazon.in/dp/B0F7XB9562")}
              className="group px-3.5 py-1.5 rounded-xl bg-[#0E2A1B] border border-[#163E26] hover:border-[#CEFF00] text-[#EAE5D9] hover:text-black hover:bg-[#CEFF00] transition-colors font-mono text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Sony Bravia 2M2 65" 4K</span>
            </button>

            <button
              onClick={() => handleTrack("https://www.amazon.in/dp/B0B6CM781M")}
              className="group px-3.5 py-1.5 rounded-xl bg-[#0E2A1B] border border-[#163E26] hover:border-[#CEFF00] text-[#EAE5D9] hover:text-black hover:bg-[#CEFF00] transition-colors font-mono text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Mokobara Transit Backpack</span>
            </button>

            <button
              onClick={() => handleTrack("https://www.amazon.in/dp/B0F29P9CKJ")}
              className="group px-3.5 py-1.5 rounded-xl bg-[#0E2A1B] border border-[#163E26] hover:border-[#CEFF00] text-[#EAE5D9] hover:text-black hover:bg-[#CEFF00] transition-colors font-mono text-xs font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Galaxy Tab S10 FE</span>
            </button>
          </div>

          {/* Smooth Scroll Down Indicator */}
          <div 
            onClick={() => {
              const el = document.getElementById("surveillance-matrix");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="mt-6 sm:mt-8 flex flex-col items-center gap-1 text-[#A6A095] hover:text-[#CEFF00] transition-colors cursor-pointer select-none group"
          >
            <span className="text-[11px] font-mono tracking-widest uppercase">
              Scroll to Surveillance Matrix
            </span>
            <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>

        </div>

      </section>

      {/* Target Matrix & Telemetry Anchor */}
      <div id="surveillance-matrix" className="pt-2 sm:pt-4">

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4 sm:mb-5">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#0E2A1B] border border-[#163E26] text-[#CEFF00] font-mono text-[10px] uppercase font-bold tracking-widest mb-1.5 shadow-sm">
              <span>WATCHING LIKE A HAWK</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#EAE5D9] tracking-tight">
              Here’s what I’m watching for you right now.
            </h2>
            <p className="text-xs sm:text-sm text-[#A6A095] mt-1 font-normal">
              Everything we're tracking together, lined up and waiting for that sweet green light. Enjoy this handpicked demo treat while exploring the experience.
            </p>
          </div>
        </div>

      {/* Tracked Products Grid */}
      <div>
        {filteredProducts.length === 0 ? (
          <div className="bg-[#0A130E] border border-[#163E26] rounded-3xl p-12 text-center max-w-lg mx-auto my-8">
            <div className="w-14 h-14 rounded-2xl bg-[#0E2A1B] border border-[#227A4E] flex items-center justify-center mx-auto mb-4 text-[#CEFF00]">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-[#EAE5D9] mb-1 font-mono">No Products in Surveillance</h3>
            <p className="text-xs text-[#A6A095] max-w-sm mx-auto leading-relaxed">
              Drop an Amazon link into the console above to begin automated price tracking and AI synthesis.
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onSync={syncProductPrice}
              isSyncing={syncingId === product._id}
              onSaveAlert={handleSaveAlert}
              onRemove={requestDeleteProduct}
              onNavigateInsights={(id) => {
                sessionStorage.setItem("last_viewed_product_id", id);
                sessionStorage.setItem("last_dashboard_scroll_y", String(window.scrollY));
                navigate(`/product/${id}/reviews`);
              }}
              onNavigateCompare={(id) => {
                sessionStorage.setItem("last_viewed_product_id", id);
                sessionStorage.setItem("last_dashboard_scroll_y", String(window.scrollY));
                navigate(`/product/${id}/compare`);
              }}
              onNavigateOffers={(id) => {
                sessionStorage.setItem("last_viewed_product_id", id);
                sessionStorage.setItem("last_dashboard_scroll_y", String(window.scrollY));
                navigate(`/product/${id}/offers`);
              }}
            />
          ))}
        </div>
      )}

        </div>

      </div>

    </div>
  );
}