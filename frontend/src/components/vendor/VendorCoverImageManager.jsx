import React, { useState } from "react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import {
  Image as ImageIcon,
  UploadSimple,
  Trash,
  LinkSimple,
  Sparkle,
  CheckCircle,
  ArrowSquareOut,
  Mountains,
  Compass,
  Eye,
  Info,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import VendorVerifiedBadge from "@/components/site/VendorVerifiedBadge";

// Curated Outdoor Adventure Cover Presets
const ADVENTURE_PRESETS = [
  {
    id: "semeru-peak",
    title: "Puncak Gunung Semeru",
    subtitle: "Trekking & Mountain Ascent",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80",
    thumb: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "rinjani-crater",
    title: "Danau Segara Anak Rinjani",
    subtitle: "Crater Lake Sunset View",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
    thumb: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "alpine-camping",
    title: "Camp Bintang & Milky Way",
    subtitle: "Overnight Outdoor Camp",
    url: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1600&q=80",
    thumb: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "rafting-adventure",
    title: "Arung Jeram Sungai Liar",
    subtitle: "Rafting & Water Sports",
    url: "https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?auto=format&fit=crop&w=1600&q=80",
    thumb: "https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "offroad-semeru",
    title: "Jeep Offroad Bromo Semeru",
    subtitle: "4x4 Overland Exploration",
    url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=80",
    thumb: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "coral-diving",
    title: "Diving Terumbu Karang",
    subtitle: "Marine Exploration & Snorkeling",
    url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80",
    thumb: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=400&q=80",
  },
];

export default function VendorCoverImageManager({ vendor = {}, onRefresh }) {
  const currentCover = vendor.cover_image || "";
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [savingUrl, setSavingUrl] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activePreset, setActivePreset] = useState(null);

  // 1. File Upload Handler
  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar. Maksimal 8 MB.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post("/vendor/me/cover-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(data.message || "Foto sampul petualangan berhasil diperbarui!");
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail) || "Gagal mengunggah foto sampul");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  // 2. Custom URL Save Handler
  async function handleSaveUrl(e) {
    e.preventDefault();
    if (!urlInput || !urlInput.trim()) {
      toast.error("Masukkan URL gambar yang valid");
      return;
    }

    setSavingUrl(true);
    try {
      const { data } = await api.post("/vendor/me/cover-image", { cover_image: urlInput.trim() });
      toast.success(data.message || "Foto sampul dari URL berhasil disimpan!");
      setShowUrlForm(false);
      setUrlInput("");
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail) || "Gagal menyimpan URL sampul");
    } finally {
      setSavingUrl(false);
    }
  }

  // 3. Preset Select Handler
  async function handleSelectPreset(preset) {
    setActivePreset(preset.id);
    try {
      const { data } = await api.post("/vendor/me/cover-image", { cover_image: preset.url });
      toast.success(`Foto sampul diubah ke tema "${preset.title}"`);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail) || "Gagal memasang tema sampul");
    } finally {
      setActivePreset(null);
    }
  }

  // 4. Delete / Reset Cover Handler
  async function handleDeleteCover() {
    if (!currentCover) return;
    if (!window.confirm("Apakah Anda yakin ingin menghapus foto sampul petualangan ini? Tampilan akan kembali ke gradien default.")) {
      return;
    }

    setDeleting(true);
    try {
      const { data } = await api.delete("/vendor/me/cover-image");
      toast.success(data.message || "Foto sampul berhasil dihapus");
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail) || "Gagal menghapus foto sampul");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section
      className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6"
      data-testid="vendor-cover-manager-card"
    >
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base flex items-center gap-2 text-foreground">
              <ImageIcon size={20} className="text-emerald-500" /> Foto Sampul Petualangan Brand (Cover Image)
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              CRUD Feature
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Foto banner utama yang akan tampil di header Storefront publik brand Anda (
            <span className="font-mono text-foreground font-semibold">/@{vendor.slug || "brand"}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {currentCover ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs border border-emerald-500/30">
              <CheckCircle size={15} weight="fill" /> Foto Sampul Aktif
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 font-bold text-xs border border-neutral-500/30">
              Sampul Default Gradient
            </span>
          )}
        </div>
      </div>

      {/* LIVE PREVIEW BANNER STOREFRONT */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Eye size={16} className="text-emerald-500" /> Live Mockup Header Storefront Publik
          </span>
          <span className="text-[11px] text-muted-foreground font-normal">
            Rekomendasi: <strong className="text-foreground">1920 x 1080 px</strong> (Rasio 16:9 / 21:9)
          </span>
        </div>

        <div
          className="relative h-48 sm:h-64 rounded-2xl overflow-hidden border border-border shadow-inner group bg-slate-900"
          data-testid="vendor-cover-preview"
        >
          {currentCover ? (
            <img
              src={currentCover}
              alt="Foto Sampul Brand"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 flex flex-col items-center justify-center text-center p-6 space-y-2">
              <Mountains size={48} className="text-emerald-500/60 animate-pulse" />
              <p className="text-xs font-semibold text-neutral-300">Belum ada foto sampul petualangan terpasang</p>
              <p className="text-[11px] text-neutral-400 max-w-md">
                Unggah foto aksi tim pendakian Anda atau pilih preset pemandangan alam di bawah ini untuk menarik perhatian pelanggan.
              </p>
            </div>
          )}

          {/* Dark Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

          {/* Brand Overlay Content */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-background border-2 border-white/20 shadow-md overflow-hidden flex items-center justify-center shrink-0">
                {vendor.logo ? (
                  <img src={vendor.logo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Compass size={28} className="text-emerald-500" />
                )}
              </div>
              <div className="space-y-0.5 text-white drop-shadow">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-lg tracking-tight">
                    {vendor.brand_name || "Nama Brand Mitra"}
                  </h3>
                  <VendorVerifiedBadge verified={vendor.status === "verified"} status={vendor.status} />
                </div>
                <p className="text-xs text-neutral-200 line-clamp-1 max-w-md">
                  {vendor.tagline || vendor.description || "Penyelenggara Tour & Petualangan Outdoor Terpercaya"}
                </p>
              </div>
            </div>

            {vendor.slug && (
              <a
                href={`/@${vendor.slug}`}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-md border border-white/30 transition-all shrink-0"
              >
                <ArrowSquareOut size={14} /> Tinjau Storefront
              </a>
            )}
          </div>

          {/* Quick Clear Cover Button */}
          {currentCover && (
            <button
              onClick={handleDeleteCover}
              disabled={deleting}
              data-testid="vendor-cover-delete-btn"
              title="Hapus / Reset Sampul"
              className="absolute top-3 right-3 p-2 rounded-xl bg-rose-500/80 hover:bg-rose-600 text-white shadow-lg backdrop-blur-md border border-rose-400/30 transition-all cursor-pointer z-10"
            >
              <Trash size={16} />
            </button>
          )}
        </div>
      </div>

      {/* CRUD ACTION BUTTONS & METHODS */}
      <div className="space-y-4 pt-2">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkle size={14} className="text-emerald-500" /> Opsi Pembaruan & CRUD Sampul
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. File Upload Button */}
          <label className="relative flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-border hover:border-emerald-500/60 bg-muted/20 hover:bg-emerald-500/5 transition-all cursor-pointer group text-center">
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
              data-testid="vendor-cover-upload-file"
            />
            <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <UploadSimple size={20} />
            </div>
            <span className="mt-2 text-xs font-bold text-foreground">
              {uploading ? "Mengunggah File..." : "Unggah Foto dari Perangkat"}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG, WebP hingga 8 MB</span>
          </label>

          {/* 2. Custom URL Input Toggle */}
          <button
            type="button"
            onClick={() => setShowUrlForm(!showUrlForm)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border ${
              showUrlForm ? "border-emerald-500 bg-emerald-500/10" : "border-border bg-muted/20 hover:bg-muted/40"
            } transition-all cursor-pointer group text-center`}
            data-testid="vendor-cover-url-toggle"
          >
            <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <LinkSimple size={20} />
            </div>
            <span className="mt-2 text-xs font-bold text-foreground">Gunakan Link URL Gambar</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Tempel tautan CDN / Unsplash</span>
          </button>

          {/* 3. Delete / Reset Button */}
          <button
            type="button"
            onClick={handleDeleteCover}
            disabled={!currentCover || deleting}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-muted/20 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all cursor-pointer group text-center disabled:opacity-40"
            data-testid="vendor-cover-reset-btn"
          >
            <div className="p-2.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
              <Trash size={20} />
            </div>
            <span className="mt-2 text-xs font-bold text-foreground">
              {deleting ? "Menghapus..." : "Hapus Foto Sampul"}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Kembali ke Tampilan Default</span>
          </button>
        </div>

        {/* URL Input Form (Collapsible) */}
        {showUrlForm && (
          <form
            onSubmit={handleSaveUrl}
            className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <LinkSimple size={14} className="text-emerald-500" /> Tautan Gambar Direct (URL)
              </label>
              <span className="text-[11px] text-muted-foreground">https://...</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b"
                className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-emerald-500"
                data-testid="vendor-cover-url-input"
              />
              <button
                type="submit"
                disabled={savingUrl || !urlInput.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg disabled:opacity-50 transition-all cursor-pointer shrink-0"
                data-testid="vendor-cover-url-submit"
              >
                {savingUrl ? "Menyimpan..." : "Terapkan URL"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* CURATED ADVENTURE PRESETS GALLERY */}
      <div className="space-y-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
              <Compass size={16} className="text-emerald-500" /> Galeri Tema Sampul Petualangan
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Pilih dari galeri foto pemandangan outdoor resolusi tinggi pilihan TREXIO:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {ADVENTURE_PRESETS.map((preset, idx) => {
            const isSelected = currentCover === preset.url;
            const isPending = activePreset === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                disabled={isPending}
                data-testid={`vendor-cover-preset-${idx}`}
                className={`relative group rounded-xl overflow-hidden border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "ring-2 ring-emerald-500 border-emerald-500 shadow-md"
                    : "border-border hover:border-emerald-500/50 hover:shadow-sm"
                }`}
              >
                <div className="h-20 sm:h-24 w-full bg-slate-900 overflow-hidden relative">
                  <img
                    src={preset.thumb}
                    alt={preset.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white p-1 rounded-full shadow-sm">
                      <CheckCircle size={14} weight="fill" />
                    </div>
                  )}

                  {isPending && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                      <ArrowsClockwise size={18} className="animate-spin text-emerald-400" />
                    </div>
                  )}

                  <div className="absolute bottom-1.5 left-2 right-2 text-white">
                    <p className="text-[11px] font-extrabold leading-tight truncate">{preset.title}</p>
                    <p className="text-[9px] text-neutral-300 truncate">{preset.subtitle}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
