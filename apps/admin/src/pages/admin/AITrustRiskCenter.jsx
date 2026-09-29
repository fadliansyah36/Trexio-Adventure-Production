import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  UserCheck,
  Building,
  CreditCard,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Info,
  Clock,
  ArrowRight,
  Sliders,
  Radio,
  Lock,
} from "lucide-react";

export default function AITrustRiskCenter() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states
  const [overview, setOverview] = useState(null);
  const [cases, setCases] = useState([]);
  const [accountRisk, setAccountRisk] = useState(null);
  const [vendorRisk, setVendorRisk] = useState(null);
  const [bookingRisk, setBookingRisk] = useState(null);
  const [paymentRisk, setPaymentRisk] = useState(null);
  const [reviewRisk, setReviewRisk] = useState(null);
  const [communityRisk, setCommunityRisk] = useState(null);
  const [aiAbuse, setAiAbuse] = useState(null);

  // Case modal state
  const [selectedCase, setSelectedCase] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [explainingLoading, setExplainingLoading] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchRiskData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        resOverview,
        resCases,
        resAccounts,
        resVendors,
        resBookings,
        resPayments,
        resReviews,
        resCommunity,
        resAbuse,
      ] = await Promise.all([
        api.get("/ai/super/risk/overview").then((r) => r.data).catch(() => ({ ok: false })),
        api.get("/ai/super/risk/cases").then((r) => r.data).catch(() => ({ ok: false })),
        api.get("/ai/super/risk/accounts").then((r) => r.data).catch(() => ({ ok: false })),
        api.get("/ai/super/risk/vendors").then((r) => r.data).catch(() => ({ ok: false })),
        api.get("/ai/super/risk/bookings").then((r) => r.data).catch(() => ({ ok: false })),
        api.get("/ai/super/risk/payments").then((r) => r.data).catch(() => ({ ok: false })),
        api.get("/ai/super/risk/reviews").then((r) => r.data).catch(() => ({ ok: false })),
        api.get("/ai/super/risk/community").then((r) => r.data).catch(() => ({ ok: false })),
        api.get("/ai/super/risk/ai-abuse").then((r) => r.data).catch(() => ({ ok: false })),
      ]);

      if (resOverview.ok) setOverview(resOverview);
      if (resCases.ok) setCases(resCases.cases || []);
      if (resAccounts.ok) setAccountRisk(resAccounts);
      if (resVendors.ok) setVendorRisk(resVendors);
      if (resBookings.ok) setBookingRisk(resBookings);
      if (resPayments.ok) setPaymentRisk(resPayments);
      if (resReviews.ok) setReviewRisk(resReviews);
      if (resCommunity.ok) setCommunityRisk(resCommunity);
      if (resAbuse.ok) setAiAbuse(resAbuse);
    } catch (err) {
      console.error("Error fetching risk data:", err);
      setError("Gagal memuat data Intelijen Risiko & Keamanan AI.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskData();
  }, []);

  const handleExplainCase = async (caseId) => {
    setExplainingLoading(true);
    try {
      const res = await api.get(`/ai/super/risk/cases/${caseId}/explain`);
      if (res.data?.ok) {
        setExplanation(res.data.explanation);
      }
    } catch (err) {
      console.error("Error explaining case:", err);
    } finally {
      setExplainingLoading(false);
    }
  };

  const handleUpdateStatus = async (caseId, newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await api.patch(`/ai/super/risk/cases/${caseId}/status`, {
        status: newStatus,
        review_note: reviewNote,
      });
      if (res.data?.ok) {
        setCases((prev) =>
          prev.map((c) => (c.id === caseId ? res.data.case : c))
        );
        setSelectedCase(res.data.case);
        setReviewNote("");
      }
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "HIGH":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "MEDIUM":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "NEW":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "REVIEWING":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "ESCALATED":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "RESOLVED":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "FALSE_POSITIVE":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-1">
            <ShieldAlert className="w-5 h-5" />
            <span>TREXIO TRUST & RISK ENGINE</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Trust, Fraud & Risk Intelligence Center
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Pusat pemantauan risiko real-time, deteksi penipuan, manipulasi
            sistem, dan manajemen kasus berbasis Human-in-the-Loop.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchRiskData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: "overview", label: "Ringkasan Risiko", icon: ShieldAlert },
          { id: "cases", label: "Manajemen Kasus", icon: FileText },
          { id: "accounts", label: "Risiko Akun", icon: UserCheck },
          { id: "vendors", label: "Trust Vendor", icon: Building },
          { id: "payments", label: "Pembayaran & Booking", icon: CreditCard },
          { id: "content", label: "Konten & AI Abuse", icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm rounded-t-xl border-b-2 transition whitespace-nowrap ${
                active
                  ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-600 font-medium text-sm">
            Menganalisis sinyal risiko seluruh ekosistem Trexio...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-sm">
          {error}
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* System Risk Score Header Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm md:col-span-1 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Skor Risiko Platform
                    </span>
                    <div className="mt-2 flex items-baseline gap-3">
                      <span className="text-4xl font-extrabold text-slate-900">
                        {overview?.system_risk_score || 0}
                      </span>
                      <span className="text-slate-500 text-sm">/ 100</span>
                      <span
                        className={`ml-auto px-2.5 py-1 text-xs font-semibold rounded-full border ${getSeverityBadge(
                          overview?.system_risk_level
                        )}`}
                      >
                        {overview?.system_risk_level || "LOW"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-4">
                    Derived from real transaction velocity, account login
                    signals, cancellation rates, and security logs.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Kasus Terbuka</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {overview?.open_cases_count || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Akun Berisiko</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {overview?.risk_breakdown?.high_risk_accounts || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Vendor Flagged</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {overview?.risk_breakdown?.flagged_vendors || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Transaksi Anomali</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {overview?.risk_breakdown?.suspicious_payments || 0}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Post/Review Spam</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {(overview?.risk_breakdown?.flagged_reviews || 0) +
                        (overview?.risk_breakdown?.flagged_community_posts || 0)}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Blok Keamanan AI</span>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {overview?.risk_breakdown?.ai_abuse_attempts || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Latest Risk Cases Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Daftar Kasus Risiko Terbaru (Human-in-the-Loop)</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab("cases")}
                    className="text-xs text-emerald-600 font-medium hover:underline flex items-center gap-1"
                  >
                    <span>Lihat Semua Kasus</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-medium uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="p-3.5">ID Kasus & Judul</th>
                        <th className="p-3.5">Kategori</th>
                        <th className="p-3.5">Entitas</th>
                        <th className="p-3.5">Skor Risiko</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cases.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-6 text-center text-slate-400">
                            Tidak ada kasus risiko aktif saat ini.
                          </td>
                        </tr>
                      ) : (
                        cases.slice(0, 5).map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/80 transition">
                            <td className="p-3.5">
                              <p className="font-semibold text-slate-900">{c.title}</p>
                              <span className="text-[11px] text-slate-400 font-mono">{c.id}</span>
                            </td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                                {c.category}
                              </span>
                            </td>
                            <td className="p-3.5 font-medium text-slate-800">
                              {c.entity_name} ({c.entity_type})
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded border font-semibold ${getSeverityBadge(
                                  c.severity
                                )}`}
                              >
                                {c.risk_score} / 100 ({c.severity})
                              </span>
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${getStatusBadge(
                                  c.status
                                )}`}
                              >
                                {c.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => {
                                  setSelectedCase(c);
                                  handleExplainCase(c.id);
                                }}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-xs transition"
                              >
                                Tinjau
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CASES */}
          {activeTab === "cases" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Antrean Kasus & Peninjauan Manusia</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Setiap keputusan perubahan status atau sanksi wajib ditinjau oleh tim Super Admin.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-medium uppercase tracking-wider border-b border-slate-100">
                      <tr>
                        <th className="p-3.5">Judul Kasus</th>
                        <th className="p-3.5">Kategori</th>
                        <th className="p-3.5">Subjek / Entitas</th>
                        <th className="p-3.5">Sinyal Risiko</th>
                        <th className="p-3.5">Keparahan</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cases.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5">
                            <p className="font-semibold text-slate-900">{c.title}</p>
                            <span className="text-[11px] text-slate-400 font-mono">{c.id}</span>
                          </td>
                          <td className="p-3.5 font-medium text-slate-700">{c.category}</td>
                          <td className="p-3.5 font-medium text-slate-900">{c.entity_name}</td>
                          <td className="p-3.5 max-w-xs">
                            <ul className="list-disc list-inside space-y-0.5 text-slate-500 text-[11px]">
                              {c.detected_signals?.map((sig, idx) => (
                                <li key={idx}>{sig}</li>
                              ))}
                            </ul>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded border font-semibold ${getSeverityBadge(
                                c.severity
                              )}`}
                            >
                              {c.risk_score} ({c.severity})
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${getStatusBadge(
                                c.status
                              )}`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => {
                                setSelectedCase(c);
                                handleExplainCase(c.id);
                              }}
                              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-xs transition"
                            >
                              Detail & Aksi
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNTS */}
          {activeTab === "accounts" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Analisis Keamanan Akun & Otentikasi</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                    <tr>
                      <th className="p-3.5">Pengguna</th>
                      <th className="p-3.5">Email / Peran</th>
                      <th className="p-3.5">Login Gagal</th>
                      <th className="p-3.5">Skor Risiko</th>
                      <th className="p-3.5">Sinyal Anomali</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {accountRisk?.account_risks?.map((u) => (
                      <tr key={u.user_id} className="hover:bg-slate-50/80">
                        <td className="p-3.5 font-semibold text-slate-900">{u.name}</td>
                        <td className="p-3.5">{u.email || "-"} ({u.role})</td>
                        <td className="p-3.5 font-mono">{u.failed_login_count}x</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded border font-semibold ${getSeverityBadge(u.risk_level)}`}>
                            {u.risk_score} ({u.risk_level})
                          </span>
                        </td>
                        <td className="p-3.5">
                          {u.detected_signals?.length === 0 ? (
                            <span className="text-slate-400">Normal</span>
                          ) : (
                            <ul className="list-disc list-inside text-amber-600 font-medium">
                              {u.detected_signals.map((s, idx) => (
                                <li key={idx}>{s}</li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: VENDORS */}
          {activeTab === "vendors" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Intelijen Kepercayaan Vendor & Partner</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                    <tr>
                      <th className="p-3.5">Nama Vendor</th>
                      <th className="p-3.5">Status Verifikasi</th>
                      <th className="p-3.5">Tingkat Pembatalan</th>
                      <th className="p-3.5">Skor Risiko</th>
                      <th className="p-3.5">Sinyal Terdeteksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vendorRisk?.vendor_risks?.map((v) => (
                      <tr key={v.vendor_id} className="hover:bg-slate-50/80">
                        <td className="p-3.5 font-semibold text-slate-900">{v.brand_name}</td>
                        <td className="p-3.5 font-medium">{v.status}</td>
                        <td className="p-3.5 font-mono">{v.cancellation_rate}%</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded border font-semibold ${getSeverityBadge(v.risk_level)}`}>
                            {v.risk_score} ({v.risk_level})
                          </span>
                        </td>
                        <td className="p-3.5">
                          {v.detected_signals?.length === 0 ? (
                            <span className="text-emerald-600 font-medium">Verified & Optimal</span>
                          ) : (
                            <ul className="list-disc list-inside text-amber-600 font-medium">
                              {v.detected_signals.map((s, idx) => (
                                <li key={idx}>{s}</li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: PAYMENTS & BOOKINGS */}
          {activeTab === "payments" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Pemantauan Risiko Transaksi Trexio Pay & Midtrans</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                      <tr>
                        <th className="p-3.5">ID Order</th>
                        <th className="p-3.5">Kanal Bayar</th>
                        <th className="p-3.5">Nominal</th>
                        <th className="p-3.5">Status Gateway</th>
                        <th className="p-3.5">Skor Risiko</th>
                        <th className="p-3.5">Sinyal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paymentRisk?.payment_risks?.map((tx) => (
                        <tr key={tx.tx_id} className="hover:bg-slate-50/80">
                          <td className="p-3.5 font-mono font-semibold text-slate-900">{tx.order_id}</td>
                          <td className="p-3.5 font-medium">{tx.payment_method}</td>
                          <td className="p-3.5 font-mono">Rp {tx.amount?.toLocaleString("id-ID")}</td>
                          <td className="p-3.5 uppercase font-semibold">{tx.status}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded border font-semibold ${getSeverityBadge(tx.risk_level)}`}>
                              {tx.risk_score}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-500">
                            {tx.detected_signals?.join(", ") || "Normal"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CONTENT & AI ABUSE */}
          {activeTab === "content" && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Tangkapan Keamanan Prompt Injection & AI Abuse</h2>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2">
                  <p className="font-semibold text-slate-800">
                    Total Permintaan AI Dipantau: {aiAbuse?.total_ai_requests_monitored || 0}
                  </p>
                  <p className="text-amber-600 font-semibold">
                    Percobaan Akses Ilegal / Injection Diblokir: {aiAbuse?.security_blocks_count || 0}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Case Review Detail Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${getSeverityBadge(selectedCase.severity)}`}>
                  {selectedCase.severity} ({selectedCase.risk_score}/100)
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">{selectedCase.title}</h3>
                <p className="text-xs text-slate-500">ID: {selectedCase.id} • Entitas: {selectedCase.entity_name}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedCase(null);
                  setExplanation(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div>
                <span className="font-semibold text-slate-900">Sinyal Terdeteksi:</span>
                <ul className="list-disc list-inside mt-1 space-y-1 text-slate-600">
                  {selectedCase.detected_signals?.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-semibold text-slate-900">Bukti Data:</span>
                <p className="mt-1 text-slate-600">{selectedCase.evidence}</p>
              </div>

              {/* AI Explanation Box */}
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Analisis Objektif AI (Grounded Narrative)</span>
                </div>
                {explainingLoading ? (
                  <p className="text-slate-500 italic">Menganalisis data dengan Gemini Risk Intelligence...</p>
                ) : (
                  <p className="text-slate-700 whitespace-pre-line leading-relaxed">{explanation}</p>
                )}
              </div>

              {/* Status Update Form */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <label className="block font-semibold text-slate-900">Catatan Peninjau (Super Admin):</label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Masukkan catatan investigasi..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  rows="2"
                />

                <div className="flex items-center gap-2 pt-2">
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedCase.id, "FALSE_POSITIVE")}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs transition"
                  >
                    Mark False Positive
                  </button>
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedCase.id, "ESCALATED")}
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl text-xs transition"
                  >
                    Eskalasi Kasus
                  </button>
                  <button
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedCase.id, "RESOLVED")}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-xs transition"
                  >
                    Selesaikan Kasus
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
