import React, { useState, useEffect } from "react";
import { api, formatRupiah } from "@/lib/api";
import { toast } from "sonner";
import {
  CurrencyDollar,
  CheckCircle,
  Clock,
  Crown,
  TrendUp,
  Plus,
  PencilSimple,
  ShieldCheck,
  Tag,
  ArrowsClockwise,
  Users,
  CalendarBlank,
  FileText
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export default function SuperSubscriptions() {
  const [activeTab, setActiveTab] = useState("plans"); // plans | directory | analytics
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit/Create Plan Modal
  const [editingPlan, setEditingPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({
    name: "",
    price: 0,
    billing_cycle: "monthly",
    description: "",
    featuresText: "",
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [plansRes, subsRes, analyticsRes] = await Promise.all([
        api.get("/super/subscription-plans"),
        api.get("/super/subscriptions"),
        api.get("/super/billing-analytics")
      ]);
      setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
      setSubscriptions(Array.isArray(subsRes.data) ? subsRes.data : []);
      setAnalytics(analyticsRes.data || null);
    } catch (err) {
      toast.error("Gagal memuat data langganan tenant");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreateModal() {
    setEditingPlan(null);
    setPlanForm({
      name: "",
      price: 299000,
      billing_cycle: "monthly",
      description: "Paket langganan kustom untuk tenant agency.",
      featuresText: "Akses Semua Template Premium\nKustom Domain & SSL\nPage Builder Visual\nAnalitik Penjualan",
      is_active: true
    });
    setShowPlanModal(true);
  }

  function handleOpenEditModal(p) {
    setEditingPlan(p);
    setPlanForm({
      name: p.name,
      price: p.price,
      billing_cycle: p.billing_cycle,
      description: p.description || "",
      featuresText: (p.features || []).join("\n"),
      is_active: p.is_active
    });
    setShowPlanModal(true);
  }

  async function handleSavePlan(e) {
    e.preventDefault();
    try {
      const payload = {
        name: planForm.name,
        price: Number(planForm.price),
        billing_cycle: planForm.billing_cycle,
        description: planForm.description,
        features: planForm.featuresText.split("\n").filter(f => f.trim().length > 0),
        is_active: planForm.is_active,
        entitlements: {
          theme_access: "all",
          custom_domain: true,
          landing_builder: true,
          advanced_analytics: true,
          custom_branding: true,
          max_products: 9999
        }
      };

      if (editingPlan) {
        await api.patch(`/super/subscription-plans/${editingPlan.id}`, payload);
        toast.success("Paket langganan berhasil diperbarui");
      } else {
        await api.post("/super/subscription-plans", payload);
        toast.success("Paket langganan baru berhasil dibuat");
      }

      setShowPlanModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal menyimpan paket langganan");
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Super Admin SaaS
            </span>
            <span className="text-xs text-muted-foreground">Tenant Monetization Engine</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Manajemen Langganan Tenant</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Atur paket langganan agency, pricing model, entitlement fitur, serta pantau MRR & ARR ekosistem.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchData} variant="outline" size="sm" className="gap-2 text-xs">
            <ArrowsClockwise size={14} /> Refresh
          </Button>
          <Button onClick={handleOpenCreateModal} className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
            <Plus size={16} /> Buat Paket Baru
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Monthly Recurring Revenue</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <CurrencyDollar size={18} weight="bold" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {formatRupiah(analytics?.subscriptions?.mrr || 0)}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold">
            ARR: {formatRupiah(analytics?.subscriptions?.arr || 0)} / thn
          </p>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Langganan Tenant Aktif</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <Crown size={18} weight="bold" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {analytics?.subscriptions?.active_count || 0} Tenant
          </div>
          <p className="text-[11px] text-muted-foreground">
            {subscriptions.filter(s => s.status === 'grace_period').length} tenant dalam Masa Grace
          </p>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Total Pendapatan Langganan</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <TrendUp size={18} weight="bold" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {formatRupiah(analytics?.subscriptions?.total_revenue || 0)}
          </div>
          <p className="text-[11px] text-muted-foreground">Pembayaran melalui Trexio Dijamin Aman</p>
        </div>

        <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Paket Dikonfigurasi</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
              <Tag size={18} weight="bold" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground">
            {plans.length} Paket
          </div>
          <p className="text-[11px] text-purple-600 font-semibold">
            {plans.filter(p => p.is_active).length} Aktif di Katalog
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-border gap-6">
        <button
          onClick={() => setActiveTab("plans")}
          className={`pb-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === "plans" ? "border-emerald-500 text-emerald-600" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Katalog Paket SaaS ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab("directory")}
          className={`pb-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === "directory" ? "border-emerald-500 text-emerald-600" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Direktori Langganan Tenant ({subscriptions.length})
        </button>
      </div>

      {/* Tab 1: Catalog of Subscription Plans */}
      {activeTab === "plans" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-card border rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all ${
                plan.is_active ? "border-border hover:border-emerald-500/50" : "border-border/50 opacity-60 bg-muted/20"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                    plan.billing_cycle === 'yearly' ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                  }`}>
                    {plan.billing_cycle === 'yearly' ? 'Tahunan' : 'Bulanan'}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                    plan.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                  }`}>
                    {plan.is_active ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{plan.description}</p>
                </div>

                <div className="py-2 border-y border-border/60">
                  <span className="text-2xl font-black text-foreground">
                    {plan.price === 0 ? "Gratis" : formatRupiah(plan.price)}
                  </span>
                  <span className="text-xs text-muted-foreground">/{plan.billing_cycle === 'yearly' ? 'tahun' : 'bulan'}</span>
                </div>

                <div className="space-y-2 text-xs">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Fitur Termasuk:</span>
                  <ul className="space-y-1.5">
                    {(plan.features || []).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                        <CheckCircle size={14} className="text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <Button
                  onClick={() => handleOpenEditModal(plan)}
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-xs font-semibold"
                >
                  <PencilSimple size={14} /> Edit Paket & Pricing
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Directory of Tenant Subscriptions */}
      {activeTab === "directory" && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-foreground">Daftar Langganan Tenant Active & Grace Period</h3>
              <p className="text-[11px] text-muted-foreground sm:hidden">Geser tabel ke samping untuk melihat detail lengkap</p>
            </div>
            <span className="text-xs text-muted-foreground font-semibold">{subscriptions.length} Catatan</span>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[700px] text-xs text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">ID / Tenant</th>
                  <th className="p-4">Paket Langganan</th>
                  <th className="p-4">Nilai Tagihan</th>
                  <th className="p-4">Status & Masa Berlaku</th>
                  <th className="p-4">Auto Renew</th>
                  <th className="p-4">Aksi Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Belum ada catatan langganan tenant.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => {
                    const daysLeft = sub.end_date
                      ? Math.ceil((new Date(sub.end_date) - new Date()) / (1000 * 3600 * 24))
                      : 0;

                    return (
                      <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-foreground">{sub.tenant_id}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{sub.id}</div>
                        </td>
                        <td className="p-4 font-semibold text-foreground">{sub.plan_name}</td>
                        <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(sub.amount || 0)}</td>
                        <td className="p-4 space-y-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                              sub.status === "active"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : sub.status === "grace_period"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                            }`}
                          >
                            {sub.status}
                          </span>
                          <div className="text-[11px] text-muted-foreground">
                            {sub.end_date ? `Sisa ${daysLeft} hari (${new Date(sub.end_date).toLocaleDateString("id-ID")})` : "Seterusnya"}
                          </div>
                        </td>
                        <td className="p-4 font-medium">
                          {sub.auto_renew ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Aktif</span>
                          ) : (
                            <span className="text-muted-foreground">Manual</span>
                          )}
                        </td>
                        <td className="p-4">
                          <Button
                            onClick={() => {
                              toast.info(`Detail langganan ${sub.id} terkonfirmasi aktif.`);
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                          >
                            Kelola
                          </Button>
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

      {/* Plan Modal Form */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-4 sm:p-6 shadow-xl my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="shrink-0 flex items-center justify-between border-b border-border pb-3 mb-3">
              <h3 className="font-black text-base sm:text-lg">
                {editingPlan ? "Edit Paket Langganan Tenant" : "Buat Paket Langganan Baru"}
              </h3>
              <button onClick={() => setShowPlanModal(false)} aria-label="Tutup" className="text-muted-foreground hover:text-foreground text-sm font-bold p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Nama Paket</label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  placeholder="Misal: Pro Agency Yearly"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Harga (IDR)</label>
                  <input
                    type="number"
                    required
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Siklus Tagihan</label>
                  <select
                    value={planForm.billing_cycle}
                    onChange={(e) => setPlanForm({ ...planForm, billing_cycle: e.target.value })}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="monthly">Bulanan</option>
                    <option value="yearly">Tahunan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Deskripsi Ringkas</label>
                <input
                  type="text"
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-1">Daftar Fitur (1 fitur per baris)</label>
                <textarea
                  rows={4}
                  value={planForm.featuresText}
                  onChange={(e) => setPlanForm({ ...planForm, featuresText: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg p-3 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active_check"
                  checked={planForm.is_active}
                  onChange={(e) => setPlanForm({ ...planForm, is_active: e.target.checked })}
                  className="rounded border-border text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="is_active_check" className="text-xs font-bold text-foreground">
                  Aktif & Tampilkan di Katalog Pembelian Tenant
                </label>
              </div>

              <div className="shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowPlanModal(false)} className="text-xs">
                  Batal
                </Button>
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5">
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
