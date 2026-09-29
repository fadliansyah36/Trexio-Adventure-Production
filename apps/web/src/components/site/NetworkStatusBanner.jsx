import { useState, useEffect } from "react";
import { WifiHigh, WifiSlash, ArrowClockwise } from "@phosphor-icons/react";

export default function NetworkStatusBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBackOnline(true);
      const timer = setTimeout(() => {
        setShowBackOnline(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBackOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !showBackOnline) return null;

  return (
    <div
      data-testid="network-status-banner"
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-xl border flex items-center gap-2.5 text-xs font-bold transition-all duration-300 animate-in fade-in slide-in-from-top ${
        !isOnline
          ? "bg-amber-600 text-white border-amber-500/50"
          : "bg-emerald-700 text-white border-emerald-500/50"
      }`}
    >
      {!isOnline ? (
        <>
          <WifiSlash size={16} weight="bold" className="animate-pulse" />
          <span>Kamu Sedang Offline</span>
          <button
            onClick={() => window.location.reload()}
            className="ml-2 px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center gap-1 transition-colors text-[11px]"
          >
            <ArrowClockwise size={12} /> Coba Lagi
          </button>
        </>
      ) : (
        <>
          <WifiHigh size={16} weight="bold" />
          <span>Koneksi Kembali</span>
        </>
      )}
    </div>
  );
}
