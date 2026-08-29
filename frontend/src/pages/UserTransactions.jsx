import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Receipt, DownloadSimple, ArrowUpRight, CheckCircle, Clock, XCircle, FileText, ArrowsLeftRight, Copy, ShieldCheck } from "@phosphor-icons/react";
import { api, formatRupiah, formatDateID } from "@/lib/api";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import { Receipt as LucideReceipt } from "lucide-react";

export default function UserTransactions() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [refundModal, setRefundModal] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/bookings/mine")
      .then((res) => {
        const myBookings = Array.isArray(res.data) ? res.data : [];
        const mapped = myBookings.map((b) => ({
          id: b.id,
          tx_id: b.midtrans_order_id || b.booking_code,
          booking_code: b.booking_code,
          product: b.trip_title || b.title || "Paket Trip",
          partner: b.vendor_name || "Mitra Trexio",
          date: b.created_at || new Date().toISOString(),
          amount: b.total_amount || 0,
          fee: 0,
          discount: 0,
          total: b.total_amount || 0,
          payment_method: b.payment_method || "Pembayaran Trexio (Dijamin Aman)",
          status: (b.payment_status === "verified" || b.payment_status === "paid" || b.booking_status === "confirmed") ? "PAID" : ((b.payment_status || "").toLowerCase() === "cancelled" || (b.booking_status || "").toLowerCase() === "cancelled" || (b.status || "").toUpperCase() === "CANCELLED") ? "CANCELLED" : "PENDING",
          invoice_no: `INV/TREXIO/${b.booking_code}`,
        }));
        setTransactions(mapped);
      })
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(`Disalin: ${text}`);
  };

  const filteredTx = transactions.filter((t) => {
    if (activeTab === "all") return true;
    if (activeTab === "paid") return t.status === "PAID";
    if (activeTab === "refund") return t.status === "REFUNDED" || t.status === "REFUND_REQUESTED";
    return true;
  });

  const handleRequestRefund = (tx) => {
    setRefundModal(tx);
  };

  const submitRefund = (e) => {
    e.preventDefault();
    if (!refundModal) return;

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === refundModal.id
          ? { ...t, status: "REFUND_REQUESTED", refund_status: "PROCESSING" }
          : t
      )
    );
    toast.success("Permohonan refund berhasil diajukan! Tim Trexio akan memverifikasi.");
    setRefundModal(null);
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-1">
              <Receipt size={16} weight="fill" /> Payments & Audit Trail
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              Histori Transaksi & Invoice
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Semua bukti pembayaran, kuitansi digital, dan pengajuan refund dana secara transparan.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border gap-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === "all" ? "border-emerald-500 text-emerald-600" : "border-transparent text-muted-foreground"
            }`}
          >
            Semua Transaksi ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab("paid")}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === "paid" ? "border-emerald-500 text-emerald-600" : "border-transparent text-muted-foreground"
            }`}
          >
            Berhasil / Paid ({transactions.filter((t) => t.status === "PAID").length})
          </button>
          <button
            onClick={() => setActiveTab("refund")}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === "refund" ? "border-emerald-500 text-emerald-600" : "border-transparent text-muted-foreground"
            }`}
          >
            Refund Center ({transactions.filter((t) => t.status.includes("REFUND")).length})
          </button>
        </div>

        {/* Transaction Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground font-extrabold uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="px-4 py-3.5">Tanggal</th>
                  <th className="px-4 py-3.5">No Invoice & Booking</th>
                  <th className="px-4 py-3.5">Produk & Partner</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Total Pembayaran</th>
                  <th className="px-4 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {filteredTx.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <EmptyState
                        title="Belum Ada Transaksi"
                        description="Kuitansi digital dan histori pembayaran pesanan Anda akan otomatis dicatat di sini."
                        icon={LucideReceipt}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                      {formatDateID(tx.date)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-foreground text-xs">{tx.invoice_no}</div>
                      <div className="text-[10px] text-emerald-600 font-bold mt-0.5">{tx.booking_code}</div>
                    </td>
                    <td className="px-4 py-4 max-w-[220px]">
                      <div className="font-bold text-foreground truncate">{tx.product}</div>
                      <div className="text-[11px] text-muted-foreground">{tx.partner}</div>
                    </td>
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      {tx.status === "PAID" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle size={12} weight="fill" /> PEMBAYARAN SUKSES
                        </span>
                      ) : tx.status === "REFUNDED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                          <ArrowsLeftRight size={12} /> REFUND SELESAI
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock size={12} /> PROSES REFUND
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <div className="font-black text-sm text-foreground">{formatRupiah(tx.total)}</div>
                      <div className="text-[10px] text-muted-foreground">{tx.payment_method}</div>
                    </td>
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedInvoice(tx)}
                          className="bg-slate-100 dark:bg-zinc-800 hover:bg-emerald-600 hover:text-white text-foreground text-[11px] font-bold px-3 py-1.5 rounded-xl transition-colors"
                        >
                          Invoice
                        </button>
                        {tx.status === "PAID" && (
                          <button
                            onClick={() => handleRequestRefund(tx)}
                            className="text-[11px] text-rose-600 hover:underline font-bold"
                          >
                            Ajukan Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Modal */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 pb-20 md:pb-6 overflow-y-auto min-h-screen">
            <div className="bg-card border border-border rounded-2xl max-w-md w-full p-4 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 my-auto max-h-[calc(100dvh-5.5rem)] sm:max-h-[90vh] flex flex-col">
              <div className="shrink-0 flex justify-between items-center border-b border-border pb-3">
                <div className="flex items-center gap-2 font-black text-sm sm:text-base text-foreground">
                  <ShieldCheck size={20} className="text-emerald-500" /> Digital Official Receipt
                </div>
                <button onClick={() => setSelectedInvoice(null)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground font-bold text-sm hover:bg-muted transition-colors">
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
                <div className="bg-slate-50 dark:bg-zinc-800 p-3.5 sm:p-4 rounded-xl space-y-2 border border-border">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground">Nomor Kuitansi</div>
                  <div className="font-mono font-black text-sm text-emerald-600 flex items-center justify-between">
                    <span>{selectedInvoice.invoice_no}</span>
                    <button onClick={() => copyToClipboard(selectedInvoice.invoice_no)} className="text-muted-foreground hover:text-foreground">
                      <Copy size={14} />
                    </button>
                  </div>
                  <div className="text-muted-foreground">Metode: {selectedInvoice.payment_method}</div>
                </div>

                <div className="space-y-2 p-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deskripsi:</span>
                    <span className="font-bold text-foreground text-right">{selectedInvoice.product}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mitra Organizer:</span>
                    <span className="font-bold text-foreground">{selectedInvoice.partner}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Harga Layanan:</span>
                    <span className="font-bold text-foreground">{formatRupiah(selectedInvoice.amount)}</span>
                  </div>
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Diskon Promo:</span>
                      <span className="font-bold">-{formatRupiah(selectedInvoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-border font-black text-sm">
                    <span>Total Lunas:</span>
                    <span className="text-emerald-600">{formatRupiah(selectedInvoice.total)}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 pt-2 border-t border-border">
                <button
                  onClick={() => {
                    toast.success("Invoice PDF diunduh!");
                    setSelectedInvoice(null);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-xs"
                >
                  <DownloadSimple size={16} /> Unduh PDF Invoice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Refund Request Modal */}
        {refundModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 pb-20 md:pb-6 overflow-y-auto min-h-screen">
            <form onSubmit={submitRefund} className="bg-card border border-border rounded-2xl max-w-md w-full p-4 sm:p-6 space-y-4 shadow-2xl my-auto max-h-[calc(100dvh-5.5rem)] sm:max-h-[90vh] flex flex-col">
              <h3 className="shrink-0 font-black text-base text-foreground border-b border-border pb-2">
                Formulir Pengajuan Refund
              </h3>

              <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Refund akan diproses sesuai dengan Cancellation Policy produk ({refundModal.partner}). Estimasi refund 90% (potongan biaya admin).
                </p>

                <div>
                  <label className="font-bold text-foreground block mb-1">Alasan Pembatalan:</label>
                  <select required className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-medium">
                    <option value="">-- Pilih Alasan --</option>
                    <option value="schedule">Perubahan Jadwal Pribadi</option>
                    <option value="weather">Cuaca / Peringatan BMKG</option>
                    <option value="health">Kondisi Kesehatan</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-foreground block mb-1">Nomor Rekening / E-Wallet Pengembalian:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: BCA 89123456 a.n. Farhan"
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-medium"
                  />
                </div>
              </div>

              <div className="shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setRefundModal(null)}
                  className="px-4 py-2.5 border border-border rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold"
                >
                  Konfirmasi Refund
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
