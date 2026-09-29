import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, DownloadSimple, Sparkle } from "@phosphor-icons/react";
import { TrexioLogo } from "@/components/site/TrexioLogo";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (installed)
    const inStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setIsStandalone(inStandalone);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.__trexioPwaPrompt = e; // Store globally so explicit buttons can trigger it

      // Show install prompt if user hasn't dismissed it recently
      const dismissed = localStorage.getItem("trexio_pwa_dismissed");
      if (!dismissed && !inStandalone) {
        // Non-intrusive delay (3 seconds) for natural engagement
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    };

    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      window.__trexioPwaPrompt = null;
      setIsStandalone(true);
      console.log("Trexio PWA installed successfully!");
    };

    // Custom event listener to trigger prompt from navigation or header
    const handleTriggerPrompt = () => {
      if (window.__trexioPwaPrompt) {
        setDeferredPrompt(window.__trexioPwaPrompt);
        setShowPrompt(true);
      } else {
        alert("Aplikasi Trexio sudah ter-install atau peramban Anda belum mendukung instalasi otomatis.");
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("trexio-trigger-install", handleTriggerPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("trexio-trigger-install", handleTriggerPrompt);
    };
  }, []);

  if (!showPrompt || !deferredPrompt || isStandalone) return null;

  async function handleInstall() {
    setShowPrompt(false);
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        console.log("User accepted Trexio PWA install prompt");
      }
    } catch (e) {
      console.warn("Installation error:", e);
    }
    setDeferredPrompt(null);
    window.__trexioPwaPrompt = null;
  }

  function handleDismiss() {
    setShowPrompt(false);
    localStorage.setItem("trexio_pwa_dismissed", Date.now().toString());
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity md:hidden"
        onClick={handleDismiss}
      />

      {/* Modern Installation Bottom Sheet (Mobile) & Floating Banner (Desktop) */}
      <div
        data-testid="pwa-install-banner"
        className="fixed bottom-0 left-0 right-0 md:bottom-6 md:right-6 md:left-auto md:w-[420px] z-50 bg-card border-t md:border border-border shadow-2xl rounded-t-3xl md:rounded-2xl p-6 transition-all transform animate-in slide-in-from-bottom duration-300 pb-safe"
      >
        <button
          onClick={handleDismiss}
          aria-label="Tutup"
          data-testid="pwa-dismiss-btn"
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-start gap-4">
          <div className="shrink-0 p-1 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <TrexioLogo variant="icon" size="lg" />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-extrabold text-base tracking-tight text-foreground">
                Trexio
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                <Sparkle size={12} weight="fill" /> App Native
              </span>
            </div>
            <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
              Adventure Marketplace — Track Every Journey
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Install Trexio untuk akses lebih cepat ke petualanganmu, pemesanan offline, dan notifikasi langsung.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Button
            data-testid="pwa-install-btn"
            onClick={handleInstall}
            className="flex-1 h-12 rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--secondary))]/90 font-bold text-sm shadow-md flex items-center justify-center gap-2 trx-btn-press"
          >
            <DownloadSimple size={18} weight="bold" /> Install Trexio
          </Button>

          <Button
            variant="outline"
            onClick={handleDismiss}
            className="h-12 px-5 rounded-xl border-border font-bold text-sm text-muted-foreground hover:text-foreground"
          >
            Nanti
          </Button>
        </div>
      </div>
    </>
  );
}

export default InstallPrompt;
