import { useState, useEffect, useRef } from "react";
import { CheckCircle, FloppyDisk, WarningCircle, CloudCheck, ArrowsClockwise, PencilSimple } from "@phosphor-icons/react";

/**
 * Custom hook that debounces form changes, writes to localStorage as an instant fallback,
 * and calls onSave to sync with the backend while the user is typing.
 */
export function useAutoSave({
  data,
  onSave,
  storageKey,
  debounceMs = 600,
  enabled = true,
}) {
  const [status, setStatus] = useState("idle"); // 'idle' | 'typing' | 'saving' | 'saved' | 'error'
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const isFirstRender = useRef(true);
  const timerRef = useRef(null);

  // Restore saved timestamp on mount if stored in localStorage
  useEffect(() => {
    if (storageKey) {
      try {
        const raw = localStorage.getItem(`${storageKey}_meta`);
        if (raw) {
          const meta = JSON.parse(raw);
          if (meta.lastSavedAt) {
            setLastSavedAt(new Date(meta.lastSavedAt));
            setStatus("saved");
          }
        }
      } catch {
        // ignore storage errors
      }
    }
  }, [storageKey]);

  useEffect(() => {
    // Skip auto-save on initial mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!enabled) return;

    setStatus("typing");

    // Backup to localStorage immediately
    if (storageKey && data) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch {
        // ignore
      }
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      setStatus("saving");
      try {
        if (onSave) {
          await onSave(data);
        }
        const now = new Date();
        setLastSavedAt(now);
        setStatus("saved");

        if (storageKey) {
          try {
            localStorage.setItem(
              `${storageKey}_meta`,
              JSON.stringify({ lastSavedAt: now.toISOString() })
            );
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.warn("[AutoSave] Error saving draft:", err);
        setStatus("error");
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, enabled, debounceMs]);

  return { status, lastSavedAt };
}

/**
 * Badge Component for displaying real-time Auto-Save status in form headers/footers.
 */
export function AutoSaveBadge({ status, lastSavedAt, testid = "auto-save-status" }) {
  const formatTime = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div
      data-testid={testid}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-300 animate-in fade-in ${
        status === "saving"
          ? "bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400"
          : status === "typing"
          ? "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300"
          : status === "saved"
          ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300"
          : status === "error"
          ? "bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-300"
          : "bg-muted text-muted-foreground border-border"
      }`}
    >
      {status === "saving" && (
        <>
          <ArrowsClockwise size={14} className="animate-spin text-blue-500 shrink-0" />
          <span>Menyimpan otomatis ke server...</span>
        </>
      )}

      {status === "typing" && (
        <>
          <PencilSimple size={14} className="animate-pulse text-amber-500 shrink-0" />
          <span>Sedang mengetik... Perubahan tersimpan lokal</span>
        </>
      )}

      {status === "saved" && (
        <>
          <CloudCheck size={15} weight="fill" className="text-emerald-500 shrink-0" />
          <span>Draft tersimpan otomatis {lastSavedAt ? `(${formatTime(lastSavedAt)})` : ""}</span>
        </>
      )}

      {status === "error" && (
        <>
          <WarningCircle size={15} weight="fill" className="text-rose-500 shrink-0" />
          <span>Gagal koneksi server (Tersimpan di memori lokal)</span>
        </>
      )}

      {status === "idle" && (
        <>
          <FloppyDisk size={14} className="text-muted-foreground shrink-0" />
          <span>Auto-Save Aktif</span>
        </>
      )}
    </div>
  );
}
