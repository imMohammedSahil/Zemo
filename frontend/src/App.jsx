import { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Lenis from "lenis";
import gsap from "gsap";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import InsightsPage from "./pages/InsightsPage";
import CustomerReviewsPage from "./pages/CustomerReviewsPage";
import WishlistPage from "./pages/WishlistPage";
import CompareStoresPage from "./pages/CompareStoresPage";
import BankOffersPage from "./pages/BankOffersPage";
import InputTestingPage from "./pages/InputTestingPage";
import NotificationBell from "./components/NotificationBell";
import SoundPill from "./components/SoundPill";

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [hasInteractedSound, setHasInteractedSound] = useState(false);
  const audioRef = useRef(null);
  const musicRef = useRef(null);
  const userMutedRef = useRef(false);
  const GIORNI_VOLUME = 0.25; // Elevated volume for Ludovico Einaudi - I Giorni

  useEffect(() => {
    // Clean up any old session storage flag so refresh always shows it
    sessionStorage.removeItem("zemo_sound_acknowledged");
  }, []);

  const updateAudioVolumes = () => {
    if (!audioRef.current || !musicRef.current) return;
    if (userMutedRef.current || !isPlayingSound) return;

    if (location.pathname === "/") {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const heroHeight = window.innerHeight || 800;
      // Start crossfade at 15% scroll, completely transition by 85% of Hero
      const fadeStart = heroHeight * 0.15;
      const fadeEnd = heroHeight * 0.85;

      let progress = 0;
      if (scrollY > fadeStart) {
        progress = Math.min(1, Math.max(0, (scrollY - fadeStart) / (fadeEnd - fadeStart)));
      }

      // Soft background rain layer at 0.075 inside Hero, fades to 0 as you scroll down
      audioRef.current.volume = Math.max(0, Math.min(1, +(0.075 * (1 - progress)).toFixed(3)));
      if (audioRef.current.volume > 0 && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }

      // The "Shelter" Concept:
      // Music plays everywhere in the shelter. Outside in the Hero, the rain masks it (volume = 0).
      // As you scroll down or step inside, the music smoothly emerges.
      if (progress > 0) {
        // Scrolling down past hero: if music hasn't started yet (e.g. fresh refresh), start it fresh!
        if (musicRef.current.paused) {
          musicRef.current.play().catch(() => {});
        }
        musicRef.current.volume = Math.max(0, Math.min(1, +(GIORNI_VOLUME * progress).toFixed(3)));
      } else {
        // At the top of hero:
        // Rain masks the music (volume 0), but if it was already playing, let it keep flowing silently
        musicRef.current.volume = 0;
      }
    } else {
      // Inside the shelter (Radar, Compare, Wishlist, etc):
      // Rain is strictly silenced and paused
      audioRef.current.volume = 0;
      if (!audioRef.current.paused) {
        audioRef.current.pause();
      }

      // Music flows continuously without interruption
      if (musicRef.current.paused) {
        if (musicRef.current.currentTime === 0) {
          musicRef.current.currentTime = 1.0;
        }
        musicRef.current.play().catch(() => {});
      }
      musicRef.current.volume = GIORNI_VOLUME;
    }
  };

  const toggleSound = () => {
    setHasInteractedSound(true);
    if (!audioRef.current || !musicRef.current) return;
    if (isPlayingSound) {
      userMutedRef.current = true;
      audioRef.current.pause();
      musicRef.current.pause();
      setIsPlayingSound(false);
    } else {
      userMutedRef.current = false;
      
      if (location.pathname === "/") {
        // Landing page: prepare rain volume before play
        audioRef.current.volume = 0.075;
        musicRef.current.volume = 0;
        const pRain = audioRef.current.play();
        if (pRain !== undefined) {
          pRain.then(() => {
            setIsPlayingSound(true);
            updateAudioVolumes();
          }).catch((err) => {
            console.warn("Audio play error:", err);
            setIsPlayingSound(false);
          });
        }
      } else {
        // Non-landing pages (Radar, Wishlist, Compare): NEVER play rain; play I Giorni directly
        audioRef.current.volume = 0;
        audioRef.current.pause();
        if (musicRef.current.currentTime < 1.0) {
          musicRef.current.currentTime = 1.0;
        }
        musicRef.current.volume = GIORNI_VOLUME;
        const pMusic = musicRef.current.play();
        if (pMusic !== undefined) {
          pMusic.then(() => {
            setIsPlayingSound(true);
          }).catch((err) => {
            console.warn("Audio play error:", err);
            setIsPlayingSound(false);
          });
        }
      }
    }
  };

  useEffect(() => {
    // First-Gesture Auto-Unlock across pages
    const handleFirstInteraction = () => {
      if (hasInteractedSound || userMutedRef.current || !audioRef.current || !musicRef.current) return;

      setHasInteractedSound(true);

      if (location.pathname === "/") {
        audioRef.current.volume = 0;
        musicRef.current.volume = 0;
        const pRain = audioRef.current.play();
        if (pRain !== undefined) {
          pRain.then(() => {
            setIsPlayingSound(true);
            let vol = 0;
            const fade = setInterval(() => {
              if (vol < 0.075 && audioRef.current) {
                vol = Math.min(0.075, +(vol + 0.01).toFixed(3));
                audioRef.current.volume = vol;
              } else {
                clearInterval(fade);
              }
            }, 80);
          }).catch((err) => console.warn("Autoplay blocked:", err));
        }
      } else {
        // On Radar or other routes: Rain is 0 and paused; start I Giorni directly
        audioRef.current.volume = 0;
        audioRef.current.pause();
        if (musicRef.current.currentTime < 1.0) {
          musicRef.current.currentTime = 1.0;
        }
        musicRef.current.volume = 0;
        const pMusic = musicRef.current.play();
        if (pMusic !== undefined) {
          pMusic.then(() => {
            setIsPlayingSound(true);
            let vol = 0;
            const fade = setInterval(() => {
              if (vol < GIORNI_VOLUME && musicRef.current) {
                vol = Math.min(GIORNI_VOLUME, +(vol + 0.02).toFixed(3));
                musicRef.current.volume = vol;
              } else {
                clearInterval(fade);
              }
            }, 60);
          }).catch((err) => console.warn("Autoplay blocked:", err));
        }
      }
    };

    const events = ["click", "touchstart"];
    events.forEach((evt) =>
      window.addEventListener(evt, handleFirstInteraction)
    );

    return () => {
      events.forEach((evt) =>
        window.removeEventListener(evt, handleFirstInteraction)
      );
    };
  }, [location.pathname, hasInteractedSound]);

  // Handle route changes and scroll crossfades
  useEffect(() => {
    updateAudioVolumes();
  }, [location.pathname, isPlayingSound]);

  useEffect(() => {
    const handleScrollCrossfade = () => {
      if (location.pathname === "/") {
        updateAudioVolumes();
      }
    };

    window.addEventListener("scroll", handleScrollCrossfade, { passive: true });
    return () => window.removeEventListener("scroll", handleScrollCrossfade);
  }, [isPlayingSound, location.pathname]);

  useEffect(() => {
    // Constant-speed smooth scrolling with zero acceleration
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => t, // Strictly linear — zero acceleration / deceleration curve
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.0,
      infinite: false
    });

    window.__lenis = lenis;

    function update(time) {
      lenis.raf(time * 1000);
    }

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      window.__lenis = null;
      gsap.ticker.remove(update);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    // When navigating to /dashboard:
    // If returning to a focused product or restoring previous position, Dashboard handles it.
    // But if entering from landing page or fresh navigation, ensure it starts at the top immediately.
    if (location.pathname === "/dashboard" || location.pathname === "/radar") {
      const hasRestoredProduct = sessionStorage.getItem("last_viewed_product_id");
      if (!hasRestoredProduct) {
        window.scrollTo({ top: 0, behavior: "instant" });
        if (window.__lenis) {
          window.__lenis.scrollTo(0, { immediate: true });
        }
      }
      return;
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    if (window.__lenis) {
      window.__lenis.scrollTo(0, { immediate: true });
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-zemo-bg text-slate-100 font-sans selection:bg-[#CEFF00] selection:text-[#0E2A1B] flex flex-col justify-between">
      
      {/* Main Navigation Bar */}
      <header className={`z-40 w-full transition-all ${location.pathname === "/" ? "absolute top-0 left-0 right-0 bg-transparent" : "relative bg-transparent"}`}>
        <div className="w-full pl-2 sm:pl-4 pr-4 sm:pr-6 py-2.5 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div 
            onClick={() => {
              if (location.pathname === "/" || location.pathname === "/dashboard") {
                window.scrollTo({ top: 0, behavior: "smooth" });
                if (window.__lenis) {
                  window.__lenis.scrollTo(0, { immediate: false });
                }
              } else {
                sessionStorage.removeItem("last_viewed_product_id");
                navigate("/dashboard");
                window.scrollTo({ top: 0, behavior: "smooth" });
                if (window.__lenis) {
                  window.__lenis.scrollTo(0, { immediate: false });
                }
              }
            }}
            className="flex items-center cursor-pointer group select-none"
          >
            <div className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 transition-transform group-hover:scale-105">
              <img 
                src="/logo.png" 
                alt="Zemo Logo" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleSound}
              aria-label={isPlayingSound ? "Mute ambient sound" : "Play ambient sound"}
              className={`h-8 px-3.5 rounded-full font-mono text-[11px] font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 border outline-none focus:outline-none focus:ring-0 focus-visible:outline-none group ${
                isPlayingSound
                  ? "bg-[#CEFF00] hover:bg-[#b8e600] text-black border-[#CEFF00]"
                  : "bg-[#08150D] hover:bg-[#CEFF00] border-[#184C2E] hover:border-[#CEFF00] text-white hover:text-black"
              }`}
            >
              {/* Sound wave equalizer */}
              <div className="flex items-center gap-[2px] h-3 px-0.5">
                <span
                  className={`w-[2px] rounded-full transition-colors animate-sound-wave-1 ${
                    isPlayingSound
                      ? "bg-black wave-running"
                      : "bg-white group-hover:bg-black wave-paused"
                  }`}
                />
                <span
                  className={`w-[2px] rounded-full transition-colors animate-sound-wave-2 ${
                    isPlayingSound
                      ? "bg-black wave-running"
                      : "bg-white group-hover:bg-black wave-paused"
                  }`}
                />
                <span
                  className={`w-[2px] rounded-full transition-colors animate-sound-wave-3 ${
                    isPlayingSound
                      ? "bg-black wave-running"
                      : "bg-white group-hover:bg-black wave-paused"
                  }`}
                />
                <span
                  className={`w-[2px] rounded-full transition-colors animate-sound-wave-4 ${
                    isPlayingSound
                      ? "bg-black wave-running"
                      : "bg-white group-hover:bg-black wave-paused"
                  }`}
                />
              </div>
              <span>
                {isPlayingSound ? "Sound On" : "Sound Off"}
              </span>
            </button>

            {location.pathname === "/" ? (
              <button
                onClick={() => {
                  navigate("/dashboard");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  if (window.__lenis) {
                    window.__lenis.scrollTo(0, { immediate: false });
                  }
                }}
                className="h-8 px-3.5 rounded-full bg-[#CEFF00] hover:bg-[#b8e600] text-black font-mono text-[11px] font-black transition-all cursor-pointer shadow-[0_0_12px_rgba(206,255,0,0.25)] active:scale-95 flex items-center justify-center gap-1.5 outline-none focus:outline-none focus:ring-0 select-none"
              >
                <span>Step Inside</span>
                <span>→</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  navigate("/");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  if (window.__lenis) {
                    window.__lenis.scrollTo(0, { immediate: false });
                  }
                }}
                className="h-8 px-3.5 rounded-full bg-[#08150D] hover:bg-[#CEFF00] border border-[#184C2E] hover:border-[#CEFF00] text-white hover:text-black font-mono text-[11px] font-bold transition-colors duration-150 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none select-none"
              >
                <span>About</span>
              </button>
            )}
            <NotificationBell />
          </div>

        </div>

        {/* Ambient Rain Audio (Hero section loop) */}
        <audio
          ref={audioRef}
          src="/rain_loop.mp3"
          loop
          preload="auto"
        />

        {/* Cinematic Soundtrack: Ludovico Einaudi - I Giorni (Crossfades in as user scrolls down past Hero) */}
        <audio
          ref={musicRef}
          src="/i_giorni.mp3"
          loop
          preload="auto"
        />
      </header>

      {/* Main Content Viewport */}
      <main className={`flex-1 w-full overflow-x-hidden ${location.pathname === "/" ? "p-0" : "max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3"}`}>
        <div key={location.pathname} className="page-cinematic-enter">
          <Routes location={location}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/radar" element={<Navigate to="/dashboard" replace />} />
            <Route path="/product/:id/reviews" element={<CustomerReviewsPage />} />
            <Route path="/product/:id/insights" element={<CustomerReviewsPage />} />
            <Route path="/product/:id/compare" element={<CompareStoresPage />} />
            <Route path="/product/:id/offers" element={<BankOffersPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/test-input" element={<InputTestingPage />} />
          </Routes>
        </div>
      </main>

      {/* Cursor Follower Sound Pill */}
      {location.pathname === "/" && (
        <SoundPill isPlaying={isPlayingSound} hasInteracted={hasInteractedSound} />
      )}

    </div>
  );
}

export default App;