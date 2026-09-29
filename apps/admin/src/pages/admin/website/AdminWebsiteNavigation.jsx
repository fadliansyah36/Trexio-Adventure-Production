import React, { useState } from "react";
import { toast } from "sonner";
import {
  List,
  CaretUp,
  CaretDown,
  Plus,
  Trash,
  FloppyDisk,
  Link as LinkIcon,
  CheckCircle,
} from "@phosphor-icons/react";

export default function AdminWebsiteNavigation() {
  const [navItems, setNavItems] = useState([
    { id: "n1", label: "BERANDA", url: "/", isPage: true },
    { id: "n2", label: "OPEN TRIP", url: "/open-trip", isPage: true },
    { id: "n3", label: "PRIVATE TRIP", url: "/private-trip", isPage: true },
    { id: "n4", label: "RENTAL ALAT", url: "/rental", isPage: true },
    { id: "n5", label: "GALERI & Ulasan", url: "/gallery", isPage: true },
    { id: "n6", label: "TENTANG KAMI", url: "/about", isPage: true },
    { id: "n7", label: "KONTAK WA", url: "https://wa.me/628123456789", isPage: false },
  ]);

  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemUrl, setNewItemUrl] = useState("");
  const [saving, setSaving] = useState(false);

  function moveItem(index, direction) {
    const next = [...navItems];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= next.length) return;
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    setNavItems(next);
  }

  function addItem(e) {
    e.preventDefault();
    if (!newItemLabel.trim()) return toast.error("Label menu wajib diisi");
    const item = {
      id: `n_${Date.now()}`,
      label: newItemLabel.toUpperCase(),
      url: newItemUrl.trim() || "/",
      isPage: newItemUrl.startsWith("/"),
    };
    setNavItems([...navItems, item]);
    setNewItemLabel("");
    setNewItemUrl("");
    toast.success(`Menu "${item.label}" ditambahkan ke Navigasi Header`);
  }

  function deleteItem(id) {
    setNavItems(navItems.filter((it) => it.id !== id));
    toast.info("Menu navigasi dihapus");
  }

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Urutan & item navigasi header berhasil disimpan!");
    }, 400);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            Navigation Builder
          </span>
          <h1 className="text-2xl font-black tracking-tight mt-1">Menu Navigasi Header Storefront</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Atur urutan menu navigasi navbar yang tampil di bagian atas website tenant Anda.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <FloppyDisk size={16} />
          <span>{saving ? "Menyimpan..." : "Simpan Navigasi"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Reorderable List */}
        <div className="lg:col-span-7 bg-card border border-border p-5 rounded-2xl space-y-4 shadow-sm">
          <h3 className="font-extrabold text-sm flex items-center gap-2">
            <List size={18} className="text-emerald-500" />
            <span>Urutan Menu Navigasi (Top Navbar)</span>
          </h3>

          <div className="space-y-2">
            {navItems.map((item, idx) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-border bg-background flex items-center justify-between gap-3 hover:border-emerald-500/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-black flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-extrabold text-xs tracking-wider">{item.label}</div>
                    <div className="text-[11px] font-mono opacity-70 flex items-center gap-1 mt-0.5">
                      <LinkIcon size={12} />
                      <span>{item.url}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveItem(idx, "up")}
                    disabled={idx === 0}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30"
                    title="Geser Ke Atas"
                  >
                    <CaretUp size={16} />
                  </button>
                  <button
                    onClick={() => moveItem(idx, "down")}
                    disabled={idx === navItems.length - 1}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30"
                    title="Geser Ke Bawah"
                  >
                    <CaretDown size={16} />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                    title="Hapus Menu"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Menu Form */}
        <div className="lg:col-span-5 bg-card border border-border p-5 rounded-2xl space-y-4 shadow-sm">
          <h3 className="font-extrabold text-sm flex items-center gap-2">
            <Plus size={18} className="text-emerald-500" />
            <span>Tambah Item Menu Baru</span>
          </h3>

          <form onSubmit={addItem} className="space-y-3 text-xs">
            <div>
              <label className="font-semibold block mb-1">Label Teks Menu</label>
              <input
                type="text"
                required
                value={newItemLabel}
                onChange={(e) => setNewItemLabel(e.target.value)}
                placeholder="Contoh: PROMO KHUSUS"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background uppercase font-bold"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Tujuan Link / URL Slug</label>
              <input
                type="text"
                required
                value={newItemUrl}
                onChange={(e) => setNewItemUrl(e.target.value)}
                placeholder="Contoh: /promo atau https://wa.me/..."
                className="w-full px-3 py-2 rounded-xl border border-border bg-background font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-sm transition-all"
            >
              + Tambahkan Ke Navbar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
