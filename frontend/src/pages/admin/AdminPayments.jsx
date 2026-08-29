import { useEffect, useState } from "react";
import { api, formatRupiah, formatApiError, formatDateID } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ShieldCheck,
  CreditCard,
  CheckCircle,
  ClockCounterClockwise,
  ArrowsClockwise,
  MagnifyingGlass,
  Receipt,
  Info,
  Bank,
  PaperPlaneTilt,
  Wallet,
  XCircle,
  Percent,
} from "@phosphor-icons/react";

export default function AdminPayments() {
  const [bookings, setBookings] = useState([]);
  const [finance, setFinance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Payout Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    amount: "",
    bank_name: "Bank Mandiri",
    account_number: "1370019283019",
    account_holder: "PT Trexio Petualang Indonesia",
    notes: "",
  });

  async function loadData() {
    try {
      setLoading(true);
      const [bookingsRes, financeRes] = await Promise.all([
        api.get("/admin/bookings"),
        api.get("/admin/finance"),
      ]);
      setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
      if (financeRes.data) {
        setFinance(financeRes.data);
        if (financeRes.data.payout_bank) {
          setPayoutForm((prev) => ({
            ...prev,
            bank_name: financeRes.data.payout_bank.bank_name || "Bank Mandiri",
            account_number: financeRes.data.payout_bank.account_number || "",
            account_holder: financeRes.data.payout_bank.account_holder || "",
          }));
        }
      }
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Gagal memuat data laporan keuangan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleRequestPayout(e) {
    e.preventDefault();
    const numAmount = Number(payoutForm.amount || 0);
    if (numAmount < 50000) {
      toast.error("Nominal pengajuan payout minimal Rp 50.000");
      return;
    }
    if (finance && numAmount > finance.available_balance) {
      toast.error("Nominal pengajuan melebihi saldo bersih yang tersedia");
      return;
    }

    try {
      setSubmittingPayout(true);
      const { data } = await api.post("/admin/payouts/request", payoutForm);
      toast.success(data.message || "Pengajuan payout berhasil dikirim ke Super Admin!");
      setShowPayoutModal(false);
      setPayoutForm({ ...payoutForm, amount: "", notes: "" });
      loadData();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Gagal mengirim pengajuan payout");
    } finally {
      setSubmittingPayout(false);
    }
  }

  async function syncBookingStatus(bookingId) {
    try {
      await api.get(`/payments/midtrans/status/${bookingId}`);
      toast.success("Status transaksi diperbarui dari Central Payment Engine");
      loadData();
    } catch (e) {
      toast.error("Gagal memperbarui status");
    }
  }

  const filtered = bookings.filter((b) => {
    const matchSearch =
      (b.booking_code || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.contact_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.trip_title || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "ALL" ||
      (statusFilter === "VERIFIED" && b.payment_status === "verified") ||
      (statusFilter === "PENDING" && b.payment_status === "pending") ||
      (statusFilter === "CANCELLED" && b.payment_status === "rejected");
    return matchSearch && matchStatus;
  });

  const grossSales = finance?.gross_sales || 0;
  const commissionFee = finance?.commission_fee || 0;
  const netRevenue = finance?.net_revenue || 0;
  const availableBalance = finance?.available_balance || 0;
  const payoutList = finance?.payouts || [];

  // Calculate live preview net for requested amount
  const requestedGross = Number(payoutForm.amount || 0);
  const commPercent = finance?.commission_percent || 10;
  const previewFee = Math.round(requestedGross * (commPercent / 100));
  const previewNet = Math.max(0, requestedGross - previewFee);

  return (
    <div className="pb-20 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="trx-overline text-emerald-600 font-bold uppercase tracking-wider text-xs">
            Tenant Operational Panel · Financial & Payout System
          </div>
          <h1 className="mt-1 text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Receipt size={28} className="text-emerald-500" /> Laporan Keuangan & Pengajuan Payout
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Pantau omset penjualan kotor, potongan komisi platform, saldo bersih siap cair, dan buat pengajuan payout langsung ke Super Admin.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setShowPayoutModal(true)}
            disabled={availableBalance <= 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer transition-all"
          >
            <PaperPlaneTilt size={16} weight="bold" /> Ajukan Payout Ke Super Admin
          </button>
          <Button
            onClick={loadData}
            variant="outline"
            className="text-xs font-bold gap-2 cursor-pointer"
          >
            <ArrowsClockwise size={16} /> Refresh Log
          </Button>
        </div>
      </div>

      {/* Centralized Infrastructure Banner */}
      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs leading-relaxed flex items-start gap-3">
        <Info size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" weight="fill" />
        <div>
          <span className="font-bold text-foreground block mb-0.5">Sistem Pembayaran & Bagi Hasil Otomatis Trexio</span>
          <p className="text-muted-foreground">
            Semua transaksi diproses secara real-time via Sistem Pembayaran Trexio (Dijamin Aman). Setiap transaksi dipotong komisi platform ({commPercent}%) & biaya gateway. Saldo bersih dapat diajukan untuk dicairkan ke rekening bank resmi Anda dan disetujui langsung oleh Super Admin.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 shadow-sm space-y-1">
          <div className="text-xs text-emerald-400 font-bold flex items-center justify-between">
            <span>SALDO SIAP AJUKAN PAYOUT</span>
            <Wallet size={20} />
          </div>
          <div className="text-2xl font-black text-emerald-400">{formatRupiah(availableBalance)}</div>
          <div className="text-[10px] text-muted-foreground">Sudah dipotong komisi {commPercent}% & transaksi</div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-1">
          <div className="text-xs text-muted-foreground font-semibold flex items-center justify-between">
            <span>Gross Sales (Omset Kotor)</span>
            <CreditCard size={20} className="text-blue-500" />
          </div>
          <div className="text-xl font-black text-foreground">{formatRupiah(grossSales)}</div>
          <div className="text-[10px] text-muted-foreground">Total dari {finance?.verified_bookings_count || 0} booking lunas</div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-1">
          <div className="text-xs text-muted-foreground font-semibold flex items-center justify-between">
            <span>Potongan Komisi Platform ({commPercent}%)</span>
            <Percent size={20} className="text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-500">-{formatRupiah(commissionFee)}</div>
          <div className="text-[10px] text-muted-foreground">Bagi hasil sistem platform Trexio</div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-1">
          <div className="text-xs text-muted-foreground font-semibold flex items-center justify-between">
            <span>Total Pendapatan Bersih (Net)</span>
            <ShieldCheck size={20} className="text-amber-500" />
          </div>
          <div className="text-xl font-black text-foreground">{formatRupiah(netRevenue)}</div>
          <div className="text-[10px] text-muted-foreground">Pendapatan bersih akumulasi tenant</div>
        </div>
      </div>

      {/* Payout Requests History Section */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
            <Bank size={18} className="text-emerald-500" /> Riwayat Pengajuan Payout Ke Super Admin
          </h3>
          <span className="text-xs text-muted-foreground font-medium">
            Total {payoutList.length} Pengajuan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted text-muted-foreground uppercase font-black tracking-wider text-[10px] border-b border-border">
              <tr>
                <th className="px-4 py-3">ID Payout</th>
                <th className="px-4 py-3">Tanggal Pengajuan</th>
                <th className="px-4 py-3">Nominal Gross</th>
                <th className="px-4 py-3">Potongan Komisi</th>
                <th className="px-4 py-3">Net Ditransfer</th>
                <th className="px-4 py-3">Rekening Tujuan</th>
                <th className="px-4 py-3 text-right">Status Super Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payoutList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-muted-foreground italic">
                    Belum ada pengajuan payout. Klik "Ajukan Payout Ke Super Admin" untuk mencairkan saldo.
                  </td>
                </tr>
              ) : (
                payoutList.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-amber-500">{p.id}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateID(p.created_at)}</td>
                    <td className="px-4 py-3 font-bold text-foreground">
                      {formatRupiah(p.gross_amount || p.amount || 0)}
                    </td>
                    <td className="px-4 py-3 font-bold text-rose-500">
                      -{formatRupiah(p.fee_amount || 0)} ({p.fee_percent || commPercent}%)
                    </td>
                    <td className="px-4 py-3 font-black text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(p.net_amount || p.gross_amount || p.amount || 0)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-foreground">{p.bank_name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">
                        {p.account_number} a.n {p.account_holder}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.status === "approved" || p.status === "paid" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle size={12} weight="fill" /> DISETUJUI & DITRANSFER
                        </span>
                      ) : p.status === "rejected" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <XCircle size={12} weight="fill" /> DITOLAK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <ClockCounterClockwise size={12} /> MENUNGGU KONFIRMASI
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
            <Receipt size={18} className="text-emerald-500" /> Log Transaksi Booking Lunas
          </h3>

          <div className="flex items-center gap-2">
            <div className="relative">
              <MagnifyingGlass size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari kode booking / nama / trip..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-background border border-border text-foreground text-xs pl-8 pr-3 py-1.5 rounded-xl w-56"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background border border-border text-foreground text-xs px-3 py-1.5 rounded-xl font-bold"
            >
              <option value="ALL">Semua Status</option>
              <option value="VERIFIED">Lunas (Terverifikasi)</option>
              <option value="PENDING">Menunggu Pembayaran</option>
              <option value="CANCELLED">Batal</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted text-muted-foreground uppercase font-black tracking-wider text-[10px] border-b border-border">
              <tr>
                <th className="px-4 py-3">Kode Order</th>
                <th className="px-4 py-3">Pemesan & Trip</th>
                <th className="px-4 py-3">Total Nominal</th>
                <th className="px-4 py-3">Saluran Payment</th>
                <th className="px-4 py-3">Status Verifikasi</th>
                <th className="px-4 py-3 text-right">Sinkronisasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    Memuat data transaksi...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground italic">
                    Tidak ada transaksi yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {b.booking_code}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-foreground">{b.contact_name || b.user_name}</div>
                      <div className="text-[10px] text-muted-foreground">{b.trip_title}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-foreground">{formatRupiah(b.total_amount)}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                      {b.payment_channel || "Trexio Pay"}
                    </td>
                    <td className="px-4 py-3">
                      {b.payment_status === "verified" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle size={12} weight="fill" /> LUNAS AUTOMATIC
                        </span>
                      ) : b.payment_status === "awaiting_verification" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                          <ClockCounterClockwise size={12} /> VERIFIKASI UPLOAD
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <ClockCounterClockwise size={12} /> MENUNGGU PEMBAYARAN
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => syncBookingStatus(b.id)}
                        className="px-2.5 py-1 bg-muted hover:bg-border text-foreground rounded-lg text-[10px] font-bold cursor-pointer transition-all inline-flex items-center gap-1"
                      >
                        <ArrowsClockwise size={12} /> Sync
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Pengajuan Payout Tenant */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="relative bg-card border border-border rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 my-auto max-h-[90vh] flex flex-col">
            <div className="shrink-0 flex justify-between items-center border-b border-border pb-3 mb-3">
              <h3 className="font-black text-base sm:text-lg text-foreground flex items-center gap-2">
                <PaperPlaneTilt size={20} className="text-emerald-500" /> Form Pengajuan Payout Tenant
              </h3>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="text-muted-foreground hover:text-foreground font-bold text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestPayout} className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 space-y-1">
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  Saldo Saluran Bersih Siap Dicairkan:
                </div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(availableBalance)}
                </div>
              </div>

              <div>
                <label className="font-extrabold uppercase text-muted-foreground block mb-1">
                  Nominal Pengajuan Payout (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="50000"
                  max={availableBalance}
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                  placeholder="Contoh: 5000000"
                  className="w-full min-w-0 text-sm font-bold p-3 bg-background border border-border rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Fee Breakdown Live Preview */}
              {requestedGross >= 50000 && (
                <div className="bg-muted p-3 rounded-xl border border-border space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Nominal Gross Requested:</span>
                    <span className="font-bold text-foreground">{formatRupiah(requestedGross)}</span>
                  </div>
                  <div className="flex justify-between text-rose-500">
                    <span>Potongan Komisi Platform ({commPercent}%):</span>
                    <span className="font-bold">-{formatRupiah(previewFee)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-extrabold border-t border-border pt-1">
                    <span>Estimasi Dana Net Masuk Rekening:</span>
                    <span>{formatRupiah(previewNet)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-border">
                <div className="font-extrabold uppercase text-muted-foreground">Rekening Tujuan Pencairan</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground">Bank Tujuan</label>
                    <input
                      type="text"
                      required
                      value={payoutForm.bank_name}
                      onChange={(e) => setPayoutForm({ ...payoutForm, bank_name: e.target.value })}
                      className="w-full p-2.5 bg-background border border-border rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground">Nomor Rekening</label>
                    <input
                      type="text"
                      required
                      value={payoutForm.account_number}
                      onChange={(e) => setPayoutForm({ ...payoutForm, account_number: e.target.value })}
                      className="w-full p-2.5 bg-background border border-border rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground">Nama Pemilik Rekening</label>
                  <input
                    type="text"
                    required
                    value={payoutForm.account_holder}
                    onChange={(e) => setPayoutForm({ ...payoutForm, account_holder: e.target.value })}
                    className="w-full p-2.5 bg-background border border-border rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground">Catatan Tambahan (Opsional)</label>
                  <input
                    type="text"
                    value={payoutForm.notes}
                    onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                    placeholder="Contoh: Pencairan dana booking periode akhir pekan"
                    className="w-full p-2.5 bg-background border border-border rounded-lg"
                  />
                </div>
              </div>

              <div className="shrink-0 flex justify-end gap-2 pt-3 border-t border-border mt-3">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-2 font-bold text-xs border border-border rounded-xl hover:bg-muted cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingPayout}
                  className="px-5 py-2 font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {submittingPayout ? "Mengirim..." : "Kirim Pengajuan Payout"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
