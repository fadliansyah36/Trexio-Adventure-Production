import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { TENANT_LANDING_TEMPLATES } from "@/components/tenant-builder/landingTemplatesData";
import TenantLandingRenderer from "@/components/tenant-builder/TenantLandingRenderer";
import {
  Sparkle,
  Desktop,
  DeviceTablet,
  DeviceMobile,
  Eye,
  EyeSlash,
  CaretUp,
  CaretDown,
  FloppyDisk,
  ArrowCounterClockwise,
  ArrowSquareOut,
  PencilSimple,
  Palette,
  CheckCircle,
  Browsers,
  List,
  Gear,
  WhatsappLogo,
  Plus,
  Trash,
  Copy,
} from "@phosphor-icons/react";

export default function AdminLandingBuilder() {
  const [activeTemplateId, setActiveTemplateId] = useState("template-1");
  const [viewport, setViewport] = useState("desktop"); // desktop | tablet | mobile
  const [activeTab, setActiveTab] = useState("templates"); // templates | sections | branding | preview
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Editable configuration state
  const [config, setConfig] = useState(() => {
    const t1 = TENANT_LANDING_TEMPLATES[0];
    return {
      templateId: t1.id,
      theme: { ...t1.theme },
      sections: JSON.parse(JSON.stringify(t1.sections)),
      tenantInfo: {
        name: "TREXIO Authorized Agency",
        tagline: "Sistem Pemesanan Trip & Persewaan Perlengkapan Official",
        phone: "628123456789",
        logo: "",
      },
    };
  });

  // Load saved builder configuration from backend or localStorage
  useEffect(() => {
    async function loadConfig() {
      setLoading(true);
      try {
        const res = await api.get("/tenant/builder-config").catch(() => null);
        if (res?.data && res.data.sections) {
          setConfig(res.data);
          setActiveTemplateId(res.data.templateId || "template-1");
        } else {
          const savedLocal = localStorage.getItem("trexio-tenant-builder-config");
          if (savedLocal) {
            const parsed = JSON.parse(savedLocal);
            setConfig(parsed);
            setActiveTemplateId(parsed.templateId || "template-1");
          }
        }
      } catch (err) {
        console.warn("Failed loading builder config, using default", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  // Handle switching template
  function handleSelectTemplate(tpl) {
    setActiveTemplateId(tpl.id);
    const newConfig = {
      templateId: tpl.id,
      theme: { ...tpl.theme },
      sections: JSON.parse(JSON.stringify(tpl.sections)),
      tenantInfo: { ...config.tenantInfo },
    };
    setConfig(newConfig);
    toast.success(`Template "${tpl.name}" berhasil diterapkan!`);
  }

  // Handle Save
  async function handleSaveConfig() {
    setSaving(true);
    try {
      localStorage.setItem("trexio-tenant-builder-config", JSON.stringify(config));
      await api.post("/tenant/builder-config", config).catch(() => null);
      toast.success("Halaman landing tenant berhasil disimpan & dipublikasikan!");
    } catch (e) {
      toast.error("Gagal menyimpan ke server, disimpan di penyimpanan lokal.");
    } finally {
      setSaving(false);
    }
  }

  // Handle Reset
  function handleResetConfig() {
    const matched = TENANT_LANDING_TEMPLATES.find((t) => t.id === activeTemplateId) || TENANT_LANDING_TEMPLATES[0];
    const resetConfig = {
      templateId: matched.id,
      theme: { ...matched.theme },
      sections: JSON.parse(JSON.stringify(matched.sections)),
      tenantInfo: { ...config.tenantInfo },
    };
    setConfig(resetConfig);
    toast.info("Pengaturan dikembalikan ke bawaan template.");
  }

  // Move section up/down
  function moveSection(index, direction) {
    const newSections = [...config.sections];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSections.length) return;
    const temp = newSections[index];
    newSections[index] = newSections[targetIdx];
    newSections[targetIdx] = temp;
    setConfig({ ...config, sections: newSections });
  }

  // Toggle section enabled
  function toggleSectionEnabled(index) {
    const newSections = [...config.sections];
    newSections[index].enabled = !newSections[index].enabled;
    setConfig({ ...config, sections: newSections });
  }

  // Update section field
  function updateSectionField(secIndex, field, value) {
    const newSections = [...config.sections];
    newSections[secIndex][field] = value;
    setConfig({ ...config, sections: newSections });
  }

  // Update tenant branding
  function updateTenantInfo(field, value) {
    setConfig({
      ...config,
      tenantInfo: {
        ...config.tenantInfo,
        [field]: value,
      },
    });
  }

  // Update Theme
  function updateTheme(field, value) {
    setConfig({
      ...config,
      theme: {
        ...config.theme,
        [field]: value,
      },
    });
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Sparkle size={32} className="animate-spin text-emerald-500" />
        <p className="text-sm text-muted-foreground font-medium">Memuat Tenant Landing Page Builder...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card border border-border p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Multitenant Site Builder
            </span>
            <span className="text-xs text-muted-foreground">7 Preset Trexio</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1">Tenant Landing Page Customizer</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pilih dari 7 template profesional, ubah susunan urutan section, dan kustomisasi teks dalam sekali klik.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleResetConfig}
            className="px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowCounterClockwise size={16} />
            <span>Reset</span>
          </button>

          <button
            onClick={() => {
              const url = `${window.location.origin}/tenant/preview`;
              window.open(url, "_blank");
            }}
            className="px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-500/20 transition-all cursor-pointer"
          >
            <ArrowSquareOut size={16} />
            <span>Pratinjau Publik</span>
          </button>

          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <FloppyDisk size={18} />
            <span>{saving ? "Menyimpan..." : "Simpan & Publikasikan"}</span>
          </button>
        </div>
      </div>

      {/* Mode Switch Tabs & Viewport Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/50 p-2 rounded-2xl border border-border">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("templates")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "templates" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Browsers size={16} />
            <span>1. Pilih Template (7)</span>
          </button>

          <button
            onClick={() => setActiveTab("sections")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "sections" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List size={16} />
            <span>2. Reorder & Edit Teks</span>
          </button>

          <button
            onClick={() => setActiveTab("branding")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "branding" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Palette size={16} />
            <span>3. Branding & Warna</span>
          </button>
        </div>

        {/* Viewport Width Control for Live Preview */}
        <div className="flex items-center gap-1 bg-card p-1 rounded-xl border border-border self-end sm:self-auto">
          <button
            onClick={() => setViewport("desktop")}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
              viewport === "desktop" ? "bg-emerald-500 text-white" : "text-muted-foreground hover:text-foreground"
            }`}
            title="Desktop View"
          >
            <Desktop size={16} />
          </button>
          <button
            onClick={() => setViewport("tablet")}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
              viewport === "tablet" ? "bg-emerald-500 text-white" : "text-muted-foreground hover:text-foreground"
            }`}
            title="Tablet View"
          >
            <DeviceTablet size={16} />
          </button>
          <button
            onClick={() => setViewport("mobile")}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
              viewport === "mobile" ? "bg-emerald-500 text-white" : "text-muted-foreground hover:text-foreground"
            }`}
            title="Mobile View"
          >
            <DeviceMobile size={16} />
          </button>
        </div>
      </div>

      {/* Main Workspace Layout (Editor Panel + Live Preview Canvas) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Active Tab Controls Editor Panel */}
        <div className="lg:col-span-5 space-y-4">
          {/* TAB 1: TEMPLATE SELECTOR */}
          {activeTab === "templates" && (
            <div className="bg-card border border-border p-5 rounded-2xl space-y-4 shadow-sm">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <Sparkle className="text-amber-500" size={18} />
                  <span>Katalog 7 Template Landing Page Trexio</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Klik template untuk mengganti tema, warna, dan struktur landing page tenant Anda.
                </p>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {TENANT_LANDING_TEMPLATES.map((tpl) => {
                  const isSelected = activeTemplateId === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => handleSelectTemplate(tpl)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 relative ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20 shadow-md"
                          : "border-border bg-background hover:border-emerald-500/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {tpl.category}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <CheckCircle size={14} weight="fill" /> Aktif
                          </span>
                        )}
                      </div>

                      <div className="font-extrabold text-sm">{tpl.name}</div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{tpl.description}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-3 h-3 rounded-full border border-black/20"
                            style={{ backgroundColor: tpl.theme.primaryColor }}
                          />
                          <span
                            className="w-3 h-3 rounded-full border border-black/20"
                            style={{ backgroundColor: tpl.theme.secondaryColor }}
                          />
                          <span className="text-[10px] text-muted-foreground font-mono ml-1">{tpl.theme.bgMode}</span>
                        </div>

                        <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                          Pilih Template →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: SECTIONS REORDER & TEXT EDITING */}
          {activeTab === "sections" && (
            <div className="bg-card border border-border p-5 rounded-2xl space-y-4 shadow-sm">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <List className="text-emerald-500" size={18} />
                  <span>Struktur & Urutan Section (Drag / Reorder)</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Gunakan tombol Atas / Bawah untuk merubah urutan tampilan, atau klik ikon mata untuk menyembunyikan section.
                </p>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {config.sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className={`p-3.5 rounded-xl border transition-all space-y-3 ${
                      sec.enabled ? "bg-background border-border" : "bg-muted/40 border-dashed border-border opacity-60"
                    }`}
                  >
                    {/* Section Header Controls */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-xs uppercase tracking-wider">{sec.type}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveSection(idx, "up")}
                          disabled={idx === 0}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30"
                          title="Geser Ke Atas"
                        >
                          <CaretUp size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(idx, "down")}
                          disabled={idx === config.sections.length - 1}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30"
                          title="Geser Ke Bawah"
                        >
                          <CaretDown size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSectionEnabled(idx)}
                          className={`p-1 rounded transition-colors ${
                            sec.enabled ? "text-emerald-600 hover:bg-emerald-500/10" : "text-muted-foreground hover:bg-muted"
                          }`}
                          title={sec.enabled ? "Sembunyikan Section" : "Tampilkan Section"}
                        >
                          {sec.enabled ? <Eye size={16} /> : <EyeSlash size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Section Text Edit Inputs */}
                    {sec.enabled && (
                      <div className="space-y-2 pt-2 border-t border-border text-xs">
                        {sec.title !== undefined && (
                          <div>
                            <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">Judul Section</label>
                            <input
                              type="text"
                              value={sec.title || ""}
                              onChange={(e) => updateSectionField(idx, "title", e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        )}

                        {sec.subtitle !== undefined && (
                          <div>
                            <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">Sub-Judul / Deskripsi</label>
                            <textarea
                              rows={2}
                              value={sec.subtitle || ""}
                              onChange={(e) => updateSectionField(idx, "subtitle", e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        )}

                        {sec.badgeText !== undefined && (
                          <div>
                            <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">Teks Badge Promo</label>
                            <input
                              type="text"
                              value={sec.badgeText || ""}
                              onChange={(e) => updateSectionField(idx, "badgeText", e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        )}

                        {sec.mainCtaText !== undefined && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">Tombol Utama</label>
                              <input
                                type="text"
                                value={sec.mainCtaText || ""}
                                onChange={(e) => updateSectionField(idx, "mainCtaText", e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">Tombol Sekunder</label>
                              <input
                                type="text"
                                value={sec.secondaryCtaText || ""}
                                onChange={(e) => updateSectionField(idx, "secondaryCtaText", e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BRANDING & COLORS */}
          {activeTab === "branding" && (
            <div className="bg-card border border-border p-5 rounded-2xl space-y-4 shadow-sm">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <Palette className="text-emerald-500" size={18} />
                  <span>Identitas Tenant & Tema Warna</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Atur nama agen travel, nomor WhatsApp resmi, serta warna khas tenant Anda.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Nama Organisasi / Agen Travel</label>
                  <input
                    type="text"
                    value={config.tenantInfo.name || ""}
                    onChange={(e) => updateTenantInfo("name", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold"
                    placeholder="Contoh: Nusantara Adventure Tours"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Slogan / Tagline Perusahaan</label>
                  <input
                    type="text"
                    value={config.tenantInfo.tagline || ""}
                    onChange={(e) => updateTenantInfo("tagline", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
                    placeholder="Contoh: Solusi Open Trip Terpercaya sejak 2018"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Nomor WhatsApp Admin (Untuk Inquiries)</label>
                  <div className="flex items-center gap-2">
                    <WhatsappLogo size={18} className="text-emerald-500" />
                    <input
                      type="text"
                      value={config.tenantInfo.phone || ""}
                      onChange={(e) => updateTenantInfo("phone", e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-mono"
                      placeholder="628123456789"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-border space-y-3">
                  <label className="font-bold block text-xs">Warna Utama (Primary Color Accent)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.theme.primaryColor || "#047857"}
                      onChange={(e) => updateTheme("primaryColor", e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-border p-1"
                    />
                    <input
                      type="text"
                      value={config.theme.primaryColor || "#047857"}
                      onChange={(e) => updateTheme("primaryColor", e.target.value)}
                      className="w-32 px-3 py-1.5 rounded-xl border border-border bg-background font-mono text-xs uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-bold block text-xs">Atmosphere / Mode Background</label>
                  <select
                    value={config.theme.bgMode || "light"}
                    onChange={(e) => updateTheme("bgMode", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold cursor-pointer"
                  >
                    <option value="light">Mode Terang Standard (Light Clean)</option>
                    <option value="dark-luxe">Mode Gelap Mewah (Dark Oceanic Luxe)</option>
                    <option value="dark-slate">Mode Gelap Petualang (Dark Slate)</option>
                    <option value="dark-neon">Mode Gelap Neon Getaway (Dark Neon)</option>
                    <option value="eco-tint">Mode Hijau Konservasi (Eco Tint)</option>
                    <option value="warm-parchment">Mode Perkamen Hangat (Warm Heritage)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Realtime Interactive Preview Canvas */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Interactive Preview</span>
            </span>
            <span className="font-mono uppercase text-[11px] bg-muted px-2 py-0.5 rounded border border-border">
              Viewport: {viewport}
            </span>
          </div>

          {/* Device Frame */}
          <div className="bg-slate-950 p-2 md:p-4 rounded-3xl border-4 border-slate-800 shadow-2xl flex justify-center overflow-x-auto">
            <div
              className="bg-background transition-all duration-300 rounded-2xl overflow-hidden shadow-inner border border-border"
              style={{
                width: viewport === "mobile" ? "375px" : viewport === "tablet" ? "768px" : "100%",
                maxWidth: "100%",
              }}
            >
              <TenantLandingRenderer
                config={config}
                onBookingClick={(id) => {
                  toast.info(`Pratinjau: Pengunjung mengeklik booking trip${id ? `: ${id}` : ""}`);
                }}
                onContactClick={(phone) => {
                  toast.success(`Pratinjau: Mengalihkan ke Chat WhatsApp Admin (${phone})`);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
