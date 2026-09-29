import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { WifiSlash, ArrowClockwise } from "@phosphor-icons/react";
import { TrexioLogo } from "@/components/site/TrexioLogo";

export function Offline({ onRetry }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRefresh = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  if (isOnline) return null;

  return (
    <div
      data-testid="offline-screen"
      className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300"
    >
      <div className="h-20 w-20 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6 shadow-sm border border-amber-500/20">
        <WifiSlash size={40} weight="bold" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
        <TrexioLogo variant="icon" size="xs" /> Mode Offline
      </div>

      <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mb-2">
        Kamu Sedang Offline
      </h2>

      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed mb-6">
        Periksa koneksi internetmu untuk melanjutkan pencarian, melihat detail destinasi, dan melakukan pemesanan petualangan outdoor.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
        <Button
          onClick={handleRefresh}
          className="w-full h-12 rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--secondary))]/90 font-bold text-sm shadow-md flex items-center justify-center gap-2 trx-btn-press"
        >
          <ArrowClockwise size={18} weight="bold" /> Coba Lagi
        </Button>
      </div>

      <p className="mt-8 text-xs text-muted-foreground font-semibold tracking-wider uppercase">
        Trexio — Track Every Journey
      </p>
    </div>
  );
}

export default Offline;
