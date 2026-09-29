import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api, formatRupiah, formatDateID } from "@/lib/api";
import {
  Tag,
  Plus,
  Rocket,
  Ticket,
  CheckCircle,
  Eye,
  Cursor,
  TrendUp,
  Clock,
  Lightning,
  Sparkle,
  ShoppingBag,
  ArrowsClockwise
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function VendorPromotions() {
  const { vendor } = useOutletContext();
  const [activeTab, setActiveTab] = useState("advertising"); // advertising | vouchers

  // Advertising State
  const [campaigns, setCampaigns] = useState([]);
  const [adPackages, setAdPackages] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [loadingAds, setLoadingAds] = useState(true);

  // New Ad Campaign Modal State
  const [showAdModal, setShowAdModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [durationDays, setDurationDays] = useState(7);
  const [creatingAd, setCreatingAd] = useState(false);

  // Vouchers State
  const [vouchers, setVouchers] = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(true);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherForm, setVoucherForm] = useState({
    code: "",
    discount_percent: "10",
    max_usage: "50",
    min_transaction: "500000",
    valid_until: "2026-12-31",
  });
  const [submittingVoucher, setSubmittingVoucher] = useState(false);

  useEffect(() => {
    loadAdData();
    loadVouchers();
  }, []);

  async function loadAdData() {
    setLoadingAds(true);
    try {
      const [campsRes, pkgsRes, myProductsRes] = await Promise.all([
        api.get("/vendor/ad-campaigns"),
        api.get("/vendor/ad-packages"),
        api.get("/vendor/trips").catch(() => ({ data: [] }))
      ]);
      const campsList = Array.isArray(campsRes.data) ? campsRes.data : [];
      const pkgsList = Array.isArray(pkgsRes.data) ? pkgsRes.data : [];
      setCampaigns(campsList);
      setAdPackages(pkgsList);
      const products = Array.isArray(myProductsRes.data) ? myProductsRes.data : [];
      setMyProducts(products);
      if (products.length > 0) setSelectedProductId(products[0].id);
      if (pkgsList.length > 0) setSelectedPackageId(pkgsList[0].id);
    } catch (e) {
      toast.error("Gagal memuat data promosi iklan");
    } finally {
      setLoadingAds(false);
    }
  }

  async function loadVouchers() {
    setLoadingVouchers(true);
    try {
      const res = await api.get("/vendor/vouchers");
      setVouchers(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      //
    } finally {
      setLoadingVouchers(false);
    }
  }

  async function handleCreateAdCampaign(e) {
    e.preventDefault();
    if (!selectedProductId || !selectedPackageId) {
      toast.error("Pilih produk dan paket promosi yang valid.");
      return;
    }

    setCreatingAd(true);
    try {
      const payload = {
        product_id: selectedProductId,
        package_id: selectedPackageId,
        duration_days: Number(durationDays)
      };

      const res = await api.post("/vendor/ad-campaigns", payload);
      const { snap_token, redirect_url, campaign_id } = res.data;

      // Handle Midtrans Payment
      if (window.snap && snap_token) {
        window.snap.pay(snap_token, {
          onSuccess: function (result) {
            toast.success("Pembayaran Iklan Berhasil (Pembayaran melalui Trexio Dijamin Aman)! Menunggu persetujuan Super Admin.");
            setShowAdModal(false);
            loadAdData();
          },
          onPending: function (result) {
            toast.info("Pembayaran pending. Silakan selesaikan pembayaran Anda.");
            setShowAdModal(false);
            loadAdData();
          },
          onError: function (result) {
            toast.error("Pembayaran gagal atau dibatalkan.");
          },
          onClose: function () {
            toast.info("Jendela pembayaran ditutup.");
          }
        });
      } else if (redirect_url) {
        window.open(redirect_url, "_blank");
        setShowAdModal(false);
        loadAdData();
      } else {
        toast.success("Pengajuan kampanye iklan berhasil dikirim!");
        setShowAdModal(false);
        loadAdData();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal membuat kampanye iklan");
    } finally {
      setCreatingAd(false);
    }
  }

  async function handleVoucherSubmit(e) {
    e.preventDefault();
    if (!voucherForm.code.trim()) {
      toast.error("Kode promo wajib diisi.");
      return;
    }
    setSubmittingVoucher(true);
    try {
      await api.post("/vendor/vouchers", voucherForm);
      toast.success(`Voucher ${voucherForm.code.toUpperCase()} berhasil dibuat!`);
      setShowVoucherModal(false);
      setVoucherForm({ code: "", discount_percent: "10", max_usage: "50", min_transaction: "500000", valid_until: "2026-12-31" });
      loadVouchers();
    } catch (e) {
      toast.error("Gagal membuat voucher.");
    } finally {
      setSubmittingVoucher(false);
    }
  }

  const selectedPkg = (Array.isArray(adPackages) ? adPackages : []).find(p => p.id === selectedPackageId);
  const totalPrice = selectedPkg ? selectedPkg.price_per_duration * (Number(durationDays) / (selectedPkg.duration_days || 7)) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="trx-overline text-muted-foreground">Pemasaran & Visibilitas Vendor</div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter">Pemasaran & Iklan Produk</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Promosikan produk trip & rental Anda untuk meraih peringkat atas pencarian dan lencana SPONSORED di Homepage.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "advertising" ? (
            <Button
              onClick={() => setShowAdModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm gap-2"
            >
              <Rocket size={16} weight="fill" /> Pasang Iklan Produk
            </Button>
          ) : (
            <Button
              onClick={() => setShowVoucherModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm gap-2"
            >
              <Plus size={16} /> Buat Voucher Baru
            </Button>
          )}
        </div>
      </div>

      {/* Hero Banner Feature */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-900 text-white rounded-3xl p-6 md:p-8 shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 max-w-xl relative z-10">
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
            <Sparkle size={14} /> Official Sponsored Partner Placement
          </div>
          <h2 className="text-2xl font-black tracking-tight">Dapatkan 5x Lebih Banyak Pesanan dengan Iklan Sponsor</h2>
          <p className="text-xs text-purple-200 leading-relaxed">
            Produk terlayani iklan akan ditandai lencana <strong>SPONSORED</strong> dan otomatis tampil di posisi prioritas pencarian serta bagian "Mitra Pilihan & Trip Sponsor" di Beranda Utama Trexio.
          </p>
        </div>
        <div className="relative z-10 shrink-0">
          <Button
            onClick={() => setShowAdModal(true)}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-6 py-3 rounded-2xl shadow-md gap-2"
          >
            <Lightning size={18} weight="fill" /> Buat Kampanye Iklan Sekarang
          </Button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center border-b border-border gap-6">
        <button
          onClick={() => setActiveTab("advertising")}
          className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "advertising" ? "border-purple-600 text-purple-600 font-extrabold" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Rocket size={16} /> Kampanye Iklan & Sponsor ({campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab("vouchers")}
          className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "vouchers" ? "border-emerald-600 text-emerald-600 font-extrabold" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Ticket size={16} /> Kode Voucher & Diskon ({vouchers.length})
        </button>
      </div>

      {/* Tab 1: Advertising Campaigns */}
      {activeTab === "advertising" && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-sm">Riwayat & Performa Iklan Produk Anda</h3>
              <Button onClick={loadAdData} variant="ghost" size="sm" className="text-xs gap-1">
                <ArrowsClockwise size={14} /> Refresh
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Produk Diiklankan</th>
                    <th className="p-4">Paket & Penempatan</th>
                    <th className="p-4">Biaya Promosi</th>
                    <th className="p-4">Status & Masa Berlaku</th>
                    <th className="p-4">Performa Tayang & Klik</th>
                    <th className="p-4">Attributed Sales (GMV)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-muted-foreground">
                        <div className="max-w-xs mx-auto space-y-2">
                          <Rocket size={36} className="mx-auto text-purple-500 opacity-60" />
                          <p className="font-bold text-foreground">Belum ada kampanye iklan aktif</p>
                          <p className="text-[11px]">Pasang iklan sponsor pertama Anda untuk menjangkau ribuan calon pendaki di Trexio.</p>
                        </div>
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
                                className="w-10 h-10 rounded-xl object-cover border border-border shrink-0"
                              />
                              <div className="font-bold text-foreground line-clamp-1">{camp.product_title}</div>
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="font-bold">{camp.package_name}</div>
                            <span className="inline-block text-[10px] font-black uppercase text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 mt-0.5">
                              {camp.placement}
                            </span>
                          </td>

                          <td className="p-4 font-black text-purple-600">{formatRupiah(camp.amount || 0)}</td>

                          <td className="p-4 space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                camp.campaign_status === "active"
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  : camp.campaign_status === "pending_approval"
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                  : "bg-red-500/10 text-red-600 border-red-500/20"
                              }`}
                            >
                              {camp.campaign_status}
                            </span>
                            <div className="text-[10px] text-muted-foreground">
                              {camp.end_date ? `Selesai: ${new Date(camp.end_date).toLocaleDateString("id-ID")}` : "Menunggu Moderasi"}
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="font-bold">{camp.metrics?.impressions || 0} Impression</div>
                            <div className="text-[10px] text-muted-foreground">{camp.metrics?.clicks || 0} Klik (CTR {ctr}%)</div>
                          </td>

                          <td className="p-4">
                            <div className="font-black text-emerald-600">{formatRupiah(camp.metrics?.attributed_gmv || 0)}</div>
                            <div className="text-[10px] text-muted-foreground">{camp.metrics?.attributed_bookings || 0} Booking Teratribusi</div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Vouchers */}
      {activeTab === "vouchers" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vouchers.map((v) => (
              <div key={v.id} className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-black uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                    {v.code}
                  </span>
                  <span className="text-xs font-black text-purple-600">Diskon {v.discount_percent}%</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
                  <div>Min Transaksi: <strong>{formatRupiah(v.min_transaction || 0)}</strong></div>
                  <div>Penggunaan: <strong>{v.used_count || 0} / {v.max_usage}</strong></div>
                  <div>Masa Berlaku: <strong>{v.valid_until}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Ad Campaign Modal */}
      {showAdModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 pb-20 lg:pb-6 overflow-y-auto min-h-screen">
          <div className="bg-card border border-border rounded-2xl sm:rounded-3xl w-full max-w-lg p-4 sm:p-6 shadow-xl my-auto max-h-[calc(100dvh-5.5rem)] sm:max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="shrink-0 flex items-center justify-between border-b border-border pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                  <Rocket size={20} weight="fill" />
                </div>
                <h3 className="font-black text-base sm:text-lg">Buat Kampanye Iklan Produk</h3>
              </div>
              <button onClick={() => setShowAdModal(false)} className="text-muted-foreground hover:text-foreground text-sm font-bold p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdCampaign} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Pilih Produk Yang Diiklankan</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                >
                  {myProducts.length === 0 ? (
                    <option value="">Belum ada produk aktif</option>
                  ) : (
                    myProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} - ({formatRupiah(p.price)})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Pilih Paket Penempatan Sponsor</label>
                <div className="grid grid-cols-1 gap-2">
                  {adPackages.map((pkg) => (
                    <label
                      key={pkg.id}
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                        selectedPackageId === pkg.id
                          ? "border-purple-600 bg-purple-500/10 ring-2 ring-purple-500/20"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-foreground">{pkg.name}</div>
                        <div className="text-[10px] text-muted-foreground">{pkg.description}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-black text-purple-600">{formatRupiah(pkg.price_per_duration)}</div>
                        <div className="text-[10px] text-muted-foreground">/{pkg.duration_days} Hari</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Durasi Promosi (Hari)</label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-purple-500"
                >
                  <option value={7}>7 Hari (1 Minggu)</option>
                  <option value={14}>14 Hari (2 Minggu)</option>
                  <option value={30}>30 Hari (1 Bulan)</option>
                </select>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-muted/60 border border-border space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span>Total Biaya Promosi:</span>
                  <span className="text-base sm:text-lg font-black text-purple-600">{formatRupiah(totalPrice)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Pembayaran melalui Trexio Dijamin Aman. Iklan akan tayang otomatis setelah verifikasi status pembayaran & persetujuan admin.
                </p>
              </div>

              <div className="shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAdModal(false)} className="text-xs">
                  Batal
                </Button>
                <Button type="submit" disabled={creatingAd} size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-2 py-2.5">
                  <Lightning size={16} weight="fill" /> {creatingAd ? "Memproses..." : "Bayar Sekarang (Dijamin Aman)"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Voucher Modal */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 pb-20 lg:pb-6 overflow-y-auto min-h-screen">
          <div className="bg-card border border-border rounded-2xl sm:rounded-3xl w-full max-w-md p-4 sm:p-6 shadow-xl my-auto max-h-[calc(100dvh-5.5rem)] sm:max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="shrink-0 flex items-center justify-between border-b border-border pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Ticket size={20} weight="fill" />
                </div>
                <h3 className="font-black text-base sm:text-lg">Buat Kode Voucher Baru</h3>
              </div>
              <button onClick={() => setShowVoucherModal(false)} className="text-muted-foreground hover:text-foreground text-sm font-bold p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleVoucherSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Kode Voucher / Promo</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: TREXIO10"
                  value={voucherForm.code}
                  onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Diskon (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={voucherForm.discount_percent}
                    onChange={(e) => setVoucherForm({ ...voucherForm, discount_percent: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Kuota Penggunaan</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={voucherForm.max_usage}
                    onChange={(e) => setVoucherForm({ ...voucherForm, max_usage: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Min. Transaksi (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  required
                  value={voucherForm.min_transaction}
                  onChange={(e) => setVoucherForm({ ...voucherForm, min_transaction: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Berlaku Sampai</label>
                <input
                  type="date"
                  required
                  value={voucherForm.valid_until}
                  onChange={(e) => setVoucherForm({ ...voucherForm, valid_until: e.target.value })}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowVoucherModal(false)} className="text-xs">
                  Batal
                </Button>
                <Button type="submit" disabled={submittingVoucher} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 py-2.5">
                  <Ticket size={16} weight="fill" /> {submittingVoucher ? "Menyimpan..." : "Buat Voucher"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
