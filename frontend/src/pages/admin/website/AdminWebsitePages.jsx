import React, { useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  PencilSimple,
  Trash,
  Copy,
  HouseSimple,
  CheckCircle,
  Eye,
  EyeSlash,
} from "@phosphor-icons/react";

export default function AdminWebsitePages() {
  const [pages, setPages] = useState([
    { id: "p1", title: "Home / Beranda", slug: "home", isHomepage: true, status: "published", updated: "Hari ini 10:30" },
    { id: "p2", title: "Katalog Open Trip", slug: "open-trip", isHomepage: false, status: "published", updated: "Kemarin 16:20" },
    { id: "p3", title: "Layanan Private Expedition", slug: "private-trip", isHomepage: false, status: "published", updated: "2 Hari lalu" },
    { id: "p4", title: "Persewaan Alat Pendakian", slug: "rental", isHomepage: false, status: "published", updated: "28 Jul 2026" },
    { id: "p5", title: "Tentang Kami & Sertifikasi", slug: "about", isHomepage: false, status: "published", updated: "25 Jul 2026" },
    { id: "p6", title: "Galeri Dokumentasi Trip", slug: "gallery", isHomepage: false, status: "published", updated: "20 Jul 2026" },
    { id: "p7", title: "FAQ (Pertanyaan Umum)", slug: "faq", isHomepage: false, status: "published", updated: "15 Jul 2026" },
    { id: "p8", title: "Kontak & Bantuan CS", slug: "contact", isHomepage: false, status: "published", updated: "10 Jul 2026" },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");

  function handleCreatePage(e) {
    e.preventDefault();
    if (!newTitle.trim()) return toast.error("Judul halaman wajib diisi");

    const slug = newSlug.trim() || newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const newPage = {
      id: `p_${Date.now()}`,
      title: newTitle,
      slug,
      isHomepage: false,
      status: "draft",
      updated: "Baru saja",
    };

    setPages([...pages, newPage]);
    toast.success(`Halaman "${newTitle}" berhasil ditambahkan sebagai Draft!`);
    setNewTitle("");
    setNewSlug("");
    setShowAddModal(false);
  }

  function handleDuplicate(page) {
    const dup = {
      ...page,
      id: `p_${Date.now()}`,
      title: `${page.title} (Salinan)`,
      slug: `${page.slug}-copy`,
      isHomepage: false,
      status: "draft",
      updated: "Baru saja",
    };
    setPages([...pages, dup]);
    toast.info(`Halaman "${page.title}" berhasil diduplikasi!`);
  }

  function handleSetHomepage(pageId) {
    setPages(
      pages.map((p) => ({
        ...p,
        isHomepage: p.id === pageId,
      }))
    );
    toast.success("Beranda (Homepage) berhasil diperbarui!");
  }

  function toggleStatus(pageId) {
    setPages(
      pages.map((p) => {
        if (p.id === pageId) {
          const next = p.status === "published" ? "draft" : "published";
          toast.info(`Status halaman "${p.title}" diubah menjadi ${next.toUpperCase()}`);
          return { ...p, status: next };
        }
        return p;
      })
    );
  }

  function handleDelete(pageId) {
    setPages(pages.filter((p) => p.id !== pageId));
    toast.success("Halaman berhasil dihapus.");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            Page Management
          </span>
          <h1 className="text-2xl font-black tracking-tight mt-1">Daftar Halaman Storefront</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kelola halaman publik tenant. Buat halaman baru, duplikat layout, atau atur halaman mana yang menjadi Beranda.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>Tambah Halaman Baru</span>
        </button>
      </div>

      {/* Pages Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border font-extrabold uppercase text-muted-foreground tracking-wider">
              <tr>
                <th className="p-4">Judul Halaman</th>
                <th className="p-4">URL Slug</th>
                <th className="p-4">Role Halaman</th>
                <th className="p-4">Status Publikasi</th>
                <th className="p-4">Terakhir Diperbarui</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pages.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-bold text-foreground">
                    <div className="flex items-center gap-2">
                      <FileText size={18} className="text-emerald-500" />
                      <span>{p.title}</span>
                    </div>
                  </td>

                  <td className="p-4 font-mono text-muted-foreground">
                    /{p.slug}
                  </td>

                  <td className="p-4">
                    {p.isHomepage ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded border border-emerald-500/20">
                        <HouseSimple size={12} weight="fill" /> Homepage
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetHomepage(p.id)}
                        className="text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:underline"
                      >
                        Jadikan Homepage
                      </button>
                    )}
                  </td>

                  <td className="p-4">
                    <span
                      onClick={() => toggleStatus(p.id)}
                      className={`cursor-pointer inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        p.status === "published"
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                      }`}
                    >
                      {p.status === "published" ? <Eye size={12} /> : <EyeSlash size={12} />}
                      <span>{p.status}</span>
                    </span>
                  </td>

                  <td className="p-4 text-muted-foreground font-medium">
                    {p.updated}
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleDuplicate(p)}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Duplikat Halaman"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={p.isHomepage}
                        className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 disabled:opacity-30"
                        title="Hapus Halaman"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Page */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <form
            onSubmit={handleCreatePage}
            className="bg-card border border-border rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 space-y-4 shadow-2xl my-auto max-h-[90vh] flex flex-col"
          >
            <div className="shrink-0 flex items-center justify-between border-b border-border pb-3 mb-1">
              <h3 className="font-extrabold text-base">Tambah Halaman Baru</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-muted font-bold text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
              <div>
                <label className="font-semibold block mb-1">Judul Halaman</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Paket Glamping Exclusive"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">URL Slug (Opsional)</label>
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="glamping-exclusive"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background font-mono"
                />
              </div>

              <div className="shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
                >
                  Simpan Draft Halaman
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
