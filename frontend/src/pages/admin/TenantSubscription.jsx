import React, { useState, useEffect } from "react";
import { api, formatRupiah } from "@/lib/api";
import { toast } from "sonner";
import {
  Crown,
  CheckCircle,
  Clock,
  CurrencyDollar,
  Sparkle,
  ArrowRight,
  ShieldCheck,
  Receipt,
  DownloadSimple,
  Lightning,
  Question
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export default function TenantSubscription() {
  const [currentSub, setCurrentSub] = useState(null);
  const [entitlements, setEntitlements] = useState(null);
  const [plans, setPlans] = useState([]);
  const [billingHistory, setBillingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasingPlan, setPurchasingPlan] = useState(null);

  useEffect(() => {
    fetchSubscriptionInfo();
  }, []);

  async function fetchSubscriptionInfo() {
    setLoading(true);
    try {
      const [subRes, plansRes] = await Promise.all([
        api.get("/tenant/subscription/current"),
        api.get("/tenant/subscription/plans")
      ]);
      setCurrentSub(subRes.data.subscription || null);
      setEntitlements(subRes.data.entitlements || null);
      setBillingHistory(Array.isArray(subRes.data?.billing_history) ? subRes.data.billing_history : []);
      setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
    } catch (err) {
      toast.error("Gagal memuat status langganan tenant");
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchasePlan(plan) {
    if (plan.price === 0) {
      toast.info("Anda sudah menggunakan paket dasar gratis.");
      return;
    }

    setPurchasingPlan(plan.id);
    try {
      const res = await api.post("/tenant/subscription/subscribe", { plan_id: plan.id });
      const { snap_token, redirect_url, subscription_id } = res.data;

      // Check if Midtrans Snap script is loaded
      if (window.snap && snap_token) {
        window.snap.pay(snap_token, {
          onSuccess: function (result) {
            toast.success("Pembayaran langganan berhasil! Mengaktifkan paket...");
            fetchSubscriptionInfo();
          },
          onPending: function (result) {
            toast.info("Pembayaran pending. Silakan selesaikan pembayaran Anda.");
            fetchSubscriptionInfo();
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
      } else {
        toast.success("Pengajuan langganan berhasil dibuat!");
        fetchSubscriptionInfo();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal memproses langganan");
    } finally {
      setPurchasingPlan(null);
    }
  }

  const daysRemaining = currentSub?.end_date
    ? Math.ceil((new Date(currentSub.end_date) - new Date()) / (1000 * 3600 * 24))
    : null;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 border border-emerald-500/20 text-white rounded-3xl p-8 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Crown size={220} weight="fill" />
        </div>

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
            <Sparkle size={14} /> Status Keanggotaan Tenant SaaS
          </div>

          <h1 className="text-3xl font-black tracking-tight">
            Status Paket: <span className="text-emerald-400">{entitlements?.plan_name || "Free Baseline"}</span>
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Akses seluruh fasilitas premium landing page themes, visual page builder, kustom SSL domain, dan analitik performa ekosistem Trexio.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="bg-black/40 backdrop-blur border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3">
              <Clock size={24} className="text-emerald-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Masa Berlaku</div>
                <div className="text-sm font-black">
                  {daysRemaining !== null ? `${daysRemaining} Hari Lagi` : "Aktif Seterusnya"}
                </div>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3">
              <ShieldCheck size={24} className="text-emerald-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Akses Template Premium</div>
                <div className="text-sm font-black">
                  {entitlements?.theme_access === "all" ? "Semua Template (Pro/Ent)" : "Gratis Saja"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog of Subscription Plans */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-black tracking-tight">Pilih & Upgrade Paket Langganan Tenant</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Tingkatkan konversi storefront travel & tour Anda dengan pilihan tema premium dan fitur kustomisasi tanpa batas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = currentSub?.plan_id === plan.id;

            return (
              <div
                key={plan.id}
                className={`bg-card border rounded-3xl p-6 shadow-sm flex flex-col justify-between relative transition-all ${
                  isCurrentPlan
                    ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5"
                    : "border-border hover:border-emerald-500/50"
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-6 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                    Paket Aktif Anda
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                      {plan.billing_cycle === "yearly" ? "Diskon Tahunan" : "Bebas Batal Kapan Saja"}
                    </span>
                    <h3 className="text-xl font-black mt-2">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
                  </div>

                  <div className="py-3 border-y border-border">
                    <span className="text-3xl font-black text-foreground">
                      {plan.price === 0 ? "Gratis" : formatRupiah(plan.price)}
                    </span>
                    <span className="text-xs text-muted-foreground"> / {plan.billing_cycle === "yearly" ? "tahun" : "bulan"}</span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Fasilitas Termasuk:</span>
                    <ul className="space-y-2 text-xs">
                      {(plan.features || []).map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-foreground font-medium">
                          <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-border">
                  <Button
                    onClick={() => handlePurchasePlan(plan)}
                    disabled={isCurrentPlan || purchasingPlan === plan.id}
                    className={`w-full text-xs font-bold py-3 gap-2 ${
                      isCurrentPlan
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    {purchasingPlan === plan.id ? (
                      "Memproses..."
                    ) : isCurrentPlan ? (
                      "Paket Sedang Aktif"
                    ) : (
                      <>
                        <Lightning size={16} weight="fill" /> Upgrade (Pembayaran Trexio Dijamin Aman)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Billing History Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h3 className="text-base font-bold">Riwayat Pembayaran & Invoice Langganan</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Catatan invoice resmi pembayaran tenant untuk keperluan pembukuan.</p>
          </div>
          <Receipt size={24} className="text-emerald-600" />
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[650px] text-xs text-left">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Item Langganan</th>
                <th className="p-3">Total Biaya</th>
                <th className="p-3">Metode</th>
                <th className="p-3">Status</th>
                <th className="p-3">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {billingHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    Belum ada riwayat transaksi langganan.
                  </td>
                </tr>
              ) : (
                billingHistory.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/30">
                    <td className="p-3 font-mono font-bold text-foreground">{tx.order_id}</td>
                    <td className="p-3 font-semibold">{tx.plan_name}</td>
                    <td className="p-3 font-bold text-emerald-600">{formatRupiah(tx.amount || 0)}</td>
                    <td className="p-3 uppercase">{tx.payment_method || "Trexio Pay"}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        tx.payment_status === "paid" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                      }`}>
                        {tx.payment_status}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString("id-ID")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
