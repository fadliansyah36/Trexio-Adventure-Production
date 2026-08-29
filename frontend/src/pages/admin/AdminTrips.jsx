import { useEffect, useState } from "react";
import { api, formatRupiah, formatApiError, safeArray } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import ProductImageUploader from "@/components/vendor/ProductImageUploader";
import { MARKETPLACE_12_CATEGORIES } from "@/pages/vendor/VendorProducts";
import {
  Plus,
  PencilSimple,
  Trash,
  MagnifyingGlass,
  CheckCircle,
  XCircle,
  Copy,
  Calendar,
  Users,
  Tag,
  MapPin,
  Sparkle,
  Eye,
  Info,
  CurrencyDollar,
  ListChecks,
  Image as ImageIcon
} from "@phosphor-icons/react";

const EMPTY_TRIP = {
  title: "",
  slug: "",
  destination: "",
  region: "",
  category: "Gunung",
  difficulty: "Pemula",
  duration_days: 2,
  price: 0,
  description: "",
  itinerary: [],
  includes: [],
  excludes: [],
  meeting_points: [],
  gallery: [],
  cover_image: "",
  max_participants: 15,
  booked_seats: 0,
  departure_dates: [],
  organizer: "TREXIO",
  published: true,
  badges: [],
};

export default function AdminTrips() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [activeTab, setActiveTab] = useState("basic");
  
  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");

  async function load() {
    try {
      setLoading(true);
      const { data } = await api.get("/trips", { params: { limit: 200 } });
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Gagal memuat katalog trip");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditing({ ...EMPTY_TRIP, _new: true });
    setActiveTab("basic");
  }

  function openEdit(t) {
    setEditing({ ...t });
    setActiveTab("basic");
  }

  function openDuplicate(t) {
    const copy = {
      ...t,
      _new: true,
      id: undefined,
      title: `${t.title} (Copy)`,
      slug: `${t.slug}-copy-${Math.floor(Math.random() * 1000)}`,
      booked_seats: 0,
    };
    setEditing(copy);
    setActiveTab("basic");
    toast.info("Menggandakan trip sebagai draft baru");
  }

  async function togglePublish(t) {
    const nextStatus = !t.published;
    try {
      await api.put(`/admin/trips/${t.id}`, { ...t, published: nextStatus });
      toast.success(
        `Trip "${t.title}" berhasil di-${nextStatus ? "publikasikan" : "sembunyikan (Draft)"}`
      );
      load();
    } catch (e) {
      toast.error("Gagal memperbarui status publikasi");
    }
  }

  async function save() {
    if (!editing) return;
    if (!editing.title || !editing.slug || !editing.destination) {
      toast.error("Mohon isi Judul, Slug, dan Destinasi trip");
      return;
    }

    const body = { ...editing };
    delete body._new;
    delete body.id;

    // Normalize array inputs
    body.includes = Array.isArray(body.includes)
      ? body.includes
      : String(body.includes || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);

    body.excludes = Array.isArray(body.excludes)
      ? body.excludes
      : String(body.excludes || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);

    body.meeting_points = Array.isArray(body.meeting_points)
      ? body.meeting_points
      : String(body.meeting_points || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

    body.departure_dates = Array.isArray(body.departure_dates)
      ? body.departure_dates
      : String(body.departure_dates || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

    body.badges = Array.isArray(body.badges)
      ? body.badges
      : String(body.badges || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

    body.gallery = Array.isArray(body.gallery)
      ? body.gallery
      : String(body.gallery || "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);

    try {
      if (editing._new) {
        await api.post("/admin/trips", body);
        toast.success("Trip baru berhasil dibuat!");
      } else {
        await api.put(`/admin/trips/${editing.id}`, body);
        toast.success("Perubahan trip berhasil disimpan!");
      }
      setEditing(null);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Gagal menyimpan trip");
    }
  }

  async function remove(t) {
    if (!window.confirm(`Hapus permanen trip "${t.title}"?`)) return;
    try {
      await api.delete(`/admin/trips/${t.id}`);
      toast.success("Trip berhasil dihapus");
      load();
    } catch (e) {
      toast.error("Gagal menghapus trip");
    }
  }

  // Auto-generate slug from title if new
  const handleTitleChange = (val) => {
    if (!editing) return;
    if (editing._new) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      setEditing({ ...editing, title: val, slug: generatedSlug });
    } else {
      setEditing({ ...editing, title: val });
    }
  };

  // Filtered Items
  const filtered = items.filter((t) => {
    const matchSearch =
      (t.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.slug || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.destination || "").toLowerCase().includes(search.toLowerCase());
    const matchCat =
      categoryFilter === "ALL" || (t.category || "").toLowerCase() === categoryFilter.toLowerCase();
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PUBLISHED" && t.published !== false) ||
      (statusFilter === "DRAFT" && t.published === false);
    return matchSearch && matchCat && matchStatus;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sortBy === "PRICE_HIGH") return (b.price || 0) - (a.price || 0);
    if (sortBy === "PRICE_LOW") return (a.price || 0) - (b.price || 0);
    if (sortBy === "QUOTA") return (b.max_participants || 0) - (a.max_participants || 0);
    return 0;
  });

  // Stats calculation
  const totalTrips = items.length;
  const publishedTrips = items.filter((i) => i.published !== false).length;
  const totalSeats = items.reduce((acc, i) => acc + (i.max_participants || 0), 0);
  const avgPrice =
    totalTrips > 0 ? Math.round(items.reduce((acc, i) => acc + (i.price || 0), 0) / totalTrips) : 0;

  return (
    <div className="pb-20 space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="trx-overline text-emerald-600 font-bold uppercase tracking-wider text-xs">
            Admin Panel · Katalog Ops
          </div>
          <h1 className="mt-1 text-2xl md:text-3xl font-black text-foreground tracking-tight">
            Manajemen Trip & Open Trip
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Kelola listings, jadwal keberangkatan, penetapan harga, kuota peserta, dan status publikasi.
          </p>
        </div>
        <Button
          data-testid="admin-new-trip"
          onClick={openNew}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
        >
          <Plus size={18} weight="bold" /> Buat Trip Baru
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Sparkle size={20} weight="fill" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Total Trip</div>
            <div className="text-xl font-black text-foreground">{totalTrips}</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <CheckCircle size={20} weight="fill" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Trip Dipublikasi</div>
            <div className="text-xl font-black text-foreground">{publishedTrips}</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Users size={20} weight="fill" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Total Kapasitas Kuota</div>
            <div className="text-xl font-black text-foreground">{totalSeats} Seat</div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Tag size={20} weight="fill" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Rata-rata Harga</div>
            <div className="text-xl font-black text-foreground">{formatRupiah(avgPrice)}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-5 relative">
            <MagnifyingGlass size={16} className="absolute left-3 top-3 text-muted-foreground" />
            <Input
              data-testid="search-trip"
              placeholder="Cari judul, slug, atau destinasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs bg-background"
            />
          </div>

          {/* Category Filter */}
          <div className="lg:col-span-3">
            <select
              data-testid="filter-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-background border border-border rounded-md text-foreground"
            >
              <option value="ALL">Semua Kategori (12 Trexio)</option>
              {MARKETPLACE_12_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <select
              data-testid="filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-background border border-border rounded-md text-foreground"
            >
              <option value="ALL">Semua Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft / Hidden</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-background border border-border rounded-md text-foreground"
            >
              <option value="NEWEST">Terbaru</option>
              <option value="PRICE_HIGH">Harga Tertinggi</option>
              <option value="PRICE_LOW">Harga Terendah</option>
              <option value="QUOTA">Kuota Terbanyak</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trips Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-border bg-muted/40 flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Daftar Trip ({filtered.length} ditemukan)
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-muted-foreground">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mb-2"></div>
            <div>Memuat data trip...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted-foreground">
            Tidak ada trip yang sesuai kriteria pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/80 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3">Detail Trip</th>
                  <th className="text-left px-4 py-3">Destinasi / Region</th>
                  <th className="text-left px-4 py-3">Kategori & Level</th>
                  <th className="text-right px-4 py-3">Harga / Peserta</th>
                  <th className="text-center px-4 py-3">Kuota Seat</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((t) => {
                  const isPublished = t.published !== false;
                  const seatPct = Math.min(
                    100,
                    Math.round(((t.booked_seats || 0) / (t.max_participants || 1)) * 100)
                  );

                  return (
                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                      {/* Trip Title & Cover */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={t.cover_image || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=150"}
                            alt={t.title || "Foto Trip"}
                            className="h-12 w-16 object-cover rounded-lg border border-border bg-muted shrink-0"
                          />
                          <div>
                            <div className="font-bold text-sm text-foreground line-clamp-1">
                              {t.title}
                            </div>
                            <div className="text-[11px] font-mono text-muted-foreground">
                              /{t.slug}
                            </div>
                            {safeArray(t.badges).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {safeArray(t.badges).map((b, i) => (
                                  <span
                                    key={i}
                                    className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  >
                                    {b}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Destination */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-foreground flex items-center gap-1">
                          <MapPin size={13} className="text-emerald-500" /> {t.destination || "-"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{t.region || "Indonesia"}</div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-foreground">{t.category || "Gunung"}</span>
                        <div className="text-[11px] text-muted-foreground">
                          {t.difficulty || "Pemula"} · {t.duration_days || 2} Hari
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          {formatRupiah(t.price)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">per orang</div>
                      </td>

                      {/* Quota */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="font-bold text-foreground">
                          {t.booked_seats || 0} / {t.max_participants || 15}
                        </div>
                        <div className="w-16 h-1.5 bg-muted rounded-full mx-auto mt-1 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all"
                            style={{ width: `${seatPct}%` }}
                          />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <button
                          data-testid={`publish-trip-${t.slug}`}
                          onClick={() => togglePublish(t)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                            isPublished
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-slate-500/10 text-slate-500 border-slate-500/30 hover:bg-slate-500/20"
                          }`}
                        >
                          {isPublished ? (
                            <>
                              <CheckCircle size={12} weight="fill" /> Published
                            </>
                          ) : (
                            <>
                              <XCircle size={12} weight="fill" /> Draft
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            title="Edit Trip"
                            data-testid={`edit-trip-${t.slug}`}
                            onClick={() => openEdit(t)}
                            className="h-8 w-8 p-0"
                          >
                            <PencilSimple size={14} />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            title="Duplikasi Trip"
                            onClick={() => openDuplicate(t)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Copy size={14} />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            title="Hapus Trip"
                            data-testid={`delete-trip-${t.slug}`}
                            onClick={() => remove(t)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          >
                            <Trash size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Create Dialog Modal */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-4 border-b border-border bg-muted/30">
            <DialogTitle className="text-xl font-bold flex items-center justify-between">
              <span>{editing?._new ? "Tambah Trip Baru" : `Edit Trip: ${editing?.title}`}</span>
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Kelola metadata trip, penawaran harga, jadwal keberangkatan, dan itinerary.
            </p>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 mt-4 border-b border-border -mb-4 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("basic")}
                className={`pb-3 text-xs font-bold border-b-2 px-3 transition-all flex items-center gap-1.5 ${
                  activeTab === "basic"
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Info size={16} /> Informasi Utama
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("pricing")}
                className={`pb-3 text-xs font-bold border-b-2 px-3 transition-all flex items-center gap-1.5 ${
                  activeTab === "pricing"
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <CurrencyDollar size={16} /> Harga & Kuota
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("schedule")}
                className={`pb-3 text-xs font-bold border-b-2 px-3 transition-all flex items-center gap-1.5 ${
                  activeTab === "schedule"
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calendar size={16} /> Jadwal & Meeting Point
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("facilities")}
                className={`pb-3 text-xs font-bold border-b-2 px-3 transition-all flex items-center gap-1.5 ${
                  activeTab === "facilities"
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <ListChecks size={16} /> Fasilitas & Agenda
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("media")}
                className={`pb-3 text-xs font-bold border-b-2 px-3 transition-all flex items-center gap-1.5 ${
                  activeTab === "media"
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <ImageIcon size={16} /> Gambar & Galeri
              </button>
            </div>
          </DialogHeader>

          {editing && (
            <div className="p-6 space-y-4">
              {/* TAB 1: BASIC INFO */}
              {activeTab === "basic" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="md:col-span-2">
                    <Label className="font-semibold text-xs mb-1 block">Judul Trip *</Label>
                    <Input
                      data-testid="trip-title"
                      value={editing.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Contoh: Open Trip Gunung Rinjani 4D3N"
                      className="bg-background"
                    />
                  </div>

                  <div>
                    <Label className="font-semibold text-xs mb-1 block">URL Slug *</Label>
                    <Input
                      value={editing.slug}
                      onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                      placeholder="mount-rinjani-4d3n"
                      className="bg-background font-mono text-xs"
                    />
                  </div>

                  <div>
                    <Label className="font-semibold text-xs mb-1 block">Penyelenggara / Organizer</Label>
                    <Input
                      value={editing.organizer || "TREXIO"}
                      onChange={(e) => setEditing({ ...editing, organizer: e.target.value })}
                      placeholder="Nama Vendor / Organizer"
                      className="bg-background"
                    />
                  </div>

                  <div>
                    <Label className="font-semibold text-xs mb-1 block">Destinasi Utama *</Label>
                    <Input
                      value={editing.destination}
                      onChange={(e) => setEditing({ ...editing, destination: e.target.value })}
                      placeholder="Lombok, Gunung Rinjani, Raja Ampat..."
                      className="bg-background"
                    />
                  </div>

                  <div>
                    <Label className="font-semibold text-xs mb-1 block">Region / Provinsi</Label>
                    <Input
                      value={editing.region}
                      onChange={(e) => setEditing({ ...editing, region: e.target.value })}
                      placeholder="Nusa Tenggara Barat, Jawa Timur..."
                      className="bg-background"
                    />
                  </div>

                  <div>
                    <Label className="font-semibold text-xs mb-1 block">Kategori</Label>
                    <select
                      value={editing.category || "open-trip"}
                      onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                      className="w-full h-10 px-3 bg-background border border-border rounded-md text-foreground"
                    >
                      {MARKETPLACE_12_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="font-semibold text-xs mb-1 block">Tingkat Kesulitan</Label>
                    <select
                      value={editing.difficulty || "Pemula"}
                      onChange={(e) => setEditing({ ...editing, difficulty: e.target.value })}
                      className="w-full h-10 px-3 bg-background border border-border rounded-md text-foreground"
                    >
                      <option value="Pemula">Pemula (Easy)</option>
                      <option value="Menengah">Menengah (Medium)</option>
                      <option value="Khusus / Ekstrem">Ekstrem (Hard)</option>
                    </select>
                  </div>

                  <div>
                    <Label className="font-semibold text-xs mb-1 block">Durasi (Hari)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={editing.duration_days}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          duration_days: Number(e.target.value),
                        })
                      }
                      className="bg-background"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="publish-toggle"
                      checked={editing.published !== false}
                      onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="publish-toggle" className="font-bold text-xs cursor-pointer select-none">
                      Publikasikan Trip di Website (Dapat Dilihat Publik)
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="font-semibold text-xs mb-1 block">Deskripsi Trip Ringkas</Label>
                    <Textarea
                      rows={4}
                      value={editing.description}
                      onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                      placeholder="Jelaskan ringkasan pengalaman trip, pemandangan, dan highlight perjalanan..."
                      className="bg-background"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: PRICING & QUOTA */}
              {activeTab === "pricing" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <Label className="font-semibold text-xs mb-1 block">Harga Per Peserta (Rp) *</Label>
                    <Input
                      type="number"
                      value={editing.price}
                      onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                      placeholder="1500000"
                      className="bg-background font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Kalkulasi: {formatRupiah(editing.price || 0)} / orang
                    </p>
                  </div>

                  <div>
                    <Label className="font-semibold text-xs mb-1 block">Maksimal Kuota Peserta (Seat) *</Label>
                    <Input
                      type="number"
                      min={1}
                      value={editing.max_participants}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          max_participants: Number(e.target.value),
                        })
                      }
                      className="bg-background font-mono"
                    />
                  </div>

                  <div>
                    <Label className="font-semibold text-xs mb-1 block">Jumlah Seat Terisi Saja</Label>
                    <Input
                      type="number"
                      min={0}
                      value={editing.booked_seats || 0}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          booked_seats: Number(e.target.value),
                        })
                      }
                      className="bg-background font-mono"
                    />
                  </div>

                  <div>
                    <Label className="font-semibold text-xs mb-1 block">Badges / Promos (Pisah Koma)</Label>
                    <Input
                      value={
                        Array.isArray(editing.badges)
                          ? editing.badges.join(", ")
                          : editing.badges || ""
                      }
                      onChange={(e) => setEditing({ ...editing, badges: e.target.value })}
                      placeholder="Bestseller, Diskon 10%, Termasuk Makan"
                      className="bg-background"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: SCHEDULE & MEETING POINTS */}
              {activeTab === "schedule" && (
                <div className="space-y-4 text-xs">
                  <div>
                    <Label className="font-semibold text-xs mb-1 block">
                      Tanggal Keberangkatan (YYYY-MM-DD, pisah koma)
                    </Label>
                    <Input
                      value={
                        Array.isArray(editing.departure_dates)
                          ? editing.departure_dates.join(", ")
                          : editing.departure_dates || ""
                      }
                      onChange={(e) =>
                        setEditing({ ...editing, departure_dates: e.target.value })
                      }
                      placeholder="2026-08-10, 2026-08-17, 2026-09-01"
                      className="bg-background font-mono text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Peserta dapat memilih tanggal keberangkatan ini saat proses checkout.
                    </p>
                  </div>

                  <div>
                    <Label className="font-semibold text-xs mb-1 block">
                      Titik Kumpul / Meeting Points (pisah koma)
                    </Label>
                    <Textarea
                      rows={3}
                      value={
                        Array.isArray(editing.meeting_points)
                          ? editing.meeting_points.join(", ")
                          : editing.meeting_points || ""
                      }
                      onChange={(e) => setEditing({ ...editing, meeting_points: e.target.value })}
                      placeholder="Stasiun Bandung, Bandara Soekarno Hatta, Basecamp Tarik"
                      className="bg-background"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: INCLUDES / EXCLUDES & ITINERARY */}
              {activeTab === "facilities" && (
                <div className="space-y-4 text-xs">
                  <div>
                    <Label className="font-semibold text-xs mb-1 block">
                      Fasilitas Termasuk (1 item per baris)
                    </Label>
                    <Textarea
                      rows={4}
                      value={
                        Array.isArray(editing.includes)
                          ? editing.includes.join("\n")
                          : editing.includes || ""
                      }
                      onChange={(e) => setEditing({ ...editing, includes: e.target.value })}
                      placeholder="Transportasi AC Jakarta - Basecamp PP&#10;Tenda & Perlengkapan Camp&#10;Makan 3x sehari selama pendakian&#10;Tiket masuk kawasan & Asuransi"
                      className="bg-background font-mono text-xs"
                    />
                  </div>

                  <div>
                    <Label className="font-semibold text-xs mb-1 block">
                      Fasilitas Tidak Termasuk (1 item per baris)
                    </Label>
                    <Textarea
                      rows={3}
                      value={
                        Array.isArray(editing.excludes)
                          ? editing.excludes.join("\n")
                          : editing.excludes || ""
                      }
                      onChange={(e) => setEditing({ ...editing, excludes: e.target.value })}
                      placeholder="Pengeluaran pribadi&#10;Tip untuk Porter / Guide&#10;Sewa Sleeping Bag pribadi"
                      className="bg-background font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: MEDIA & GALLERY */}
              {activeTab === "media" && (
                <div className="space-y-4 text-xs">
                  <ProductImageUploader
                    images={
                      Array.isArray(editing.gallery) && editing.gallery.length > 0
                        ? editing.gallery
                        : editing.cover_image
                        ? [editing.cover_image]
                        : []
                    }
                    coverImage={editing.cover_image}
                    onChange={(imagesList, coverUrl) => {
                      setEditing({
                        ...editing,
                        gallery: imagesList,
                        cover_image: coverUrl || imagesList[0] || "",
                      });
                    }}
                    maxPhotos={5}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="p-4 bg-muted/30 border-t border-border flex items-center justify-between">
            <Button variant="outline" onClick={() => setEditing(null)} className="text-xs">
              Batal
            </Button>
            <Button
              data-testid="admin-save-trip"
              onClick={save}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2"
            >
              Simpan Trip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
