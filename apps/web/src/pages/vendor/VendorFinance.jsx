import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api, formatRupiah, formatDateID } from "@/lib/api";
import { CurrencyDollar, Wallet, ArrowUpRight, Bank, Receipt, CheckCircle, Warning, Clock } from "@phosphor-icons/react";
import { toast } from "sonner";
import TransactionLedger from "@/components/vendor/TransactionLedger";

export default function VendorFinance() {
  const { vendor } = useOutletContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [wdForm, setWdForm] = useState({ amount: "", bank_name: "", account_number: "", account_holder: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFinance();
  }, []);

  async function loadFinance() {
    setLoading(true);
    try {
      const res = await api.get("/vendor/finance");
      setData(res.data);
      if (res.data.payout_bank) {
        setWdForm({
          amount: "",
          bank_name: res.data.payout_bank.bank_name || "BCA",
          account_number: res.data.payout_bank.account_number || "",
          account_holder: res.data.payout_bank.account_holder || vendor.brand_name,
        });
      }
    } catch (e) {
      toast.error("Gagal memuat data keuangan.");
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw(e) {
    e.preventDefault();
    if (!wdForm.amount || Number(wdForm.amount) < 50000) {
      toast.error("Nominal penarikan minimal Rp 50.000");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/vendor/withdraw", wdForm);
      toast.success(res.data.message || "Pengajuan penarikan berhasil!");
      setShowWithdrawModal(false);
      loadFinance();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal mengajukan penarikan.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-sm font-bold text-neutral-500">Memuat keuangan & dompet...</div>;
  }

  const wallet = data?.wallet || { available_balance: 0, pending_balance: 0, processing_withdrawal: 0, paid_out: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="trx-overline text-muted-foreground">Keuangan & Saldo</div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter">Dompet & Ledger Keuangan</h1>
          <p className="text-xs text-muted-foreground mt-1">Transparansi pendapatan bersih, potongan komisi platform Trexio 7%, dan riwayat penarikan dana.</p>
        </div>
        <button
          onClick={() => setShowWithdrawModal(true)}
          disabled={wallet.available_balance <= 0}
          className="inline-flex items-center gap-2 bg-[hsl(var(--primary))] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
        >
          <ArrowUpRight size={16} /> Tarik Saldo Ke Rekening
        </button>
      </div>

      {/* Wallet Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-emerald-900 text-white rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-200">
            <span>SALDO SIAP DITARIK</span>
            <Wallet size={18} />
          </div>
          <div className="text-2xl font-black">{formatRupiah(wallet.available_balance)}</div>
          <div className="text-[10px] text-emerald-300">Dapat ditransfer langsung ke rekening bank Anda</div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>PENDAPATAN BERSIH (NET)</span>
            <CurrencyDollar size={18} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-foreground">{formatRupiah(data.net_revenue)}</div>
          <div className="text-[10px] text-muted-foreground">Setelah potongan komisi 7% + PG Fee</div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>SALDO PENDING</span>
            <Clock size={18} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{formatRupiah(wallet.pending_balance)}</div>
          <div className="text-[10px] text-muted-foreground">Booking aktif berjalan (Holding escrow)</div>
        </div>

        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>TOTAL DICAIRKAN</span>
            <Receipt size={18} className="text-blue-600" />
          </div>
          <div className="text-2xl font-black text-foreground">{formatRupiah(wallet.paid_out)}</div>
          <div className="text-[10px] text-muted-foreground">Total dana masuk ke rekening bank mitra</div>
        </div>
      </div>

      {/* Financial Breakdown */}
      <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-neutral-600">Rincian Transaksi & Fee Platform</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <div className="text-muted-foreground">Gross Sales (Omset Kotor)</div>
            <div className="text-lg font-black mt-1 text-foreground">{formatRupiah(data.gross_sales)}</div>
          </div>
          <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-rose-900">
            <div className="text-rose-700">Potongan Komisi Trexio (7%)</div>
            <div className="text-lg font-black mt-1">{formatRupiah(data.trexio_fee)}</div>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
            <div className="text-emerald-700">Net Revenue Mitra</div>
            <div className="text-lg font-black mt-1">{formatRupiah(data.net_revenue)}</div>
          </div>
        </div>
      </div>

      {/* Ledger Entries Component & Withdrawals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TransactionLedger
            transactions={data.ledger}
            loading={loading}
            onRefresh={loadFinance}
          />
        </div>

        {/* Withdrawal History */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-neutral-600">Riwayat Penarikan Dana</h2>
          {data.withdrawals?.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-6">Belum ada riwayat penarikan dana.</div>
          ) : (
            <div className="space-y-3">
              {data.withdrawals?.map((w) => (
                <div key={w.id} className="p-3 border border-border rounded-xl text-xs space-y-1">
                  <div className="flex justify-between items-center font-bold">
                    <span>{formatRupiah(w.amount)}</span>
                    {w.status === "paid" || w.status === "approved" ? (
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle size={12} weight="fill" /> Disetujui Super Admin
                      </span>
                    ) : w.status === "rejected" ? (
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 flex items-center gap-1">
                        <Warning size={12} weight="fill" /> Ditolak
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                        <Clock size={12} /> Menunggu Super Admin
                      </span>
                    )}
                  </div>
                  {w.net_amount && (
                    <div className="text-[10px] text-emerald-700 font-semibold">
                      Net Ditransfer: {formatRupiah(w.net_amount)} (Fee: -{formatRupiah(w.fee_amount || 0)})
                    </div>
                  )}
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Bank size={14} /> {w.bank_name} {w.account_number} a.n {w.account_holder}
                  </div>
                  <div className="text-[10px] text-neutral-400">{formatDateID(w.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Withdrawal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 pb-20 lg:pb-6 overflow-y-auto min-h-screen">
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-xl animate-in fade-in zoom-in-95 my-auto max-h-[calc(100dvh-5.5rem)] sm:max-h-[90vh] flex flex-col">
            <div className="shrink-0 flex justify-between items-center border-b border-border pb-3 mb-3">
              <h3 className="font-black text-base sm:text-lg text-foreground flex items-center gap-2">
                <Bank size={20} className="text-[hsl(var(--primary))]" /> Penarikan Dana Mitra Vendor
              </h3>
              <button onClick={() => setShowWithdrawModal(false)} className="text-muted-foreground hover:text-foreground font-bold text-sm p-1">✕</button>
            </div>

            <form onSubmit={handleWithdraw} className="flex-1 overflow-y-auto space-y-3.5 text-xs pr-1">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900">
                <div className="font-bold">Saldo Maksimal Siap Tarik:</div>
                <div className="text-lg font-black text-emerald-700">{formatRupiah(wallet.available_balance)}</div>
              </div>

              <div>
                <label className="font-extrabold uppercase text-neutral-500">Nominal Penarikan (Rp)</label>
                <input
                  type="number"
                  required
                  min="50000"
                  max={wallet.available_balance}
                  value={wdForm.amount}
                  onChange={(e) => setWdForm({ ...wdForm, amount: e.target.value })}
                  placeholder="Contoh: 1500000"
                  className="mt-1 w-full min-w-0 text-sm font-bold p-3 border border-border rounded-xl focus:outline-none focus:border-[hsl(var(--primary))]"
                />
              </div>

              {Number(wdForm.amount) >= 50000 && (
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-neutral-600">
                    <span>Nominal Pengajuan Penarikan:</span>
                    <span className="font-bold">{formatRupiah(Number(wdForm.amount))}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Biaya Transfer / Platform:</span>
                    <span className="font-bold text-emerald-600">Rp 0 (Gratis)</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-extrabold border-t border-neutral-200 pt-1">
                    <span>Total Bersih Diterima di Rekening:</span>
                    <span>{formatRupiah(Number(wdForm.amount))}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-border">
                <div className="font-extrabold uppercase text-neutral-500">Rekening Tujuan Payout</div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground">Bank</label>
                  <input
                    type="text"
                    required
                    value={wdForm.bank_name}
                    onChange={(e) => setWdForm({ ...wdForm, bank_name: e.target.value })}
                    className="w-full min-w-0 p-2.5 border border-border rounded-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground">Nomor Rekening</label>
                  <input
                    type="text"
                    required
                    value={wdForm.account_number}
                    onChange={(e) => setWdForm({ ...wdForm, account_number: e.target.value })}
                    className="w-full min-w-0 p-2.5 border border-border rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground">Nama Pemilik Rekening</label>
                  <input
                    type="text"
                    required
                    value={wdForm.account_holder}
                    onChange={(e) => setWdForm({ ...wdForm, account_holder: e.target.value })}
                    className="w-full min-w-0 p-2.5 border border-border rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div className="shrink-0 flex justify-end gap-2 pt-3 border-t border-border mt-3">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 font-bold text-xs border border-border rounded-xl hover:bg-neutral-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 font-bold text-xs bg-[hsl(var(--primary))] text-white rounded-xl hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Memproses..." : "Konfirmasi Penarikan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
