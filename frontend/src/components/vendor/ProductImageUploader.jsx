import { useState } from "react";
import { api, ASSET_BASE } from "@/lib/api";
import { UploadSimple, Trash, Star, Image as ImageIcon, CircleNotch } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function ProductImageUploader({ images = [], coverImage = "", onChange, maxPhotos = 5 }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (images.length + files.length > maxPhotos) {
      toast.error(`Maksimal ${maxPhotos} foto produk.`);
      return;
    }

    setUploading(true);
    const newUploadedUrls = [];

    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          toast.error(`File ${file.name} bukan format gambar valid.`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await api.post("/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          if (res.data && res.data.url) {
            const fileUrl = res.data.url.startsWith("http")
              ? res.data.url
              : `${ASSET_BASE}${res.data.url}`;
            newUploadedUrls.push(fileUrl);
          }
        } catch (err) {
          // Fallback reading as Data URL if upload endpoint fails locally
          const reader = new FileReader();
          const dataUrl = await new Promise((resolve) => {
            reader.onload = (ev) => resolve(ev.target.result);
            reader.readAsDataURL(file);
          });
          if (dataUrl) newUploadedUrls.push(dataUrl);
        }
      }

      if (newUploadedUrls.length > 0) {
        const updatedList = [...images, ...newUploadedUrls].slice(0, maxPhotos);
        const updatedCover = coverImage && updatedList.includes(coverImage) ? coverImage : updatedList[0] || "";
        onChange(updatedList, updatedCover);
        toast.success(`${newUploadedUrls.length} foto berhasil diunggah!`);
      }
    } catch (e) {
      toast.error("Gagal mengunggah gambar");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    const removedUrl = images[indexToRemove];
    const updatedList = images.filter((_, idx) => idx !== indexToRemove);
    let updatedCover = coverImage;
    if (coverImage === removedUrl || !updatedList.includes(coverImage)) {
      updatedCover = updatedList[0] || "";
    }
    onChange(updatedList, updatedCover);
  };

  const handleSetCover = (url) => {
    onChange(images, url);
    toast.info("Foto sampul utama diperbarui!");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="font-extrabold uppercase text-neutral-500 text-xs flex items-center gap-1.5">
          <ImageIcon size={16} className="text-[hsl(var(--primary))]" />
          Foto & Galeri Produk ({images.length}/{maxPhotos})
        </label>
        <span className="text-[11px] text-muted-foreground font-semibold">
          Hanya Upload File (Tanpa URL)
        </span>
      </div>

      {/* Grid foto yang telah diunggah */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {images.map((imgUrl, idx) => {
            const isCover = imgUrl === coverImage || (!coverImage && idx === 0);
            return (
              <div
                key={idx}
                className={`relative group rounded-xl overflow-hidden border-2 aspect-square bg-neutral-100 shadow-xs transition-all ${
                  isCover ? "border-[hsl(var(--primary))] ring-2 ring-[hsl(var(--primary))/20]" : "border-border"
                }`}
              >
                <img src={imgUrl} alt={`Produk ${idx + 1}`} className="w-full h-full object-cover" />

                {/* Badge Cover */}
                {isCover && (
                  <span className="absolute top-1.5 left-1.5 bg-[hsl(var(--primary))] text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                    <Star size={10} weight="fill" /> Cover
                  </span>
                )}

                {/* Action buttons on hover / mobile touch */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                  {!isCover && (
                    <button
                      type="button"
                      onClick={() => handleSetCover(imgUrl)}
                      className="bg-white/90 hover:bg-white text-neutral-900 font-extrabold text-[10px] px-2 py-1 rounded-md shadow-xs flex items-center gap-1 transition-all"
                    >
                      <Star size={12} className="text-amber-500" /> Set Cover
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] px-2 py-1 rounded-md shadow-xs flex items-center gap-1 transition-all"
                  >
                    <Trash size={12} /> Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dropzone & Upload Button */}
      {images.length < maxPhotos ? (
        <label className="border-2 border-dashed border-neutral-300 hover:border-[hsl(var(--primary))] bg-neutral-50/50 hover:bg-neutral-100/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all text-center">
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploading}
            onChange={handleFileChange}
            className="hidden"
          />
          {uploading ? (
            <div className="flex items-center gap-2 text-xs font-bold text-[hsl(var(--primary))] py-2">
              <CircleNotch size={20} className="animate-spin" /> Mengunggah File Gambar...
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary))/10] text-[hsl(var(--primary))] flex items-center justify-center">
                <UploadSimple size={20} weight="bold" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-foreground block">
                  Pilih / Upload File Foto ({maxPhotos - images.length} slot tersisa)
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Format PNG, JPG, WEBP • Tambahkan hingga {maxPhotos} foto detail
                </span>
              </div>
            </>
          )}
        </label>
      ) : (
        <div className="p-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-center text-xs font-bold text-neutral-600">
          ✓ Batas maksimal {maxPhotos} foto telah terpenuhi
        </div>
      )}
    </div>
  );
}
