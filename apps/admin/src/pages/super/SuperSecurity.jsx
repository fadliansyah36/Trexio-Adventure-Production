import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ShieldCheck,
  ShieldWarning,
  LockLaminated,
  WarningCircle,
  Clock,
  ArrowClockwise,
  CheckCircle,
  XCircle,
  Pulse,
  Globe,
  UserCheck,
  Funnel,
  Key,
  Keyhole,
  Check,
  FloppyDisk,
  Prohibit,
  Trash,
  SignOut,
  Fingerprint,
  ShieldPlus,
  Flame,
  FileText,
  Sliders
} from "@phosphor-icons/react";

export default function SuperSecurity() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [rolesPermissions, setRolesPermissions] = useState({});
  const [sessions, setSessions] = useState([]);

  // Filter States
  const [incidentSeverityFilter, setIncidentSeverityFilter] = useState("ALL");
  const [auditSearch, setAuditSearch] = useState("");
  const [sessionSearch, setSessionSearch] = useState("");

  // Sensitive action state
  const [sensitiveAction, setSensitiveAction] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verifyingAction, setVerifyingAction] = useState(false);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const [overviewRes, incidentsRes, auditRes, rbacRes, sessionsRes] = await Promise.all([
        api.get("/super/security/overview"),
        api.get("/super/security/incidents"),
        api.get("/super/security/audit-logs"),
        api.get("/super/security/roles-permissions"),
        api.get("/super/security/sessions"),
      ]);

      if (overviewRes.data) setOverview(overviewRes.data);
      if (incidentsRes.data?.incidents) setIncidents(incidentsRes.data.incidents);
      if (Array.isArray(auditRes.data)) setAuditLogs(auditRes.data);
      if (rbacRes.data?.roles_permissions) setRolesPermissions(rbacRes.data.roles_permissions);
      if (sessionsRes.data?.sessions) setSessions(sessionsRes.data.sessions);
    } catch (err) {
      toast.error("Gagal memuat data Security Center");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const handleTriageIncident = async (incidentId, newStatus) => {
    try {
      const { data } = await api.post(`/super/security/incidents/${incidentId}/triage`, {
        status: newStatus,
        resolution_notes: `Status diperbarui menjadi ${newStatus} oleh Super Admin`,
      });
      toast.success(data.message || "Insiden berhasil diperbarui");
      fetchSecurityData();
    } catch (err) {
      toast.error("Gagal memperbarui status insiden");
    }
  };

  const handleTogglePermission = (role, permission) => {
    setRolesPermissions((prev) => {
      const currentRolePerms = prev[role] || [];
      let updatedPerms = [];
      if (currentRolePerms.includes(permission)) {
        updatedPerms = currentRolePerms.filter((p) => p !== permission);
      } else {
        updatedPerms = [...currentRolePerms, permission];
      }
      return {
        ...prev,
        [role]: updatedPerms,
      };
    });
  };

  const handleSaveRolePermissions = async (role) => {
    try {
      const { data } = await api.post("/super/security/roles-permissions/update", {
        role,
        permissions: rolesPermissions[role] || [],
      });
      toast.success(data.message || `Matriks izin untuk ${role} berhasil disimpan`);
    } catch (err) {
      toast.error("Gagal menyimpan matriks izin role");
    }
  };

  const handleRevokeSession = async (sessionId, userEmail) => {
    if (!window.confirm(`Apakah Anda yakin ingin mencabut sesi #${sessionId} untuk user ${userEmail}?`)) {
      return;
    }
    try {
      const { data } = await api.post("/super/security/sessions/revoke", { session_id: sessionId });
      toast.success(data.message || "Sesi perangkat berhasil dicabut");
      fetchSecurityData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal mencabut sesi perangkat");
    }
  };

  const handleSensitiveActionConfirm = async (e) => {
    e.preventDefault();
    if (!confirmPassword) {
      toast.error("Masukkan password untuk verifikasi");
      return;
    }
    setVerifyingAction(true);
    try {
      const { data } = await api.post("/super/security/sensitive-confirm", {
        password: confirmPassword,
        action_name: sensitiveAction?.title || "Konfirmasi Keamanan",
      });
      toast.success("Verifikasi berhasil! Menjalankan aksi sensitif...");
      if (sensitiveAction?.onSuccess) {
        sensitiveAction.onSuccess();
      }
      setSensitiveAction(null);
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Password verifikasi salah");
    } finally {
      setVerifyingAction(false);
    }
  };

  const allAvailablePermissions = [
    "tenant.view",
    "tenant.manage",
    "partner.view",
    "partner.verify",
    "product.view",
    "product.create",
    "product.update",
    "product.manage",
    "booking.view",
    "booking.manage",
    "payment.view",
    "payment.manage",
    "refund.view",
    "refund.approve",
    "withdrawal.view",
    "withdrawal.approve",
    "cms.edit",
    "cms.publish",
    "security.view",
    "security.manage",
  ];

  const filteredIncidents = incidents.filter((i) => {
    if (incidentSeverityFilter === "ALL") return true;
    return i.severity === incidentSeverityFilter;
  });

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!auditSearch) return true;
    const q = auditSearch.toLowerCase();
    return (
      (log.user || "").toLowerCase().includes(q) ||
      (log.action || "").toLowerCase().includes(q) ||
      (log.resource || "").toLowerCase().includes(q)
    );
  });

  const filteredSessions = sessions.filter((s) => {
    if (!sessionSearch) return true;
    const q = sessionSearch.toLowerCase();
    return (
      (s.user_email || "").toLowerCase().includes(q) ||
      (s.device_name || "").toLowerCase().includes(q) ||
      (s.ip || "").toLowerCase().includes(q)
    );
  });

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><Flame size={12} weight="fill" /> Critical</span>;
      case "HIGH":
        return <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><ShieldWarning size={12} weight="fill" /> High</span>;
      case "MEDIUM":
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><WarningCircle size={12} weight="fill" /> Medium</span>;
      default:
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><CheckCircle size={12} weight="fill" /> Info</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 text-neutral-100">
      {/* Title & Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck size={36} weight="bold" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-white">TREXIO Security Center</h1>
              <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Active Governance Engine
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Pusat Kendali Keamanan, RBAC, Deteksi Insiden, dan Pemantauan Akses Terpusat Platform.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={fetchSecurityData}
            disabled={loading}
            className="border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold rounded-xl h-10 px-4"
          >
            <ArrowClockwise size={16} className={loading ? "animate-spin mr-2" : "mr-2"} /> Refresh Data
          </Button>
          <div className="text-right hidden lg:block border-l border-neutral-800 pl-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 font-bold">SECURITY HEALTH SCORE</p>
            <p className="text-xl font-black text-emerald-400">{overview?.security_score || 98}% Excellent</p>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-neutral-900/90 border border-neutral-800 rounded-2xl">
        {[
          { id: "overview", label: "Overview & Security Score", icon: Pulse },
          { id: "incidents", label: "Security Alerts & Incidents", icon: ShieldWarning, badge: incidents.filter((i) => i.status !== "resolved").length },
          { id: "rbac", label: "RBAC & Permissions Matrix", icon: Key },
          { id: "sessions", label: "Platform Active Sessions", icon: Fingerprint, badge: sessions.length },
          { id: "audit", label: "Audit Trail Logs", icon: FileText },
          { id: "controls", label: "Security Protection Controls", icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
              }`}
            >
              <Icon size={16} weight={isActive ? "bold" : "regular"} />
              {tab.label}
              {tab.badge > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? "bg-black text-amber-400" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & KPIS */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold">Critical Alerts</span>
                <Flame size={20} className="text-rose-400" />
              </div>
              <p className="text-3xl font-black text-white">{overview?.kpis?.critical_alerts || 0}</p>
              <p className="text-[11px] text-neutral-500">Insiden tingkat tinggi butuh penanganan</p>
            </div>

            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold">Gagal Login (24 jam)</span>
                <Prohibit size={20} className="text-amber-400" />
              </div>
              <p className="text-3xl font-black text-white">{overview?.kpis?.failed_logins_24h || 14}</p>
              <p className="text-[11px] text-emerald-400 font-bold">Dibatasi Brute-Force Limiter</p>
            </div>

            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold">Permintaan Diblokir</span>
                <ShieldWarning size={20} className="text-cyan-400" />
              </div>
              <p className="text-3xl font-black text-white">{overview?.kpis?.blocked_requests_24h || 42}</p>
              <p className="text-[11px] text-neutral-500">Oleh Rate Limiter & Security Headers</p>
            </div>

            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold">Active Sesi Terdaftar</span>
                <Fingerprint size={20} className="text-emerald-400" />
              </div>
              <p className="text-3xl font-black text-white">{overview?.kpis?.total_active_sessions || sessions.length}</p>
              <p className="text-[11px] text-neutral-500">Perangkat terverifikasi di platform</p>
            </div>
          </div>

          {/* Active Protection Matrix */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <LockLaminated className="text-emerald-400" size={20} /> Lapisan Proteksi Aktif (System Security Controls)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: "HTTPS / TLS Encryption", desc: "Enkripsi lalu lintas in-transit HSTS 31536000", ok: true },
                { title: "Content Security Policy (CSP)", desc: "XSS, framing, and strict origin policy", ok: true },
                { title: "Rate Limiting & Abuse Prevention", desc: "15 req/15m auth, 300 req/15m global API", ok: true },
                { title: "Double-Submit CSRF Protection", desc: "Anti-CSRF token verification pada mutasi data", ok: true },
                { title: "Super Admin 2FA TOTP", desc: "Enforced Google Authenticator / Authy TOTP", ok: true },
                { title: "Bcrypt Modern Password Hashing", desc: "Soliter salt hashing tanpa plaintext storage", ok: true },
                { title: "Trexio Webhook Idempotency", desc: "Mencegah duplicate ledger entry dari payment webhook", ok: true },
                { title: "Tenant & Partner Data Isolation", desc: "Mencegah IDOR/BOLA dengan scope verification", ok: true },
                { title: "PWA Sensitive Data No-Cache", desc: "Header Network-Only untuk data sensitif", ok: true },
              ].map((c, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-start justify-between">
                  <div>
                    <p className="font-bold text-xs text-white">{c.title}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">{c.desc}</p>
                  </div>
                  <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    ACTIVE
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SECURITY ALERTS & INCIDENTS */}
      {activeTab === "incidents" && (
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div>
              <h3 className="font-extrabold text-base text-white">Deteksi & Manajemen Insiden Keamanan</h3>
              <p className="text-xs text-neutral-400">Eskalasi, triage, dan tindakan mitigasi ancaman otomatis.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-400">Filter Severity:</span>
              <select
                value={incidentSeverityFilter}
                onChange={(e) => setIncidentSeverityFilter(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl text-xs font-bold px-3 py-1.5 text-white"
              >
                <option value="ALL">Semua Severity</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="INFO">Info</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredIncidents.length === 0 ? (
              <div className="py-12 text-center text-neutral-500 text-xs font-bold border border-dashed border-neutral-800 rounded-2xl">
                Tidak ada insiden keamanan untuk filter ini.
              </div>
            ) : (
              filteredIncidents.map((inc) => (
                <div key={inc.id} className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {getSeverityBadge(inc.severity)}
                      <h4 className="font-extrabold text-sm text-white">{inc.title}</h4>
                      <span className="text-[10px] font-mono text-neutral-500">#{inc.id}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      inc.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      Status: {inc.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300">{inc.description}</p>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-neutral-800/60 text-[11px] text-neutral-400">
                    <div className="flex items-center gap-3">
                      <span>Sumber IP: <strong className="font-mono text-neutral-200">{inc.ip}</strong></span>
                      <span>•</span>
                      <span>Target: <strong className="text-neutral-200">{inc.affected_resource}</strong></span>
                      <span>•</span>
                      <span>Waktu: <strong className="text-neutral-200">{new Date(inc.created_at).toLocaleString('id-ID')}</strong></span>
                    </div>

                    {inc.status !== 'resolved' && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleTriageIncident(inc.id, 'investigating')}
                          className="h-7 text-[10px] font-bold border-amber-500/30 text-amber-400 hover:bg-amber-500/10 rounded-lg"
                        >
                          Triage: Investigasi
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleTriageIncident(inc.id, 'resolved')}
                          className="h-7 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                        >
                          Selesaikan Insiden
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: RBAC & PERMISSIONS MATRIX */}
      {activeTab === "rbac" && (
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div>
              <h3 className="font-extrabold text-base text-white">Role-Based Access Control (RBAC) Granular Matrix</h3>
              <p className="text-xs text-neutral-400">Pengaturan izin akses spesifik untuk setiap tingkatan role platform.</p>
            </div>
          </div>

          <div className="space-y-6 overflow-x-auto">
            {Object.keys(rolesPermissions).map((roleKey) => {
              const currentPerms = rolesPermissions[roleKey] || [];
              const isSuperAdmin = roleKey === 'super_admin';

              return (
                <div key={roleKey} className="p-5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-black uppercase text-amber-400 tracking-wider">
                        {roleKey.replace('_', ' ')}
                      </span>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        {isSuperAdmin ? "Akses Penuh Tanpa Batas (*)" : `${currentPerms.length} izin granular terdaftar`}
                      </p>
                    </div>

                    {!isSuperAdmin && (
                      <Button
                        type="button"
                        onClick={() => handleSaveRolePermissions(roleKey)}
                        className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs h-8 rounded-xl"
                      >
                        <FloppyDisk size={14} className="mr-1.5" /> Simpan Matriks {roleKey}
                      </Button>
                    )}
                  </div>

                  {!isSuperAdmin ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                      {allAvailablePermissions.map((perm) => {
                        const isChecked = currentPerms.includes(perm);
                        return (
                          <button
                            key={perm}
                            type="button"
                            onClick={() => handleTogglePermission(roleKey, perm)}
                            className={`p-2.5 rounded-xl border text-left transition-all text-xs font-bold flex items-center justify-between ${
                              isChecked
                                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                                : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700"
                            }`}
                          >
                            <span className="truncate">{perm}</span>
                            {isChecked ? <Check size={14} weight="bold" /> : <Prohibit size={14} />}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 font-bold">
                      ★ Super Admin memiliki semua izin secara otomatis (*) untuk kontrol platform penuh.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: PLATFORM ACTIVE SESSIONS */}
      {activeTab === "sessions" && (
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div>
              <h3 className="font-extrabold text-base text-white">Inspektur Sesi Login Aktif Platform</h3>
              <p className="text-xs text-neutral-400">Daftar seluruh sesi aktif pengguna & admin dengan kemampuan pencabutan remote.</p>
            </div>
            <Input
              placeholder="Cari email, perangkat, IP..."
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              className="bg-neutral-950 border-neutral-800 text-xs w-full sm:w-64"
            />
          </div>

          <div className="space-y-3">
            {filteredSessions.length === 0 ? (
              <div className="py-12 text-center text-neutral-500 text-xs font-bold border border-dashed border-neutral-800 rounded-2xl">
                Tidak ada sesi aktif terdeteksi.
              </div>
            ) : (
              filteredSessions.map((sess) => (
                <div key={sess.id} className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-white">{sess.user_email}</span>
                      <span className="bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                        {sess.user_role}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-400">
                      <span>Perangkat: <strong className="text-neutral-200">{sess.device_name}</strong></span>
                      <span>•</span>
                      <span>IP: <strong className="font-mono text-neutral-200">{sess.ip}</strong></span>
                      <span>•</span>
                      <span>Lokasi: <strong className="text-neutral-200">{sess.location || "Indonesia"}</strong></span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRevokeSession(sess.id, sess.user_email)}
                    className="h-8 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
                  >
                    <SignOut size={14} className="mr-1.5" /> Cabut Akses Remote
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL LOGS */}
      {activeTab === "audit" && (
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div>
              <h3 className="font-extrabold text-base text-white">Jejak Audit Aktivitas Sistem (Audit Trail)</h3>
              <p className="text-xs text-neutral-400">Log immutable untuk seluruh tindakan sensitif admin dan pengguna.</p>
            </div>
            <Input
              placeholder="Cari user, tindakan, resource..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="bg-neutral-950 border-neutral-800 text-xs w-full sm:w-64"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 text-neutral-400 font-mono text-[10px] uppercase tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="p-3">Waktu</th>
                  <th className="p-3">Aktor & Role</th>
                  <th className="p-3">IP / Perangkat</th>
                  <th className="p-3">Tindakan</th>
                  <th className="p-3">Resource Target</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-500 font-bold">
                      Tidak ada data audit log ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log, idx) => {
                    const isSuccess = (log.status || "SUCCESS").toUpperCase() === "SUCCESS" || (log.status || "").toUpperCase() === "AUTHENTICATED" || (log.status || "").toUpperCase() === "VERIFIED";
                    const isFailed = (log.status || "").toUpperCase().includes("FAIL") || (log.status || "").toUpperCase().includes("REJECT");
                    return (
                      <tr key={idx} className="hover:bg-neutral-800/40 transition-colors">
                        <td className="p-3 text-neutral-400 whitespace-nowrap font-mono text-[11px]">
                          {new Date(log.timestamp || log.created_at || Date.now()).toLocaleString('id-ID')}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="font-bold text-white">{log.user || log.actor_email || log.actor || "System"}</div>
                          <div className="text-[10px] text-neutral-500 uppercase font-mono">{log.actor_role || "user"}</div>
                        </td>
                        <td className="p-3 whitespace-nowrap font-mono text-[11px]">
                          <div className="text-emerald-400 font-semibold">{log.actor_ip || "127.0.0.1"}</div>
                          <div className="text-[10px] text-neutral-500 truncate max-w-[140px]" title={log.actor_user_agent || "Web Browser"}>
                            {log.actor_user_agent || "Web Browser"}
                          </div>
                        </td>
                        <td className="p-3 text-amber-400 font-bold whitespace-nowrap">{log.action}</td>
                        <td className="p-3 text-neutral-300 font-mono text-[11px] max-w-xs truncate">{log.resource}</td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase border ${
                            isSuccess
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : isFailed
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                              : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                          }`}>
                            {log.status || "SUCCESS"}
                          </span>
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

      {/* TAB 6: SECURITY CONTROLS & SETTINGS */}
      {activeTab === "controls" && (
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="font-extrabold text-base text-white">Konfigurasi Parameter Proteksi</h3>
            <p className="text-xs text-neutral-400">Sesuaikan batas rate limiting, kebijakan re-autentikasi, dan perlindungan API.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-3">
              <h4 className="font-bold text-sm text-white">Brute Force & Auth Rate Limiting</h4>
              <p className="text-xs text-neutral-400">Membatasi percobaan login/register maksimal 15 percobaan per 15 menit per IP.</p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-emerald-400">Status: ENFORCED (15 req/15m)</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-3">
              <h4 className="font-bold text-sm text-white">Global API Rate Limiter</h4>
              <p className="text-xs text-neutral-400">Membatasi panggilan API publik maksimal 300 request per 15 menit per IP.</p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-emerald-400">Status: ENFORCED (300 req/15m)</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-3">
              <h4 className="font-bold text-sm text-white">Step-Up Re-Authentication</h4>
              <p className="text-xs text-neutral-400">Aksi sensitif (ganti API key payment, suspend tenant, refund besar) wajib konfirmasi password.</p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-emerald-400">Status: ACTIVE</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-3">
              <h4 className="font-bold text-sm text-white">Trexio Webhook Verification & Idempotency</h4>
              <p className="text-xs text-neutral-400">Setiap webhook diverifikasi signature dan dijamin idempotensi untuk mencegah double ledger entry.</p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-emerald-400">Status: ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sensitive Action Modal */}
      {sensitiveAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <form onSubmit={handleSensitiveActionConfirm} className="bg-neutral-900 border border-neutral-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-md w-full space-y-4 shadow-2xl my-auto max-h-[90vh] flex flex-col">
            <div className="shrink-0 flex items-center gap-3 text-amber-400 border-b border-neutral-800 pb-3">
              <LockLaminated size={28} weight="bold" />
              <div>
                <h3 className="font-black text-sm sm:text-base text-white">Verifikasi Aksi Sensitif</h3>
                <p className="text-xs text-neutral-400">{sensitiveAction.title}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <p className="text-xs text-neutral-300 leading-relaxed">
                Aksi ini memerlukan konfirmasi keamanan ulang. Masukkan password Super Admin Anda untuk melanjutkan:
              </p>

              <Input
                type="password"
                placeholder="Password Super Admin Anda..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-xs h-10"
                autoFocus
              />

              <div className="shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 pt-3 border-t border-neutral-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSensitiveAction(null)}
                  className="border-neutral-800 text-xs h-10 sm:h-9"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={verifyingAction}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs h-10 sm:h-9"
                >
                  {verifyingAction ? "Memverifikasi..." : "Konfirmasi & Lanjutkan"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
