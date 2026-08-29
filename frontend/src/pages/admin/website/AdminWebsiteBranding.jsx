import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Palette,
  FloppyDisk,
  UploadSimple,
  Sparkle,
  TextAa,
  Image as ImageIcon,
} from "@phosphor-icons/react";

export default function AdminWebsiteBranding() {
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#047857");
  const [secondaryColor, setSecondaryColor] = useState("#0f172a");
  const [accentColor, setAccentColor] = useState("#f59e0b");
  const [fontFamily, setFontFamily] = useState("font-sans");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await api.get("/tenant/builder-config").catch(() => null);
        if (res?.data) {
          const cfg = res.data;
          if (cfg.tenantInfo?.logo) setLogoUrl(cfg.tenantInfo.logo);
          if (cfg.theme?.primaryColor) setPrimaryColor(cfg.theme.primaryColor);
          if (cfg.theme?.fontStyle) setFontFamily(cfg.theme.fontStyle);
        }
      } catch (e) {}
    }
    loadConfig();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const saved = localStorage.getItem("trexio-tenant-builder-config");
      let cfg = saved ? JSON.parse(saved) : {};
      cfg = {
        ...cfg,
        theme: {
          ...cfg.theme,
          primaryColor,
          secondaryColor,
          fontStyle: fontFamily,
        },
        tenantInfo: {
          ...cfg.tenantInfo,
          logo: logoUrl,
          favicon: faviconUrl,
        },
      };

      localStorage.setItem("trexio-tenant-builder-config", JSON.stringify(cfg));
      await api.post("/tenant/builder-config", cfg).catch(() => null);
      toast.success("Branding & warna global website berhasil disimpan!");
    } catch (e) {
      toast.error("Gagal menyimpan branding");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            Global Branding
          </span>
          <h1 className="text-2xl font-black tracking-tight mt-1">Identitas Branding & Warna</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Atur identitas visual tenant Anda. Perubahan warna dan font di sini secara otomatis memperbarui seluruh halaman storefront.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <FloppyDisk size={16} />
          <span>{saving ? "Menyimpan..." : "Simpan Branding"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logo & Favicon */}
        <div className="bg-card border border-border p-6 rounded-2xl space-y-4 shadow-sm">
          <h3 className="font-extrabold text-sm flex items-center gap-2">
            <ImageIcon size={18} className="text-emerald-500" />
            <span>Logo & Favicon Perusahaan</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold block">Logo Perusahaan (PNG/SVG/JPG Transparan)</label>
                <label className="text-[11px] font-bold text-emerald-600 hover:text-emerald-500 cursor-pointer flex items-center gap-1">
                  <UploadSimple size={14} /> Upload File
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 8 * 1024 * 1024) {
                        toast.error("File maksimal 8MB");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setLogoUrl(ev.target.result);
                        toast.success("Logo file terpilih");
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://domain.com/logo.png atau data:image/..."
                className="w-full px-3 py-2 rounded-xl border border-border bg-background font-mono text-xs"
              />
              {logoUrl ? (
                <div className="mt-2 p-3 rounded-xl border border-border bg-slate-900 flex items-center justify-between gap-3">
                  <img src={logoUrl} alt="Logo Preview" className="h-10 max-w-[180px] object-contain" />
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="text-[10px] font-bold text-rose-400 hover:text-rose-300 px-2 py-1 bg-rose-500/10 rounded-lg border border-rose-500/20"
                  >
                    Hapus Logo
                  </button>
                </div>
              ) : (
                <div className="mt-2 p-3 rounded-xl border border-dashed border-border bg-muted/30 text-center text-[11px] text-muted-foreground">
                  Belum ada logo diset. Menggunakan logo default platform.
                </div>
              )}
            </div>

            <div>
              <label className="font-bold block mb-1">URL Favicon Browser (32x32px)</label>
              <input
                type="text"
                value={faviconUrl}
                onChange={(e) => setFaviconUrl(e.target.value)}
                placeholder="https://domain.com/favicon.ico"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Color Palette & Typography */}
        <div className="bg-card border border-border p-6 rounded-2xl space-y-4 shadow-sm">
          <h3 className="font-extrabold text-sm flex items-center gap-2">
            <Palette size={18} className="text-emerald-500" />
            <span>Skema Warna & Typografi Global</span>
          </h3>

          <div className="space-y-4 text-xs">
            {/* Primary */}
            <div>
              <label className="font-bold block mb-1">Warna Utama Aksentuasi (Primary Accent)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-border p-1"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-32 px-3 py-1.5 rounded-xl border border-border font-mono text-xs uppercase"
                />
              </div>
            </div>

            {/* Secondary */}
            <div>
              <label className="font-bold block mb-1">Warna Sekunder / Dark Contrast</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-border p-1"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-32 px-3 py-1.5 rounded-xl border border-border font-mono text-xs uppercase"
                />
              </div>
            </div>

            {/* Typography font */}
            <div>
              <label className="font-bold block mb-1">Gaya Font Typografi Storefront</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background font-semibold cursor-pointer"
              >
                <option value="font-sans">Sans-Serif Modern (Plus Jakarta Sans)</option>
                <option value="font-serif">Serif Elegan Classic (Playfair / Merriweather)</option>
                <option value="font-mono">Monospace Tech Expedition</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
