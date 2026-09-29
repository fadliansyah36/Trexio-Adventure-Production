import { useEffect, useState } from "react";
import { apiFetch, formatRupiah } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Wallet, ArrowDownRight, ArrowUpRight, Bank, Plus, PaperPlaneRight } from "@phosphor-icons/react";

export default function WalletPage() {
  const [wallet, setWallet] = useState({ balance: 0, transactions: [], payouts: [] });
  const [topupAmount, setTopupAmount] = useState("100000");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankName, setBankName] = useState("BCA");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [loading, setLoading] = useState(false);

  const loadWallet = async () => {
    try {
      const data = await apiFetch("/wallet/mine");
      setWallet({
        balance: data.balance || 0,
        transactions: Array.isArray(data.transactions) ? data.transactions : [],
        payouts: Array.isArray(data.payouts) ? data.payouts : [],
      });
    } catch (e) {
      toast.error("Gagal memuat saldo dompet");
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const handleTopup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/wallet/topup", {
        method: "POST",
        body: JSON.stringify({ amount: Number(topupAmount), method: "Virtual Account" }),
      });
      toast.success("Top-up saldo berhasil!");
      loadWallet();
    } catch (e) {
      toast.error(e.message || "Gagal top-up saldo");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawAmount || !accountNumber || !accountHolder) {
      return toast.error("Semua field penarikan wajib diisi");
    }
    setLoading(true);
    try {
      await apiFetch("/wallet/withdraw", {
        method: "POST",
        body: JSON.stringify({
          amount: Number(withdrawAmount),
          bank_name: bankName,
          account_number: accountNumber,
          account_holder: accountHolder,
        }),
      });
      toast.success("Permintaan pencairan dana berhasil dikirim!");
      setWithdrawAmount("");
      setAccountNumber("");
      setAccountHolder("");
      loadWallet();
    } catch (e) {
      toast.error(e.message || "Gagal mengajukan penarikan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-20">
      <div className="trx-container pt-10">
        <div className="trx-overline text-muted-foreground">Dompet Digital</div>
        <h1 className="mt-2 text-3xl md:text-5xl font-black tracking-tighter">
          Dompet & Saldo TREXIO
        </h1>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Balance Card */}
          <div className="lg:col-span-1 bg-gradient-to-br from-[hsl(var(--primary))] to-emerald-800 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="flex items-center gap-2 text-emerald-200 text-sm font-medium">
                <Wallet size={20} /> Saldo Aktif
              </div>
              <div className="text-3xl md:text-4xl font-black mt-2 tracking-tight">
                {formatRupiah(wallet.balance)}
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/20 text-xs text-white/80">
              Dapat digunakan untuk reservasi trip, sewa peralatan outdoor, dan penarikan ke rekening bank.
            </div>
          </div>

          {/* Topup Form */}
          <div className="bg-white border border-border p-6 rounded-xl">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Plus size={20} className="text-[hsl(var(--secondary))]" /> Isi Saldo (Top-up)
            </h3>
            <form onSubmit={handleTopup} className="mt-4 space-y-4">
              <div>
                <Label className="text-xs">Nominal Top-up (Rp)</Label>
                <div className="mt-1 grid grid-cols-3 gap-2 mb-2">
                  {[50000, 100000, 250000, 500000, 1000000].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setTopupAmount(val.toString())}
                      className={`text-xs p-2 rounded border transition-colors ${
                        topupAmount === val.toString()
                          ? "border-[hsl(var(--secondary))] bg-[hsl(var(--muted))] font-bold"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {formatRupiah(val)}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  placeholder="Atau ketik nominal..."
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-[hsl(var(--secondary))] text-white">
                {loading ? "Memproses..." : "Top-up Instan"}
              </Button>
            </form>
          </div>

          {/* Withdraw Form */}
          <div className="bg-white border border-border p-6 rounded-xl">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Bank size={20} className="text-emerald-700" /> Tarik Saldo Ke Rekening
            </h3>
            <form onSubmit={handleWithdraw} className="mt-4 space-y-3">
              <div>
                <Label className="text-xs">Nominal Penarikan (Rp)</Label>
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Min. Rp50.000"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Bank</Label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full text-xs p-2.5 border rounded-md bg-white mt-1"
                  >
                    <option value="BCA">BCA</option>
                    <option value="Mandiri">Mandiri</option>
                    <option value="BNI">BNI</option>
                    <option value="BRI">BRI</option>
                    <option value="CIMB">CIMB Niaga</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">No. Rekening</Label>
                  <Input
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="1234567890"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Atas Nama Rekening</Label>
                <Input
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Nama sesuai buku tabungan"
                  className="mt-1"
                />
              </div>
              <Button type="submit" disabled={loading} variant="outline" className="w-full">
                <PaperPlaneRight size={16} className="mr-1" /> Ajukan Penarikan
              </Button>
            </form>
          </div>
        </div>

        {/* Transaction History */}
        <div className="mt-10 bg-white border border-border rounded-xl p-6">
          <h3 className="font-bold text-xl mb-4">Riwayat Mutasi Saldo</h3>
          <div className="divide-y overflow-x-auto">
            {(wallet.transactions || []).length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">Belum ada riwayat transaksi.</div>
            ) : (
              (wallet.transactions || []).map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        tx.type === "credit" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {tx.type === "credit" ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div>
                      <div className="font-bold">{tx.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString("id-ID")}
                      </div>
                    </div>
                  </div>
                  <div className={`font-black ${tx.type === "credit" ? "text-emerald-800" : "text-red-800"}`}>
                    {tx.type === "credit" ? "+" : "-"}{formatRupiah(tx.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
