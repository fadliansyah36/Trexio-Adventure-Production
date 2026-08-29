import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { TENANT_LANDING_TEMPLATES } from "@/components/tenant-builder/landingTemplatesData";
import TenantLandingRenderer from "@/components/tenant-builder/TenantLandingRenderer";
import { Sparkle, ArrowLeft } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function TenantPublicPreview() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      setLoading(true);
      try {
        const res = await api.get("/tenant/builder-config").catch(() => null);
        if (res?.data && res.data.sections) {
          setConfig(res.data);
        } else {
          const savedLocal = localStorage.getItem("trexio-tenant-builder-config");
          if (savedLocal) {
            setConfig(JSON.parse(savedLocal));
          } else {
            // Default Template 1
            const t1 = TENANT_LANDING_TEMPLATES[0];
            setConfig({
              templateId: t1.id,
              theme: { ...t1.theme },
              sections: JSON.parse(JSON.stringify(t1.sections)),
              tenantInfo: {
                name: "TREXIO White-Label Partner",
                tagline: "Marketplace Open Trip & Rental Gear Terpercaya",
                phone: "628123456789",
              },
            });
          }
        }
      } catch (e) {
        console.warn("Failed fetching public tenant preview config", e);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-3 bg-background">
        <Sparkle size={36} className="animate-spin text-emerald-500" />
        <p className="text-sm font-semibold text-muted-foreground">Memuat Landing Page Tenant...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Top Banner Notice */}
      <div className="sticky top-0 z-50 bg-slate-900 text-white text-xs px-4 py-2 flex items-center justify-between border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-2">
          <Link
            to="/admin/builder"
            className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-bold flex items-center gap-1 transition-all"
          >
            <ArrowLeft size={14} /> Kembali ke Builder
          </Link>
          <span className="hidden sm:inline opacity-70">
            Pratinjau Publik Halaman Landing Tenant
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>LIVE TENANT TEMPLATE</span>
        </div>
      </div>

      <TenantLandingRenderer
        config={config}
        onBookingClick={(tripId) => {
          toast.success(`Mengalihkan ke pemesanan tiket${tripId ? ` (ID: ${tripId})` : ""}...`);
        }}
        onContactClick={(phone) => {
          window.open(`https://wa.me/${phone}?text=Halo%20Admin%20Trexio,%20saya%20tertarik%20dengan%20paket%20trip`, "_blank");
        }}
      />
    </div>
  );
}
