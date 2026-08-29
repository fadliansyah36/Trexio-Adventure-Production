import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import { ShieldAlert } from "lucide-react";
import {
  Desktop,
  DeviceMobile,
  DeviceTablet,
  ShieldWarning,
  Globe,
  ArrowClockwise,
  SignOut,
  CheckCircle,
  Clock,
  Laptop,
  Radio,
  LockLaminated,
} from "@phosphor-icons/react";

export default function ActiveSessionsManager({ user, onSessionChange, className = "" }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  const fetchActiveSessions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users/me/sessions");
      if (data && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
      }
    } catch (err) {
      toast.error("Gagal memuat sesi aktif perangkat");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSessions();
  }, [user]);

  const handleRevokeSession = async (sessionId, deviceName, isCurrent) => {
    if (isCurrent) {
      if (!window.confirm("Sesi ini adalah perangkat yang Anda gunakan sekarang. Mencabut sesi ini akan mengeluarkan Anda dari sistem. Lanjutkan?")) {
        return;
      }
    } else {
      if (!window.confirm(`Apakah Anda yakin ingin mencabut akses untuk perangkat "${deviceName}"?`)) {
        return;
      }
    }

    setRevokingId(sessionId);
    try {
      const { data } = await api.post("/users/me/sessions/revoke", { session_id: sessionId });
      if (data && data.sessions) {
        setSessions(data.sessions);
      } else {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
      toast.success(data?.message || "Akses sesi perangkat berhasil dicabut");
      if (onSessionChange) onSessionChange();

      if (isCurrent) {
        window.location.href = "/login";
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal mencabut sesi perangkat");
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    const otherCount = sessions.filter((s) => !s.is_current).length;
    if (otherCount === 0) return;

    if (!window.confirm(`Apakah Anda yakin ingin mengakhiri ${otherCount} sesi perangkat lainnya secara remote?`)) {
      return;
    }

    setRevokingOthers(true);
    try {
      const { data } = await api.post("/users/me/sessions/revoke-others");
      if (data && data.sessions) {
        setSessions(data.sessions);
      } else {
        setSessions((prev) => prev.filter((s) => s.is_current));
      }
      toast.success(data?.message || `Berhasil mengakhiri ${otherCount} sesi perangkat lain`);
      if (onSessionChange) onSessionChange();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal mengakhiri sesi perangkat lain");
    } finally {
      setRevokingOthers(false);
    }
  };

  const getDeviceIcon = (deviceType, browser = "") => {
    const type = (deviceType || "").toLowerCase();
    const browserName = (browser || "").toLowerCase();

    if (type.includes("mobile") || browserName.includes("iphone") || browserName.includes("android")) {
      return <DeviceMobile size={22} className="text-cyan-500" />;
    }
    if (type.includes("tablet") || browserName.includes("ipad")) {
      return <DeviceTablet size={22} className="text-amber-500" />;
    }
    if (browserName.includes("macbook") || browserName.includes("laptop")) {
      return <Laptop size={22} className="text-emerald-500" />;
    }
    return <Desktop size={22} className="text-blue-500" />;
  };

  const formatRelativeTime = (timestamp, isCurrent) => {
    if (isCurrent) return "Aktif Saat Ini";
    if (!timestamp) return "Baru saja";

    const date = new Date(timestamp);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays === 1) return "Kemarin";
    return `${diffDays} hari yang lalu`;
  };

  const otherSessionsCount = sessions.filter((s) => !s.is_current).length;

  return (
    <div className={`bg-card border border-border rounded-2xl p-6 shadow-xs space-y-6 ${className}`}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <LockLaminated size={22} weight="bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base text-foreground">Kelola Sesi Login Aktif</h2>
              <span className="text-[11px] font-bold bg-muted px-2.5 py-0.5 rounded-full text-muted-foreground">
                {sessions.length} Perangkat
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Daftar perangkat yang saat ini memiliki akses terautentikasi ke akun Anda.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchActiveSessions}
            disabled={loading}
            className="text-xs font-bold h-9 rounded-xl px-3"
            title="Muat Ulang Sesi Aktif"
          >
            <ArrowClockwise size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </Button>

          {otherSessionsCount > 0 && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRevokeAllOtherSessions}
              disabled={revokingOthers}
              className="text-xs font-bold h-9 rounded-xl px-3 bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
            >
              {revokingOthers ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Mengakhiri...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <SignOut size={15} weight="bold" /> Keluar Perangkat Lain ({otherSessionsCount})
                </span>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center space-y-3 bg-muted/20 rounded-2xl border border-dashed border-border">
            <ArrowClockwise size={28} className="animate-spin text-blue-500 mx-auto" />
            <p className="text-xs font-bold text-muted-foreground">Memeriksa sesi login aktif di seluruh perangkat...</p>
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            title="Tidak Ada Sesi Aktif"
            description="Belum ada perangkat terdaftar yang terhubung."
            icon={ShieldAlert}
          />
        ) : (
          <div className="space-y-3">
            {sessions.map((sess) => {
              const isCurrent = sess.is_current;
              const isRevokingThis = revokingId === sess.id;

              return (
                <div
                  key={sess.id}
                  className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? "bg-emerald-500/5 border-emerald-500/30 shadow-xs"
                      : "bg-muted/30 border-border hover:bg-muted/60"
                  }`}
                >
                  {/* Left Device Info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`shrink-0 p-3 rounded-xl border shadow-2xs mt-0.5 ${
                        isCurrent
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-background border-border text-foreground"
                      }`}
                    >
                      {getDeviceIcon(sess.device_type, sess.browser || sess.device_name)}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-xs text-foreground">
                          {sess.device_name || `${sess.browser || "Browser"} pada ${sess.os || "Sistem OS"}`}
                        </span>

                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Sesi Saat Ini
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border">
                            Terhubung Remote
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1 font-mono">
                          <Globe size={13} className="text-muted-foreground" />
                          {sess.ip || "127.0.0.1"}
                        </span>

                        <span>•</span>

                        <span>{sess.location || "Indonesia"}</span>

                        <span>•</span>

                        <span className="inline-flex items-center gap-1 text-foreground font-medium">
                          <Clock size={13} className="text-muted-foreground" />
                          {formatRelativeTime(sess.last_active, isCurrent)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="shrink-0 flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-border/50 justify-end">
                    <Button
                      type="button"
                      variant={isCurrent ? "outline" : "ghost"}
                      size="sm"
                      onClick={() => handleRevokeSession(sess.id, sess.device_name || sess.browser, isCurrent)}
                      disabled={isRevokingThis}
                      className={`text-xs font-bold h-8 rounded-xl px-3 transition-colors ${
                        isCurrent
                          ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                          : "text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                      }`}
                    >
                      {isRevokingThis ? (
                        <span className="flex items-center gap-1.5">
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                          Mencabut...
                        </span>
                      ) : isCurrent ? (
                        <span className="flex items-center gap-1.5">
                          <SignOut size={14} /> Keluar (Sesi Ini)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <SignOut size={14} /> Akhiri Akses Remote
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
