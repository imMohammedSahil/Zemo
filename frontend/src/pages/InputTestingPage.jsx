import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AiProgressLoader, { LOADER_PRESETS } from "../components/AiProgressLoader";

export default function InputTestingPage() {
  // Main View: 'subpages' or 'inputbar'
  const [activeView, setActiveView] = useState("subpages");

  // Selected subpage loader tab: 'compare' | 'graph' | 'reviews' | 'offers'
  const [selectedSubpage, setSelectedSubpage] = useState("compare");

  // Subpage loader simulator state
  const [loaderProgress, setLoaderProgress] = useState(15);
  const [loaderRunning, setLoaderRunning] = useState(false);
  const [loaderCompleted, setLoaderCompleted] = useState(false);
  const [loaderDuration, setLoaderDuration] = useState(6000);
  const [loaderStageIdx, setLoaderStageIdx] = useState(0);

  // Input bar console simulator state
  const [url, setUrl] = useState("");
  const [inputLoading, setInputLoading] = useState(false);
  const [inputProgress, setInputProgress] = useState(0);
  const [inputStage, setInputStage] = useState("");
  const [inputEta, setInputEta] = useState(6);
  const [waitingDots, setWaitingDots] = useState(".");

  const inputStages = [
    "Scouting store details...",
    "Checking live price...",
    "Reading verified reviews...",
    "Uncovering bank offers...",
    "Tucking into watchlist..."
  ];

  const currentPreset = LOADER_PRESETS[selectedSubpage] || LOADER_PRESETS.compare;

  useEffect(() => {
    const dotTimer = setInterval(() => {
      setWaitingDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 850);
    return () => clearInterval(dotTimer);
  }, []);

  // -------------------------------------------------------------
  // Subpage Loader Simulation
  // -------------------------------------------------------------
  const runSubpageLoader = (durationMs = 6000) => {
    if (window.__subpageTimer) clearInterval(window.__subpageTimer);
    if (window.__subpageHoldTimer) clearTimeout(window.__subpageHoldTimer);

    setLoaderRunning(true);
    setLoaderCompleted(false);
    setLoaderProgress(10);
    setLoaderStageIdx(0);

    const startTime = Date.now();
    const stagesCount = currentPreset.stages.length;

    window.__subpageTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;

      if (elapsed >= durationMs) {
        clearInterval(window.__subpageTimer);
        setLoaderProgress(100);
        setLoaderStageIdx(stagesCount - 1);
        setLoaderCompleted(true);

        // Hold 5th stage at 100% for 3 full seconds before resetting
        window.__subpageHoldTimer = setTimeout(() => {
          setLoaderRunning(false);
          setLoaderCompleted(false);
        }, 3000);
        return;
      }

      // Smooth progression up to 96%
      const pct = Math.min(96, Math.round((elapsed / durationMs) * 86) + 10);
      setLoaderProgress(pct);

      const preCount = Math.max(1, stagesCount - 1);
      const stageIdx = Math.min(preCount - 1, Math.floor((pct / 96) * preCount));
      setLoaderStageIdx(stageIdx);
    }, 60);
  };

  const handleSubpageScrub = (val) => {
    if (window.__subpageTimer) clearInterval(window.__subpageTimer);
    if (window.__subpageHoldTimer) clearTimeout(window.__subpageHoldTimer);

    const pct = Number(val);
    setLoaderProgress(pct);
    setLoaderRunning(true);

    const stagesCount = currentPreset.stages.length;
    if (pct >= 100) {
      setLoaderCompleted(true);
      setLoaderStageIdx(stagesCount - 1);
    } else {
      setLoaderCompleted(false);
      const preCount = Math.max(1, stagesCount - 1);
      const stageIdx = Math.min(preCount - 1, Math.floor((pct / 96) * preCount));
      setLoaderStageIdx(stageIdx);
    }
  };

  const jumpToStage = (idx) => {
    if (window.__subpageTimer) clearInterval(window.__subpageTimer);
    if (window.__subpageHoldTimer) clearTimeout(window.__subpageHoldTimer);

    setLoaderRunning(true);
    setLoaderStageIdx(idx);
    if (idx === currentPreset.stages.length - 1) {
      setLoaderProgress(100);
      setLoaderCompleted(true);
    } else {
      setLoaderCompleted(false);
      const pctMap = [18, 42, 68, 88];
      setLoaderProgress(pctMap[idx] || 25);
    }
  };

  const resetSubpageLoader = () => {
    if (window.__subpageTimer) clearInterval(window.__subpageTimer);
    if (window.__subpageHoldTimer) clearTimeout(window.__subpageHoldTimer);
    setLoaderRunning(false);
    setLoaderCompleted(false);
    setLoaderProgress(12);
    setLoaderStageIdx(0);
  };

  // -------------------------------------------------------------
  // Input Bar Simulation
  // -------------------------------------------------------------
  const triggerInputSimulation = (durationMs = 6000) => {
    if (window.__simTimer) clearInterval(window.__simTimer);
    if (window.__simCompleteTimer) clearTimeout(window.__simCompleteTimer);

    setInputLoading(true);
    setInputProgress(6);
    setInputStage(inputStages[0]);
    setInputEta(Math.ceil(durationMs / 1000));

    const startTime = Date.now();

    window.__simTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;

      if (elapsed >= durationMs) {
        clearInterval(window.__simTimer);
        setInputProgress(100);
        setInputEta(0);
        setInputStage("Product secured! Keeping watch.");

        window.__simCompleteTimer = setTimeout(() => {
          setInputLoading(false);
          setInputProgress(0);
          setInputStage("");
          setUrl("");
        }, 3000);
        return;
      }

      const pct = Math.min(98, Math.round((elapsed / durationMs) * 92) + 6);
      setInputProgress(pct);
      const rem = Math.max(1, Math.ceil((durationMs - elapsed) / 1000));
      setInputEta(rem);

      const stageIdx = Math.min(
        inputStages.length - 1,
        Math.floor((pct / 98) * inputStages.length)
      );
      setInputStage(inputStages[stageIdx]);
    }, 60);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8 font-sans text-[#EAE5D9]">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#163E26] pb-5">
        <div>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#0E2A1B] border border-[#163E26] text-[#CEFF00] font-mono text-[10px] uppercase font-bold tracking-widest mb-1.5 shadow-sm">
            <span>VISUAL LABORATORY & TESTBENCH</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-[#EAE5D9]">
            Unified Loader Playground
          </h1>
          <p className="text-xs sm:text-sm text-[#A6A095] mt-1">
            Design and preview warm, cozy loaders for all 4 subpages with zero technical jargon.
          </p>
        </div>

        <Link
          to="/"
          className="px-4 py-2 bg-[#0E2A1B] hover:bg-[#163E26] border border-[#163E26] hover:border-[#CEFF00] text-[#CEFF00] text-xs font-mono font-bold rounded-xl transition-all self-start sm:self-auto"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Main Mode Toggle: Subpage Loaders vs Input Bar */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#060D09] border border-[#163E26] w-fit">
        <button
          onClick={() => setActiveView("subpages")}
          className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer ${
            activeView === "subpages"
              ? "bg-[#CEFF00] text-black shadow-md"
              : "text-[#A6A095] hover:text-[#CEFF00] hover:bg-[#0E2A1B]"
          }`}
        >
          ✨ Subpage Loaders (4 Pages)
        </button>
        <button
          onClick={() => setActiveView("inputbar")}
          className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all cursor-pointer ${
            activeView === "inputbar"
              ? "bg-[#CEFF00] text-black shadow-md"
              : "text-[#A6A095] hover:text-[#CEFF00] hover:bg-[#0E2A1B]"
          }`}
        >
          🔍 Input Console
        </button>
      </div>

      {/* ========================================================= */}
      {/* VIEW 1: SUBPAGE LOADERS (COMPARE, GRAPH, REVIEWS, OFFERS) */}
      {/* ========================================================= */}
      {activeView === "subpages" && (
        <div className="space-y-6">
          
          {/* 4 Subpage Selectors */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {Object.values(LOADER_PRESETS).map((preset) => {
              const isSelected = selectedSubpage === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    setSelectedSubpage(preset.id);
                    resetSubpageLoader();
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? "bg-[#0E2A1B] border-[#CEFF00] shadow-[0_0_20px_rgba(206,255,0,0.15)]"
                      : "bg-[#060D09] border-[#163E26] hover:border-[#227A4E] text-[#A6A095]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{preset.icon}</span>
                    <span
                      className={`text-xs font-mono font-bold ${
                        isSelected ? "text-[#CEFF00]" : "text-[#EAE5D9]"
                      }`}
                    >
                      {preset.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#A6A095] font-mono truncate">
                    {preset.stages.length} feel-good stages
                  </span>
                </button>
              );
            })}
          </div>

          {/* Live Visual Preview of Selected Loader */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#A6A095]">
                LIVE RENDER: <strong className="text-[#CEFF00]">{currentPreset.name}</strong>
              </span>
              <span className="text-[#CEFF00] font-bold">
                {loaderCompleted
                  ? "COMPLETED (Holding 3s)"
                  : loaderRunning
                  ? `RUNNING (${loaderProgress}%)`
                  : "PAUSED / SCRUBBING"}
              </span>
            </div>

            {/* Render Component Directly */}
            <div className="w-full">
              <div className="py-16 sm:py-20 text-center flex flex-col items-center justify-center bg-[#060D09] border border-[#143E26] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-radial from-[#CEFF00]/5 via-transparent to-transparent pointer-events-none" />

                {/* Spinner */}
                <div className="relative mb-5">
                  <div className="w-14 h-14 border-3 border-[#163E26] border-t-[#CEFF00] rounded-full animate-spin"></div>
                </div>

                {/* Title & Warm Subtitle */}
                <div className="space-y-1.5 max-w-xl">
                  <h3 className="font-mono text-sm sm:text-base font-bold text-[#CEFF00] tracking-wide">
                    {currentPreset.title}
                  </h3>
                  <p className="font-mono text-xs text-[#A6A095] leading-relaxed">
                    {currentPreset.subtitle}
                  </p>
                </div>

                {/* Progress Bar Container */}
                <div className="w-full max-w-md mt-6 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#CEFF00] font-semibold truncate pr-2">
                      {currentPreset.stages[loaderStageIdx] || currentPreset.stages[0]}
                    </span>
                    <span className="text-zinc-400 font-bold shrink-0">
                      {loaderProgress >= 100
                        ? "Ready!"
                        : loaderProgress >= 90
                        ? "Almost ready..."
                        : `(${loaderProgress}%)`}
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-[#0E2416] border border-[#184C2E]/70 overflow-hidden relative p-[1px]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#184C2E] via-[#A3E000] to-[#CEFF00] transition-all duration-200 ease-out shadow-[0_0_12px_rgba(206,255,0,0.5)]"
                      style={{ width: `${loaderProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Simulator Controls */}
          <div className="bg-[#0A130E] border border-[#163E26] rounded-3xl p-5 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-[#CEFF00]">
                Interactive Simulation Controls
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#A6A095]">Run Speed:</span>
                {[3000, 6000, 10000].map((ms) => (
                  <button
                    key={ms}
                    onClick={() => {
                      setLoaderDuration(ms);
                      runSubpageLoader(ms);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                      loaderDuration === ms
                        ? "bg-[#CEFF00] text-black"
                        : "bg-[#0E2A1B] text-[#A6A095] hover:text-[#CEFF00]"
                    }`}
                  >
                    {ms / 1000}s
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => runSubpageLoader(loaderDuration)}
                className="p-3 rounded-xl bg-[#CEFF00] text-black font-mono text-xs font-bold hover:bg-[#b8e600] transition-all cursor-pointer"
              >
                ▶ Run Simulation
              </button>
              <button
                onClick={() => jumpToStage(currentPreset.stages.length - 1)}
                className="p-3 rounded-xl bg-[#0E2A1B] border border-[#163E26] hover:border-[#CEFF00] text-[#CEFF00] font-mono text-xs font-bold transition-all cursor-pointer"
              >
                ✨ Jump to 100% (Hold)
              </button>
              <button
                onClick={resetSubpageLoader}
                className="p-3 rounded-xl bg-[#0E2A1B] border border-[#163E26] hover:border-red-500 text-red-400 font-mono text-xs font-bold transition-all cursor-pointer"
              >
                ↺ Reset Loader
              </button>
              <div className="p-3 rounded-xl bg-[#060D09] border border-[#163E26] flex items-center justify-center font-mono text-xs text-[#CEFF00] font-bold">
                Progress: {loaderProgress}%
              </div>
            </div>

            {/* Scrub Slider */}
            <div className="space-y-2 pt-2 border-t border-[#163E26]/60">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#A6A095]">Scrub Progress Slider:</span>
                <span className="text-[#CEFF00] font-bold">{loaderProgress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={loaderProgress}
                onChange={(e) => handleSubpageScrub(e.target.value)}
                className="w-full accent-[#CEFF00] cursor-pointer"
              />
            </div>

            {/* 5 Stage Quick Pickers */}
            <div className="space-y-2 pt-2 border-t border-[#163E26]/60">
              <span className="text-xs font-mono text-[#A6A095] block">
                Preview Individual Stages (Click to test copy):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {currentPreset.stages.map((stg, idx) => (
                  <button
                    key={idx}
                    onClick={() => jumpToStage(idx)}
                    className={`p-2.5 rounded-xl border text-left font-mono text-[11px] transition-all cursor-pointer ${
                      loaderStageIdx === idx
                        ? "bg-[#0E2A1B] border-[#CEFF00] text-[#CEFF00] font-bold shadow-sm"
                        : "bg-[#060D09] border-[#163E26] text-[#A6A095] hover:text-[#EAE5D9] hover:border-[#227A4E]"
                    }`}
                  >
                    <div className="text-[9px] uppercase tracking-wider text-[#A6A095] mb-1">
                      {idx === currentPreset.stages.length - 1 ? "Stage 5 (100%)" : `Stage ${idx + 1}`}
                    </div>
                    <div className="line-clamp-2 leading-tight">{stg}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Unified Preset Comparison Matrix for all 4 pages */}
          <div className="bg-[#060D09] border border-[#163E26] rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#CEFF00]">
              Full Copy Matrix: All 4 Pages (Warm & Technical-Free)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(LOADER_PRESETS).map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedSubpage(p.id);
                    resetSubpageLoader();
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                    selectedSubpage === p.id
                      ? "bg-[#0E2A1B] border-[#CEFF00]"
                      : "bg-[#0A130E] border-[#163E26] hover:border-[#227A4E]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-[#CEFF00] flex items-center gap-2">
                      <span>{p.icon}</span> {p.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-[#A6A095]">
                      {p.estimatedSeconds}s default
                    </span>
                  </div>
                  <p className="text-xs text-[#EAE5D9] font-medium">{p.title}</p>
                  <p className="text-[11px] text-[#A6A095]">{p.subtitle}</p>
                  <div className="pt-2 border-t border-[#163E26]/60 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-[#A6A095] block">
                      5th Completion Message:
                    </span>
                    <span className="text-xs font-mono text-[#CEFF00] font-semibold block">
                      {p.stages[p.stages.length - 1]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: INPUT BAR CONSOLE (ORIGINAL SANDBOX) */}
      {/* ========================================================= */}
      {activeView === "inputbar" && (
        <div className="space-y-6">
          <div className="bg-[#040905] border border-[#163E26] rounded-3xl p-6 sm:p-10 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between text-xs font-mono text-[#A6A095]">
              <span>INPUT BAR COMPONENT PREVIEW</span>
              <span className="text-[#CEFF00] font-bold">
                State: {inputLoading ? `LOADING (${inputProgress}%)` : "IDLE"}
              </span>
            </div>

            <div className="w-full">
              <div className="relative group p-[2px] rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#163E26] via-[#227A4E] to-[#163E26] hover:from-[#227A4E] hover:via-[#CEFF00] hover:to-[#227A4E] focus-within:from-[#227A4E] focus-within:via-[#CEFF00] focus-within:to-[#227A4E] transition-all duration-300">
                <div className="bg-[#050D08] rounded-[14px] sm:rounded-[22px] p-1.5 sm:p-2 flex flex-col sm:flex-row items-center gap-2 w-full ring-1 ring-inset ring-[#163E26]/50 relative overflow-hidden">
                  
                  {inputLoading && (
                    <>
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#184C2E]/35 via-[#227A4E]/25 to-[#CEFF00]/15 transition-all duration-300 ease-out pointer-events-none rounded-[14px] sm:rounded-[22px]"
                        style={{ width: `${inputProgress}%` }}
                      />
                      <div 
                        className="absolute left-0 bottom-0 h-[2.5px] bg-gradient-to-r from-[#184C2E] via-[#A3E000] to-[#CEFF00] transition-all duration-300 ease-out shadow-[0_0_10px_#CEFF00] pointer-events-none"
                        style={{ width: `${inputProgress}%` }}
                      />
                    </>
                  )}

                  <div className="flex-1 w-full relative flex items-center pl-3.5 sm:pl-5 z-10 min-w-0">
                    <div className="flex items-center text-[#CEFF00] mr-3.5 sm:mr-4 shrink-0">
                      <svg className="w-5 h-5 opacity-90 group-focus-within:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>

                    {inputLoading ? (
                      <div className="w-full py-3.5 sm:py-4 flex items-center justify-between pr-3 select-none min-w-0">
                        <div className="flex items-center min-w-0 pr-2">
                          <span className="text-xs sm:text-sm font-mono text-[#CEFF00] font-semibold truncate">
                            {inputStage}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-[#CEFF00] shrink-0 bg-[#0E2A1B] px-2.5 py-1 rounded-lg border border-[#163E26] flex items-center gap-1.5">
                          {inputProgress >= 100 ? (
                            "Ready!"
                          ) : (
                            <>
                              <span className="text-zinc-400 font-normal">ETA ~{inputEta}s</span>
                              <span>{inputProgress}%</span>
                            </>
                          )}
                        </span>
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          placeholder={`What’s sitting on your Amazon wishlist? Drop the link here${waitingDots}`}
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && triggerInputSimulation(6000)}
                          className="w-full py-3.5 sm:py-4 bg-transparent text-[#EAE5D9] placeholder-[#A6A095]/50 outline-none text-sm sm:text-base font-medium pr-10 transition-all"
                        />

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

                  <button
                    onClick={() => triggerInputSimulation(6000)}
                    disabled={inputLoading}
                    className="btn-3d-track group/btn w-full sm:w-auto relative z-10 shrink-0"
                  >
                    {inputLoading ? (
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                        <span>{inputProgress === 100 ? "Added!" : "Tracking..."}</span>
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
          </div>

          <div className="bg-[#0A130E] border border-[#163E26] rounded-3xl p-6 sm:p-7 space-y-6">
            <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-[#CEFF00]">
              Input Bar Testing Controls
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => triggerInputSimulation(4000)}
                className="p-3 rounded-xl bg-[#0E2A1B] border border-[#163E26] hover:border-[#CEFF00] hover:text-[#CEFF00] font-mono text-xs font-semibold text-center transition-all cursor-pointer"
              >
                ⚡ Fast Run (4s)
              </button>
              <button
                onClick={() => triggerInputSimulation(7000)}
                className="p-3 rounded-xl bg-[#0E2A1B] border border-[#163E26] hover:border-[#CEFF00] hover:text-[#CEFF00] font-mono text-xs font-semibold text-center transition-all cursor-pointer"
              >
                🚀 Normal Run (7s)
              </button>
              <button
                onClick={() => triggerInputSimulation(12000)}
                className="p-3 rounded-xl bg-[#0E2A1B] border border-[#163E26] hover:border-[#CEFF00] hover:text-[#CEFF00] font-mono text-xs font-semibold text-center transition-all cursor-pointer"
              >
                🐢 Slow Run (12s)
              </button>
              <button
                onClick={() => {
                  setInputLoading(false);
                  setInputProgress(0);
                  setInputStage("");
                  setUrl("");
                }}
                className="p-3 rounded-xl bg-red-950/30 border border-red-900/40 hover:bg-red-900/40 text-red-400 font-mono text-xs font-semibold text-center transition-all cursor-pointer"
              >
                ↺ Reset Input
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
