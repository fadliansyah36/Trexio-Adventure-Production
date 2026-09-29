import { useEffect, useState, useRef } from "react";
import { api, formatDateID } from "@/lib/api";
import { toast } from "sonner";
import {
  Headset,
  WarningCircle,
  ShieldCheck,
  CheckCircle,
  ClockCounterClockwise,
  UserCheck,
  Scales,
  ListDashes,
  User,
  Storefront,
  Receipt,
  ChatCircleDots,
  PaperPlaneRight,
  Sparkle,
  Gear,
  Robot,
  ToggleLeft,
  ToggleRight,
  Tag,
  Lightning,
  Clock,
  ArrowRight,
  ArrowsClockwise
} from "@phosphor-icons/react";

export default function SuperCustomerCare() {
  const [activeTab, setActiveTab] = useState("chat_live"); // 'chat_live' | 'broadcast' | 'cs_bot_settings' | 'tickets' | 'disputes' | 'audit'
  const [tickets, setTickets] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [loading, setLoading] = useState(true);

  // Broadcast & Communication State
  const [announcements, setAnnouncements] = useState([]);
  const [commAnalytics, setCommAnalytics] = useState(null);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    title: "",
    summary: "",
    content: "",
    category: "Information",
    priority: "NORMAL",
    target_audience: "ALL",
    link: "/messages?tab=info"
  });

  // CS Bot Settings State
  const [csConfig, setCsConfig] = useState({
    cs_status: "OFFLINE",
    bot_enabled: true,
    auto_reply_template: "Saat ini Tim CS Super Admin sedang offline. Trexio CS Auto-Bot siap memandu Anda secara cepat.",
    working_hours: "08:00 - 17:00 WIB",
    total_bot_replies: 42
  });
  const [savingConfig, setSavingConfig] = useState(false);

  const messagesEndRef = useRef(null);

  async function loadData() {
    try {
      setLoading(true);
      const [careRes, convRes, auditRes, ancRes, commAnalyticsRes] = await Promise.all([
        api.get("/super/customer-care/tickets"),
        api.get("/super/customer-care/conversations"),
        api.get("/super/security/audit-logs"),
        api.get("/super/announcements"),
        api.get("/super/communications/analytics")
      ]);

      setTickets(careRes.data?.tickets || []);
      setDisputes(careRes.data?.disputes || []);
      if (careRes.data?.csConfig) {
        setCsConfig(careRes.data.csConfig);
      }

      if (ancRes.data?.announcements) {
        setAnnouncements(ancRes.data.announcements);
      }

      if (commAnalyticsRes.data?.analytics) {
        setCommAnalytics(commAnalyticsRes.data.analytics);
      }

      const convList = Array.isArray(convRes.data) ? convRes.data : [];
      setConversations(convList);
      if (convList.length > 0 && !selectedConv) {
        setSelectedConv(convList[0]);
      } else if (selectedConv) {
        const updatedSelected = convList.find((c) => c.id === selectedConv.id);
        if (updatedSelected) setSelectedConv(updatedSelected);
      }

      setAuditLogs(Array.isArray(auditRes.data) ? auditRes.data : []);
    } catch (e) {
      toast.error("Gagal memuat data Customer Care & Security");
    } finally {
      setLoading(false);
    }
  }

  async function handleBroadcastSubmit(e) {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.content) {
      return toast.error("Judul dan isi pengumuman wajib diisi.");
    }
    setBroadcasting(true);
    try {
      const { data } = await api.post("/super/announcements", broadcastForm);
      if (data.ok) {
        toast.success(`Pengumuman berhasil disiarkan ke ${data.recipient_count || 0} akun!`);
        setBroadcastForm({
          title: "",
          summary: "",
          content: "",
          category: "Information",
          priority: "NORMAL",
          target_audience: "ALL",
          link: "/messages?tab=info"
        });
        loadData();
      }
    } catch (err) {
      toast.error("Gagal menyiarkan pengumuman");
    } finally {
      setBroadcasting(false);
    }
  }

  async function handleDeleteAnnouncement(id) {
    try {
      await api.delete(`/super/announcements/${id}`);
      toast.success("Pengumuman berhasil dihapus");
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      toast.error("Gagal menghapus pengumuman");
    }
  }

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 12000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeTab === "chat_live") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedConv, activeTab]);

  async function handleSendReply() {
    if (!selectedConv || !replyText.trim()) return;
    setReplying(true);
    try {
      const { data } = await api.post(`/super/customer-care/conversations/${selectedConv.id}/reply`, {
        text: replyText.trim()
      });
      if (data.ok) {
        toast.success("Balasan CS Super Admin berhasil dikirim.");
        setReplyText("");
        await loadData();
      } else {
        toast.error(data.error || "Gagal mengirim balasan.");
      }
    } catch (e) {
      toast.error(e.response?.data?.error || "Gagal mengirim pesan balasan.");
    } finally {
      setReplying(false);
    }
  }

  async function handleToggleCsStatus() {
    const nextStatus = csConfig.cs_status === "ONLINE" ? "OFFLINE" : "ONLINE";
    try {
      const { data } = await api.post("/super/customer-care/cs-config", {
        ...csConfig,
        cs_status: nextStatus
      });
      if (data.ok) {
        setCsConfig(data.csConfig);
        toast.success(`Status CS berhasil diubah menjadi: ${nextStatus}`);
      }
    } catch (e) {
      toast.error("Gagal mengubah status CS.");
    }
  }

  async function handleToggleBot() {
    const nextBot = !csConfig.bot_enabled;
    try {
      const { data } = await api.post("/super/customer-care/cs-config", {
        ...csConfig,
        bot_enabled: nextBot
      });
      if (data.ok) {
        setCsConfig(data.csConfig);
        toast.success(`CS Auto-Chatbot ${nextBot ? "Diaktifkan" : "Dinonaktifkan"}`);
      }
    } catch (e) {
      toast.error("Gagal mengubah status Chatbot.");
    }
  }

  async function handleSaveConfig(e) {
    e?.preventDefault();
    setSavingConfig(true);
    try {
      const { data } = await api.post("/super/customer-care/cs-config", csConfig);
      if (data.ok) {
        setCsConfig(data.csConfig);
        toast.success("Konfigurasi CS Offline & Chatbot tersimpan.");
      }
    } catch (e) {
      toast.error("Gagal menyimpan konfigurasi.");
    } finally {
      setSavingConfig(false);
    }
  }

  async function handleResolveTicket(ticketId) {
    try {
      const { data } = await api.post(`/super/customer-care/tickets/${ticketId}/resolve`);
      if (data.ok) {
        toast.success(`Tiket #${ticketId} berhasil diselesaikan.`);
        loadData();
      }
    } catch (e) {
      toast.error("Gagal menyelesaikan tiket.");
    }
  }

  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = auditLogs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (log.user || "").toLowerCase().includes(q) ||
      (log.action || "").toLowerCase().includes(q) ||
      (log.resource || "").toLowerCase().includes(q) ||
      (log.old_val || "").toLowerCase().includes(q) ||
      (log.new_val || "").toLowerCase().includes(q)
    );
  });

  function exportAuditLogsCSV() {
    if (!filteredLogs.length) {
      toast.error("Tidak ada log untuk di-export");
      return;
    }
    const headers = ["Log ID", "Timestamp", "Actor Email", "Role", "Actor IP", "User Agent", "Action", "Resource Target", "Status", "Old Value", "New Value"];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      `"${l.user || l.actor_email || ""}"`,
      `"${l.actor_role || "user"}"`,
      `"${l.actor_ip || "127.0.0.1"}"`,
      `"${(l.actor_user_agent || "").replace(/"/g, '""')}"`,
      `"${l.action || ""}"`,
      `"${l.resource || ""}"`,
      `"${l.status || "SUCCESS"}"`,
      `"${l.old_val || ""}"`,
      `"${l.new_val || ""}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trexio-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audit Log report CSV berhasil diunduh");
  }

  const quickPresets = [
    "Halo Kak! Tim CS Super Admin Trexio siap membantu Anda.",
    "Pembayaran Anda sedang kami verifikasi dengan gateway Midtrans.",
    "Pengajuan Anda sudah diteruskan ke tim moderasi vendor.",
    "Terima kasih atas konfirmasinya. Kendala ini telah diselesaikan."
  ];

  return (
    <div className="space-y-6 text-neutral-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-sky-950/40 to-neutral-900 border border-sky-500/20 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Headset size={14} weight="fill" />
            <span>Platform Customer Care & Mediation</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Pusat CS Live Chat, Auto-Chatbot & Sengketa Transaksi
          </h1>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Balas pesan chat traveler secara real-time, kelola mode CS Offline & Auto Chatbot, tangani tiket bantuan serta pantau audit logs governance.
          </p>
        </div>

        {/* CS Status Indicator Card */}
        <div className="flex items-center gap-3 p-3 bg-black/60 rounded-xl border border-white/10 shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-neutral-400 uppercase">Status CS Live</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2.5 h-2.5 rounded-full ${csConfig.cs_status === "ONLINE" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span className={`text-xs font-black ${csConfig.cs_status === "ONLINE" ? "text-emerald-400" : "text-amber-400"}`}>
                {csConfig.cs_status === "ONLINE" ? "ONLINE (Live Admin)" : "OFFLINE (Auto-Bot Active)"}
              </span>
            </div>
          </div>

          <button
            onClick={handleToggleCsStatus}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              csConfig.cs_status === "ONLINE"
                ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40"
                : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40"
            }`}
          >
            {csConfig.cs_status === "ONLINE" ? "Set Offline" : "Set Online"}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("chat_live")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "chat_live"
              ? "border-sky-500 text-sky-400 bg-sky-500/10 rounded-t-lg"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <ChatCircleDots size={16} /> Live CS Chat ({conversations.length})
        </button>
        <button
          onClick={() => setActiveTab("broadcast")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "broadcast"
              ? "border-sky-500 text-sky-400 bg-sky-500/10 rounded-t-lg"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <Lightning size={16} /> Broadcast & Announcements ({announcements.length})
        </button>
        <button
          onClick={() => setActiveTab("cs_bot_settings")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "cs_bot_settings"
              ? "border-sky-500 text-sky-400 bg-sky-500/10 rounded-t-lg"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <Robot size={16} /> Auto-Chatbot & Offline Mode
        </button>
        <button
          onClick={() => setActiveTab("tickets")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "tickets"
              ? "border-sky-500 text-sky-400 bg-sky-500/10 rounded-t-lg"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <Headset size={16} /> Tiket Support ({tickets.length})
        </button>
        <button
          onClick={() => setActiveTab("disputes")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "disputes"
              ? "border-sky-500 text-sky-400 bg-sky-500/10 rounded-t-lg"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <Scales size={16} /> Sengketa & Mediation ({disputes.length})
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "audit"
              ? "border-sky-500 text-sky-400 bg-sky-500/10 rounded-t-lg"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <ShieldCheck size={16} /> Security Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: LIVE CS CHAT & REPLY */}
      {activeTab === "chat_live" && (
        <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[560px]">
          {/* Left Panel: Conversations List */}
          <div className="md:col-span-4 border-r border-white/10 flex flex-col bg-neutral-900/40">
            <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-extrabold text-white flex items-center gap-2">
                <ChatCircleDots size={16} className="text-sky-400" />
                <span>Percakapan Masuk</span>
              </span>
              <button
                onClick={loadData}
                title="Refresh Obrolan"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 transition-colors cursor-pointer"
              >
                <ArrowsClockwise size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/5 max-h-[500px]">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500 italic">
                  Belum ada pesan chat dari pengguna.
                </div>
              ) : (
                conversations.map((c) => {
                  const isSelected = selectedConv?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedConv(c)}
                      className={`w-full text-left p-3.5 transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected ? "bg-sky-500/15 border-l-4 border-sky-400" : "hover:bg-white/5"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {(c.user_name || "U")[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white truncate">{c.user_name || "Traveler"}</span>
                          <span className="text-[10px] text-neutral-400 shrink-0 font-mono">
                            {formatDateID(c.updated_at).split(",")[0]}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 truncate mt-0.5">{c.last_message || "Pertanyaan baru..."}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-neutral-300 font-mono">
                            ID: {c.id}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Active Chat Room */}
          <div className="md:col-span-8 flex flex-col bg-neutral-950/60">
            {selectedConv ? (
              <>
                {/* Chat Room Header */}
                <div className="p-3.5 border-b border-white/10 bg-neutral-900/60 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center">
                      {(selectedConv.user_name || "U")[0]}
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-white">{selectedConv.user_name}</div>
                      <div className="text-[10px] text-neutral-400 flex items-center gap-2">
                        <span>{selectedConv.user_email || "user@trexio.id"}</span>
                        <span>•</span>
                        <span className="text-sky-400 font-mono">{selectedConv.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                      Live Support Session
                    </span>
                  </div>
                </div>

                {/* Message Stream */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[380px]">
                  {Array.isArray(selectedConv.messages) && selectedConv.messages.length > 0 ? (
                    selectedConv.messages.map((m) => {
                      const isCsAdmin = m.sender_role === "super_admin" || m.sender_role === "admin" || m.sender_id === user?.id;
                      const isAutoBot = m.sender_id === "cs_bot_auto" || m.sender_role === "system";

                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isCsAdmin ? "items-end" : isAutoBot ? "items-start" : "items-start"}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-neutral-400">
                            <span className="font-bold text-neutral-300">{m.sender_name || m.sender_id}</span>
                            <span>•</span>
                            <span className="font-mono">{formatDateID(m.created_at)}</span>
                          </div>

                          <div
                            className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                              isCsAdmin
                                ? "bg-sky-600 text-white rounded-br-none shadow-md font-medium"
                                : isAutoBot
                                ? "bg-amber-500/10 text-amber-200 border border-amber-500/30 rounded-bl-none"
                                : "bg-neutral-800 text-neutral-100 border border-white/10 rounded-bl-none"
                            }`}
                          >
                            <div className="whitespace-pre-line">{m.text}</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-xs text-neutral-500 italic">
                      Belum ada riwayat pesan dalam obrolan ini.
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Presets & Reply Input Area */}
                <div className="p-3.5 border-t border-white/10 bg-neutral-900/80 space-y-2 shrink-0">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <span className="text-[10px] text-neutral-400 font-bold shrink-0 flex items-center gap-1">
                      <Lightning size={12} className="text-amber-400" weight="fill" />
                      <span>Template Cepat:</span>
                    </span>
                    {quickPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => setReplyText(preset)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 text-[10px] font-medium whitespace-nowrap border border-white/10 transition-all cursor-pointer shrink-0"
                      >
                        {preset.substring(0, 32)}...
                      </button>
                    ))}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendReply();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Ketik pesan balasan CS Super Admin..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      disabled={replying}
                      className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="submit"
                      disabled={replying || !replyText.trim()}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                    >
                      <PaperPlaneRight size={16} weight="fill" />
                      <span>Balas CS</span>
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2">
                <ChatCircleDots size={48} className="text-neutral-600" />
                <h4 className="font-extrabold text-sm text-neutral-300">Pilih Percakapan untuk Memulai Balasan</h4>
                <p className="text-xs text-neutral-500 max-w-sm">
                  Klik salah satu sesi percakapan di sebelah kiri untuk melihat pesan dan mengirimkan respon langsung.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BROADCAST & ANNOUNCEMENTS ENGINE */}
      {activeTab === "broadcast" && (
        <div className="space-y-6">
          {/* Analytics Cards */}
          {commAnalytics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-1">
                <div className="text-[10px] uppercase font-mono text-neutral-400">Total Notifikasi Terkirim</div>
                <div className="text-xl font-black text-white">{commAnalytics.total_notifications} Item</div>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-1">
                <div className="text-[10px] uppercase font-mono text-neutral-400">Read Rate (%)</div>
                <div className="text-xl font-black text-emerald-400">{commAnalytics.read_rate_percentage}% Dibaca</div>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-1">
                <div className="text-[10px] uppercase font-mono text-neutral-400">Percakapan Partner Aktif</div>
                <div className="text-xl font-black text-sky-400">{commAnalytics.active_conversations} Sesi</div>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-1">
                <div className="text-[10px] uppercase font-mono text-neutral-400">CS Bot Replied</div>
                <div className="text-xl font-black text-amber-400">{commAnalytics.cs_bot_replies} Respon</div>
              </div>
            </div>
          )}

          {/* Form Create & Broadcast Announcement */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Lightning size={18} className="text-amber-400" /> Siarkan Pengumuman & Notifikasi Resmi Baru
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Pengumuman yang dibuat akan langsung muncul di Communication Center pengguna dan mengirimkan notifikasi terdorong.
                </p>
              </div>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[11px] font-bold text-neutral-300">Judul Pengumuman *</label>
                  <input
                    type="text"
                    required
                    value={broadcastForm.title}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                    placeholder="Contoh: Pemberitahuan Sistem: SOP Pendaftaran SIMAKSI Online Taman Nasional Bromo"
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-300">Target Penerima Audience *</label>
                  <select
                    value={broadcastForm.target_audience}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, target_audience: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="ALL">Semua Pengguna (Semua Akun)</option>
                    <option value="BACKPACKER">Semua Backpacker / Pendaki</option>
                    <option value="VENDOR">Semua Mitra Outdoor Vendor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-300">Kategori</label>
                  <select
                    value={broadcastForm.category}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, category: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="Information">Information & Warta</option>
                    <option value="Safety">Safety & BMKG Alert</option>
                    <option value="System">System & Policy</option>
                    <option value="Promo">Promo & Campaign</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-300">Prioritas Tampilan</label>
                  <select
                    value={broadcastForm.priority}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, priority: e.target.value })}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">Tinggi (High)</option>
                    <option value="URGENT">Mendesak (Urgent Alert)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-300">Tautan Aksi (Link)</label>
                  <input
                    type="text"
                    value={broadcastForm.link}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, link: e.target.value })}
                    placeholder="/my-bookings atau /safety"
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-300">Isi Pengumuman Lengkap *</label>
                <textarea
                  rows={4}
                  required
                  value={broadcastForm.content}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, content: e.target.value })}
                  placeholder="Tuliskan rincian pengumuman resmi di sini..."
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={broadcasting}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Lightning size={16} weight="fill" />
                  <span>{broadcasting ? "Menyiarkan..." : "Siarkan Pengumuman Resmi Sekarang"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Published Announcements */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              Daftar Pengumuman Resmi Aktif ({announcements.length})
            </h3>

            <div className="space-y-3">
              {announcements.map((anc) => (
                <div
                  key={anc.id}
                  className="p-4 bg-neutral-900/60 border border-white/10 rounded-xl flex items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                        anc.priority === 'URGENT' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      }`}>
                        {anc.priority || 'NORMAL'}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        Target: {anc.target_audience || 'ALL'}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">
                        {formatDateID(anc.created_at)}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-white leading-snug">{anc.title}</h4>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">{anc.content}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteAnnouncement(anc.id)}
                    className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                    title="Hapus Pengumuman"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CS OFFLINE MODE & AUTO-CHATBOT SETTINGS */}
      {activeTab === "cs_bot_settings" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Main Form */}
          <div className="md:col-span-7 bg-black/40 border border-white/10 p-6 rounded-2xl space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Robot size={18} className="text-amber-400" /> Konfigurasi Chatbot & CS Offline Auto-Reply
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Ketika CS Admin offline, Trexio Auto-Chatbot akan secara otomatis menjawab pertanyaan traveler berbasis data riil marketplace.
              </p>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-5">
              {/* CS Status Switch */}
              <div className="p-4 bg-neutral-900/80 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-xs text-white">Status Kehadiran Live CS</div>
                  <div className="text-[11px] text-neutral-400">Atur status CS Admin saat ini (Online/Offline)</div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleCsStatus}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                    csConfig.cs_status === "ONLINE"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {csConfig.cs_status === "ONLINE" ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  <span>{csConfig.cs_status}</span>
                </button>
              </div>

              {/* Bot Enabled Switch */}
              <div className="p-4 bg-neutral-900/80 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-xs text-white">Aktifkan Trexio Auto-Chatbot</div>
                  <div className="text-[11px] text-neutral-400">Mengaktifkan AI bot untuk menjawab pesan otomatis</div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleBot}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                    csConfig.bot_enabled
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-neutral-800 text-neutral-400 border border-white/10"
                  }`}
                >
                  {csConfig.bot_enabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  <span>{csConfig.bot_enabled ? "AKTIF" : "OFF"}</span>
                </button>
              </div>

              {/* Auto Reply Template Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">Pesan Sambutan CS Offline (Greeting Template)</label>
                <textarea
                  rows={3}
                  value={csConfig.auto_reply_template}
                  onChange={(e) => setCsConfig({ ...csConfig, auto_reply_template: e.target.value })}
                  placeholder="Ketik pesan sambutan CS offline..."
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
                />
                <span className="text-[10px] text-neutral-400">
                  Pesan ini akan menjadi pembuka sebelum AI menyajikan data trip / bantuan terkait.
                </span>
              </div>

              {/* Working Hours */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">Jam Operasional CS Live Admin</label>
                <input
                  type="text"
                  value={csConfig.working_hours}
                  onChange={(e) => setCsConfig({ ...csConfig, working_hours: e.target.value })}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {savingConfig ? "Menyimpan..." : "Simpan Pengaturan CS"}
                </button>
              </div>
            </form>
          </div>

          {/* Stats & Live Preview Side Panel */}
          <div className="md:col-span-5 space-y-6">
            {/* Stats Card */}
            <div className="p-5 bg-gradient-to-br from-neutral-900 via-amber-950/20 to-neutral-900 border border-amber-500/20 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Sparkle size={20} weight="fill" />
                <span className="font-extrabold text-xs uppercase tracking-wider">Performa CS Auto-Bot AI</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <div className="text-[10px] text-neutral-400 font-mono uppercase">Respon Bot Diberikan</div>
                  <div className="text-xl font-black text-amber-400 mt-0.5">{csConfig.total_bot_replies || 42}</div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                  <div className="text-[10px] text-neutral-400 font-mono uppercase">AI Grounded Model</div>
                  <div className="text-xs font-black text-emerald-400 mt-1">Gemini 2.5 Flash</div>
                </div>
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="p-5 bg-black/40 border border-white/10 rounded-2xl space-y-3">
              <h4 className="text-xs font-extrabold text-white flex items-center gap-2">
                <ChatCircleDots size={16} className="text-sky-400" /> Preview Pesan Otomatis Pengguna
              </h4>

              <div className="p-3.5 rounded-xl bg-neutral-900 border border-white/10 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono">
                  <span className="font-bold text-amber-400">CS Auto-Bot TREXIO</span>
                  <span>•</span>
                  <span>Baru saja</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs leading-relaxed">
                  [CS Offline Auto-Reply]: {csConfig.auto_reply_template}
                  <div className="mt-2 text-neutral-300">
                    Berikut 2 rekomendasi open trip Gunung Prau di bawah Rp 700.000...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TICKETS */}
      {activeTab === "tickets" && (
        <div className="bg-black/40 border border-white/10 p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Headset size={18} className="text-sky-400" /> Daftar Tiket Bantuan Pengguna & Mitra
          </h3>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-900 text-neutral-400 uppercase font-black tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">ID Tiket</th>
                  <th className="px-4 py-3">Pemohon</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Subjek Masalah</th>
                  <th className="px-4 py-3">Prioritas</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-amber-400">{t.id}</td>
                    <td className="px-4 py-3 font-bold text-white">{t.user_name}</td>
                    <td className="px-4 py-3 font-semibold text-neutral-300">{t.category}</td>
                    <td className="px-4 py-3 text-white">{t.subject}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          t.priority === "HIGH" ? "bg-rose-500/20 text-rose-400" : "bg-sky-500/20 text-sky-400"
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {t.status === "RESOLVED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle size={12} weight="fill" /> SELESAI
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          <ClockCounterClockwise size={12} /> {t.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {t.status !== "RESOLVED" && (
                        <button
                          onClick={() => handleResolveTicket(t.id)}
                          className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[10px] rounded-lg cursor-pointer transition-all"
                        >
                          Tandai Selesai
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DISPUTES */}
      {activeTab === "disputes" && (
        <div className="bg-black/40 border border-white/10 p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Scales size={18} className="text-sky-400" /> Sengketa Transaksi (Mediation Center)
          </h3>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-900 text-neutral-400 uppercase font-black tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">ID Sengketa</th>
                  <th className="px-4 py-3">Kode Order</th>
                  <th className="px-4 py-3">Traveler & Vendor</th>
                  <th className="px-4 py-3">Alasan Mediasi</th>
                  <th className="px-4 py-3">Bukti Attachment</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {disputes.map((d) => (
                  <tr key={d.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-amber-400">{d.id}</td>
                    <td className="px-4 py-3 font-mono font-bold text-white">{d.booking_code}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{d.user_name}</div>
                      <div className="text-[10px] text-sky-400">vs {d.vendor_name}</div>
                    </td>
                    <td className="px-4 py-3 text-neutral-300">{d.reason}</td>
                    <td className="px-4 py-3 text-neutral-400 font-mono text-[10px]">{d.evidence}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === "audit" && (
        <div className="bg-black/40 border border-white/10 p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Centralized Security & Action Audit Trail
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Mencatat seluruh aksi administratif sensitif (WHO, WHAT, OLD_VALUE, NEW_VALUE, WHEN) secara real-time.
              </p>
            </div>

            <button
              onClick={exportAuditLogsCSV}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs transition-all cursor-pointer shrink-0 self-start sm:self-auto shadow-md"
            >
              Export CSV Audit Log
            </button>
          </div>

          <div className="flex items-center gap-3 bg-neutral-900/60 p-2 rounded-xl border border-white/10">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari aktor (email), nama aksi, resource, atau status..."
              className="w-full bg-transparent border-none text-xs text-white placeholder-neutral-500 focus:outline-none px-2"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-xs text-neutral-400 hover:text-white px-2">
                Reset
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-900 text-neutral-400 uppercase font-black tracking-wider text-[10px] border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Waktu (WHEN)</th>
                  <th className="px-4 py-3">Aktor Super Admin (WHO)</th>
                  <th className="px-4 py-3">Aksi Governance (WHAT)</th>
                  <th className="px-4 py-3">Resource Target</th>
                  <th className="px-4 py-3">Perubahan (OLD → NEW)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-mono text-neutral-400 text-[10px]">{formatDateID(log.timestamp)}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-white bg-white/5 px-2 py-1 rounded border border-white/10">
                        {log.user}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded font-black text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-300">{log.resource}</td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      <span className="text-rose-400 line-through mr-1.5">{log.old_val}</span>
                      <span className="text-neutral-500">→</span>
                      <span className="text-emerald-400 font-bold ml-1.5">{log.new_val}</span>
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-neutral-500 italic">
                      Tidak ada data audit log yang sesuai pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
