import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RainyGlass from "../components/RainyGlass";
import EmailEntryModal from "../components/EmailEntryModal";

export default function LandingPage() {
  const navigate = useNavigate();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("focusProduct")) {
      navigate(`/dashboard?${params.toString()}`, { replace: true });
    }
  }, [navigate]);

  const handleEnterClick = () => {
    setIsEmailModalOpen(true);
  };

  const handleEmailSuccess = () => {
    sessionStorage.removeItem("last_viewed_product_id");
    sessionStorage.removeItem("last_dashboard_scroll_y");
    setIsEmailModalOpen(false);
    navigate("/dashboard");
  };

  const handleScrollToPillars = () => {
    const el = document.getElementById("zemo-pillars");
    if (el) {
      if (window.__lenis) {
        window.__lenis.scrollTo(el, { offset: -40 });
      } else {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className="w-full min-h-screen text-[#EAE5D9] selection:bg-[#CEFF00] selection:text-[#0E2A1B] overflow-x-hidden font-sans relative">
      {/* HERO SECTION WITH REALISTIC RAINY GLASS BACKGROUND */}
      <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-24 sm:pt-28 pb-20 overflow-hidden">
        {/* Procedural Realistic Glass & Water Droplets (Hero Section Only) */}
        <RainyGlass backdropImage="/rain_forest_bokeh.png" />

        <div className="relative z-10 flex flex-col items-center justify-center max-w-4xl mx-auto py-8 sm:py-12">
          
          {/* Level 1: Brand Anchor strictly with Acid Chartreuse & Midnight Pine palette */}
          <h1 className="relative translate-y-3 sm:translate-y-5 font-prata font-black text-7xl sm:text-8xl md:text-9xl tracking-[0.06em] bg-gradient-to-r from-[#CEFF00] via-[#A8F000] to-[#E5FF66] bg-clip-text text-transparent [-webkit-text-stroke:1.5px_#CEFF00] drop-shadow-[0_15px_30px_#061009] select-none">
            ZEMO
          </h1>

          {/* Level 2: Core Value Hook */}
          <p className="mt-5 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#F5F2EA] drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] max-w-3xl leading-snug">
            Watch prices drop like{" "}
            <span className="bg-gradient-to-r from-[#CEFF00] via-[#E4FF54] to-[#CEFF00] bg-clip-text text-transparent underline decoration-[#CEFF00]/40 underline-offset-8">
              gentle rain.
            </span>
          </p>

          {/* Level 3: Supporting Value Statement (Peaceful Rainy Tone) */}
          <p className="mt-5 text-sm sm:text-base md:text-lg text-[#F0EBE1] max-w-3xl mx-auto leading-relaxed font-normal text-balance [text-shadow:_0_1px_3px_#000000,_0_2px_8px_#000000,_0_4px_20px_#000000,_0_0_30px_#061009] drop-shadow-[0_4px_20px_rgba(0,0,0,1)]">
            A quiet shelter for your dreams.{" "}
            <span className="text-[#FFFFFF] font-semibold">Zemo keeps a watchful eye while you rest</span>—comparing prices across stores, tracking discounts in real-time, and bringing the best <span className="whitespace-nowrap">savings to you.</span>
          </p>

          {/* Level 4: Multi-Store Coverage Network */}
          <div className="mt-8 flex flex-col items-center gap-2.5 w-full max-w-4xl mx-auto px-2">
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.2em] uppercase text-[#E2EBE5] [text-shadow:0_1px_4px_#000000,0_2px_10px_#000000] select-none">
              SURVEILLANCE COVERAGE
            </span>
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap w-full">
              {["Amazon", "Flipkart", "Myntra", "Ajio", "Brand D2C", "Croma", "Nykaa"].map((store) => (
                <span
                  key={store}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#061009]/85 border border-[#163E26]/80 text-[#D2CEC4] hover:text-[#CEFF00] hover:border-[#CEFF00]/60 font-mono text-xs font-semibold flex items-center shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 cursor-default shrink-0"
                >
                  <span>{store}</span>
                </span>
              ))}
              <span className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#0E2A1B]/90 border border-[#CEFF00]/50 text-[#CEFF00] font-mono text-xs font-bold flex items-center shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 cursor-default shrink-0">
                + Any Indian Retailer
              </span>
            </div>
          </div>

          {/* Level 5: High-Impact Call To Actions (Symmetrically matched) */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={handleEnterClick}
              className="w-full sm:w-[210px] h-[58px] px-8 py-4 rounded-2xl bg-[#CEFF00] hover:bg-[#b8e600] text-black font-mono text-sm sm:text-base font-black transition-all cursor-pointer shadow-[0_0_35px_rgba(206,255,0,0.4)] hover:shadow-[0_0_55px_rgba(206,255,0,0.65)] active:scale-95 flex items-center justify-center gap-2 group outline-none focus:outline-none focus:ring-0 select-none"
            >
              <span>Step Inside</span>
              <span className="transition-transform group-hover:translate-x-1.5 font-bold">→</span>
            </button>

            <button
              onClick={handleScrollToPillars}
              className="w-full sm:w-[210px] h-[58px] px-8 py-4 rounded-2xl bg-[#08150D]/85 hover:bg-[#0E2A1B] border border-[#184C2E] hover:border-[#CEFF00] text-[#D8D2C4] hover:text-[#CEFF00] font-mono text-sm sm:text-base font-black transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 backdrop-blur-md group outline-none focus:outline-none focus:ring-0 select-none"
            >
              <span>Take The Tour</span>
              <span className="transition-transform group-hover:translate-y-1">↓</span>
            </button>
          </div>

        </div>
      </section>

      {/* THE 3 CORE CAPABILITIES */}
      <section id="zemo-pillars" className="py-24 sm:py-32 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#0E2A1B]/60 border border-[#163E26] mb-4">
            <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#CEFF00]">
              THOUGHTFULLY BUILT FOR YOU
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-[#F5F2EA] tracking-tight leading-tight">
            Because buying what you love shouldn&apos;t feel like work.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#9EB0A3] max-w-2xl mx-auto leading-relaxed">
            Zemo compares stores, checks real reviews, and watches for price drops—so you can just relax and save.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1: 24/7 Surveillance */}
          <div className="relative overflow-hidden rounded-3xl border border-[#163E26] bg-[#07130A]/90 p-7 sm:p-8 flex flex-col justify-start transition-all duration-1000 ease-out group hover:shadow-[0_16px_50px_rgba(206,255,0,0.15)] backdrop-blur-md">
            {/* Natural fluid radial bloom expanding from bottom-left to top-right */}
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-gradient-to-tr from-[#1E5C35] via-[#123E25] to-transparent blur-3xl opacity-0 scale-50 group-hover:scale-[3.2] group-hover:opacity-90 transition-all duration-1000 ease-out pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-[#CEFF00]/15 blur-2xl opacity-0 scale-75 group-hover:scale-150 group-hover:opacity-100 transition-all duration-1000 ease-out pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0F361E]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ease-out pointer-events-none" />
            {/* Subtle extreme top-right black vignette touch */}
            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-black/45 blur-xl pointer-events-none z-[1]" />

            <div className="relative z-10">
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#CEFF00] font-bold block mb-3">
                01 / CALM & PATIENT
              </span>
              <h3 className="text-xl font-bold text-[#F5F2EA] group-hover:text-[#CEFF00] transition-colors duration-700 mb-3">
                Always looking out for you.
              </h3>
              <p className="text-sm text-[#9EB0A3] group-hover:text-[#D8E6DB] transition-colors duration-700 leading-relaxed">
                Paste any link and let your mind rest. Zemo keeps a quiet eye on prices day and night, letting you know the exact moment savings happen just for you.
              </p>
            </div>
          </div>

          {/* Card 2: Multi-Store Benchmark */}
          <div className="relative overflow-hidden rounded-3xl border border-[#163E26] bg-[#07130A]/90 p-7 sm:p-8 flex flex-col justify-start transition-all duration-1000 ease-out group hover:shadow-[0_16px_50px_rgba(206,255,0,0.15)] backdrop-blur-md">
            {/* Natural fluid radial bloom expanding from bottom-left to top-right */}
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-gradient-to-tr from-[#1E5C35] via-[#123E25] to-transparent blur-3xl opacity-0 scale-50 group-hover:scale-[3.2] group-hover:opacity-90 transition-all duration-1000 ease-out pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-[#CEFF00]/15 blur-2xl opacity-0 scale-75 group-hover:scale-150 group-hover:opacity-100 transition-all duration-1000 ease-out pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0F361E]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ease-out pointer-events-none" />
            {/* Subtle extreme top-right black vignette touch */}
            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-black/45 blur-xl pointer-events-none z-[1]" />

            <div className="relative z-10">
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#CEFF00] font-bold block mb-3">
                02 / CURATED STORES
              </span>
              <h3 className="text-xl font-bold text-[#F5F2EA] group-hover:text-[#CEFF00] transition-colors duration-700 mb-3">
                Looking beyond one shop.
              </h3>
              <p className="text-sm text-[#9EB0A3] group-hover:text-[#D8E6DB] transition-colors duration-700 leading-relaxed">
                Why spend hours hopping tabs? Zemo checks Amazon, Flipkart, and your favorite stores together—so your money always goes furthest on every purchase.
              </p>
            </div>
          </div>

          {/* Card 3: Review Analysis & Bank Offers */}
          <div className="relative overflow-hidden rounded-3xl border border-[#163E26] bg-[#07130A]/90 p-7 sm:p-8 flex flex-col justify-start transition-all duration-1000 ease-out group hover:shadow-[0_16px_50px_rgba(206,255,0,0.15)] backdrop-blur-md">
            {/* Natural fluid radial bloom expanding from bottom-left to top-right */}
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-gradient-to-tr from-[#1E5C35] via-[#123E25] to-transparent blur-3xl opacity-0 scale-50 group-hover:scale-[3.2] group-hover:opacity-90 transition-all duration-1000 ease-out pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-[#CEFF00]/15 blur-2xl opacity-0 scale-75 group-hover:scale-150 group-hover:opacity-100 transition-all duration-1000 ease-out pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0F361E]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ease-out pointer-events-none" />
            {/* Subtle extreme top-right black vignette touch */}
            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-black/45 blur-xl pointer-events-none z-[1]" />

            <div className="relative z-10">
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#CEFF00] font-bold block mb-3">
                03 / THE FULL STORY
              </span>
              <h3 className="text-xl font-bold text-[#F5F2EA] group-hover:text-[#CEFF00] transition-colors duration-700 mb-3">
                Every saving, handpicked.
              </h3>
              <p className="text-sm text-[#9EB0A3] group-hover:text-[#D8E6DB] transition-colors duration-700 leading-relaxed">
                No fake 5-star hype. Just genuine feedback from real owners, paired with hidden card discounts ready before you checkout with total confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 max-w-5xl mx-auto border-t border-[#163E26]/40">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#0E2A1B]/60 border border-[#163E26] mb-4">
            <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#CEFF00]">
              MADE EASY FOR YOU
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#F5F2EA] tracking-tight">
            How Zemo Works In 3 Steps
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          {/* Step 1 */}
          <div className="relative overflow-hidden rounded-2xl bg-[#07130A] border border-[#163E26] p-7 transition-all duration-1000 ease-out group hover:shadow-[0_16px_50px_rgba(206,255,0,0.15)] backdrop-blur-md">
            {/* Natural fluid radial bloom expanding from bottom-left */}
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-gradient-to-tr from-[#1E5C35] via-[#123E25] to-transparent blur-3xl opacity-0 scale-50 group-hover:scale-[3.2] group-hover:opacity-90 transition-all duration-1000 ease-out pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-[#CEFF00]/15 blur-2xl opacity-0 scale-75 group-hover:scale-150 group-hover:opacity-100 transition-all duration-1000 ease-out pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0F361E]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ease-out pointer-events-none" />
            {/* Subtle extreme top-right black vignette touch */}
            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-black/45 blur-xl pointer-events-none z-[1]" />

            <div className="relative z-10">
              <div className="mb-4">
                <span className="text-xs font-mono text-[#CEFF00] font-bold tracking-wider">STEP 01</span>
              </div>
              <h4 className="text-lg font-bold text-[#F5F2EA] group-hover:text-[#CEFF00] transition-colors duration-700 mb-2">Drop In What You Love</h4>
              <p className="text-xs sm:text-sm text-[#9EB0A3] group-hover:text-[#D8E6DB] transition-colors duration-700 leading-relaxed">
                Found something special on Amazon? Just paste the product link—no complicated setups.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative overflow-hidden rounded-2xl bg-[#07130A] border border-[#163E26] p-7 transition-all duration-1000 ease-out group hover:shadow-[0_16px_50px_rgba(206,255,0,0.15)] backdrop-blur-md">
            {/* Natural fluid radial bloom expanding from bottom-left */}
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-gradient-to-tr from-[#1E5C35] via-[#123E25] to-transparent blur-3xl opacity-0 scale-50 group-hover:scale-[3.2] group-hover:opacity-90 transition-all duration-1000 ease-out pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-[#CEFF00]/15 blur-2xl opacity-0 scale-75 group-hover:scale-150 group-hover:opacity-100 transition-all duration-1000 ease-out pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0F361E]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ease-out pointer-events-none" />
            {/* Subtle extreme top-right black vignette touch */}
            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-black/45 blur-xl pointer-events-none z-[1]" />

            <div className="relative z-10">
              <div className="mb-4">
                <span className="text-xs font-mono text-[#CEFF00] font-bold tracking-wider">STEP 02</span>
              </div>
              <h4 className="text-lg font-bold text-[#F5F2EA] group-hover:text-[#CEFF00] transition-colors duration-700 mb-2">Pick Your Happy Price</h4>
              <p className="text-xs sm:text-sm text-[#9EB0A3] group-hover:text-[#D8E6DB] transition-colors duration-700 leading-relaxed">
                Choose the price you want to pay. Zemo keeps a quiet eye on it day and night with calm patience.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative overflow-hidden rounded-2xl bg-[#07130A] border border-[#163E26] p-7 transition-all duration-1000 ease-out group hover:shadow-[0_16px_50px_rgba(206,255,0,0.15)] backdrop-blur-md">
            {/* Natural fluid radial bloom expanding from bottom-left */}
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-gradient-to-tr from-[#1E5C35] via-[#123E25] to-transparent blur-3xl opacity-0 scale-50 group-hover:scale-[3.2] group-hover:opacity-90 transition-all duration-1000 ease-out pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-[#CEFF00]/15 blur-2xl opacity-0 scale-75 group-hover:scale-150 group-hover:opacity-100 transition-all duration-1000 ease-out pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0F361E]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ease-out pointer-events-none" />
            {/* Subtle extreme top-right black vignette touch */}
            <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-black/45 blur-xl pointer-events-none z-[1]" />

            <div className="relative z-10">
              <div className="mb-4">
                <span className="text-xs font-mono text-[#CEFF00] font-bold tracking-wider">STEP 03</span>
              </div>
              <h4 className="text-lg font-bold text-[#F5F2EA] group-hover:text-[#CEFF00] transition-colors duration-700 mb-2">Celebrate The Savings</h4>
              <p className="text-xs sm:text-sm text-[#9EB0A3] group-hover:text-[#D8E6DB] transition-colors duration-700 leading-relaxed">
                Get a gentle alert sent to you the moment the price hits your target, so you never overpay.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS & TRANSPARENCY STRIP */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="rounded-3xl border border-[#163E26] bg-[#07130A] p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl transition-all duration-1000 ease-out group hover:shadow-[0_16px_50px_rgba(206,255,0,0.15)] backdrop-blur-md">
          {/* Natural fluid radial bloom expanding from bottom-left - smooth seamless gradient, no harsh hotspot */}
          <div className="absolute -bottom-36 -left-36 w-[560px] h-[560px] rounded-full bg-gradient-to-tr from-[#1B5230] via-[#0E351E] to-transparent blur-3xl opacity-0 scale-50 group-hover:scale-[2.4] group-hover:opacity-90 transition-all duration-1000 ease-out pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#123E25]/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ease-out pointer-events-none" />
          {/* Subtle extreme top-right black vignette touch */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-black/50 blur-2xl pointer-events-none z-[1]" />

          <div className="max-w-2xl mx-auto relative z-10">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#CEFF00] font-bold block mb-2.5">
              ALWAYS IN YOUR FAVOR
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-[#F5F2EA] tracking-tight">
              Timing is everything. Zemo watches the clock.
            </h3>
            <p className="mt-3 text-sm sm:text-base text-[#9EB0A3] leading-relaxed">
              No fake timers, no sponsored push, and zero sneaky fees. Just honest price tracking that quietly works to keep money where it belongs—with you.
            </p>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-[#163E26]/60 font-mono">
              <div className="p-3 rounded-xl bg-[#061209]/60 border border-[#133A23]">
                <span className="text-2xl sm:text-3xl font-black text-[#CEFF00] block">100%</span>
                <span className="text-[10px] text-[#6D8274] uppercase tracking-wider font-semibold">Pure Integrity</span>
              </div>
              <div className="p-3 rounded-xl bg-[#061209]/60 border border-[#133A23]">
                <span className="text-2xl sm:text-3xl font-black text-[#CEFF00] block">24/7</span>
                <span className="text-[10px] text-[#6D8274] uppercase tracking-wider font-semibold">Continuous Radar</span>
              </div>
              <div className="p-3 rounded-xl bg-[#061209]/60 border border-[#133A23]">
                <span className="text-2xl sm:text-3xl font-black text-[#CEFF00] block">&lt;60s</span>
                <span className="text-[10px] text-[#6D8274] uppercase tracking-wider font-semibold">Price Refresh</span>
              </div>
              <div className="p-3 rounded-xl bg-[#061209]/60 border border-[#133A23]">
                <span className="text-2xl sm:text-3xl font-black text-[#CEFF00] block">&#8377;0</span>
                <span className="text-[10px] text-[#6D8274] uppercase tracking-wider font-semibold">No Cost, Ever</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 text-center relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[520px] h-[360px] bg-[#CEFF00]/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#08150D] border border-[#163E26]">
            <span className="text-xs font-mono font-bold text-[#CEFF00] uppercase tracking-wider">
              Ready Whenever You Are
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#F5F2EA] leading-tight">
            Give your dreams the patience they deserve.
          </h2>
          <p className="text-sm sm:text-base text-[#9EB0A3] max-w-xl mx-auto leading-relaxed">
            Put down the worry and let patience do the work. Zemo checks the prices day and night, bringing you calm certainty with every notification.
          </p>
          <div className="pt-4">
            <button
              onClick={handleEnterClick}
              className="px-10 sm:px-12 py-4 sm:py-5 rounded-2xl bg-[#CEFF00] hover:bg-[#b8e600] text-black font-mono text-base sm:text-lg font-black transition-all cursor-pointer active:scale-95 inline-flex items-center gap-3 group"
            >
              <span>Step Inside</span>
              <span className="transition-transform group-hover:translate-x-1 font-bold text-xl">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* Gmail Entrance / Confirmation Modal */}
      <EmailEntryModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onEnterSuccess={handleEmailSuccess}
      />

    </div>
  );
}
