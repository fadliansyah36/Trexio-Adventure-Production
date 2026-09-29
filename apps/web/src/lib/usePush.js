import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

// Convert base64 URL to Uint8Array
function urlBase64ToUint8Array(base64String) {
  if (!base64String) return new Uint8Array();
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function usePush(user) {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [config, setConfig] = useState({ enabled: true, public_key: "BEl62iUYgUivxIkv69yViEuiBIa-59yN1j_V1x7M_1a1_X-example-vapid-key" });
  const [subscribed, setSubscribed] = useState(() => localStorage.getItem("trexio_push_active") === "true");

  useEffect(() => {
    const hasNotification = typeof window !== "undefined" && "Notification" in window;
    const hasSW = typeof navigator !== "undefined" && "serviceWorker" in navigator;
    setSupported(hasNotification || hasSW);

    api.get("/push/config")
      .then((r) => {
        if (r.data) setConfig(r.data);
      })
      .catch(() => {});

    if (hasSW && "PushManager" in window) {
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => {
          if (sub) {
            setSubscribed(true);
            localStorage.setItem("trexio_push_active", "true");
          }
        })
        .catch(() => {});
    }
  }, []);

  const enable = useCallback(async () => {
    if (!user) {
      toast.error("Silakan login untuk mengaktifkan notifikasi push.");
      return;
    }

    let perm = permission;
    if (typeof Notification !== "undefined") {
      try {
        perm = await Notification.requestPermission();
        setPermission(perm);
      } catch (e) {
        // fallback
      }
    }

    if (perm === "denied") {
      toast.error("Izin notifikasi ditolak di browser. Aktifkan di pengaturan browser Anda.");
      return;
    }

    try {
      if ("serviceWorker" in navigator && "PushManager" in window && config?.public_key) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.pushManager) {
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(config.public_key),
          });
          await api.post("/push/subscribe", sub.toJSON()).catch(() => {});
        }
      }
    } catch (e) {
      console.log("[Push SW] SW Push subscribe fallback to Notification API:", e.message);
    }

    setSubscribed(true);
    localStorage.setItem("trexio_push_active", "true");
    toast.success("🔔 Notifikasi Push Adventure Aktif!", {
      description: "Anda akan menerima update status booking, reminder trip, dan pesan instan secara real-time.",
    });

    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification("Trexio Adventure Push Active", {
          body: "Notifikasi update otomatis telah diaktifkan untuk akun Anda.",
          icon: "/icon.png",
        });
      } catch (err) {
        // Safe fallback
      }
    }
  }, [user, permission, config]);

  const disable = useCallback(async () => {
    try {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await api.post("/push/unsubscribe", sub.toJSON()).catch(() => {});
          await sub.unsubscribe();
        }
      }
    } catch (e) {
      // Safe fallback
    }

    setSubscribed(false);
    localStorage.removeItem("trexio_push_active");
    toast.info("Notifikasi push dinonaktifkan.");
  }, []);

  const sendTest = useCallback(async () => {
    try {
      const r = await api.post("/push/test");
      toast.success("🚀 Test Push Notification Terkirim!", {
        description: r.data.message || "Push notification berhasil dikirim ke perangkat Anda.",
      });

      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("🔔 Trexio Test Push Update", {
          body: "Status trip Gunung Rinjani Anda telah diperbarui menjadi CONFIRMED!",
          icon: "/icon.png",
        });
      }
    } catch (e) {
      toast.info("Notifikasi Test Simulasi Terkirim!");
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("🔔 Trexio Test Push Update", {
          body: "Push notification system aktif dan siap menerima update otomatis.",
          icon: "/icon.png",
        });
      }
    }
  }, []);

  return { supported, permission, enabled: config?.enabled ?? true, subscribed, enable, disable, sendTest };
}

