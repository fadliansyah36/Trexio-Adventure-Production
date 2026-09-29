import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api, formatDateID } from "@/lib/api";
import { toast } from "sonner";
import {
  Bell,
  ChatCircleDots,
  PaperPlaneRight,
  MagnifyingGlass,
  CheckCircle,
  Ticket,
  UsersThree,
  Megaphone,
  CreditCard,
  Car,
  Receipt,
  MapPin,
  Sparkle,
  ShieldCheck,
  Funnel,
  ArrowRight,
  Info,
  Clock,
  X,
  Trash,
  Check,
  Storefront,
  Headset,
  BookOpen,
  WarningCircle,
  Newspaper,
  Broadcast
} from "@phosphor-icons/react";

export default function UserMessages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const nav = useNavigate();

  const initialTab = searchParams.get("tab") || "all";
  const initialConvId = searchParams.get("conversation_id") || null;

  const [activeTab, setActiveTab] = useState(initialTab); // 'all' | 'notif' | 'booking' | 'backpacker' | 'chat' | 'news' | 'info'
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);

  // Data states
  const [notifications, setNotifications] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({ unread_count: 0, unread_booking: 0, unread_news: 0, unread_chat: 0 });
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(initialConvId);
  const [activeConvMessages, setActiveConvMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  const [announcements, setAnnouncements] = useState([]);
  const [newsArticles, setNewsArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Sync tab from search params
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
    const convParam = searchParams.get("conversation_id");
    if (convParam) {
      setActiveConvId(convParam);
      if (activeTab !== "chat") setActiveTab("chat");
    }
  }, [searchParams]);

  // Load all communication data
  async function loadData() {
    try {
      setLoading(true);
      const [notifRes, summaryRes, ancRes, newsRes] = await Promise.all([
        api.get("/notifications"),
        api.get("/communications/summary"),
        api.get("/announcements"),
        api.get("/explore/articles")
      ]);

      if (notifRes.data) {
        setNotifications(notifRes.data.notifications || []);
        setUnreadCounts({
          unread_count: notifRes.data.unread_count || 0,
          unread_booking: notifRes.data.unread_booking || 0,
          unread_news: notifRes.data.unread_news || 0,
          unread_chat: summaryRes.data?.unread_chat_count || 0
        });
      }

      if (summaryRes.data?.conversations) {
        const convList = summaryRes.data.conversations;
        setConversations(convList);
        if (convList.length > 0 && !activeConvId) {
          setActiveConvId(convList[0].id);
        }
      }

      if (ancRes.data?.announcements) {
        setAnnouncements(ancRes.data.announcements);
      }

      if (Array.isArray(newsRes.data)) {
        setNewsArticles(newsRes.data);
      }
    } catch (e) {
      toast.error("Gagal memuat data Communication Center");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 15000);
    return () => clearInterval(timer);
  }, []);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) return;
    async function fetchMessages() {
      try {
        const { data } = await api.get(`/chat/conversations/${activeConvId}/messages`);
        setActiveConvMessages(Array.isArray(data) ? data : []);
      } catch (e) {
        // silent error handling for message thread
      }
    }
    fetchMessages();
  }, [activeConvId]);

  // Scroll to bottom of chat thread
  useEffect(() => {
    if (activeTab === "chat" && activeConvId) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeConvMessages, activeTab, activeConvId]);

  // Actions
  async function handleMarkRead(notifId) {
    try {
      await api.post(`/notifications/${notifId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      );
      setUnreadCounts((prev) => ({
        ...prev,
        unread_count: Math.max(0, prev.unread_count - 1)
      }));
    } catch (e) {
      // silent
    }
  }

  async function handleMarkAllRead() {
    try {
      await api.post("/notifications/read-all", { category: activeTab });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCounts((prev) => ({ ...prev, unread_count: 0 }));
      toast.success("Semua notifikasi berhasil ditandai dibaca");
    } catch (e) {
      toast.error("Gagal memperbarui status notifikasi");
    }
  }

  async function handleDeleteNotif(notifId, e) {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${notifId}`);
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      toast.success("Notifikasi dihapus");
    } catch (e) {
      toast.error("Gagal menghapus notifikasi");
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!inputMsg.trim() || !activeConvId) return;
    setSendingMsg(true);

    try {
      const { data } = await api.post(`/chat/conversations/${activeConvId}/messages`, {
        text: inputMsg.trim()
      });

      if (data.userMessage) {
        setActiveConvMessages((prev) => [...prev, data.userMessage]);
      }
      if (data.botReply) {
        setTimeout(() => {
          setActiveConvMessages((prev) => [...prev, data.botReply]);
        }, 600);
      }

      setInputMsg("");

      // Update last message in list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? { ...c, last_message: inputMsg.trim(), updated_at: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      toast.error("Gagal mengirim pesan chat");
    } finally {
      setSendingMsg(false);
    }
  }

  async function handleStartNewChatWithCS() {
    try {
      const { data } = await api.post("/chat/conversations", {
        vendor_id: "vendor_official",
        vendor_name: "Mitra TREXIO Official & CS Support",
        initial_message: "Halo Tim CS Super Admin TREXIO, saya ingin meminta bantuan seputar pesanan dan layanan."
      });

      if (data) {
        toast.success("Sesi percakapan baru dengan CS TREXIO dibuka!");
        loadData();
        setActiveConvId(data.id);
        setActiveTab("chat");
      }
    } catch (e) {
      toast.error("Gagal memulai obrolan dengan CS");
    }
  }

  const activeConv = conversations.find((c) => c.id === activeConvId);

  // Filter helper for notifications
  const filteredNotifications = notifications.filter((n) => {
    if (unreadOnly && n.read) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (n.title || "").toLowerCase().includes(q);
      const matchMsg = (n.message || "").toLowerCase().includes(q);
      if (!matchTitle && !matchMsg) return false;
    }

    if (activeTab === "all") return true;
    if (activeTab === "notif") return n.category === "system" || n.category === "security" || ["system", "security", "verification"].includes(n.type);
    if (activeTab === "booking") return n.category === "booking" || n.category === "payment" || ["booking", "simaksi", 'rental', 'trip', 'payment', 'ticket'].includes(n.type);
    if (activeTab === "backpacker") return n.category === "matching" || n.category === "backpacker" || ["matching", "guided_match", "shared_ride", "split_cost", "journey", "transport"].includes(n.type);
    if (activeTab === "news") return n.category === "news" || ["news", "article", "weather", "promo"].includes(n.type);
    if (activeTab === "info") return n.category === "info" || ["info", "announcement", "policy", "broadcast"].includes(n.type);
    return true;
  });

  const getNotifIcon = (type) => {
    switch (type) {
      case "booking":
      case "simaksi":
      case "ticket":
        return <Ticket size={18} className="text-blue-500 shrink-0" />;
      case "payment":
      case "wallet":
        return <CreditCard size={18} className="text-emerald-500 shrink-0" />;
      case "guided_match":
      case "matching":
        return <Sparkle size={18} className="text-purple-500 shrink-0" />;
      case "shared_ride":
        return <Car size={18} className="text-amber-500 shrink-0" />;
      case "split_cost":
        return <Receipt size={18} className="text-indigo-500 shrink-0" />;
      case "partner_chat":
      case "chat":
        return <ChatCircleDots size={18} className="text-emerald-600 shrink-0" />;
      case "announcement":
      case "broadcast":
        return <Broadcast size={18} className="text-rose-500 shrink-0" />;
      case "news":
      case "article":
        return <Newspaper size={18} className="text-amber-600 shrink-0" />;
      case "verification":
      case "security":
        return <ShieldCheck size={18} className="text-blue-600 shrink-0" />;
      default:
        return <Bell size={18} className="text-foreground/70 shrink-0" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-6 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Title & Status Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs mb-2">
              <ChatCircleDots size={16} weight="fill" /> Communications & Partner Chat Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Pusat Komunikasi, News & Notifikasi
            </h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              Integrasi langsung untuk update booking, matching terbimbing, koordinasi mitra outdoor, berita pendakian, serta pengumuman resmi Trexio.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleMarkAllRead}
              className="px-3.5 py-2 rounded-xl bg-muted hover:bg-neutral-200 dark:hover:bg-neutral-800 text-foreground text-xs font-bold transition-all flex items-center gap-1.5 border border-border"
            >
              <CheckCircle size={16} className="text-emerald-600" />
              Tandai Semua Dibaca
            </button>
            <button
              onClick={handleStartNewChatWithCS}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center gap-2 shadow-xs"
            >
              <Headset size={16} weight="fill" />
              Hubungi CS Super Admin
            </button>
          </div>
        </div>

        {/* Unread Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black">
              <Bell size={20} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-muted-foreground">Notifikasi Unread</div>
              <div className="text-lg font-black text-foreground">{unreadCounts.unread_count} Item</div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black">
              <Ticket size={20} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-muted-foreground">Booking & SIMAKSI</div>
              <div className="text-lg font-black text-foreground">{unreadCounts.unread_booking} Update</div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black">
              <ChatCircleDots size={20} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-muted-foreground">Partner Chat</div>
              <div className="text-lg font-black text-foreground">{conversations.length} Diskusi</div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black">
              <Megaphone size={20} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-muted-foreground">Pengumuman Aktif</div>
              <div className="text-lg font-black text-foreground">{announcements.length} Warta</div>
            </div>
          </div>
        </div>

        {/* Filter Bar & Tabs */}
        <div className="bg-card border border-border rounded-2xl p-3 space-y-3 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Nav Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: "all", label: "Semua", icon: Bell },
                { id: "chat", label: "Partner Chat", icon: ChatCircleDots, count: unreadCounts.unread_chat },
                { id: "booking", label: "Booking & Payment", icon: Ticket, count: unreadCounts.unread_booking },
                { id: "backpacker", label: "Matching & Backpacker", icon: UsersThree },
                { id: "news", label: "Trexio News", icon: Newspaper, count: unreadCounts.unread_news },
                { id: "info", label: "Pengumuman & Info", icon: Megaphone },
                { id: "notif", label: "Sistem & Security", icon: ShieldCheck }
              ].map((tab) => {
                const IconComp = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSearchParams({ tab: tab.id });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <IconComp size={15} />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                          isActive ? "bg-white text-emerald-800" : "bg-rose-500 text-white"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUnreadOnly(!unreadOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all flex items-center gap-1.5 ${
                  unreadOnly
                    ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <Funnel size={14} />
                <span>Belum Dibaca</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-3 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari dalam notifikasi, pesan, berita, atau pengumuman..."
              className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Content Render Area */}
        {activeTab === "chat" ? (
          /* PARTNER CHAT TAB VIEW */
          <div className="bg-card border border-border rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[520px] shadow-sm">
            {/* Conversation List */}
            <div className="md:col-span-5 border-r border-border bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ChatCircleDots size={16} className="text-emerald-600" />
                  Daftar Percakapan Partner ({conversations.length})
                </div>
                <button
                  onClick={handleStartNewChatWithCS}
                  className="text-[11px] font-extrabold text-emerald-600 hover:underline flex items-center gap-1"
                >
                  + Chat CS
                </button>
              </div>

              {conversations.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <ChatCircleDots size={32} className="mx-auto text-muted-foreground/50" />
                  <p className="text-xs text-muted-foreground font-medium">
                    Belum ada diskusi aktif dengan partner atau vendor.
                  </p>
                  <button
                    onClick={handleStartNewChatWithCS}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                  >
                    Mulai Chat dengan CS
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[460px] overflow-y-auto">
                  {conversations.map((conv) => {
                    const isActive = conv.id === activeConvId;
                    return (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setActiveConvId(conv.id);
                          setSearchParams({ tab: "chat", conversation_id: conv.id });
                        }}
                        className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-start gap-3 border ${
                          isActive
                            ? "bg-card border-emerald-500 shadow-sm ring-1 ring-emerald-500/30"
                            : "border-transparent hover:bg-muted/60"
                        }`}
                      >
                        <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-black flex items-center justify-center shrink-0 text-sm border border-emerald-500/20 shadow-2xs">
                          {conv.vendor_name ? conv.vendor_name.charAt(0).toUpperCase() : "M"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="font-black text-xs text-foreground truncate flex items-center gap-1">
                              <span>{conv.vendor_name || "Mitra Outdoor"}</span>
                              <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 font-bold text-[9px]">Mitra</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {new Date(conv.updated_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate font-medium">
                            {conv.last_message}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chat Messages Pane */}
            {activeConv ? (
              <div className="md:col-span-7 flex flex-col justify-between bg-card min-h-[480px]">
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                      {activeConv.vendor_name ? activeConv.vendor_name.charAt(0).toUpperCase() : "M"}
                    </div>
                    <div>
                      <div className="font-black text-sm text-foreground flex items-center gap-2">
                        <span>{activeConv.vendor_name}</span>
                        <span className="bg-emerald-500/10 text-emerald-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          Mitra Terverifikasi
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-medium">
                        Diskusi Koordinasi Logistik & Meeting Point Trip
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message History */}
                <div className="p-4 space-y-3.5 overflow-y-auto max-h-[380px] flex-1">
                  {activeConvMessages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-xs font-medium">
                      Memuat atau belum ada riwayat pesan dalam diskusi ini.
                    </div>
                  ) : (
                    activeConvMessages.map((msg) => {
                      const isUser = msg.sender_id === "user" || msg.sender_id === "user_demo_01" || msg.sender_name === "Anda";
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                        >
                          <div className="text-[10px] text-muted-foreground mb-1 px-1 font-bold">
                            {msg.sender_name}
                          </div>
                          <div
                            className={`max-w-[85%] p-3.5 rounded-2xl text-xs space-y-1 ${
                              isUser
                                ? "bg-emerald-600 text-white rounded-br-none shadow-2xs"
                                : "bg-muted text-foreground border border-border rounded-bl-none shadow-2xs"
                            }`}
                          >
                            <p className="leading-relaxed font-medium whitespace-pre-wrap">{msg.text}</p>
                            <div
                              className={`text-[9px] text-right ${
                                isUser ? "text-emerald-100" : "text-muted-foreground"
                              }`}
                            >
                              {new Date(msg.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-border flex items-center gap-2 bg-muted/20">
                  <input
                    type="text"
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    placeholder="Ketik pesan koordinasi untuk Partner atau CS..."
                    className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-emerald-500 shadow-2xs"
                  />
                  <button
                    type="submit"
                    disabled={sendingMsg || !inputMsg.trim()}
                    aria-label="Kirim Pesan"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 rounded-xl transition-colors shadow-xs disabled:opacity-50"
                  >
                    <PaperPlaneRight size={18} weight="fill" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="md:col-span-7 flex flex-col items-center justify-center p-8 text-muted-foreground text-xs space-y-2">
                <ChatCircleDots size={36} className="text-muted-foreground/40" />
                <p>Pilih salah satu percakapan di sebelah kiri untuk melihat pesan.</p>
              </div>
            )}
          </div>
        ) : activeTab === "news" ? (
          /* NEWS & ARTICLES TAB VIEW */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                <Newspaper size={18} className="text-amber-600" /> Berita Pendakian & Updates Trexio
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {newsArticles.map((art) => (
                <div
                  key={art.id}
                  onClick={() => setSelectedArticle(art)}
                  className="bg-card border border-border rounded-2xl p-4 hover:border-emerald-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-3 group shadow-2xs"
                >
                  <div className="space-y-2">
                    {art.cover_image && (
                      <div className="h-40 rounded-xl overflow-hidden bg-muted">
                        <img src={art.cover_image} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-700 dark:text-amber-400">
                        {art.category || "Trexio News"}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-bold">
                        {formatDateID(art.published_at)}
                      </span>
                    </div>
                    <h4 className="font-black text-sm text-foreground group-hover:text-emerald-600 transition-colors leading-snug">
                      {art.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {art.excerpt || art.content}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs font-bold text-emerald-600">
                    <span>Oleh {art.author || "Redaksi Trexio"}</span>
                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Baca Selengkapnya <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === "info" ? (
          /* ANNOUNCEMENTS & OFFICIAL INFORMATION TAB VIEW */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                <Megaphone size={18} className="text-rose-500" /> Warta Pengumuman Resmi & SOP Trexio
              </h3>
            </div>

            <div className="space-y-3">
              {announcements.map((anc) => (
                <div
                  key={anc.id}
                  onClick={() => setSelectedAnnouncement(anc)}
                  className="bg-card border border-border hover:border-rose-500/40 rounded-2xl p-5 transition-all cursor-pointer space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        anc.priority === 'URGENT' ? 'bg-rose-500 text-white' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                      }`}>
                        {anc.priority || 'NORMAL'}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground">
                        {anc.category || 'Information'}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatDateID(anc.created_at)}
                    </span>
                  </div>
                  <h4 className="font-black text-base text-foreground leading-snug">
                    {anc.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {anc.summary || anc.content}
                  </p>
                  <div className="pt-2 text-xs font-extrabold text-rose-500 flex items-center gap-1">
                    Lihat Rincian Pengumuman <ArrowRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* STANDARD NOTIFICATIONS LIST FEED (ALL, NOTIF, BOOKING, BACKPACKER) */
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm divide-y divide-border">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Bell size={36} className="mx-auto text-muted-foreground/40" />
                <h4 className="text-sm font-bold text-foreground">Tidak ada notifikasi ditemukan</h4>
                <p className="text-xs text-muted-foreground">
                  Semua notifikasi pada kategori ini telah dibaca atau belum tersedia.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    handleMarkRead(notif.id);
                    if (notif.link) {
                      if (notif.link.startsWith("/messages?tab=chat")) {
                        setActiveTab("chat");
                      } else {
                        nav(notif.link);
                      }
                    }
                  }}
                  className={`p-4 hover:bg-muted/40 transition-colors cursor-pointer flex items-start justify-between gap-4 ${
                    !notif.read ? "bg-emerald-500/5 dark:bg-emerald-950/20" : ""
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="p-2.5 rounded-2xl bg-muted border border-border shrink-0 mt-0.5">
                      {getNotifIcon(notif.type)}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-xs text-foreground leading-snug">
                          {notif.title}
                        </span>
                        {!notif.read && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse">
                            BARU
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatDateID(notif.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleDeleteNotif(notif.id, e)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Hapus Notifikasi"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Article Detail Modal */}
        {selectedArticle && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl relative">
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-muted text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800"
              >
                <X size={18} />
              </button>

              {selectedArticle.cover_image && (
                <div className="h-56 rounded-2xl overflow-hidden bg-muted">
                  <img src={selectedArticle.cover_image} alt={selectedArticle.title} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full text-xs font-black bg-amber-500/10 text-amber-600">
                    {selectedArticle.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateID(selectedArticle.published_at)}
                  </span>
                </div>
                <h3 className="text-xl font-black text-foreground">
                  {selectedArticle.title}
                </h3>
                <p className="text-xs font-bold text-emerald-600">
                  Penulis: {selectedArticle.author || "Redaksi TREXIO"}
                </p>
              </div>

              <div className="text-xs leading-relaxed text-foreground/90 whitespace-pre-line border-t border-border pt-4">
                {selectedArticle.content}
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                >
                  Tutup Berita
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Announcement Detail Modal */}
        {selectedAnnouncement && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-3xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl relative">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-muted text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-800"
              >
                <X size={18} />
              </button>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white">
                    {selectedAnnouncement.priority}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateID(selectedAnnouncement.created_at)}
                  </span>
                </div>
                <h3 className="text-lg font-black text-foreground">
                  {selectedAnnouncement.title}
                </h3>
              </div>

              <div className="text-xs leading-relaxed text-foreground/90 whitespace-pre-line bg-muted/40 p-4 rounded-2xl border border-border">
                {selectedAnnouncement.content}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="px-5 py-2 rounded-xl bg-muted text-foreground font-bold text-xs"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
