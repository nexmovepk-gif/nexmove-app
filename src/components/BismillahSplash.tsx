"use client";

import React, { useEffect, useState } from "react";

export default function BismillahSplash() {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Check session storage to only show once per browser session
    try {
      const splashShown = sessionStorage.getItem("nexmove_splash_shown");
      if (!splashShown) {
        setIsMounted(true);
        setIsVisible(true);

        // Keep active for exactly 3.5 seconds, then start smooth fade-out
        const timer = setTimeout(() => {
          setIsFadingOut(true);

          // Mark in sessionStorage as completed
          sessionStorage.setItem("nexmove_splash_shown", "true");

          // Unmount after 0.5s fade-out transition completes (total 4.0s)
          const unmountTimer = setTimeout(() => {
            setIsVisible(false);
            setIsMounted(false);
          }, 500);

          return () => clearTimeout(unmountTimer);
        }, 3500);

        return () => clearTimeout(timer);
      }
    } catch {
      // In case sessionStorage is blocked (e.g. private mode quirks), gracefully do not block UI
      setIsMounted(false);
      setIsVisible(false);
    }
  }, []);

  if (!isMounted || !isVisible) {
    return null;
  }

  return (
    <div
      id="nexmove-bismillah-splash"
      aria-hidden={!isVisible}
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0B0F19] overflow-hidden select-none transition-all duration-500 ease-in-out ${
        isFadingOut ? "opacity-0 scale-[1.03] blur-sm pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      {/* Dynamic Ambient Glow Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-gradient-to-tr from-emerald-500/10 via-amber-500/15 to-emerald-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-amber-400/10 rounded-full blur-2xl animate-bismillah-glow" />
        {/* Subtle Luxury Radial Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
      </div>

      {/* Decorative Geometric Ring */}
      <div className="relative flex flex-col items-center justify-center px-4 max-w-4xl w-full">
        <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-amber-500/20 border-dashed animate-[spin_40s_linear_infinite] pointer-events-none opacity-40" />
        <div className="absolute w-80 h-80 sm:w-[26rem] sm:h-[26rem] rounded-full border border-emerald-500/15 pointer-events-none opacity-30 animate-pulse" />

        {/* Top Emblem / Motif */}
        <div className="mb-4 sm:mb-6 flex items-center gap-3 opacity-90 animate-bismillah-fade-in">
          <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
          <div className="w-2 h-2 rotate-45 border border-amber-400/80 bg-emerald-500/30" />
          <div className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
        </div>

        {/* Bismillah Calligraphy Container with RTL Handwriting Mask Animation */}
        <div className="relative py-4 px-2 sm:px-6 w-full flex justify-center items-center">
          {/* Main Calligraphy Text with SVG & Arabic Font Rendering */}
          <div
            className="bismillah-rtl-animated text-center select-none font-serif tracking-wide"
            dir="rtl"
          >
            <h1
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-l from-amber-200 via-amber-400 to-emerald-300 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(245,158,11,0.45)] leading-relaxed sm:leading-loose py-2"
              style={{
                fontFamily:
                  "'Traditional Arabic', 'Scheherazade New', 'Amiri', 'Noto Naskh Arabic', 'Al Majeed Quranic Font', 'Lateef', serif",
                textShadow: "0 0 35px rgba(245, 158, 11, 0.3), 0 0 15px rgba(16, 185, 129, 0.2)",
              }}
            >
              بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </h1>
          </div>
        </div>

        {/* Translation & Subtitle */}
        <div className="mt-3 sm:mt-5 flex flex-col items-center text-center animate-bismillah-fade-in-delayed">
          <p className="text-xs sm:text-sm font-medium tracking-wider text-amber-200/80 uppercase">
            In the Name of Allah, the Most Gracious, the Most Merciful
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[11px] sm:text-xs tracking-[0.25em] font-semibold text-slate-400 uppercase">
              NexMove Ecosystem
            </span>
          </div>
        </div>

        {/* Bottom Flourish */}
        <div className="mt-6 flex items-center gap-3 opacity-80 animate-bismillah-fade-in-delayed">
          <div className="h-[1px] w-16 sm:w-28 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
          <div className="w-1.5 h-1.5 rotate-45 bg-amber-400" />
          <div className="h-[1px] w-16 sm:w-28 bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
        </div>
      </div>
    </div>
  );
}
