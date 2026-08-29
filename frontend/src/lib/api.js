import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

export const API_BASE = `${BACKEND_URL}/api`;
export const ASSET_BASE = BACKEND_URL;

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Attach tenant hint from localStorage (dev/preview) or subdomain.
// Priority: localStorage("trexio-tenant") → subdomain of window.location.host
api.interceptors.request.use((config) => {
  try {
    const token = typeof window !== "undefined" && window.localStorage.getItem("trexio-token");
    if (token) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    const stored = typeof window !== "undefined" && window.localStorage.getItem("trexio-tenant");
    let hint = stored;
    if (!hint && typeof window !== "undefined") {
      const host = window.location.hostname || "";
      const parts = host.split(".");
      if (parts.length >= 3 && !["www", "app", "api"].includes(parts[0])) {
        hint = parts[0];
      }
    }
    if (hint) {
      config.headers = config.headers || {};
      config.headers["X-Tenant"] = hint;
      config.headers["x-tenant-id"] = hint;
      config.headers["x-tenant-slug"] = hint;
    }
  } catch (e) { /* ignore */ }
  return config;
});

// Response interceptor to catch failed booking attempts, log request DTO & server error, and trigger toast
api.interceptors.response.use(
  (response) => response,
  (error) => {
    try {
      const config = error.config || {};
      const url = config.url || "";
      const method = (config.method || "get").toLowerCase();

      const isBookingEndpoint = url.includes("/booking") || url.includes("/bookings") || url.includes("/payments/midtrans");
      const isMutation = ["post", "put", "patch"].includes(method);

      if (isBookingEndpoint && isMutation) {
        let requestDTO = config.data;
        if (typeof requestDTO === "string") {
          try {
            requestDTO = JSON.parse(requestDTO);
          } catch (_) {
            /* keep raw string */
          }
        }

        const serverData = error.response?.data;
        const statusCode = error.response?.status;
        const errCodeStr = serverData?.code ? `[${serverData.code}] ` : "";
        const rawMsg =
          serverData?.detail ||
          serverData?.message ||
          serverData?.error ||
          error.message ||
          "Terjadi kesalahan saat memproses pesanan.";

        console.error("❌ [Booking Attempt Failed]", {
          endpoint: url,
          method: method.toUpperCase(),
          status: statusCode,
          code: serverData?.code || "UNKNOWN_ERROR",
          requestDTO: requestDTO || null,
          serverError: serverData || rawMsg,
        });

        const formattedError = formatApiError(rawMsg, "Gagal memproses transaksi. Silakan periksa data Anda.");
        const displayMsg = `${errCodeStr}${formattedError}`;

        toast.error(`Pemesanan Gagal: ${displayMsg}`, {
          description: requestDTO?.category ? `Kategori: ${requestDTO.category}` : "Silakan periksa kembali data pesanan Anda.",
          duration: 5000,
        });
      }
    } catch (e) {
      console.error("[Interceptor Diagnostic Error]", e);
    }

    return Promise.reject(error);
  }
);

export function setTenantHint(slug) {
  if (typeof window === "undefined") return;
  if (!slug) window.localStorage.removeItem("trexio-tenant");
  else window.localStorage.setItem("trexio-tenant", slug);
}

export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  try {
    const token = typeof window !== "undefined" && window.localStorage.getItem("trexio-token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const stored = typeof window !== "undefined" && window.localStorage.getItem("trexio-tenant");
    if (stored) headers["X-Tenant"] = stored;
  } catch (e) {}

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || errData.message || res.statusText);
  }

  return res.json();
}

export function safeArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string" && val.trim()) {
    return val.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export function formatRupiah(n) {
  if (n == null) return "Rp0";
  return "Rp" + Number(n).toLocaleString("id-ID");
}

export function formatDateID(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatApiError(data, defaultFallback = "Terjadi kesalahan pada sistem. Silakan coba beberapa saat lagi.") {
  if (data == null || data === "") return defaultFallback;
  if (typeof data === "string") return data;
  if (typeof data === "object") {
    if (data.detail) return formatApiError(data.detail, defaultFallback);
    if (data.message) return formatApiError(data.message, defaultFallback);
    if (data.error) return formatApiError(data.error, defaultFallback);
    if (data.msg && typeof data.msg === "string") return data.msg;
    if (data.reason && typeof data.reason === "string") return data.reason;
  }
  if (Array.isArray(data)) {
    const formatted = data
      .map((e) => (e && typeof e.msg === "string" ? e.msg : typeof e === "string" ? e : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
    if (formatted) return formatted;
  }
  return String(data) || defaultFallback;
}

export { apiClient } from "./apiClient";
export default api;
