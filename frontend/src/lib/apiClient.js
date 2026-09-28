import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
export const API_BASE = `${BACKEND_URL}/api`;

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach authentication tokens and tenant headers
apiClient.interceptors.request.use(
  (config) => {
    try {
      if (typeof window !== "undefined") {
        const token = window.localStorage.getItem("trexio-token") || window.localStorage.getItem("token");
        if (token) {
          config.headers = config.headers || {};
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        const tenant = window.localStorage.getItem("trexio-tenant");
        if (tenant) {
          config.headers = config.headers || {};
          config.headers["X-Tenant"] = tenant;
          config.headers["x-tenant-id"] = tenant;
          config.headers["x-tenant-slug"] = tenant;
        }
      }
    } catch (e) {
      /* ignore storage errors */
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper to format API error detail into readable string
function formatErrorMessage(detail) {
  if (detail == null) return "Terjadi kesalahan. Silakan coba lagi.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => (item && typeof item.msg === "string" ? item.msg : JSON.stringify(item)))
      .filter(Boolean)
      .join(" ");
  }
  if (detail && typeof detail.msg === "string") return detail.msg;
  if (detail && typeof detail.message === "string") return detail.message;
  return String(detail);
}

// Response Interceptor: Catch 4xx & 5xx errors for booking endpoints, log request DTO & server error, and trigger toast
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const config = error.config;
    const url = config?.url || "";

    const isBookingEndpoint = url.includes("/booking") || url.includes("/bookings");
    const isError4xxOr5xx = status ? status >= 400 && status < 600 : true;

    if (isBookingEndpoint && isError4xxOr5xx) {
      let requestData = config?.data;
      if (typeof requestData === "string") {
        try {
          requestData = JSON.parse(requestData);
        } catch (_) {
          /* raw string */
        }
      }

      const rawErrorData = error.response?.data;
      const serverDetail =
        rawErrorData?.detail ||
        rawErrorData?.message ||
        rawErrorData?.error ||
        error.message ||
        "Gagal memproses booking.";

      const errorMessage = formatErrorMessage(serverDetail);

      // Never log full Axios config or request bodies: they may contain
      // Authorization headers, cookies, payment data, or personal information.
      console.error("❌ [API Client Booking Error]", {
        status: status || "NETWORK_ERROR",
        endpoint: url,
        method: config?.method?.toUpperCase(),
        errorMessage,
        code: rawErrorData?.code || "UNKNOWN_ERROR",
      });

      // Trigger global toast notification system
      toast.error(`Pemesanan Gagal: ${errorMessage}`, {
        description: requestData?.category
          ? `Kategori: ${requestData.category}`
          : "Silakan periksa kembali detail pesanan Anda.",
        duration: 5000,
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
