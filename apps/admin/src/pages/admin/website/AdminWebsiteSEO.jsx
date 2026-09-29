import React, { useState } from "react";
import { toast } from "sonner";
import {
  Sparkle,
  FloppyDisk,
  ShareNetwork,
  MagnifyingGlass,
  CheckCircle,
} from "@phosphor-icons/react";

export default function AdminWebsiteSEO() {
  const [seoTitle, setSeoTitle] = useState("Rinjani Adventure | Agent Open Trip & Pendakian Resmi");
  const [seoDescription, setSeoDescription] = useState(
    "Solusi pemesanan paket Open Trip Rinjani 3D2N, Semeru, dan persewaan perlengkapan outdoor resmi terpercaya sejak 2018. Booking langsung bergaransi."
  );
  const [ogImage, setOgImage] = useState(
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
  );
  const [canonicalUrl, setCanonicalUrl] = useState("https://rinjaniadventure.com");
  const [saving, setSaving] = useState(false);

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Pengaturan SEO & Social Share Cover berhasil disimpan!");
    }, 400);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            SEO & Social Metadata
          </span>
          <h1 className="text-2xl font-black tracking-tight mt-1">SEO & WhatsApp Link Sharing Manager</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Optimalkan tampilan website Anda di pencarian Google dan pratinjau kartu saat link dibagikan ke WhatsApp, Instagram, dan media sosial.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <FloppyDisk size={16} />
          <span>{saving ? "Menyimpan..." : "Simpan SEO"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Settings */}
        <div className="bg-card border border-border p-6 rounded-2xl space-y-4 shadow-sm">
          <h3 className="font-extrabold text-sm flex items-center gap-2">
            <MagnifyingGlass size={18} className="text-emerald-500" />
            <span>Google Search & Meta Fields</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold block mb-1">SEO Title (Judul Pencarian Google)</label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background font-medium text-xs"
              />
              <div className="text-[10px] opacity-60 mt-1">{seoTitle.length} / 60 Karakter Disarankan</div>
            </div>

            <div>
              <label className="font-bold block mb-1">Meta Description (Ringkasan Deskripsi Search)</label>
              <textarea
                rows={3}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium"
              />
              <div className="text-[10px] opacity-60 mt-1">{seoDescription.length} / 160 Karakter Disarankan</div>
            </div>

            <div>
              <label className="font-bold block mb-1">Social Share Cover Image (OpenGraph Image URL)</label>
              <input
                type="text"
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background font-mono text-xs"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">Canonical Domain URL</label>
              <input
                type="text"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Live Search & Social Preview Cards */}
        <div className="space-y-4">
          {/* Google Search Live Preview */}
          <div className="bg-card border border-border p-6 rounded-2xl space-y-3 shadow-sm">
            <div className="text-xs font-extrabold flex items-center gap-2">
              <MagnifyingGlass size={16} className="text-blue-500" />
              <span>Pratinjau Google Search Result</span>
            </div>

            <div className="p-4 rounded-xl bg-background border border-border space-y-1">
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono line-clamp-1">{canonicalUrl}</div>
              <div className="text-sm font-bold text-blue-600 dark:text-blue-400 line-clamp-1 hover:underline cursor-pointer">
                {seoTitle || "Judul SEO"}
              </div>
              <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {seoDescription || "Deskripsi meta pencarian Google..."}
              </div>
            </div>
          </div>

          {/* WhatsApp / Social Share Live Card Preview */}
          <div className="bg-card border border-border p-6 rounded-2xl space-y-3 shadow-sm">
            <div className="text-xs font-extrabold flex items-center gap-2">
              <ShareNetwork size={16} className="text-emerald-500" />
              <span>Pratinjau Kartu Link WhatsApp Sharing</span>
            </div>

            <div className="rounded-2xl border border-border bg-background overflow-hidden max-w-sm shadow-md">
              <div className="h-36 overflow-hidden bg-slate-900">
                <img src={ogImage} alt="OG Preview" className="w-full h-full object-cover" />
              </div>
              <div className="p-3 space-y-1 bg-muted/40">
                <div className="text-[10px] uppercase font-mono font-bold text-muted-foreground">{canonicalUrl}</div>
                <div className="font-bold text-xs line-clamp-1">{seoTitle}</div>
                <div className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">{seoDescription}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
