import { useState, useEffect, useRef } from "react";

export default function SoundPill({ isPlaying, hasInteracted }) {
  const [hasMoved, setHasMoved] = useState(false);
  const [isInHero, setIsInHero] = useState(true);
  const pillRef = useRef(null);

  // Hide the pill when scrolling below the hero section
  useEffect(() => {
    const checkHeroVisibility = () => {
      const hero = document.getElementById("hero");
      if (hero) {
        const rect = hero.getBoundingClientRect();
        // Only visible while the hero section is in view
        setIsInHero(rect.bottom > 80);
      } else {
        setIsInHero(window.scrollY < window.innerHeight * 0.7);
      }
    };

    window.addEventListener("scroll", checkHeroVisibility, { passive: true });
    checkHeroVisibility();
    return () => window.removeEventListener("scroll", checkHeroVisibility);
  }, []);

  useEffect(() => {
    let targetX = -500;
    let targetY = -500;
    let currentX = -500;
    let currentY = -500;
    let initialized = false;
    let animId = null;

    const handlePointerMove = (e) => {
      targetX = e.clientX + 14;
      targetY = e.clientY - 34;

      // On first detection, instantly snap with zero lag or fly-in
      if (!initialized) {
        currentX = targetX;
        currentY = targetY;
        if (pillRef.current) {
          pillRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        }
        initialized = true;
        setHasMoved(true);
      }
    };

    const render = () => {
      if (initialized) {
        // Slow, fluid cinematic magnetic trail (0.14)
        currentX += (targetX - currentX) * 0.14;
        currentY += (targetY - currentY) * 0.14;

        if (pillRef.current) {
          pillRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        }
      }
      animId = requestAnimationFrame(render);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("mouseenter", handlePointerMove, { passive: true });
    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseenter", handlePointerMove);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  const isVisible = hasMoved && !isPlaying && !hasInteracted && isInHero;

  return (
    <div
      ref={pillRef}
      className={`fixed top-0 left-0 pointer-events-none z-[99999] select-none will-change-transform transition-all duration-500 ease-out ${
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}
      style={{ transform: "translate3d(-500px, -500px, 0)" }}
    >
      <div className="px-3.5 py-1.5 rounded-full bg-[#07130A]/95 text-[#CEFF00] font-mono font-black text-[11px] tracking-wider uppercase shadow-[0_12px_35px_rgba(0,0,0,0.8),0_0_15px_rgba(206,255,0,0.25)] backdrop-blur-xl flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#CEFF00] shadow-[0_0_8px_#CEFF00] inline-block animate-pulse" />
        <span>CLICK — TO ENABLE MUSIC</span>
      </div>
    </div>
  );
}
