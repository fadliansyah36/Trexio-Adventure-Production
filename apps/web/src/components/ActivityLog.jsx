import React, { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import { History } from "lucide-react";
import {
  ClockCounterClockwise,
  MagnifyingGlass,
  Funnel,
  ShieldCheck,
  UserCircle,
  Key,
  Camera,
  Trash,
  ArrowClockwise,
  DownloadSimple,
  Desktop,
  Globe,
  Gear,
  CheckCircle,
  WarningCircle,
  Lock,
} from "@phosphor-icons/react";

export default function ActivityLog({ user, className = "" }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [clearing, setClearing] = useState(false);

  const fetchActivityLogs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users/me/activity-log");
      if (data && Array.isArray(data.activities)) {
        setActivities(data.activities);
      } else if (user && Array.isArray(user.activity_logs)) {
        setActivities(user.activity_logs);
      }
    } catch (err) {
      if (user && Array.isArray(user.activity_logs)) {
        setActivities(user.activity_logs);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityLogs();
  }, [user]);

  const handleClearLogs = async () => {
    if (!window.confirm("Apakah Anda yakin ingin membersihkan riwayat aktivitas akun ini?")) return;
    setClearing(true);
    try {
      const { data } = await api.delete("/users/me/activity-log");
      if (data && data.activities) {
        setActivities(data.activities);
      } else {
        setActivities([]);
      }
      toast.success("Riwayat aktivitas telah dibersihkan");
    } catch (err) {
      toast.error("Gagal membersihkan riwayat aktivitas");
    } finally {
      setClearing(false);
    }
  };

  const handleExportCSV = () => {
    if (!activities || activities.length === 0) {
      toast.error("Tidak ada data aktivitas untuk diunduh");
      return;
    }
    const headers = ["ID", "Waktu", "Tindakan", "Kategori", "Detail", "Perangkat", "IP Address"];
    const rows = activities.map((a) => [
      a.id,
      new Date(a.timestamp).toLocaleString("id-ID"),
      `"${(a.action || "").replace(/"/g, '""')}"`,
      `"${(a.category || "").replace(/"/g, '""')}"`,
      `"${(a.details || "").replace(/"/g, '""')}"`,
      `"${(a.device || "").replace(/"/g, '""')}"`,
      a.ip || "127.0.0.1",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trexio-activity-log-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("File CSV Riwayat Aktivitas berhasil diunduh");
  };

  const categories = useMemo(() => {
    const set = new Set(["Semua"]);
    activities.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set);
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchesCategory = selectedCategory === "Semua" || act.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        (act.action && act.action.toLowerCase().includes(query)) ||
        (act.details && act.details.toLowerCase().includes(query)) ||
        (act.category && act.category.toLowerCase().includes(query)) ||
        (act.device && act.device.toLowerCase().includes(query)) ||
        (act.ip && act.ip.includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [activities, selectedCategory, searchQuery]);

  const getCategoryBadge = (category) => {
    switch ((category || "").toLowerCase()) {
      case "keamanan":
        return {
          icon: <Lock size={14} className="text-rose-500" />,
          bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
        };
      case "autentikasi":
        return {
          icon: <Key size={14} className="text-amber-500" />,
          bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        };
      case "profil":
        return {
          icon: <UserCircle size={14} className="text-emerald-500" />,
          bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        };
      case "uploads":
      case "foto":
        return {
          icon: <Camera size={14} className="text-cyan-500" />,
          bg: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
        };
      default:
        return {
          icon: <Gear size={14} className="text-blue-500" />,
          bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        };
    }
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "Baru saja";
    const date = new Date(timestamp);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return "Kemarin";
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className={`bg-card border border-border rounded-2xl p-6 shadow-xs space-y-6 ${className}`}>
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ClockCounterClockwise size={22} weight="bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base text-foreground">Riwayat Aktivitas & Keamanan</h2>
              <span className="text-[11px] font-bold bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                {activities.length} Tindakan
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Catatan real-time perubahan profil, sesi login, dan konfigurasi keamanan akun
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchActivityLogs}
            disabled={loading}
            className="text-xs font-bold h-9 rounded-xl px-3"
            title="Muat Ulang Activity Log"
          >
            <ArrowClockwise size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs font-bold h-9 rounded-xl px-3 text-foreground"
          >
            <DownloadSimple size={15} /> Unduh CSV
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearLogs}
            disabled={clearing || activities.length === 0}
            className="text-xs font-bold h-9 rounded-xl px-3 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
          >
            <Trash size={15} /> Bersihkan
          </Button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari aktivitas, perangkat, atau detail perubahan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-background border-border text-xs rounded-xl pl-9 h-9"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <Funnel size={14} className="text-muted-foreground shrink-0 mr-1 hidden sm:block" />
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                  : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Log List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center space-y-3 bg-muted/20 rounded-2xl border border-dashed border-border">
            <ArrowClockwise size={28} className="animate-spin text-emerald-500 mx-auto" />
            <p className="text-xs font-bold text-muted-foreground">Memuat riwayat aktivitas akun...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <EmptyState
            title="Tidak Ada Aktivitas Ditemukan"
            description={
              searchQuery
                ? `Tidak ada log aktivitas yang cocok dengan pencarian "${searchQuery}"`
                : "Belum ada tindakan baru yang tercatat untuk kategori ini."
            }
            icon={History}
          />
        ) : (
          <div className="relative pl-3 space-y-3 before:absolute before:left-6 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/60">
            {filteredActivities.map((act) => {
              const badge = getCategoryBadge(act.category);
              return (
                <div
                  key={act.id}
                  className="relative flex items-start gap-3 p-3.5 bg-muted/30 hover:bg-muted/60 transition-colors rounded-xl border border-border/70 group"
                >
                  {/* Category Circle Icon */}
                  <div className="relative z-10 shrink-0 p-2 rounded-xl bg-background border border-border shadow-2xs text-foreground mt-0.5">
                    {badge.icon}
                  </div>

                  {/* Main Activity Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {act.action}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                          {act.category || "Aktivitas"}
                        </span>
                      </div>

                      <span className="text-[11px] font-medium text-muted-foreground shrink-0" title={new Date(act.timestamp).toLocaleString("id-ID")}>
                        {formatRelativeTime(act.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed break-words">
                      {act.details || "Aktivitas tercatat"}
                    </p>

                    {/* Metadata Badges: Device, IP, Exact Time */}
                    <div className="pt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1 bg-background px-2 py-0.5 rounded-md border border-border/60">
                        <Desktop size={12} className="text-muted-foreground" />
                        {act.device || "Web Application"}
                      </span>

                      <span className="inline-flex items-center gap-1 bg-background px-2 py-0.5 rounded-md border border-border/60 font-mono">
                        <Globe size={12} className="text-muted-foreground" />
                        {act.ip || "127.0.0.1"}
                      </span>

                      <span className="text-muted-foreground/70 hidden sm:inline">
                        • {new Date(act.timestamp).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>
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
