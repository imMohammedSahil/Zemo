import { useNavigate } from "react-router-dom";

export default function ProductNavTabs({
  productId,
  activeTab,
  isLoading = false,
  onClearCache = null,
  isClearing = false
}) {
  const navigate = useNavigate();

  const lockMessage = "Hold tight! I'm crunching live data for this tab first — one at a time keeps our surveillance 100% accurate!";

  const tabs = [
    { id: "compare", label: "Compare Stores", path: `/product/${productId}/compare` },
    { id: "reviews", label: "Customer Reviews", path: `/product/${productId}/reviews` },
    { id: "offers", label: "Bank Offers", path: `/product/${productId}/offers` },
  ];

  return (
    <div className="flex items-center justify-between w-full flex-wrap gap-2.5">
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Return to Main Radar / Dashboard */}
        <button
          onClick={() => {
            if (productId) {
              sessionStorage.setItem("last_viewed_product_id", productId);
            }
            navigate(productId ? `/dashboard?focusProduct=${productId}` : "/dashboard", {
              state: { scrollToProductId: productId }
            });
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#08150D] border border-[#184C2E] text-[#A6A095] hover:bg-[#CEFF00] hover:border-[#CEFF00] hover:text-black font-mono text-xs font-bold transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <span>←</span>
          <span>Dashboard</span>
        </button>

        {/* Sibling navigation tabs */}
        <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-[#08150D] border border-[#1E5633] shadow-sm">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          if (isActive) {
            return (
              <span
                key={tab.id}
                className="px-3 py-1 rounded-lg bg-[#CEFF00] text-black font-mono text-xs font-black shadow-sm shrink-0 whitespace-nowrap"
              >
                {tab.label}
              </span>
            );
          }

          if (isLoading) {
            const alignClass = tab.id === "offers" ? "right-0" : tab.id === "compare" ? "left-0" : "left-1/2 -translate-x-1/2";
            const caretClass = tab.id === "offers" ? "right-8" : tab.id === "compare" ? "left-8" : "left-1/2 -translate-x-1/2";

            return (
              <div key={tab.id} className="relative group/tab flex items-center">
                <button
                  disabled
                  className="px-3 py-1 rounded-lg text-zinc-500 bg-transparent font-mono text-xs font-bold shrink-0 whitespace-nowrap opacity-40 cursor-not-allowed select-none"
                >
                  {tab.label}
                </button>

                {/* Custom Zemo Cyber Tooltip (positioned downward to stay in-bounds) */}
                <div className={`absolute top-full mt-2.5 w-64 p-3 rounded-xl bg-[#08150D] border border-[#184C2E] shadow-[0_12px_30px_rgba(0,0,0,0.95)] opacity-0 invisible group-hover/tab:opacity-100 group-hover/tab:visible pointer-events-none transition-all duration-200 z-50 text-left ${alignClass}`}>
                  <div className="mb-1.5">
                    <span className="text-[11px] font-mono font-bold tracking-wide text-[#CEFF00]">
                      Just a Moment
                    </span>
                  </div>
                  <p className="font-sans text-[11px] text-[#EAE5D9] leading-relaxed font-medium">
                    {lockMessage}
                  </p>
                  {/* Tooltip caret pointing up */}
                  <div className={`absolute -top-1 w-2 h-2 bg-[#08150D] border-l border-t border-[#184C2E] rotate-45 ${caretClass}`}></div>
                </div>
              </div>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className="px-3 py-1 rounded-lg text-[#A6A095] hover:text-[#CEFF00] hover:bg-[#1C5433] font-mono text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      </div>

      {/* Optional On-Demand Cache Clear & Re-synthesize Button */}
      {onClearCache && (
        <button
          onClick={onClearCache}
          disabled={isLoading || isClearing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#08150D] border border-[#184C2E] text-[#CEFF00] hover:bg-[#CEFF00] hover:border-[#CEFF00] hover:text-black font-mono text-xs font-bold transition-all cursor-pointer active:scale-95 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Clear cache and re-analyze fresh"
        >
          <span className={isClearing ? "animate-spin inline-block text-[10px]" : "text-[11px]"}>
            {isClearing ? "⏳" : "↻"}
          </span>
          <span>{isClearing ? "Re-analyzing..." : "Clear Cache & Re-analyze"}</span>
        </button>
      )}
    </div>
  );
}
