import { useState, useEffect, useRef } from "react";
import API from "../services/api";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const getStoredReadTime = () => {
    try {
      return Number(localStorage.getItem("zemo_last_read_notifs") || 0);
    } catch {
      return 0;
    }
  };

  const setStoredReadTime = (time) => {
    try {
      localStorage.setItem("zemo_last_read_notifs", String(time));
    } catch {}
  };

  async function loadNotifications() {
    try {
      const res = await API.get("/notifications");
      const list = res.data || [];
      setNotifications(list);

      const lastRead = getStoredReadTime();
      const unread = list.filter(n => {
        const t = new Date(n.sentAt || n.createdAt || 0).getTime();
        return t > lastRead;
      }).length;

      setUnreadCount(unread);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadNotifications();
    const handleUpdate = () => loadNotifications();
    window.addEventListener("notificationUpdated", handleUpdate);
    const interval = setInterval(loadNotifications, 4000);
    return () => {
      window.removeEventListener("notificationUpdated", handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleToggle = () => {
    const nextState = !open;
    setOpen(nextState);
    if (nextState) {
      setStoredReadTime(Date.now());
      setUnreadCount(0);
      loadNotifications();
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className={`h-8 w-8 rounded-full border transition-colors duration-150 relative flex items-center justify-center cursor-pointer active:scale-95 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none select-none ${
          open
            ? "bg-[#CEFF00] border-[#CEFF00] text-black shadow-sm"
            : "bg-[#08150D] border-[#184C2E] text-white hover:bg-[#CEFF00] hover:border-[#CEFF00] hover:text-black"
        }`}
        aria-label="Toggle notifications"
      >
        {/* Sleek Modern Bell SVG */}
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.65}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Live Badge Indicator - visible only when unread and clears upon reading */}
        {unreadCount > 0 && !open && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#CEFF00] border-2 border-[#060907] text-[9px] font-mono font-black text-black items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Architectural Dropdown Drawer */}
      {open && (
        <div 
          data-lenis-prevent
          className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-black border border-[#163E26] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150"
        >
          
          {/* Drawer Header */}
          <div className="px-4 pt-3.5 pb-2 flex items-center justify-between bg-black border-b border-[#163E26]/60 select-none">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-[#CEFF00] text-xs sm:text-sm tracking-wider uppercase">
                Wish Bell
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#CEFF00] bg-[#0E2A1B] px-2.5 py-0.5 rounded-full border border-[#163E26] font-bold shadow-sm">
              {notifications.length} {notifications.length === 1 ? "Alert" : "Alerts"}
            </span>
          </div>

          {/* Alert Content Stage */}
          <div 
            data-lenis-prevent
            className="max-h-80 overflow-y-auto overscroll-contain divide-y divide-[#143E26]/40 custom-notification-scroll"
            onWheel={(e) => {
              e.stopPropagation();
              const el = e.currentTarget;
              if (!el) return;
              const { scrollTop, scrollHeight, clientHeight } = el;
              const isScrollingUp = e.deltaY < 0;
              const isScrollingDown = e.deltaY > 0;
              if (isScrollingUp && scrollTop <= 0) {
                e.preventDefault();
              } else if (isScrollingDown && scrollTop + clientHeight >= scrollHeight - 1) {
                e.preventDefault();
              }
            }}
          >
            {notifications.length === 0 ? (
              <div className="p-7 text-center flex flex-col items-center">
                <h4 className="text-xs sm:text-sm font-mono font-black text-[#EAE5D9] mb-1.5 tracking-tight">
                  Shh... deals are snoozing
                </h4>
                <p className="text-[11px] font-sans text-[#A6A095] max-w-[240px] leading-relaxed">
                  I’m wide awake keeping watch — <span className="text-[#CEFF00]/90 font-medium">I’ll chime the moment prices drop.</span>
                </p>
              </div>
            ) : (
              notifications.map((n, i) => (
                <div
                  key={n._id || i}
                  className="p-3.5 hover:bg-[#0E2A1B]/70 transition-colors text-xs text-[#EAE5D9] flex items-stretch gap-3 group cursor-pointer"
                >
                  <div className="w-[3px] rounded-full bg-[#CEFF00] shadow-[0_0_6px_rgba(206,255,0,0.35)] group-hover:shadow-[0_0_10px_#CEFF00] transition-all shrink-0 my-0.5"></div>
                  <div className="flex-1 min-w-0">
                    {n.title && !/wish bell/i.test(n.title) && (
                      <div className="font-mono font-bold text-[#CEFF00] text-xs mb-1">
                        {n.title.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").trim()}
                      </div>
                    )}
                    <p className="text-[11.5px] font-sans text-[#EAE5D9] leading-relaxed break-words">
                      {(() => {
                        let msg = n.message || "";
                        // If it's the old verbose template
                        const match = msg.match(/keeping watch on (.+?) for (₹[\d,]+)/i);
                        if (match) {
                          let titlePart = match[1].replace(/\[.*?\]|\(.*?\)/g, "").replace(/\b(Racing Edition|Ergonomic|with 3D Armrests|Breathable Fabric|High Performance|Wi-Fi|GB RAM|Storage|Display|In-Box)\b/gi, "").trim();
                          const words = titlePart.split(/\s+/).filter(Boolean);
                          const short = words.slice(0, 4).join(" ").replace(/[,|\-–—:]+$/, "").trim();
                          msg = `Chasing ${short || titlePart} around the clock until it surrenders at ${match[2]}`;
                        } else if (msg.startsWith("Tracking ") || msg.startsWith("Keeping a warm watch on ")) {
                          const trackMatch = msg.match(/^(?:Tracking|Keeping a warm watch on) (.+?) at (₹[\d,]+)$/i);
                          if (trackMatch) {
                            let titlePart = trackMatch[1].replace(/\[.*?\]|\(.*?\)/g, "").replace(/\b(Racing Edition|Ergonomic|with 3D Armrests|Breathable Fabric|High Performance|Wi-Fi|GB RAM|Storage|Display|In-Box)\b/gi, "").trim();
                            const words = titlePart.split(/\s+/).filter(Boolean);
                            const short = words.slice(0, 4).join(" ").replace(/[,|\-–—:]+$/, "").trim();
                            msg = `Chasing ${short || titlePart} around the clock until it surrenders at ${trackMatch[2]}`;
                          }
                        }
                        return msg.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "").trim();
                      })()}
                    </p>
                    <span className="text-[10px] text-[#A6A095] font-mono mt-1.5 block">
                      {new Date(n.sentAt || n.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
}