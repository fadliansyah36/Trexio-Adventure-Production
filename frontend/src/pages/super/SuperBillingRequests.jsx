import React, { useState, useEffect } from "react";
import { api, formatRupiah } from "@/lib/api";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Eye,
  Rocket,
  ShieldCheck,
  Receipt,
  Clock,
  ArrowsClockwise,
  UserCheck,
  WarningCircle
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export default function SuperBillingRequests() {
  const [campaigns, setCampaigns] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending_approval"); // pending_approval | active | rejected | all

  // Review Modal State
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [campsRes, txRes] = await Promise.all([
        api.get("/super/ad-campaigns"),
        api.get("/super/billing-transactions")
      ]);
      setCampaigns(Array.isArray(campsRes.data) ? campsRes.data : []);
      setTransactions(Array.isArray(txRes.data) ? txRes.data : []);
    } catch (err) {
      toast.error("Gagal memuat permohonan billing");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(camp) {
    try {
      await api.post(`/super/ad-campaigns/${camp.id}/approve`);
      toast.success(`Iklan "${camp.product_title}" berhasil disetujui dan diaktifkan di marketplace!`);
      setSelectedCampaign(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal menyetujui kampanye iklan");
    }
  }

  async function handleRejectConfirm(e) {
    e.preventDefault();
    if (!selectedCampaign) return;
    try {
      await api.post(`/super/ad-campaigns/${selectedCampaign.id}/reject`, {
        rejection_reason: rejectionReason
      });
      toast.success(`Iklan "${selectedCampaign.product_title}" ditolak.`);
      setShowRejectModal(false);
      setSelectedCampaign(null);
      setRejectionReason("");
      fetchData();
    } catch (err) {
      toast.error("Gagal menolak kampanye iklan");
    }
  }

  const filteredCampaigns = campaigns.filter(c => {
    if (statusFilter === "all") return true;
    if (statusFilter === "pending_approval") return c.campaign_status === "pending_approval" || c.approval_status === "pending_approval";
    return c.campaign_status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">
              Moderation & Approvals Center
            </span>
            <span className="text-xs text-muted-foreground">Verification Queue</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Persetujuan Billing & Iklan Vendor</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Pusat verifikasi dan persetujuan kampanye promosi vendor serta konfirmasi pembayaran langganan tenant.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchData} variant="outline" size="sm" className="gap-2 text-xs">
            <ArrowsClockwise size={14} /> Refresh
          </Button>
        </div>
      </div>

      {/* Status Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setStatusFilter("pending_approval")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            statusFilter === "pending_approval"
              ? "bg-amber-500 text-slate-950 font-black shadow-sm"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock size={16} /> Menunggu Persetujuan ({campaigns.filter(c => c.campaign_status === "pending_approval" || c.approval_status === "pending_approval").length})
        </button>

        <button
          onClick={() => setStatusFilter("active")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            statusFilter === "active"
              ? "bg-emerald-600 text-white font-black shadow-sm"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <CheckCircle size={16} /> Aktif Berjalan ({campaigns.filter(c => c.campaign_status === "active").length})
        </button>

        <button
          onClick={() => setStatusFilter("rejected")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            statusFilter === "rejected"
              ? "bg-red-600 text-white font-black shadow-sm"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <XCircle size={16} /> Ditolak ({campaigns.filter(c => c.campaign_status === "rejected").length})
        </button>

        <button
          onClick={() => setStatusFilter("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            statusFilter === "all"
              ? "bg-foreground text-background font-black shadow-sm"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          Semua Permohonan ({campaigns.length})
        </button>
      </div>

      {/* Main Approval Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-foreground">Daftar Permohonan Iklan & Promosi Vendor</h3>
            <p className="text-[11px] text-muted-foreground sm:hidden">Geser tabel ke samping untuk melihat detail lengkap</p>
          </div>
          <span className="text-xs text-muted-foreground font-semibold">{filteredCampaigns.length} Item</span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[750px] text-xs text-left">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Vendor & Produk</th>
                <th className="p-4">Paket & Penempatan</th>
                <th className="p-4">Pembayaran Trexio</th>
                <th className="p-4">Status Moderasi</th>
                <th className="p-4">Aksi Eksekusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground">
                    <div className="max-w-xs mx-auto space-y-2">
                      <ShieldCheck size={32} className="mx-auto text-emerald-500 dark:text-emerald-400 opacity-60" />
                      <p className="font-bold text-foreground">Antrean Moderasi Bersih!</p>
                      <p className="text-[11px]">Tidak ada permohonan iklan vendor yang perlu dimoderasi saat ini.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={camp.product_image || "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=200"}
                          alt={camp.product_title}
                          className="w-12 h-12 rounded-xl object-cover border border-border shrink-0"
                        />
                        <div>
                          <div className="font-bold text-foreground text-sm line-clamp-1">{camp.product_title}</div>
                          <div className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1 mt-0.5">
                            <UserCheck size={12} className="text-emerald-500 dark:text-emerald-400" /> {camp.vendor_name}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-foreground">{camp.package_name}</div>
                      <div className="text-[10px] text-purple-600 dark:text-purple-400 uppercase font-black tracking-wider mt-1">
                        {camp.placement} ({camp.duration_days} Hari)
                      </div>
                    </td>

                    <td className="p-4 space-y-1">
                      <div className="font-black text-emerald-600 dark:text-emerald-400">{formatRupiah(camp.amount || 0)}</div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        camp.payment_status === "paid"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      }`}>
                        {camp.payment_status === "paid" ? "TERBAYAR (LUNAS)" : "PENDING PAYMENT"}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          camp.campaign_status === "active"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : camp.campaign_status === "pending_approval"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                        }`}
                      >
                        {camp.campaign_status}
                      </span>
                    </td>

                    <td className="p-4 space-x-2">
                      {camp.campaign_status === "pending_approval" || camp.approval_status === "pending_approval" ? (
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleApprove(camp)}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1"
                          >
                            <CheckCircle size={14} /> Setujui
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedCampaign(camp);
                              setShowRejectModal(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold text-xs gap-1"
                          >
                            <XCircle size={14} /> Tolak
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => {
                            setSelectedCampaign(camp);
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-xs font-semibold"
                        >
                          <Eye size={14} className="mr-1" /> Lihat Detail
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedCampaign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-4 sm:p-6 shadow-xl my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="shrink-0 flex items-center gap-2 text-red-600 font-black text-base sm:text-lg border-b border-border pb-3 mb-3">
              <WarningCircle size={22} />
              <span>Tolak Pengajuan Iklan Vendor</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Anda akan menolak kampanye iklan <strong>"{selectedCampaign.product_title}"</strong> dari vendor <strong>{selectedCampaign.vendor_name}</strong>. Silakan berikan alasan penolakan.
              </p>

              <form onSubmit={handleRejectConfirm} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Alasan Penolakan</label>
                  <textarea
                    required
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-3 text-xs font-medium focus:ring-2 focus:ring-red-500"
                    placeholder="Contoh: Gambar produk buram, judul mengandung kata sensitif, atau stok pax kosong."
                  />
                </div>

                <div className="shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 pt-3 border-t border-border">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowRejectModal(false)} className="text-xs">
                    Batal
                  </Button>
                  <Button type="submit" size="sm" className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5">
                    Konfirmasi Tolak
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
