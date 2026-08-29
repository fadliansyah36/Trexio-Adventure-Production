import React, { useState, useEffect } from "react";
import { api, formatRupiah } from "@/lib/api";
import { toast } from "sonner";
import {
  Rocket,
  CurrencyDollar,
  Eye,
  Cursor,
  TrendUp,
  Plus,
  PencilSimple,
  PauseCircle,
  PlayCircle,
  CheckCircle,
  Tag,
  ArrowsClockwise,
  ShoppingBag,
  Target
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export default function SuperAdvertising() {
  const [activeTab, setActiveTab] = useState("campaigns"); // campaigns | packages
  const [campaigns, setCampaigns] = useState([]);
  const [packages, setPackages] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit/Create Package Modal
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageForm, setPackageForm] = useState({
    name: "",
    placement: "sponsored_search",
    price_per_duration: 150000,
    duration_days: 7,
    description: "",
    priority: 1,
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [campsRes, pkgsRes, analyticsRes] = await Promise.all([
        api.get("/super/ad-campaigns"),
        api.get("/super/ad-packages"),
        api.get("/super/billing-analytics")
      ]);
      setCampaigns(Array.isArray(campsRes.data) ? campsRes.data : []);
      setPackages(Array.isArray(pkgsRes.data) ? pkgsRes.data : []);
      setAnalytics(analyticsRes.data || null);
    } catch (err) {
      toast.error("Gagal memuat data iklan vendor");
    } finally {
      setLoading(false);
    }
  }

  async function handleTogglePauseResume(camp) {
    try {
      if (camp.campaign_status === "active") {
        await api.post(`/super/ad-campaigns/${camp.id}/pause`);
        toast.success(`Kampanye "${camp.product_title}" dijeda.`);
      } else {
        await api.post(`/super/ad-campaigns/${camp.id}/resume`);
        toast.success(`Kampanye "${camp.product_title}" dilanjutkan.`);
      }
      fetchData();
    } catch (err) {
      toast.error("Gagal mengubah status kampanye");
    }
  }

  function handleOpenCreatePackageModal() {
    setEditingPackage(null);
    setPackageForm({
      name: "",
      placement: "sponsored_search",
      price_per_duration: 150000,
      duration_days: 7,
      description: "Penempatan promosi prioritas untuk vendor mitra.",
      priority: 1,
      is_active: true
    });
    setShowPackageModal(true);
  }

  function handleOpenEditPackageModal(pkg) {
    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name,
      placement: pkg.placement,
      price_per_duration: pkg.price_per_duration,
      duration_days: pkg.duration_days,
      description: pkg.description || "",
      priority: pkg.priority || 1,
      is_active: pkg.is_active
    });
    setShowPackageModal(true);
  }

  async function handleSavePackage(e) {
    e.preventDefault();
    try {
      const payload = {
        name: packageForm.name,
        placement: packageForm.placement,
        price_per_duration: Number(packageForm.price_per_duration),
        duration_days: Number(packageForm.duration_days),
        description: packageForm.description,
        priority: Number(packageForm.priority),
        is_active: packageForm.is_active
      };

      if (editingPackage) {
        await api.patch(`/super/ad-packages/${editingPackage.id}`, payload);
        toast.success("Paket iklan berhasil diperbarui");
      } else {
        await api.post("/super/ad-packages", payload);
        toast.success("Paket iklan baru berhasil ditambahkan");
      }

      setShowPackageModal(false);
      fetchData();
    } catch (err) {
      toast.error("Gagal menyimpan paket iklan");
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 border border-purple-500/20">
              Vendor Monetization Engine
            </span>
            <span className="text-xs text-muted-foreground">Ad Placement & Sponsored Analytics</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Manajemen Iklan Vendor & Sponsor</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Kelola paket promosi berbayar vendor, penempatan sponsor di Homepage & Search, serta pantau CTR & GMV teratribusi.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchData} variant="outline" size="sm" className="gap-2 text-xs">
            <ArrowsClockwise size={14} /> Refresh
          </Button>
          <Button onClick={handleOpenCreatePackageModal} className="gap-2 text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold">
            <Plus size={16} /> Buat Paket Iklan
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Total Pendapatan Iklan</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
              <CurrencyDollar size={18} weight="bold" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {formatRupiah(analytics?.advertising?.total_ad_revenue || 0)}
          </div>
          <p className="text-[11px] text-purple-600 font-semibold">
            {analytics?.advertising?.active_campaigns_count || 0} Kampanye Aktif Saat Ini
          </p>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Total Impressions & Clicks</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <Eye size={18} weight="bold" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {analytics?.advertising?.total_impressions || 0} Tayang
          </div>
          <p className="text-[11px] text-muted-foreground">
            {analytics?.advertising?.total_clicks || 0} Klik (CTR: {analytics?.advertising?.ctr_percent || 0}%)
          </p>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Attributed GMV Penjualan</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <TrendUp size={18} weight="bold" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {formatRupiah(analytics?.advertising?.total_attributed_gmv || 0)}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold">
            {analytics?.advertising?.total_attributed_bookings || 0} Booking Teratribusi
          </p>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Menunggu Persetujuan Admin</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <Target size={18} weight="bold" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {analytics?.advertising?.pending_approval_count || 0} Iklan
          </div>
          <p className="text-[11px] text-amber-600 font-semibold">Memerlukan Moderasi Materi</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-border gap-6">
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`pb-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === "campaigns" ? "border-purple-500 text-purple-600" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Daftar Kampanye Iklan Vendor ({campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab("packages")}
          className={`pb-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === "packages" ? "border-purple-500 text-purple-600" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Konfigurasi Paket Promosi ({packages.length})
        </button>
      </div>

      {/* Tab 1: Vendor Ad Campaigns */}
      {activeTab === "campaigns" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-sm">Semua Kampanye Iklan Vendor Ekosistem</h3>
            <span className="text-xs text-muted-foreground">{campaigns.length} Kampanye</span>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[750px] text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Vendor & Produk</th>
                  <th className="p-4">Paket & Penempatan</th>
                  <th className="p-4">Biaya Promosi</th>
                  <th className="p-4">Status Iklan</th>
                  <th className="p-4">Performa (Impressions / Clicks)</th>
                  <th className="p-4">Kontrol Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Belum ada kampanye iklan vendor yang dipasang.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((camp) => {
                    const ctr = camp.metrics?.impressions > 0
                      ? ((camp.metrics.clicks / camp.metrics.impressions) * 100).toFixed(1)
                      : "0.0";

                    return (
                      <tr key={camp.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={camp.product_image || "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=200"}
                              alt={camp.product_title}
                              className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
                            />
                            <div>
                              <div className="font-bold text-foreground line-clamp-1">{camp.product_title}</div>
                              <div className="text-[10px] text-muted-foreground font-semibold">{camp.vendor_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-foreground">{camp.package_name}</div>
                          <span className="inline-block text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 mt-1">
                            {camp.placement}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-purple-600 dark:text-purple-400">{formatRupiah(camp.amount || 0)}</td>
                        <td className="p-4 space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                              camp.campaign_status === "active"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : camp.campaign_status === "pending_approval"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                : camp.campaign_status === "paused"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                            }`}
                          >
                            {camp.campaign_status}
                          </span>
                          <div className="text-[10px] text-muted-foreground">
                            {camp.end_date ? `Selesai: ${new Date(camp.end_date).toLocaleDateString("id-ID")}` : "Menunggu Aktivasi"}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-bold">{camp.metrics?.impressions || 0} tayang</div>
                              <div className="text-[10px] text-muted-foreground">{camp.metrics?.clicks || 0} klik (CTR {ctr}%)</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          {camp.campaign_status === "active" || camp.campaign_status === "paused" ? (
                            <Button
                              onClick={() => handleTogglePauseResume(camp)}
                              variant="outline"
                              size="sm"
                              className="text-xs font-bold gap-1"
                            >
                              {camp.campaign_status === "active" ? (
                                <>
                                  <PauseCircle size={14} className="text-amber-500" /> Jeda
                                </>
                              ) : (
                                <>
                                  <PlayCircle size={14} className="text-emerald-500" /> Lanjutkan
                                </>
                              )}
                            </Button>
                          ) : (
                            <span className="text-[11px] text-muted-foreground font-medium">Lihat Permohonan</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Packages Configuration */}
      {activeTab === "packages" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-card border rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all ${
                pkg.is_active ? "border-border hover:border-purple-500/50" : "border-border/50 opacity-60 bg-muted/20"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded border bg-purple-500/10 text-purple-600 border-purple-500/20">
                    {pkg.placement}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                    pkg.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-500'
                  }`}>
                    {pkg.is_active ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black">{pkg.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{pkg.description}</p>
                </div>

                <div className="py-2 border-y border-border/60">
                  <span className="text-2xl font-black text-purple-600">
                    {formatRupiah(pkg.price_per_duration)}
                  </span>
                  <span className="text-xs text-muted-foreground"> / {pkg.duration_days} hari</span>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Prioritas Tampil: <strong>Level {pkg.priority}</strong></div>
                  <div>Homepage Eligibility: <strong>{pkg.homepage_eligibility ? "Ya (Tampil di Beranda)" : "Tidak"}</strong></div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <Button
                  onClick={() => handleOpenEditPackageModal(pkg)}
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs font-semibold"
                >
                  <PencilSimple size={14} /> Edit Tarif & Ketentuan
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Package Form Modal */}
      {showPackageModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-4 sm:p-6 shadow-xl my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="shrink-0 flex items-center justify-between border-b border-border pb-3 mb-3">
              <h3 className="font-black text-base sm:text-lg">
                {editingPackage ? "Edit Paket Iklan Vendor" : "Tambah Paket Iklan Baru"}
              </h3>
              <button onClick={() => setShowPackageModal(false)} aria-label="Tutup" className="text-muted-foreground hover:text-foreground text-sm font-bold p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Nama Paket Promosi</label>
                <input
                  type="text"
                  required
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Jenis Penempatan</label>
                  <select
                    value={packageForm.placement}
                    onChange={(e) => setPackageForm({ ...packageForm, placement: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="sponsored_search">Sponsored Search</option>
                    <option value="category_top">Category Top Banner</option>
                    <option value="homepage_featured">Homepage Featured</option>
                    <option value="super_banner">Super Hero Banner</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Durasi Standar (Hari)</label>
                  <input
                    type="number"
                    required
                    value={packageForm.duration_days}
                    onChange={(e) => setPackageForm({ ...packageForm, duration_days: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Biaya Iklan per Durasi (IDR)</label>
                <input
                  type="number"
                  required
                  value={packageForm.price_per_duration}
                  onChange={(e) => setPackageForm({ ...packageForm, price_per_duration: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Deskripsi Manfaat bagi Vendor</label>
                <textarea
                  rows={3}
                  value={packageForm.description}
                  onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg p-3 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="pkg_active_check"
                  checked={packageForm.is_active}
                  onChange={(e) => setPackageForm({ ...packageForm, is_active: e.target.checked })}
                  className="rounded border-border text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="pkg_active_check" className="text-xs font-bold text-foreground">
                  Aktifkan Paket Ini untuk Dibeli oleh Vendor
                </label>
              </div>

              <div className="shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowPackageModal(false)} className="text-xs">
                  Batal
                </Button>
                <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2.5">
                  Simpan Paket
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
