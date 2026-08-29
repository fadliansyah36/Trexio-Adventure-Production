import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TENANT_LANDING_TEMPLATES } from "@/components/tenant-builder/landingTemplatesData";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Browsers,
  CheckCircle,
  Eye,
  Sparkle,
  Crown,
  ArrowRight,
  Desktop,
  LockKey
} from "@phosphor-icons/react";

export default function AdminWebsiteTemplates() {
  const nav = useNavigate();
  const [selectedTemplateId, setSelectedTemplateId] = useState("template-1");
  const [applying, setApplying] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [entitlements, setEntitlements] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [lockedTemplateName, setLockedTemplateName] = useState("");

  useEffect(() => {
    fetchEntitlements();
  }, []);

  async function fetchEntitlements() {
    try {
      const res = await api.get("/tenant/subscription/entitlements");
      setEntitlements(res.data);
    } catch (err) {
      // Default baseline fallback
    }
  }

  async function handleApplyTemplate(tpl) {
    const isPro = tpl.isPremium || tpl.badge === "PRO" || tpl.badge === "ENTERPRISE";
    
    // Check Pro theme entitlement
    if (isPro && entitlements && !entitlements.can_access_pro_themes) {
      setLockedTemplateName(tpl.name);
      setShowUpgradeModal(true);
      return;
    }

    setApplying(true);
    try {
      // Get current saved config
      const saved = localStorage.getItem("trexio-tenant-builder-config");
      let currentInfo = {
        name: "TREXIO Authorized Agency",
        tagline: "Sistem Pemesanan Trip & Persewaan Perlengkapan Official",
        phone: "628123456789",
      };
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.tenantInfo) currentInfo = parsed.tenantInfo;
        } catch (e) {}
      }

      const newConfig = {
        templateId: tpl.id,
        theme: { ...tpl.theme },
        sections: JSON.parse(JSON.stringify(tpl.sections)),
        tenantInfo: currentInfo,
      };

      localStorage.setItem("trexio-tenant-builder-config", JSON.stringify(newConfig));
      await api.post("/tenant/builder-config", newConfig).catch(() => null);

      setSelectedTemplateId(tpl.id);
      toast.success(`Template "${tpl.name}" berhasil diterapkan pada website Anda!`);
    } catch (err) {
      toast.error("Gagal menerapkan template");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            Template Library
          </span>
          <span className="text-xs text-muted-foreground">7 Preset Siap Pakai</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight">Katalog Template Storefront Trexio</h1>
        <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
          Pilih template yang paling sesuai dengan jenis bisnis Anda. Pergantian template tidak akan menghapus data produk, pemesanan, atau akun Anda.
        </p>
      </div>

      {/* Grid of 7 Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TENANT_LANDING_TEMPLATES.map((tpl) => {
          const isSelected = selectedTemplateId === tpl.id;
          const isPremium = tpl.isPremium || tpl.badge === "PRO" || tpl.price;

          return (
            <div
              key={tpl.id}
              className={`rounded-2xl border bg-card overflow-hidden transition-all flex flex-col justify-between hover:shadow-lg ${
                isSelected ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md" : "border-border"
              }`}
            >
              <div className="space-y-4 p-5">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    {tpl.category}
                  </span>
                  {isPremium ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                      <Crown size={12} weight="fill" /> Pro Template
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-slate-500/10 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-500/20">
                      Gratis
                    </span>
                  )}
                </div>

                {/* Color Palette Preview Strip */}
                <div className="h-28 rounded-xl p-4 flex flex-col justify-between text-white relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${tpl.theme.primaryColor} 0%, ${tpl.theme.secondaryColor || '#0f172a'} 100%)`
                  }}
                >
                  <div className="font-mono text-[10px] uppercase font-bold opacity-80">
                    Mode: {tpl.theme.bgMode}
                  </div>
                  <div className="text-base font-black tracking-tight">{tpl.name}</div>
                </div>

                <div>
                  <h3 className="font-extrabold text-base">{tpl.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-5 pt-0 border-t border-border mt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(tpl)}
                  className="px-3 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye size={16} />
                  <span>Pratinjau</span>
                </button>

                {isSelected ? (
                  <span className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center gap-1">
                    <CheckCircle size={16} weight="fill" /> Diterapkan
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    disabled={applying}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Gunakan Template</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative my-auto max-h-[90vh] flex flex-col">
            <div className="shrink-0 flex items-center justify-between border-b border-border pb-3 mb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                  {previewTemplate.category}
                </span>
                <h3 className="text-lg sm:text-xl font-black mt-1">{previewTemplate.name}</h3>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 font-bold text-xs flex items-center justify-center shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              <p className="text-xs text-muted-foreground leading-relaxed">{previewTemplate.description}</p>

              <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2 text-xs">
                <div className="font-bold">Informasi Tema:</div>
                <div className="flex items-center gap-2">
                  <span>Warna Utama:</span>
                  <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: previewTemplate.theme.primaryColor }} />
                  <span className="font-mono text-[11px]">{previewTemplate.theme.primaryColor}</span>
                </div>
                <div>Atmosphere Mode: <span className="font-mono">{previewTemplate.theme.bgMode}</span></div>
              </div>

              <div className="shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 pt-3 border-t border-border">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    handleApplyTemplate(previewTemplate);
                    setPreviewTemplate(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
                >
                  Gunakan Template Ini
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Upgrade Required Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-card border border-amber-500/30 rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 my-auto max-h-[90vh] flex flex-col">
            <div className="shrink-0 flex items-center gap-3 border-b border-border pb-3 mb-2">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 shrink-0">
                <Crown size={32} weight="fill" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Fitur Premium Terkunci
                </span>
                <h3 className="text-base sm:text-lg font-black mt-1">Upgrade ke Paket Pro Agency</h3>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Template <strong>"{lockedTemplateName}"</strong> adalah preset desain eksklusif yang memerlukan paket langganan <strong>Pro Agency</strong> atau <strong>Enterprise</strong>.
            </p>

            <div className="p-4 rounded-2xl bg-muted/50 border border-border space-y-2 text-xs">
              <div className="font-bold text-foreground">Keuntungan Upgrade:</div>
              <ul className="space-y-1.5 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Sparkle size={14} className="text-amber-500" /> Akses seluruh 7 preset tema premium
                </li>
                <li className="flex items-center gap-2">
                  <Sparkle size={14} className="text-amber-500" /> Kustom SSL Domain & Branding
                </li>
                <li className="flex items-center gap-2">
                  <Sparkle size={14} className="text-amber-500" /> Dukungan penuh visual page builder
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold"
              >
                Nanti Saja
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  nav("/admin/subscription");
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md flex items-center gap-2"
              >
                <span>Upgrade Sekarang</span>
                <Crown size={16} weight="fill" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
