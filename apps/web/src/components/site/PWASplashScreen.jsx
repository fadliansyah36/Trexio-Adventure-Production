import React, { useState, useEffect } from "react";
import { TrexioLogo } from "@/components/site/TrexioLogo";

// Module-level guard: once the splash has been shown (or dismissed) in this page
// session, any subsequent mount/remount hides immediately. This makes the splash
// bulletproof against re-render/remount loops that could otherwise keep it stuck.
let SPLASH_DISMISSED = false;

export function PWASplashScreen({ onFinished }) {
  const [visible, setVisible] = useState(!SPLASH_DISMISSED);
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    // Already shown/dismissed once (remount or same-tab session) -> hide now.
    if (SPLASH_DISMISSED || sessionStorage.getItem("trexio_pwa_splash_shown")) {
      SPLASH_DISMISSED = true;
      setVisible(false);
      if (onFinished) onFinished();
      return;
    }

    // Mark dismissed up-front so any remount during the animation hides instantly.
    SPLASH_DISMISSED = true;
    sessionStorage.setItem("trexio_pwa_splash_shown", "true");

    const p1 = setTimeout(() => setProgress(55), 250);
    const p2 = setTimeout(() => setProgress(88), 550);
    const p3 = setTimeout(() => setProgress(100), 850);
    const fadeTimer = setTimeout(() => setFading(true), 1100);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      if (onFinished) onFinished();
    }, 1500);

    return () => {
      clearTimeout(p1);
      clearTimeout(p2);
      clearTimeout(p3);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-slate-950 text-white select-none transition-opacity duration-500 ease-in-out ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 35%, rgba(16, 185, 129, 0.15) 0%, rgba(2, 44, 34, 0.95) 70%, rgba(2, 6, 23, 1) 100%)",
      }}
    >
      {/* Top subtle badge */}
      <div className="pt-12 md:pt-16 flex items-center gap-2 opacity-60">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-[10px] font-black tracking-[0.25em] uppercase text-emerald-300">
          Adventure PWA Ready
        </span>
      </div>

      {/* Main Center Logo & Brand */}
      <div className="my-auto transform scale-105 transition-transform duration-700">
        <TrexioLogo variant="splash" showTagline={true} />
      </div>

      {/* Bottom Progress & Footer Status */}
      <div className="pb-12 md:pb-16 w-full max-w-xs px-6 flex flex-col items-center gap-3">
        {/* Progress Bar Container */}
        <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-emerald-500/20 backdrop-blur-md">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(34,197,94,0.6)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between w-full text-[10px] text-slate-400 font-medium tracking-wider">
          <span>Memuat Aplikasi...</span>
          <span className="text-emerald-400 font-extrabold">{progress}%</span>
        </div>
      </div>
    </div>
  );
}

export default PWASplashScreen;
