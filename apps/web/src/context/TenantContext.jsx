import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const TenantContext = createContext(null);

/** Applies tenant branding to CSS variables so the whole app re-themes per tenant. */
function applyBranding(branding) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const primary = branding?.primary_color || "#CC5A3F";
  const secondary = branding?.secondary_color || "#1E3F20";
  root.style.setProperty("--brand-primary", primary);
  root.style.setProperty("--brand-secondary", secondary);
  if (branding?.favicon) {
    const link = document.querySelector("link[rel~='icon']") || document.createElement("link");
    link.rel = "icon";
    link.href = branding.favicon;
    document.head.appendChild(link);
  }
  if (branding?.brand_name) {
    document.title = `${branding.brand_name} — ${branding.tagline || "Adventure Platform"}`;
  }
}

export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState(null);
  const [ready, setReady] = useState(false);

  async function refresh() {
    try {
      const { data } = await api.get("/tenant/current");
      setTenant(data);
      applyBranding(data.branding || {});
    } catch (e) {
      setTenant(null);
    } finally {
      setReady(true);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, ready, refresh }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => useContext(TenantContext) || { tenant: null, ready: false, refresh: () => {} };
