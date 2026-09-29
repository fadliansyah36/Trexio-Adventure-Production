import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowClockwise, Sparkle } from "@phosphor-icons/react";

export default function PWAUpdateToast() {
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;

        // If a service worker is waiting to activate
        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
          setShowUpdate(true);
        }

        // Listen for new updates found
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setShowUpdate(true);
              }
            });
          }
        });
      });

      // Reload window when new worker claims controller
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const handleApplyUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    } else {
      window.location.reload();
    }
  };

  if (!showUpdate) return null;

  return (
    <div
      data-testid="pwa-update-toast"
      className="fixed top-4 right-4 z-50 bg-card border border-border shadow-2xl rounded-2xl p-4 flex items-center gap-3 max-w-sm animate-in slide-in-from-top duration-300"
    >
      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
        <Sparkle size={20} weight="fill" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-foreground">Versi baru Trexio tersedia</div>
        <div className="text-[11px] text-muted-foreground">Perbarui untuk performa & fitur terbaik.</div>
      </div>
      <Button
        size="sm"
        onClick={handleApplyUpdate}
        className="bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--secondary))]/90 font-bold text-xs h-8 px-3 rounded-lg flex items-center gap-1 shrink-0"
      >
        <ArrowClockwise size={14} /> Perbarui
      </Button>
    </div>
  );
}
