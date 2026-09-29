import React, { useState, useEffect, useCallback } from "react";
import { api, formatApiError } from "@/lib/api";
import SEO from "@/components/site/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ShieldCheck,
  Flag,
  ChatCircleDots,
  UsersThree,
  LockKey,
  EyeSlash,
  Trash,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  SlidersHorizontal,
  MagnifyingGlass,
  ArrowRight,
  Eye,
  Megaphone,
  UserCheck,
} from "@phosphor-icons/react";

export default function SuperCommunity() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'reports', 'posts', 'categories', 'logs'
  const [activeTab, setActiveTab] = useState("reports");

  // Filters
  const [postSearch, setPostSearch] = useState("");
  const [postStatusFilter, setPostStatusFilter] = useState("all");

  // Add Category Modal
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [submittingCat, setSubmittingCat] = useState(false);

  // Moderate Post Modal
  const [modTargetPost, setModTargetPost] = useState(null);
  const [modAction, setModAction] = useState("hide");
  const [modReason, setModReason] = useState("");
  const [submittingMod, setSubmittingMod] = useState(false);

  // Load All Community Admin Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, reportsRes, postsRes, catsRes, logsRes] = await Promise.all([
        api.get("/super/community/stats").catch(() => null),
        api.get("/super/community/reports").catch(() => ({ data: [] })),
        api.get("/super/community/posts").catch(() => ({ data: [] })),
        api.get("/community-categories").catch(() => ({ data: [] })),
        api.get("/super/community/logs").catch(() => ({ data: [] })),
      ]);

      if (statsRes?.data) setStats(statsRes.data);
      if (reportsRes?.data) setReports(Array.isArray(reportsRes.data) ? reportsRes.data : []);
      if (postsRes?.data) setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
      if (catsRes?.data) setCategories(Array.isArray(catsRes.data) ? catsRes.data : []);
      if (logsRes?.data) setLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Execute Action on Report
  const handleReportAction = async (reportId, action) => {
    try {
      await api.post(`/super/community/reports/${reportId}/action`, {
        action,
        notes: `Tindakan ${action} oleh Super Admin`,
      });
      toast.success("Laporan berhasil diproses!");
      loadData();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  // Moderate Post Submit
  const handleModeratePostSubmit = async () => {
    if (!modTargetPost || !modAction) return;
    setSubmittingMod(true);
    try {
      await api.post(`/super/community/posts/${modTargetPost.id}/moderate`, {
        action: modAction,
        reason: modReason,
      });
      toast.success(`Berhasil melakukan tindakan ${modAction} pada diskusi`);
      setModTargetPost(null);
      setModReason("");
      loadData();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setSubmittingMod(false);
    }
  };

  // Add Category Submit
  const handleAddCategorySubmit = async () => {
    if (!catName || !catSlug) return toast.error("Isi nama dan slug kategori");
    setSubmittingCat(true);
    try {
      await api.post("/super/community/categories", {
        name: catName,
        slug: catSlug,
        description: catDesc,
      });
      toast.success("Kategori diskusi baru berhasil ditambahkan!");
      setCatName("");
      setCatSlug("");
      setCatDesc("");
      setShowAddCatModal(false);
      loadData();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setSubmittingCat(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (catId) => {
    if (!window.confirm("Hapus kategori ini?")) return;
    try {
      await api.delete(`/super/community/categories/${catId}`);
      toast.success("Kategori berhasil dihapus");
      loadData();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  // Filter Posts
  const filteredPosts = posts.filter((p) => {
    if (postStatusFilter === "hidden" && !p.is_hidden) return false;
    if (postStatusFilter === "locked" && !p.is_locked) return false;
    if (postStatusFilter === "active" && (p.is_hidden || p.is_locked)) return false;
    if (postSearch) {
      const q = postSearch.toLowerCase();
      return (
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.content && p.content.toLowerCase().includes(q)) ||
        (p.user_name && p.user_name.toLowerCase().includes(q)) ||
        (p.vendor_name && p.vendor_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <SEO
        title="Moderasi & Tata Kelola Komunitas — Super Admin TREXIO"
        description="Pusat kontrol moderasi konten, antrean laporan pengguna, manajemen kategori, dan audit log komunitas TREXIO."
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-neutral-900 to-emerald-950 text-white rounded-3xl p-6 md:p-8 border border-neutral-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase">
              <ShieldCheck size={16} weight="fill" /> COMMUNITY GOVERNANCE & MODERATION
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Manajemen & Moderasi Komunitas TREXIO
            </h1>
            <p className="text-xs md:text-sm text-neutral-300 max-w-2xl">
              Pantau keamanan forum, tangani laporan konten dari pengguna, kunci atau sembunyikan diskusi yang melanggar, dan kelola kategori topik.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-border p-4 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Total Diskusi
          </span>
          <span className="text-2xl font-black text-foreground">
            {stats?.total_posts || 0}
          </span>
          <span className="text-[10px] text-emerald-600 font-bold block">
            {stats?.active_posts || 0} Aktif Publik
          </span>
        </div>

        <div className="bg-white border border-border p-4 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Antrean Laporan
          </span>
          <span className="text-2xl font-black text-rose-600">
            {stats?.pending_reports || 0}
          </span>
          <span className="text-[10px] text-muted-foreground font-bold block">
            Laporan Perlu Ditinjau
          </span>
        </div>

        <div className="bg-white border border-border p-4 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Total Komentar
          </span>
          <span className="text-2xl font-black text-foreground">
            {stats?.total_comments || 0}
          </span>
          <span className="text-[10px] text-muted-foreground font-bold block">
            Tanggapan Pengguna
          </span>
        </div>

        <div className="bg-white border border-border p-4 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            User Aktif Diskusi
          </span>
          <span className="text-2xl font-black text-foreground">
            {stats?.active_community_users || 0}
          </span>
          <span className="text-[10px] text-amber-600 font-bold block">
            {stats?.suspended_users_count || 0} User Ditangguhkan
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-border pb-3 flex-wrap">
        <button
          onClick={() => setActiveTab("reports")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "reports"
              ? "bg-[hsl(var(--secondary))] text-white shadow-xs"
              : "text-muted-foreground hover:bg-neutral-100"
          }`}
        >
          <Flag size={16} weight="bold" /> Antrean Laporan ({reports.filter(r => r.status === 'pending').length})
        </button>

        <button
          onClick={() => setActiveTab("posts")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "posts"
              ? "bg-[hsl(var(--secondary))] text-white shadow-xs"
              : "text-muted-foreground hover:bg-neutral-100"
          }`}
        >
          <ChatCircleDots size={16} weight="bold" /> Master Diskusi ({posts.length})
        </button>

        <button
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "categories"
              ? "bg-[hsl(var(--secondary))] text-white shadow-xs"
              : "text-muted-foreground hover:bg-neutral-100"
          }`}
        >
          <UsersThree size={16} weight="bold" /> Kategori & Topik ({categories.length})
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "logs"
              ? "bg-[hsl(var(--secondary))] text-white shadow-xs"
              : "text-muted-foreground hover:bg-neutral-100"
          }`}
        >
          <Clock size={16} weight="bold" /> Audit Log Moderasi
        </button>
      </div>

      {/* Tab 1: Moderation Reports */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-white border border-border rounded-2xl p-12 text-center text-xs text-muted-foreground font-bold">
              Tidak ada laporan pelanggaran komunitas saat ini.
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className={`bg-white border rounded-2xl p-5 shadow-2xs space-y-3 ${
                  rep.status === "pending"
                    ? "border-rose-300 bg-rose-50/10"
                    : "border-border"
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={rep.status === "pending" ? "destructive" : "secondary"}
                      className="text-[10px] font-black uppercase"
                    >
                      {rep.status === "pending" ? "PENDING REVIEW" : rep.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs font-bold text-foreground">
                      Tipe: {rep.target_type.toUpperCase()} ({rep.target_id})
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Dilaporkan pada: {new Date(rep.created_at).toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="bg-neutral-50 p-3 rounded-xl border border-border space-y-1 text-xs">
                  <span className="font-bold text-rose-700 block">
                    Alasan Pelaporan: {rep.reason}
                  </span>
                  {rep.details && (
                    <p className="text-neutral-600 italic">"{rep.details}"</p>
                  )}
                  <div className="pt-2 text-[11px] text-muted-foreground border-t border-border flex justify-between">
                    <span>Pelapor: {rep.reporter_name} ({rep.reporter_role})</span>
                    <span>Pemilik Konten: {rep.author_name}</span>
                  </div>
                </div>

                <div className="bg-neutral-100/60 p-3 rounded-xl text-xs text-neutral-800 font-mono line-clamp-3">
                  Konten Terlapor: "{rep.target_content}"
                </div>

                {rep.status === "pending" && (
                  <div className="pt-2 flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReportAction(rep.id, "dismiss")}
                      className="text-xs rounded-xl font-bold"
                    >
                      Abaikan Laporan
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleReportAction(rep.id, "hide_content")}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs"
                    >
                      Sembunyikan Konten
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleReportAction(rep.id, "suspend_author")}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs"
                    >
                      Tangguhkan User
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Master Posts */}
      {activeTab === "posts" && (
        <div className="space-y-4">
          <div className="bg-white border border-border rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Cari kata kunci, judul, atau author..."
                value={postSearch}
                onChange={(e) => setPostSearch(e.target.value)}
                className="pl-9 text-xs rounded-xl"
              />
            </div>
            <select
              value={postStatusFilter}
              onChange={(e) => setPostStatusFilter(e.target.value)}
              className="text-xs font-bold bg-neutral-50 border border-border rounded-xl px-3 py-2 shrink-0"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif Publik</option>
              <option value="hidden">Disembunyikan</option>
              <option value="locked">Dikunci</option>
            </select>
          </div>

          <div className="space-y-3">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white border border-border rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-foreground">
                      {post.title}
                    </span>
                    {post.is_hidden && (
                      <Badge variant="destructive" className="text-[10px]">
                        Disembunyikan
                      </Badge>
                    )}
                    {post.is_locked && (
                      <Badge variant="secondary" className="text-[10px]">
                        Dikunci
                      </Badge>
                    )}
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {post.category_name}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 line-clamp-2">
                    {post.content}
                  </p>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-3">
                    <span>Oleh: {post.vendor_name || post.user_name}</span>
                    <span>• {new Date(post.created_at).toLocaleDateString("id-ID")}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setModTargetPost(post);
                      setModAction(post.is_hidden ? "restore" : "hide");
                    }}
                    className="text-xs rounded-xl font-bold"
                  >
                    {post.is_hidden ? "Restore" : "Sembunyikan"}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setModTargetPost(post);
                      setModAction(post.is_locked ? "unlock" : "lock");
                    }}
                    className="text-xs rounded-xl font-bold"
                  >
                    {post.is_locked ? "Buka Kunci" : "Kunci"}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setModTargetPost(post);
                      setModAction("remove");
                    }}
                    className="text-rose-600 hover:bg-rose-50 text-xs rounded-xl font-bold"
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Categories Management */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
              Kategori & Topik Diskusi Master
            </h3>
            <Button
              onClick={() => setShowAddCatModal(true)}
              size="sm"
              className="bg-emerald-600 text-white font-bold rounded-xl text-xs gap-1.5"
            >
              <Plus size={16} /> Tambah Kategori
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white border border-border rounded-2xl p-4 shadow-2xs flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-sm text-foreground">
                    {cat.name}
                  </h4>
                  <span className="text-[11px] font-mono text-emerald-600 block">
                    slug: {cat.slug}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {cat.description || "Topik diskusi komunitas"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="text-rose-600 hover:bg-rose-50 h-8 w-8 p-0 rounded-lg"
                >
                  <Trash size={16} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === "logs" && (
        <div className="bg-white border border-border rounded-2xl p-5 shadow-2xs space-y-3">
          <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider mb-2">
            Riwayat Tindakan Moderasi
          </h3>
          {logs.length === 0 ? (
            <div className="text-xs text-neutral-400 py-4 italic">Belum ada aktivitas moderasi tercatat.</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-3 bg-neutral-50 rounded-xl border border-border text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-foreground">{log.action.toUpperCase()}</span>
                  <span className="text-muted-foreground ml-2">oleh {log.actor_name}</span>
                  <p className="text-neutral-600 text-[11px] mt-0.5">
                    Target: {log.target_type} ({log.target_id}) — Alasan: {log.reason}
                  </p>
                </div>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {new Date(log.created_at).toLocaleString("id-ID")}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODERATE POST MODAL */}
      <Dialog open={!!modTargetPost} onOpenChange={(open) => !open && setModTargetPost(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <ShieldCheck size={20} className="text-emerald-600" />
              Konfirmasi Moderasi Diskusi
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs py-2">
            <div>
              <Label className="text-xs font-bold mb-1 block">Tindakan Moderasi</Label>
              <select
                value={modAction}
                onChange={(e) => setModAction(e.target.value)}
                className="w-full text-xs font-bold bg-neutral-50 border border-border rounded-xl p-2.5"
              >
                <option value="hide">Sembunyikan dari Publik</option>
                <option value="restore">Pulihkan Tampilan Publik</option>
                <option value="lock">Kunci Diskusi (Tutup Komentar)</option>
                <option value="unlock">Buka Kembali Komentar</option>
                <option value="remove">Hapus Permanen</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold mb-1 block">Alasan Moderasi (Catatan untuk User)</Label>
              <Textarea
                rows={3}
                placeholder="Misal: Melanggar ketentuan tata krama forum TREXIO..."
                value={modReason}
                onChange={(e) => setModReason(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModTargetPost(null)}
              className="text-xs rounded-xl font-bold"
            >
              Batal
            </Button>
            <Button
              onClick={handleModeratePostSubmit}
              disabled={submittingMod}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
            >
              Eksekusi Tindakan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD CATEGORY MODAL */}
      <Dialog open={showAddCatModal} onOpenChange={setShowAddCatModal}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black">Tambah Kategori Topik Baru</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs py-2">
            <div>
              <Label className="text-xs font-bold mb-1 block">Nama Kategori</Label>
              <Input
                placeholder="Contoh: Survival & Pertolongan Pertama"
                value={catName}
                onChange={(e) => {
                  setCatName(e.target.value);
                  setCatSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                }}
                className="text-xs rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs font-bold mb-1 block">Slug (URL Keyword)</Label>
              <Input
                placeholder="survival-first-aid"
                value={catSlug}
                onChange={(e) => setCatSlug(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs font-bold mb-1 block">Deskripsi Singkat</Label>
              <Textarea
                rows={3}
                placeholder="Penjelasan cakupan bahasan kategori..."
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddCatModal(false)}
              className="text-xs rounded-xl font-bold"
            >
              Batal
            </Button>
            <Button
              onClick={handleAddCategorySubmit}
              disabled={submittingCat}
              size="sm"
              className="bg-emerald-600 text-white font-bold rounded-xl text-xs"
            >
              Simpan Kategori
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
