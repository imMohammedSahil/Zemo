import { useState, useEffect, useRef } from "react";

export const LOADER_PRESETS = {
  compare: {
    id: "compare",
    name: "Compare Stores",
    icon: "cart",
    title: "Looking for Sweet Store Deals...",
    subtitle: "Checking verified prices, live discounts and deals across top stores",
    estimatedSeconds: 12,
    stages: [
      "Window shopping across Amazon, Flipkart, Croma and friends...",
      "Skipping unverified sellers so you get the genuine deal...",
      "Hunting down the lowest cart value for your wallet...",
      "Wrapping up the sweetest store bargains for you...",
      "Best price spotted and ready for you."
    ]
  },
  graph: {
    id: "graph",
    name: "Price Graph",
    icon: "graph",
    title: "Mapping Price Rollercoaster...",
    subtitle: "Tracing historical price drops, flash sales, and all-time lowest discount dips",
    estimatedSeconds: 13,
    stages: [
      "Hunting down past festival sales and quiet price drops...",
      "Spotting the big festive sales and record discount dips...",
      "Checking if today's tag is a rare steal or a little high...",
      "Smoothing out the rollercoaster tracks for you...",
      "All cozy! Price rollercoaster mapped out for you."
    ]
  },
  reviews: {
    id: "reviews",
    name: "Customer Reviews",
    icon: "reviews",
    title: "Reading Shopper Reviews...",
    subtitle: "Checking what real owners loved, disliked and wished they knew first",
    estimatedSeconds: 11,
    stages: [
      "Sifting through verified feedback with a warm cup of coffee...",
      "Collecting the features real owners could not stop praising...",
      "Taking note of honest gotchas so unboxing day is pure delight...",
      "Putting together the complete verdict for you...",
      "Shopper wisdom packed and ready for you."
    ]
  },
  offers: {
    id: "offers",
    name: "Bank Offers",
    icon: "card",
    title: "Stacking Up Bank Offers & Perks...",
    subtitle: "Finding instant card discounts, EMI perks and stackable checkout savings",
    estimatedSeconds: 11,
    stages: [
      "Digging into your wallet to find secret card perks...",
      "Teaming up with partner banks to see who gives you the sweetest deal...",
      "Stacking up voucher magic for maximum savings at checkout...",
      "Squeezing out every last rupee of discount for you...",
      "Discounts ready! Save that extra cash."
    ]
  }
};

// Module-level persistent start times across unmounts / tab switches
const globalLoaderStarts = {};

export default function AiProgressLoader({
  trackingKey,
  title = "Gathering Fresh Insights...",
  subtitle = "Checking verified details so you always get the best deal",
  estimatedSeconds = 12,
  minDisplaySeconds = 4,
  isCompleted = false,
  onFinished,
  stages = LOADER_PRESETS.compare.stages
}) {
  const minMs = Math.max(2500, (minDisplaySeconds || 4) * 1000);
  const baseDuration = Math.max(minMs, (estimatedSeconds || 12) * 1000);

  if (trackingKey && !globalLoaderStarts[trackingKey]) {
    globalLoaderStarts[trackingKey] = Date.now();
  }
  const initialStartTime = trackingKey ? globalLoaderStarts[trackingKey] : Date.now();
  const initialElapsed = Date.now() - initialStartTime;

  let initialPct = 8;
  let initialStatus = `ETA ~${estimatedSeconds || 12}s`;
  if (initialElapsed < baseDuration) {
    initialPct = Math.min(88, Math.round((initialElapsed / baseDuration) * 80) + 8);
    const rem = Math.max(1, Math.ceil((baseDuration - initialElapsed) / 1000));
    initialStatus = `ETA ~${rem}s`;
  } else {
    const extraSecs = (initialElapsed - baseDuration) / 1000;
    initialPct = Math.min(96, 88 + Math.round((1 - Math.exp(-extraSecs / 5)) * 8));
    initialStatus = "Almost ready...";
  }

  const preCompletionStages = Math.max(1, (stages || LOADER_PRESETS.compare.stages).length - 1);
  const initialStageIdx = Math.min(
    preCompletionStages - 1,
    Math.floor((initialPct / 96) * preCompletionStages)
  );

  const [progress, setProgress] = useState(initialPct);
  const [currentStageIdx, setCurrentStageIdx] = useState(initialStageIdx);
  const [statusText, setStatusText] = useState(initialStatus);

  const startTimeRef = useRef(initialStartTime);
  const isCompletedRef = useRef(isCompleted);
  const onFinishedRef = useRef(onFinished);
  const stagesRef = useRef(stages);
  const completedTriggeredRef = useRef(false);

  useEffect(() => {
    isCompletedRef.current = isCompleted;
  }, [isCompleted]);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  useEffect(() => {
    stagesRef.current = stages;
  }, [stages]);

  useEffect(() => {
    let holdTimeout = null;

    const interval = setInterval(() => {
      if (completedTriggeredRef.current) return;

      const elapsed = Date.now() - startTimeRef.current;
      const minTimeElapsed = elapsed >= minMs;
      const curStages = stagesRef.current || LOADER_PRESETS.compare.stages;
      const preCompletionStagesCount = Math.max(1, curStages.length - 1);

      // When API finishes and minimum animation time has elapsed
      if (isCompletedRef.current && minTimeElapsed) {
        completedTriggeredRef.current = true;
        clearInterval(interval);
        if (trackingKey) {
          delete globalLoaderStarts[trackingKey];
        }
        setProgress(100);
        setCurrentStageIdx(curStages.length - 1);
        setStatusText("Ready!");

        holdTimeout = setTimeout(() => {
          onFinishedRef.current?.();
        }, 1100);
        return;
      }

      // Smooth progression up to 96%
      let pct;
      if (elapsed < baseDuration) {
        pct = Math.min(88, Math.round((elapsed / baseDuration) * 80) + 8);
        const rem = Math.max(1, Math.ceil((baseDuration - elapsed) / 1000));
        setStatusText(`ETA ~${rem}s`);
      } else {
        const extraSecs = (elapsed - baseDuration) / 1000;
        pct = Math.min(96, 88 + Math.round((1 - Math.exp(-extraSecs / 5)) * 8));
        setStatusText("Almost ready...");
      }
      setProgress(pct);

      const stageIdx = Math.min(
        preCompletionStagesCount - 1,
        Math.floor((pct / 96) * preCompletionStagesCount)
      );
      setCurrentStageIdx(stageIdx);
    }, 60);

    return () => {
      clearInterval(interval);
      if (holdTimeout) clearTimeout(holdTimeout);
    };
  }, [estimatedSeconds, minDisplaySeconds, trackingKey, minMs, baseDuration]);

  return (
    <div className="py-20 sm:py-24 text-center flex flex-col items-center justify-center bg-[#060D09] border border-[#143E26] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-radial from-[#CEFF00]/5 via-transparent to-transparent pointer-events-none" />

      {/* Center Spinner */}
      <div className="relative mb-5">
        <div className="w-14 h-14 border-3 border-[#163E26] border-t-[#CEFF00] rounded-full animate-spin"></div>
      </div>

      {/* Main Title & Subtitle */}
      <div className="space-y-1.5 max-w-xl">
        <h3 className="font-mono text-sm sm:text-base font-bold text-[#CEFF00] tracking-wide">
          {title}
        </h3>
        <p className="font-mono text-xs text-[#A6A095] leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full max-w-md mt-6 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-[#CEFF00] font-semibold">
            {stages[currentStageIdx]}
          </span>
          <span className="text-zinc-400 font-bold">
            {progress >= 100 ? (
              "Ready!"
            ) : (
              <>
                <span className="text-[#CEFF00]">{statusText}</span> ({progress}%)
              </>
            )}
          </span>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-2 rounded-full bg-[#0E2416] border border-[#184C2E]/70 overflow-hidden relative p-[1px]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#184C2E] via-[#A3E000] to-[#CEFF00] transition-all duration-200 ease-out shadow-[0_0_12px_rgba(206,255,0,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Reassuring Note */}
        <p className="pt-2 text-[11px] font-sans text-zinc-400 text-center leading-relaxed font-medium">
          I know it feels like a wait! Live-scanning and verifying fresh details takes a few seconds on the first try. Thank you for hanging in there.
        </p>
      </div>
    </div>
  );
}
