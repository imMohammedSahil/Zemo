import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import API from "../services/api";

export default function EmailEntryModal({ isOpen, onClose, onEnterSuccess }) {
  const [savedEmail, setSavedEmail] = useState("");
  const [isDifferentMode, setIsDifferentMode] = useState(false);
  const [inputEmail, setInputEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  // Lock body scroll and pause Lenis while modal is open to prevent page jumps
  useEffect(() => {
    if (isOpen) {
      window.__lenis?.stop();
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
        window.__lenis?.start();
      };
    }
  }, [isOpen]);

  // Sync saved email from localStorage on open
  useEffect(() => {
    if (isOpen) {
      const existing = localStorage.getItem("zemo_user_email") || "";
      setSavedEmail(existing);
      setIsDifferentMode(false);
      setInputEmail(existing ? "" : "");
      setError("");

      // Auto-focus input without scrolling the background page
      if (!existing) {
        setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 150);
      }
    }
  }, [isOpen]);

  // Handle focus when switching to different mode without scrolling
  useEffect(() => {
    if (isDifferentMode && isOpen) {
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 150);
    }
  }, [isDifferentMode, isOpen]);

  // Handle Esc key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const validateEmail = (email) => {
    const trimmed = email.trim().toLowerCase();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(trimmed);
  };

  const handleConfirmExisting = async (emailToUse) => {
    setLoading(true);
    setError("");
    try {
      localStorage.setItem("zemo_user_email", emailToUse);
      onEnterSuccess(emailToUse);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterNewEmail = async (e) => {
    if (e) e.preventDefault();

    let email = inputEmail.trim().toLowerCase();
    if (!email) {
      setError("Please enter your Gmail address");
      return;
    }

    // Auto-append @gmail.com if user only typed username
    if (!email.includes("@")) {
      email = `${email}@gmail.com`;
      setInputEmail(email);
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address (e.g. name@gmail.com)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await API.post("/user/enter-email", { email });
      localStorage.setItem("zemo_user_email", email);
      onEnterSuccess(email);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        // Validation error from AbstractAPI (e.g. invalid mailbox or bad domain)
        setError(err.response.data.error);
        return;
      }
      console.warn("Backend unreachable, fallback locally:", err);
      // Fallback: save locally and proceed if server is offline
      localStorage.setItem("zemo_user_email", email);
      onEnterSuccess(email);
    } finally {
      setLoading(false);
    }
  };

  const handleAppendGmailDomain = () => {
    if (!inputEmail.includes("@")) {
      setInputEmail(prev => prev.trim() ? `${prev.trim()}@gmail.com` : "");
      inputRef.current?.focus({ preventScroll: true });
    }
  };

  return createPortal(
    <div
      data-lenis-prevent
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/45 backdrop-blur-[7px]"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-3xl bg-[#07130A] border border-[#1B5230]/70 shadow-[0_25px_70px_rgba(0,0,0,0.85)] p-6 sm:p-8 overflow-hidden text-left transition-all">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-36 bg-[#CEFF00]/12 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button with Acid Chartreuse Hover Fill */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#0E2A1B]/80 hover:bg-[#CEFF00] border border-[#184C2E] hover:border-[#CEFF00] text-[#9EB0A3] hover:text-black flex items-center justify-center transition-all duration-200 text-sm font-mono font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(206,255,0,0.4)]"
          aria-label="Close"
        >
          ✕
        </button>

        {/* =========================================================================
            SCENARIO 1: RETURNING USER (Saved Email Exists & Not in 'Different' mode)
            ========================================================================= */}
        {savedEmail && !isDifferentMode ? (
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#0E2A1B] border border-[#163E26] mb-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#CEFF00]">
                Good to see you again
              </span>
            </div>

            <h3 className="text-[20px] sm:text-[22px] font-black text-[#F5F2EA] tracking-tight leading-snug">
              I’ve got your email saved — ready?
            </h3>
            
            <p className="mt-2 text-xs sm:text-sm text-[#9EB0A3] leading-relaxed">
              Happy to keep looking out for your deals here — step right in, or switch inboxes anytime.
            </p>

            {/* Current Email Badge Card */}
            <div className="mt-5 p-4 rounded-2xl bg-[#061009] border border-[#163E26] flex items-center justify-between gap-3 shadow-inner">
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-[#6D8274] uppercase tracking-wider block">
                  Connected Gmail
                </span>
                <span className="font-mono text-sm sm:text-base font-bold text-[#CEFF00] truncate block mt-0.5">
                  {savedEmail}
                </span>
              </div>
              <div className="shrink-0 w-8 h-8 rounded-xl bg-[#0E2A1B] border border-[#184C2E] flex items-center justify-center text-[#CEFF00]">
                ✓
              </div>
            </div>

            {/* Primary & Secondary Action Choices */}
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => handleConfirmExisting(savedEmail)}
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-[#CEFF00] hover:bg-[#b8e600] text-black font-mono font-black text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 group cursor-pointer outline-none focus:outline-none focus:ring-0 select-none"
              >
                <span>{loading ? "Connecting..." : `Continue as ${savedEmail.split("@")[0]}`}</span>
                <span className="transition-transform group-hover:translate-x-1 font-bold">→</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDifferentMode(true);
                  setError("");
                }}
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#08150D] hover:bg-[#0E2A1B] border border-[#184C2E] hover:border-[#22633C] text-[#D8D2C4] hover:text-[#CEFF00] font-mono font-bold text-xs sm:text-sm transition-colors duration-150 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer outline-none focus:outline-none focus:ring-0 select-none"
              >
                <span>Use a different Gmail ID</span>
                <span className="font-mono text-xs">↻</span>
              </button>
            </div>
          </div>
        ) : (
          /* =========================================================================
             SCENARIO 2: FIRST-TIME VISITOR OR SWITCHING TO DIFFERENT GMAIL
             ========================================================================= */
          <div>
            {savedEmail && (
              <button
                type="button"
                onClick={() => {
                  setIsDifferentMode(false);
                  setError("");
                }}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#9EB0A3] hover:text-[#CEFF00] mb-4 transition-colors cursor-pointer"
              >
                <span>←</span>
                <span>Back to {savedEmail}</span>
              </button>
            )}

            {/* Level 1: Primary Heading */}
            <h3 className="text-2xl sm:text-[25px] font-black text-[#F5F2EA] tracking-tight leading-snug">
              {savedEmail ? "Enter Different Gmail ID" : "Where can I send you a little good news?"}
            </h3>
            
            {/* Level 2: Warm Subtitle */}
            <p className="mt-2 text-xs sm:text-sm text-[#9EB0A3] leading-relaxed">
              Drop your Gmail and I’ll send a quick hello, then watch for price drops while you rest.
            </p>

            <form onSubmit={handleRegisterNewEmail} className="mt-6 space-y-4">
              {/* Level 3: Form Input Group */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#A6A095] mb-2">
                  Gmail Address
                </label>
                
                <div className="relative group p-[1.5px] rounded-2xl bg-gradient-to-r from-[#163E26] via-[#227A4E] to-[#163E26] hover:from-[#227A4E] hover:via-[#CEFF00] hover:to-[#227A4E] focus-within:from-[#227A4E] focus-within:via-[#CEFF00] focus-within:to-[#227A4E] transition-all duration-300">
                  <div className="relative bg-[#061009] rounded-[15px] flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6D8274] z-10">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                      </svg>
                    </div>
                    <input
                      ref={inputRef}
                      type="email"
                      value={inputEmail}
                      onChange={(e) => {
                        setInputEmail(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="yourname@gmail.com"
                      disabled={loading}
                      className="w-full pl-10 pr-24 py-3.5 bg-transparent border-0 text-[#F5F2EA] placeholder-[#4B5E52] font-mono text-sm outline-none focus:ring-0"
                    />
                    {!inputEmail.includes("@") && inputEmail.length > 2 && (
                      <button
                        type="button"
                        onClick={handleAppendGmailDomain}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-[#0E2A1B] border border-[#184C2E] text-[#CEFF00] font-mono text-[11px] hover:bg-[#163E26] transition-colors cursor-pointer z-10"
                      >
                        + @gmail.com
                      </button>
                    )}
                  </div>
                </div>

                {error && (
                  <p className="mt-2 text-xs font-mono text-red-400 flex items-center gap-1.5 animate-fadeIn">
                    <span>⚠</span>
                    <span>{error}</span>
                  </p>
                )}
              </div>

              {/* Level 4: Clear Primary CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 rounded-2xl bg-[#CEFF00] hover:bg-[#b8e600] text-black font-mono font-black text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                      <span>Connecting...</span>
                    </span>
                  ) : (
                    <>
                      <span>{savedEmail ? "Save & Watch My Deals" : "I’m In — Watch My Deals"}</span>
                      <span className="transition-transform group-hover:translate-x-1 font-bold">→</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
