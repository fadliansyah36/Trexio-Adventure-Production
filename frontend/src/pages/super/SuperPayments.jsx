import { useEffect, useState } from "react";
import { api, formatRupiah, formatApiError, formatDateID } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import {
  ShieldCheck,
  CreditCard,
  CheckCircle,
  XCircle,
  ClockCounterClockwise,
  Key,
  ArrowsClockwise,
  MagnifyingGlass,
  Crown,
  Gear,
  FloppyDisk,
  ToggleLeft,
  ToggleRight,
  Sliders,
  Receipt,
  ArrowsDownUp,
  Copy,
  Lightning,
  Bank,
  PaperPlaneTilt,
  Check,
  X,
  User,
  Storefront,
  Buildings,
  Percent,
  Wallet,
  DownloadSimple,
} from "@phosphor-icons/react";
import { exportAdminBookingsCSV, exportAdminPayoutsCSV } from "@/lib/exportCsv";

export default function SuperPayments() {
  const [activeTab, setActiveTab] = useState("payouts"); // 'payouts' | 'midtrans' | 'financial' | 'transactions'
  const [payoutSubTab, setPayoutSubTab] = useState("tenant"); // 'tenant' | 'vendor' | 'all'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmingSaveConfig, setConfirmingSaveConfig] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [payoutFilter, setPayoutFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Approval & Rejection Modal States
  const [approvingPayout, setApprovingPayout] = useState(null);
  const [rejectingPayout, setRejectingPayout] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processingAction, setProcessingAction] = useState(false);

  const [config, setConfig] = useState({
    server_key: "",
    client_key: "",
    is_production: false,
    enabled: true,
    merchant_id: "M88910291",
    platform_fee: 5000,
    service_fee_percent: 2.5,
    commission_percent: 10.0,
    tenant_commission_percent: 10.0,
    tenant_platform_fee: 5000,
    vendor_commission_percent: 7.0,
    vendor_platform_fee: 2500,
    settlement_schedule: "daily",
    refund_approval_required: true,
    active_channels: ["gopay", "qris", "bca_va", "mandiri_va", "credit_card"],
    webhook_url: "https://trexio.id/api/payments/midtrans/notification",
  });

  async function loadData() {
    try {
      setLoading(true);
      const [configRes, bookingsRes, payoutsRes] = await Promise.all([
        api.get("/super/payments/midtrans/config"),
        api.get("/admin/bookings"),
        api.get("/super/payouts"),
      ]);
      if (configRes.data) {
        setConfig((prev) => ({
          ...prev,
          ...configRes.data,
          tenant_commission_percent: configRes.data.tenant_commission_percent ?? configRes.data.commission_percent ?? 10.0,
          tenant_platform_fee: configRes.data.tenant_platform_fee ?? configRes.data.platform_fee ?? 5000,
          vendor_commission_percent: configRes.data.vendor_commission_percent ?? 7.0,
          vendor_platform_fee: configRes.data.vendor_platform_fee ?? 2500,
        }));
      }
      setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
      setPayouts(Array.isArray(payoutsRes.data) ? payoutsRes.data : []);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Gagal memuat data pembayaran & payout");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSaveConfig(e) {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post("/super/payments/midtrans/config", config);
      toast.success(data.message || "Konfigurasi Central Midtrans & Komisi berhasil disimpan!");
      loadData();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Gagal menyimpan konfigurasi");
    } finally {
      setSaving(false);
    }
  }

  async function confirmApprovePayout() {
    if (!approvingPayout) return;
    try {
      setProcessingAction(true);
      const { data } = await api.post(`/super/payouts/${approvingPayout.id}/approve`);
      toast.success(data.message || "Pengajuan Payout berhasil disetujui & dikonfirmasi!");
      setApprovingPayout(null);
      loadData();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Gagal menyetujui payout");
    } finally {
      setProcessingAction(false);
    }
  }

  async function handleRejectPayout(e) {
    e.preventDefault();
    if (!rejectingPayout) return;
    try {
      setProcessingAction(true);
      const { data } = await api.post(`/super/payouts/${rejectingPayout.id}/reject`, {
        rejection_reason: rejectReason,
      });
      toast.success(data.message || "Pengajuan payout ditolak.");
      setRejectingPayout(null);
      setRejectReason("");
      loadData();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Gagal menolak payout");
    } finally {
      setProcessingAction(false);
    }
  }

  function toggleChannel(channel) {
    const exists = config.active_channels.includes(channel);
    let updated = [];
    if (exists) {
      updated = config.active_channels.filter((c) => c !== channel);
    } else {
      updated = [...config.active_channels, channel];
    }
    setConfig({ ...config, active_channels: updated });
  }

  function copyWebhookUrl() {
    navigator.clipboard.writeText(config.webhook_url);
    toast.success("URL Webhook Midtrans berhasil disalin ke clipboard!");
  }

  const filteredBookings = bookings.filter((b) => {
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

  const tenantPayouts = payouts.filter((p) => p.type === "tenant");
  const vendorPayouts = payouts.filter((p) => p.type === "vendor");

  const currentPayoutsList =
    payoutSubTab === "tenant"
      ? tenantPayouts
      : payoutSubTab === "vendor"
      ? vendorPayouts
      : payouts;

  const filteredPayouts = currentPayoutsList.filter((p) => {
    const matchStatus =
      payoutFilter === "ALL" ||
      (payoutFilter === "PENDING" && (p.status === "pending" || p.status === "under_review")) ||
      (payoutFilter === "APPROVED" && (p.status === "approved" || p.status === "paid")) ||
      (payoutFilter === "REJECTED" && p.status === "rejected");
    return matchStatus;
  });

  const pendingTenantCount = tenantPayouts.filter((p) => p.status === "pending" || p.status === "under_review").length;
  const pendingVendorCount = vendorPayouts.filter((p) => p.status === "pending" || p.status === "under_review").length;
  const totalPendingCount = pendingTenantCount + pendingVendorCount;

  return (
    <div className="space-y-6 text-neutral-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-emerald-950/40 to-neutral-900 border border-emerald-500/20 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Crown size={14} weight="fill" />
            <span>Central Platform Authority</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Persetujuan Payout & Central Payment Engine
          </h1>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Verifikasi dan konfirmasi pengajuan pencairan dana (payout) terpisah untuk **Tenant SaaS Storefront** & **Vendor Mitra**, serta kelola skema komisi dan gateway Midtrans terpusat.
          </p>
        </div>

        <button
          data-testid="super-save-payment-config-btn"
          onClick={() => setConfirmingSaveConfig(true)}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <FloppyDisk size={16} weight="bold" />
          <span>{saving ? "Menyimpan..." : "Simpan Konfigurasi Central"}</span>
        </button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-amber-950/20 border border-amber-500/30 p-5 rounded-2xl space-y-1">
          <div className="text-xs text-amber-400 font-bold flex items-center justify-between">
            <span>PENDING PAYOUT TENANT</span>
            <Buildings size={20} />
          </div>
          <div className="text-2xl font-black text-amber-400">{pendingTenantCount} Pengajuan</div>
          <div className="text-[10px] text-neutral-400">Pencairan saldo storefront tenant</div>
        </div>

        <div className="bg-sky-950/20 border border-sky-500/30 p-5 rounded-2xl space-y-1">
          <div className="text-xs text-sky-400 font-bold flex items-center justify-between">
            <span>PENDING PAYOUT VENDOR</span>
            <Storefront size={20} />
          </div>
          <div className="text-2xl font-black text-sky-400">{pendingVendorCount} Pengajuan</div>
          <div className="text-[10px] text-neutral-400">Pencairan hasil booking vendor mitra</div>
        </div>

        <div className="bg-black/50 border border-white/10 p-5 rounded-2xl space-y-1">
          <div className="text-xs text-neutral-400 font-semibold flex items-center justify-between">
            <span>KOMISI TENANT (SAAS)</span>
            <Percent size={20} className="text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400">{config.tenant_commission_percent}%</div>
          <div className="text-[10px] text-neutral-400">Fixed Fee: {formatRupiah(config.tenant_platform_fee)} / order</div>
        </div>

        <div className="bg-black/50 border border-white/10 p-5 rounded-2xl space-y-1">
          <div className="text-xs text-neutral-400 font-semibold flex items-center justify-between">
            <span>KOMISI VENDOR (PARTNER)</span>
            <Percent size={20} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{config.vendor_commission_percent}%</div>
          <div className="text-[10px] text-neutral-400">Fixed Fee: {formatRupiah(config.vendor_platform_fee)} / order</div>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab("payouts")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "payouts"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <PaperPlaneTilt size={16} /> Pengajuan Payout ({payouts.length})
          {totalPendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-black font-black">
              {totalPendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("financial")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "financial"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <Sliders size={16} /> Pengaturan Komisi Tenant & Vendor
        </button>

        <button
          onClick={() => setActiveTab("midtrans")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "midtrans"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <Key size={16} /> Central Gateway Midtrans
        </button>

        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "transactions"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <Receipt size={16} /> Monitoring Semua Transaksi ({bookings.length})
        </button>
      </div>

      {/* TAB 0: PAYOUT APPROVAL MANAGEMENT (SEPARATED TENANT & VENDOR) */}
      {activeTab === "payouts" && (
        <div className="bg-black/40 border border-white/10 p-6 rounded-2xl space-y-5">
          {/* Sub-tab Switcher for Tenant vs Vendor Payouts */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2 bg-neutral-900/80 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setPayoutSubTab("tenant")}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                  payoutSubTab === "tenant"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Buildings size={16} />
                <span>Payout Tenant SaaS</span>
                {pendingTenantCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-black font-black">
                    {pendingTenantCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setPayoutSubTab("vendor")}
                className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                  payoutSubTab === "vendor"
                    ? "bg-sky-600 text-white shadow-md"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Storefront size={16} />
                <span>Payout Vendor Mitra</span>
                {pendingVendorCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-black font-black">
                    {pendingVendorCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setPayoutSubTab("all")}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  payoutSubTab === "all"
                    ? "bg-white/20 text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Semua ({payouts.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={payoutFilter}
                onChange={(e) => setPayoutFilter(e.target.value)}
                className="bg-neutral-900 border border-white/15 text-white text-xs px-3 py-2 rounded-xl font-bold"
              >
                <option value="ALL">Semua Status Payout</option>
                <option value="PENDING">Menunggu Konfirmasi ({currentPayoutsList.filter(p=>p.status==='pending'||p.status==='under_review').length})</option>
                <option value="APPROVED">Disetujui / Dicairkan</option>
                <option value="REJECTED">Ditolak</option>
              </select>

              <button
                onClick={() => {
                  if (!filteredPayouts || filteredPayouts.length === 0) {
                    toast.error("Tidak ada data payout untuk di-export.");
                    return;
                  }
                  exportAdminPayoutsCSV(filteredPayouts);
                  toast.success("Laporan payout CSV berhasil di-download!");
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Download Laporan Payout CSV"
              >
                <DownloadSimple size={15} weight="bold" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Payout Table */}
          <div className="overflow-x-auto rounded-xl border border-white/10 w-full">
            <table className="w-full min-w-[850px] text-xs text-left">
              <thead className="bg-neutral-900 text-neutral-400 uppercase font-black tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">ID Payout</th>
                  <th className="px-4 py-3">Pemohon & Kategori</th>
                  <th className="px-4 py-3">Nominal Gross</th>
                  <th className="px-4 py-3">Potongan Komisi Platform</th>
                  <th className="px-4 py-3">Net Dana Ditransfer</th>
                  <th className="px-4 py-3">Rekening Bank Tujuan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-neutral-500 italic space-y-1">
                      <Wallet size={32} className="mx-auto text-neutral-600 mb-2" />
                      <div>Belum ada pengajuan payout untuk kategori ini.</div>
                      <div className="text-[10px] text-neutral-600">
                        Pengajuan dari Tenant Admin atau Vendor Mitra akan muncul di sini secara realtime.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayouts.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-amber-400">
                        {p.id}
                        <div className="text-[10px] text-neutral-400 font-normal">{formatDateID(p.created_at)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{p.requester_name || p.user_name || "Pemohon"}</div>
                        <div className="text-[10px] flex items-center gap-1 mt-0.5">
                          <span
                            className={`px-1.5 py-0.2 rounded font-mono uppercase text-[9px] font-black ${
                              p.type === "tenant" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                            }`}
                          >
                            {p.type === "tenant" ? "Tenant Storefront" : "Vendor Mitra"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-white">
                        {formatRupiah(p.gross_amount || p.amount || 0)}
                      </td>
                      <td className="px-4 py-3 font-bold text-rose-400">
                        -{formatRupiah(p.fee_amount || 0)}
                        <span className="text-[10px] text-neutral-400 block font-normal">
                          ({p.fee_percent || (p.type === "vendor" ? config.vendor_commission_percent : config.tenant_commission_percent)}%)
                        </span>
                      </td>
                      <td className="px-4 py-3 font-black text-emerald-400 text-sm">
                        {formatRupiah(p.net_amount || p.gross_amount || p.amount || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{p.bank_name || "BCA"}</div>
                        <div className="text-[10px] font-mono text-neutral-300">
                          {p.account_number} a.n {p.account_holder}
                        </div>
                        {p.notes && <div className="text-[10px] text-neutral-400 italic">"{p.notes}"</div>}
                      </td>
                      <td className="px-4 py-3">
                        {p.status === "approved" || p.status === "paid" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle size={12} weight="fill" /> DISETUJUI & CAIR
                          </span>
                        ) : p.status === "rejected" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            <XCircle size={12} weight="fill" /> DITOLAK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <ClockCounterClockwise size={12} /> MENUNGGU KONFIRMASI
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {p.status === "pending" || p.status === "under_review" ? (
                          <>
                            <button
                              disabled={processingAction}
                              onClick={() => setApprovingPayout(p)}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[11px] rounded-lg shadow-md cursor-pointer transition-all inline-flex items-center gap-1"
                            >
                              <Check size={14} weight="bold" /> Setujui Payout
                            </button>
                            <button
                              disabled={processingAction}
                              onClick={() => {
                                setRejectingPayout(p);
                                setRejectReason("");
                              }}
                              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-extrabold rounded-lg cursor-pointer transition-all inline-flex items-center gap-1"
                            >
                              <X size={14} weight="bold" /> Tolak
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-neutral-400 italic">
                            Oleh {p.approved_by || "Super Admin"}
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
      )}

      {/* TAB 1: SEPARATE COMMISSION & FEE RULES (TENANT vs VENDOR) */}
      {activeTab === "financial" && (
        <div className="bg-black/40 border border-white/10 p-6 rounded-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Sliders size={18} className="text-sky-400" /> Pengaturan Komisi & Fee Platform (Tenant vs Vendor)
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Atur skema potongan komisi persen (%) dan platform fee per order secara independen antara Tenant Storefront & Vendor Mitra.
              </p>
            </div>
            <button
              onClick={() => setConfirmingSaveConfig(true)}
              disabled={saving}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <FloppyDisk size={16} /> Simpan Skema Komisi
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tenant SaaS Commission Rules */}
            <div className="bg-neutral-900/90 border border-purple-500/30 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                    <Buildings size={18} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-white">Komisi Tenant Storefront (SaaS)</h4>
                    <p className="text-[10px] text-neutral-400">Potongan dari transaksi penjualan produk/trip tenant</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <Label className="font-bold text-neutral-300">Potongan Komisi Tenant (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={config.tenant_commission_percent}
                    onChange={(e) => setConfig({ ...config, tenant_commission_percent: e.target.value })}
                    className="bg-black border-white/15 text-white font-bold"
                  />
                  <span className="text-[10px] text-neutral-400 block">
                    Standar default: 10.0%. Otomatis memotong dari gross revenue pencairan tenant.
                  </span>
                </div>

                <div className="space-y-1">
                  <Label className="font-bold text-neutral-300">Platform Fee Tenant per Order (Rp)</Label>
                  <Input
                    type="number"
                    value={config.tenant_platform_fee}
                    onChange={(e) => setConfig({ ...config, tenant_platform_fee: e.target.value })}
                    className="bg-black border-white/15 text-white font-bold"
                  />
                  <span className="text-[10px] text-neutral-400 block">
                    Biaya fixed per invoice transaksi tenant. Standar default: Rp 5.000.
                  </span>
                </div>
              </div>
            </div>

            {/* Vendor Partner Commission Rules */}
            <div className="bg-neutral-900/90 border border-sky-500/30 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-sky-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400">
                    <Storefront size={18} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-white">Komisi Vendor Mitra (E-Commerce / Trip)</h4>
                    <p className="text-[10px] text-neutral-400">Potongan dari penarikan saldo hasil booking vendor</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <Label className="font-bold text-neutral-300">Potongan Komisi Vendor (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={config.vendor_commission_percent}
                    onChange={(e) => setConfig({ ...config, vendor_commission_percent: e.target.value })}
                    className="bg-black border-white/15 text-white font-bold"
                  />
                  <span className="text-[10px] text-neutral-400 block">
                    Standar default: 7.0%. Otomatis memotong dari pengajuan penarikan dana vendor.
                  </span>
                </div>

                <div className="space-y-1">
                  <Label className="font-bold text-neutral-300">Platform Fee Vendor per Order (Rp)</Label>
                  <Input
                    type="number"
                    value={config.vendor_platform_fee}
                    onChange={(e) => setConfig({ ...config, vendor_platform_fee: e.target.value })}
                    className="bg-black border-white/15 text-white font-bold"
                  />
                  <span className="text-[10px] text-neutral-400 block">
                    Biaya administrasi per transaksi trip vendor. Standar default: Rp 2.500.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-neutral-900 p-5 rounded-2xl border border-white/10 space-y-3 text-xs">
            <h4 className="font-bold text-white flex items-center gap-2">
              <ClockCounterClockwise size={16} className="text-amber-400" /> Jadwal Settlement & Approval Refund
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold text-neutral-300 block mb-1">Siklus Settlement Payout</Label>
                <select
                  value={config.settlement_schedule}
                  onChange={(e) => setConfig({ ...config, settlement_schedule: e.target.value })}
                  className="w-full bg-black border border-white/15 text-white rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="daily">Harian (Tinjauan Realtime Setiap Hari)</option>
                  <option value="weekly">Mingguan (Setiap Hari Senin)</option>
                  <option value="monthly">Bulanan (Tanggal 1 Setiap Bulan)</option>
                </select>
              </div>

              <div>
                <Label className="font-semibold text-neutral-300 block mb-1">Biaya Layanan Payment Gateway (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={config.service_fee_percent}
                  onChange={(e) => setConfig({ ...config, service_fee_percent: e.target.value })}
                  className="bg-black border-white/15 text-white font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MIDTRANS API & WEBHOOK */}
      {activeTab === "midtrans" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-black/40 border border-white/10 p-6 rounded-2xl space-y-5">
            <h3 className="text-sm font-extrabold flex items-center gap-2 text-emerald-400">
              <Key size={18} /> Central Payment Credentials Trexio
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <Label className="font-semibold text-xs text-neutral-300">Environment Mode</Label>
                <select
                  value={config.is_production ? "production" : "sandbox"}
                  onChange={(e) => setConfig({ ...config, is_production: e.target.value === "production" })}
                  className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="sandbox">Sandbox (Sandbox API Environment)</option>
                  <option value="production">Production (Live Transaction)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-xs text-neutral-300">Merchant ID</Label>
                <Input
                  type="text"
                  value={config.merchant_id}
                  onChange={(e) => setConfig({ ...config, merchant_id: e.target.value })}
                  placeholder="Contoh: M123456"
                  className="bg-neutral-900 border-white/15 text-white font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-xs text-neutral-300">Midtrans Server Key (Backend Only)</Label>
                <Input
                  type="text"
                  value={config.server_key}
                  onChange={(e) => setConfig({ ...config, server_key: e.target.value })}
                  placeholder="SB-Mid-server-xxxxxxxxxxxx"
                  className="bg-neutral-900 border-white/15 text-white font-mono text-xs"
                />
                <span className="text-[10px] text-neutral-400 block">
                  Sangat Rahasia. Tersimpan di backend & tidak dikirim ke client/tenant.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-xs text-neutral-300">Midtrans Client Key (Public Snap SDK)</Label>
                <Input
                  type="text"
                  value={config.client_key}
                  onChange={(e) => setConfig({ ...config, client_key: e.target.value })}
                  placeholder="SB-Mid-client-xxxxxxxxxxxx"
                  className="bg-neutral-900 border-white/15 text-white font-mono text-xs"
                />
              </div>
            </div>

            {/* Webhook Configuration */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Lightning size={16} className="text-amber-400" /> Endpoint Notification Webhook
              </h4>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Salin URL webhook ini ke Sistem Gateway Pembayaran Midtrans untuk sinkronisasi pembayaran otomatis 24/7.
              </p>

              <div className="flex items-center gap-2 bg-neutral-900 border border-white/15 p-2.5 rounded-xl font-mono text-xs text-emerald-400">
                <span className="truncate flex-1">{config.webhook_url}</span>
                <button
                  type="button"
                  onClick={copyWebhookUrl}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Copy size={14} /> Salin URL
                </button>
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-white/10 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" /> Saluran Pembayaran Aktif
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Pilih metode pembayaran Trexio yang diizinkan untuk digunakan oleh seluruh customer di semua storefront tenant.
            </p>

            <div className="space-y-2 text-xs">
              {[
                { id: "gopay", name: "GoPay / QRIS Snap", desc: "Verifikasi Instan via QRIS" },
                { id: "qris", name: "All QRIS (Shopee, OVO, Dana)", desc: "Metode QR Universal" },
                { id: "bca_va", name: "BCA Virtual Account", desc: "Automatic Verification" },
                { id: "mandiri_va", name: "Mandiri Bill Payment", desc: "Automatic Verification" },
                { id: "bni_va", name: "BNI Virtual Account", desc: "Automatic Verification" },
                { id: "credit_card", name: "Kartu Kredit 3D-Secure", desc: "Enkripsi Visa / Mastercard" },
              ].map((ch) => {
                const isSelected = config.active_channels.includes(ch.id);
                return (
                  <div
                    key={ch.id}
                    onClick={() => toggleChannel(ch.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? "bg-emerald-950/40 border-emerald-500/40 text-white"
                        : "bg-neutral-900/50 border-white/10 text-neutral-400 opacity-60"
                    }`}
                  >
                    <div>
                      <div className="font-bold">{ch.name}</div>
                      <div className="text-[10px] opacity-70">{ch.desc}</div>
                    </div>
                    {isSelected ? (
                      <CheckCircle size={20} className="text-emerald-400" weight="fill" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-white/20" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSACTION MONITORING */}
      {activeTab === "transactions" && (
        <div className="bg-black/40 border border-white/10 p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Receipt size={18} className="text-emerald-400" /> Monitoring Semua Transaksi Pembayaran
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="text"
                placeholder="Cari kode booking / pelanggan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-neutral-900 border-white/15 text-xs text-white w-48"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-neutral-900 border border-white/15 text-white text-xs px-3 py-2 rounded-xl font-bold"
              >
                <option value="ALL">Semua Status</option>
                <option value="VERIFIED">Lunas / Terverifikasi</option>
                <option value="PENDING">Menunggu Pembayaran</option>
                <option value="CANCELLED">Batal / Ditolak</option>
              </select>

              <button
                onClick={() => {
                  if (!filteredBookings || filteredBookings.length === 0) {
                    toast.error("Tidak ada data transaksi untuk di-export.");
                    return;
                  }
                  exportAdminBookingsCSV(filteredBookings);
                  toast.success("Laporan transaksi CSV berhasil di-download!");
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Download Laporan Transaksi CSV"
              >
                <DownloadSimple size={15} weight="bold" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10 w-full">
            <table className="w-full min-w-[800px] text-xs text-left">
              <thead className="bg-neutral-900 text-neutral-400 uppercase font-black tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Kode Booking</th>
                  <th className="px-4 py-3">Pelanggan & Trip</th>
                  <th className="px-4 py-3">Total Tagihan</th>
                  <th className="px-4 py-3">Metode Bayar</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi Super Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-neutral-500 italic">
                      Belum ada data transaksi booking yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-amber-400">
                        {b.booking_code || b.id}
                        <div className="text-[10px] text-neutral-400 font-normal">{formatDateID(b.created_at)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{b.contact_name || "Guest"}</div>
                        <div className="text-[10px] text-neutral-300 truncate max-w-xs">{b.trip_title || "Paket Trip"}</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-400">
                        {formatRupiah(b.total_amount || 0)}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-neutral-300">
                        {b.payment_channel || b.payment_method || "Midtrans Snap"}
                      </td>
                      <td className="px-4 py-3">
                        {b.payment_status === "verified" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle size={12} weight="fill" /> LUNAS / TERVERIFIKASI
                          </span>
                        ) : b.payment_status === "pending" || b.payment_status === "awaiting_verification" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <ClockCounterClockwise size={12} /> MENUNGGU PEMBAYARAN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            <XCircle size={12} weight="fill" /> DIBATALKAN
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {b.payment_status !== "verified" && (
                          <button
                            onClick={() => triggerSimulatePaid(b.id)}
                            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold rounded-lg cursor-pointer"
                          >
                            Setujui Manual
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Confirmation Approval */}
      {approvingPayout && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-emerald-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl text-xs text-white space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-extrabold text-sm text-emerald-400 flex items-center gap-2">
                <CheckCircle size={18} weight="fill" /> Konfirmasi Setujui Payout
              </h3>
              <button
                onClick={() => setApprovingPayout(null)}
                className="text-neutral-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-500/20 p-4 rounded-xl space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-400">ID Payout:</span>
                <span className="font-mono font-bold text-amber-400">{approvingPayout.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Pemohon ({approvingPayout.type}):</span>
                <span className="font-bold text-white">{approvingPayout.requester_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Net Transfer Dana:</span>
                <span className="font-black text-emerald-400 text-sm">{formatRupiah(approvingPayout.net_amount || approvingPayout.gross_amount || approvingPayout.amount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Rekening Tujuan:</span>
                <span className="font-mono font-bold text-neutral-200">{approvingPayout.bank_name} - {approvingPayout.account_number}</span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Dengan mengonfirmasi, status pengajuan pencairan saldo ini akan ditandai **Lunas / Disetujui** dan notifikasi sukses akan dikirimkan ke email/dashboard pemohon.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setApprovingPayout(null)}
                className="px-4 py-2 font-bold text-xs border border-white/15 rounded-xl hover:bg-white/10 cursor-pointer"
              >
                Batal
              </button>
              <button
                disabled={processingAction}
                onClick={confirmApprovePayout}
                className="px-5 py-2 font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                {processingAction ? "Memproses..." : "Ya, Setujui & Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rejection Payout */}
      {rejectingPayout && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-white/15 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl my-auto max-h-[90vh] flex flex-col text-xs text-white">
            <div className="shrink-0 flex justify-between items-center border-b border-white/10 pb-3 mb-3">
              <h3 className="font-extrabold text-xs sm:text-sm text-rose-400 flex items-center gap-2">
                <XCircle size={18} /> Tolak Pengajuan Payout ({rejectingPayout.id})
              </h3>
              <button
                onClick={() => setRejectingPayout(null)}
                className="text-neutral-400 hover:text-white font-bold cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRejectPayout} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="font-bold text-neutral-300 block mb-1">
                  Alasan Penolakan Payout
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Nomor rekening tidak cocok dengan nama pemilik atau data dokumen belum terverifikasi."
                  className="w-full bg-black border border-white/15 p-2.5 rounded-xl text-white font-medium focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setRejectingPayout(null)}
                  className="px-4 py-2 font-bold text-xs border border-white/15 rounded-xl hover:bg-white/10 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={processingAction}
                  className="px-5 py-2 font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white rounded-xl cursor-pointer shadow-md disabled:opacity-50"
                >
                  {processingAction ? "Memproses..." : "Konfirmasi Tolak Payout"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Confirmation Modal for Updating Configuration & Fees */}
      <ConfirmationModal
        isOpen={confirmingSaveConfig}
        onClose={() => setConfirmingSaveConfig(false)}
        onConfirm={async () => {
          setConfirmingSaveConfig(false);
          await handleSaveConfig();
        }}
        title="Konfirmasi Perubahan Skema & Tarif"
        description="Apakah Anda yakin ingin memperbarui skema komisi, platform fee, dan konfigurasi Midtrans terpusat ini? Perubahan akan langsung diterapkan ke seluruh transaksi platform."
        confirmText="Ya, Terapkan Perubahan"
        variant="amber"
        loading={saving}
      />
    </div>
  );
}
