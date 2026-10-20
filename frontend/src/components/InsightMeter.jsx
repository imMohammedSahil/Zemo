import { useState } from "react";

export default function InsightMeter({ title, segments = [] }) {
  const [selected, setSelected] = useState(null);

  const total = segments.reduce((sum, s) => sum + (s.value || 0), 0) || 1;
  let startAngle = 0;

  const isPros = title.toLowerCase().includes("pro");

  return (
    <div className="bg-zemo-card border border-zemo-border rounded-3xl p-6 shadow-xl flex flex-col items-center justify-between w-full max-w-md relative overflow-hidden">
      
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-zemo-border">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isPros ? "bg-[#39FF14] shadow-[0_0_10px_#39FF14]" : "bg-rose-500 shadow-[0_0_10px_#f43f5e]"}`}></span>
          <h3 className="text-base font-mono uppercase font-bold text-white tracking-wider">
            {title}
          </h3>
        </div>
        <span className="text-[10px] font-mono text-zinc-500">
          {segments.length} Aspects Distilled
        </span>
      </div>

      {/* SVG Arc Gauge */}
      <div className="relative my-2">
        <svg width="280" height="150" className="overflow-visible">
          {segments.map((seg, i) => {
            const value = seg.value || 0;
            const angle = (value / total) * 180;

            const x1 = 140 + 110 * Math.cos((Math.PI * startAngle) / 180);
            const y1 = 140 - 110 * Math.sin((Math.PI * startAngle) / 180);

            const endAngle = startAngle + angle;

            const x2 = 140 + 110 * Math.cos((Math.PI * endAngle) / 180);
            const y2 = 140 - 110 * Math.sin((Math.PI * endAngle) / 180);

            const largeArc = angle > 180 ? 1 : 0;

            const path = `
              M ${x1} ${y1}
              A 110 110 0 ${largeArc} 0 ${x2} ${y2}
            `;

            startAngle = endAngle;

            return (
              <path
                key={i}
                d={path}
                stroke={seg.color}
                strokeWidth="28"
                fill="none"
                strokeLinecap="round"
                className="cursor-pointer transition-all duration-300 hover:opacity-80 hover:stroke-[32]"
                onClick={() => setSelected(seg)}
              />
            );
          })}
        </svg>

        <div className="text-center absolute bottom-0 left-1/2 -translate-x-1/2">
          <span className="text-[10px] font-mono text-zinc-400 uppercase">Aspects Total</span>
          <p className="text-xl font-bold font-mono text-white leading-none">100%</p>
        </div>
      </div>

      {/* Interactive Legend Grid */}
      <div className="w-full mt-6 space-y-2">
        {segments.map((seg, i) => (
          <div
            key={i}
            onClick={() => setSelected(seg)}
            className="flex items-center justify-between p-2 rounded-xl bg-[#060907] border border-zemo-border hover:border-[#39FF14]/40 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                style={{ background: seg.color }}
              ></span>
              <span className="text-xs font-mono text-zinc-300 group-hover:text-white capitalize">
                {seg.label}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded bg-white/5">
              {seg.value}%
            </span>
          </div>
        ))}
      </div>

      {/* Cyber Popup Modal for Selected Aspect */}
      {selected && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setSelected(null)}
        >
          <div 
            className="bg-[#0B1E12] border border-[#22C55E] p-6 rounded-3xl shadow-[0_0_40px_rgba(57,255,20,0.25)] max-w-sm w-full text-left space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#0D3B16] text-[#39FF14] border border-[#163E22]">
                Aspect: {selected.label} ({selected.value}%)
              </span>
              <button 
                onClick={() => setSelected(null)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div>
              <h4 className="text-lg font-bold text-white font-mono capitalize">
                {selected.label}
              </h4>
              <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                {selected.description || "Synthesized from real multi-customer verified reviews using Llama-3-8B."}
              </p>
            </div>

            <button
              onClick={() => setSelected(null)}
              className="w-full bg-[#39FF14] hover:bg-[#32E612] text-black font-mono font-bold text-xs py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(57,255,20,0.3)]"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

    </div>
  );
}