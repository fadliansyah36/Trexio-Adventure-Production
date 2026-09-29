import React, { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ChatCircleDots,
  PaperPlaneRight,
  MagnifyingGlass,
  Funnel,
  CheckCircle,
  Clock,
  User,
  Package,
  Receipt,
  Sparkle,
  Archive,
  ArrowLeft,
  CircleNotch,
  ArrowClockwise
} from "@phosphor-icons/react";

export default function VendorCommunications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConvParam = searchParams.get("conversation_id");

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(activeConvParam || null);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'unread' | 'active' | 'archived'
  const [searchQuery, setSearchQuery] = useState("");
  const [totalUnread, setTotalUnread] = useState(0);

  const messagesEndRef = useRef(null);

  // Fetch Conversations List
  const fetchConversations = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.get("/vendor/communications/conversations", {
        params: { status: filterStatus, q: searchQuery }
      });
      if (res.data?.ok) {
        const list = res.data.conversations || [];
        setConversations(list);
        setTotalUnread(res.data.total_unread || 0);

        if (list.length > 0 && !activeConvId) {
          setActiveConvId(list[0].id);
        }
      }
    } catch (err) {
      console.error("Gagal memuat percakapan vendor:", err);
      toast.error("Gagal memuat kotak masuk percakapan.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations(true);
    const interval = setInterval(() => fetchConversations(false), 6000);
    return () => clearInterval(interval);
  }, [filterStatus, searchQuery]);

  // Sync query param with state
  useEffect(() => {
    if (activeConvParam) {
      setActiveConvId(activeConvParam);
    }
  }, [activeConvParam]);

  // Fetch Messages for Selected Conversation
  const fetchMessages = async (convId) => {
    if (!convId) return;
    setLoadingMsgs(true);
    try {
      const res = await api.get(`/vendor/communications/conversations/${convId}/messages`);
      if (res.data?.ok) {
        setActiveConv(res.data.conversation);
        setMessages(res.data.messages || []);
        // Update local unread status for conversation in list
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unread_vendor_count: 0 } : c))
        );
      }
    } catch (err) {
      console.error("Gagal memuat isi pesan:", err);
      toast.error(err.response?.data?.detail || "Gagal membuka pesan percakapan.");
    } finally {
      setLoadingMsgs(false);
    }
  };

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
    } else {
      setActiveConv(null);
      setMessages([]);
    }
  }, [activeConvId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send Reply
  const handleSendReply = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || !activeConvId || sending) return;

    const textToSend = inputMessage.trim();
    setInputMessage("");
    setSending(true);

    try {
      const res = await api.post(`/vendor/communications/conversations/${activeConvId}/reply`, {
        text: textToSend
      });

      if (res.data?.ok) {
        setMessages((prev) => [...prev, res.data.data]);
        if (res.data.conversation) {
          setActiveConv(res.data.conversation);
        }
        fetchConversations(false);
      }
    } catch (err) {
      console.error("Gagal mengirim balasan:", err);
      toast.error(err.response?.data?.detail || "Gagal mengirim balasan.");
      setInputMessage(textToSend); // Restore on error
    } finally {
      setSending(false);
    }
  };

  // Quick reply template insert
  const handleQuickTemplate = (templateText) => {
    setInputMessage((prev) => (prev ? `${prev} ${templateText}` : templateText));
  };

  // Archive / Unarchive Conversation
  const handleToggleArchive = async () => {
    if (!activeConvId) return;
    try {
      const res = await api.patch(`/vendor/communications/conversations/${activeConvId}/archive`);
      if (res.data?.ok) {
        toast.success(res.data.message);
        fetchConversations(false);
        fetchMessages(activeConvId);
      }
    } catch (err) {
      toast.error("Gagal mengubah status arsip.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <ChatCircleDots className="text-emerald-600" size={28} /> Communications & Partner Chat
            </h1>
            {totalUnread > 0 && (
              <span className="bg-amber-500 text-white font-black text-xs px-2.5 py-0.5 rounded-full animate-pulse">
                {totalUnread} Belum Dibaca
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pusat komunikasi resmi mitra dengan pendaki & peserta trip. Pertanyaan produk, detail itinerary, dan koordinasi meeting point.
          </p>
        </div>

        <button
          onClick={() => fetchConversations(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border border-border bg-neutral-50 hover:bg-neutral-100 transition-all self-start sm:self-auto"
        >
          <ArrowClockwise size={16} /> Segarkan Inbox
        </button>
      </div>

      {/* Main Grid: Inbox + Chat Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[620px] bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
        {/* Left Pane: Conversation List */}
        <div className={`lg:col-span-4 border-r border-border flex flex-col ${activeConvId ? "hidden lg:flex" : "flex"}`}>
          {/* Search & Filter Bar */}
          <div className="p-4 border-b border-border space-y-3 bg-neutral-50/50">
            <div className="relative">
              <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari nama traveler, produk, kode booking..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
              {[
                { id: "all", label: "Semua" },
                { id: "unread", label: "Belum Dibaca", badge: totalUnread },
                { id: "active", label: "Aktif" },
                { id: "archived", label: "Diarsipkan" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all text-xs flex items-center gap-1.5 ${
                    filterStatus === tab.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-muted-foreground hover:bg-neutral-200/60"
                  }`}
                >
                  {tab.label}
                  {tab.badge > 0 && (
                    <span className="bg-amber-400 text-slate-900 font-extrabold text-[10px] px-1.5 py-0.2 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/60 max-h-[520px]">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                <CircleNotch size={24} className="animate-spin text-emerald-600" />
                Memuat percakapan...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <ChatCircleDots size={32} className="mx-auto text-neutral-300" />
                <p className="font-bold">Tidak ada percakapan ditemukan.</p>
                <p className="text-[11px]">Pesan masuk dari calon pendaki atau peserta booking akan tampil di sini.</p>
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = c.id === activeConvId;
                const hasUnread = (c.unread_vendor_count || 0) > 0;

                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveConvId(c.id);
                      setSearchParams({ conversation_id: c.id });
                    }}
                    className={`w-full text-left p-4 transition-all flex items-start gap-3 hover:bg-neutral-50 ${
                      isSelected ? "bg-emerald-50/70 border-l-4 border-emerald-600" : ""
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {c.user_name ? c.user_name.charAt(0).toUpperCase() : "P"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-xs font-black truncate ${hasUnread ? "text-slate-900 font-black" : "text-slate-700"}`}>
                          {c.user_name || "Pendaki Trexio"}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                          {c.updated_at ? new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      {/* Product or Booking Context Badge */}
                      {c.product_title && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-100/70 px-1.5 py-0.5 rounded-md w-fit my-1 truncate max-w-full">
                          <Package size={12} className="shrink-0" />
                          <span className="truncate">{c.product_title}</span>
                        </div>
                      )}

                      {c.booking_code && (
                        <div className="flex items-center gap-1 text-[10px] text-blue-700 font-bold bg-blue-100/70 px-1.5 py-0.5 rounded-md w-fit my-1">
                          <Receipt size={12} className="shrink-0" />
                          <span>Kode: {c.booking_code}</span>
                        </div>
                      )}

                      <p className={`text-xs truncate ${hasUnread ? "font-bold text-slate-900" : "text-muted-foreground"}`}>
                        {c.last_message || "Tidak ada pesan."}
                      </p>
                    </div>

                    {hasUnread && (
                      <span className="bg-amber-500 text-white font-black text-[10px] min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center shrink-0 shadow-xs animate-bounce">
                        {c.unread_vendor_count}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Chat Thread Detail */}
        <div className={`lg:col-span-8 flex flex-col ${!activeConvId ? "hidden lg:flex" : "flex"}`}>
          {activeConv ? (
            <>
              {/* Active Conversation Header */}
              <div className="p-4 border-b border-border bg-neutral-50/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => {
                      setActiveConvId(null);
                      setSearchParams({});
                    }}
                    className="lg:hidden p-1.5 rounded-lg hover:bg-neutral-200 text-muted-foreground"
                    title="Kembali ke Daftar Pesan"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-black text-sm flex items-center justify-center shrink-0">
                    {activeConv.user_name ? activeConv.user_name.charAt(0).toUpperCase() : "P"}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-black text-slate-900 truncate">
                        {activeConv.user_name || "Pendaki Trexio"}
                      </h2>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                        Terverifikasi
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                      {activeConv.product_title && (
                        <span className="flex items-center gap-1 font-bold text-emerald-700">
                          <Package size={12} /> {activeConv.product_title}
                        </span>
                      )}
                      {activeConv.booking_code && (
                        <span className="flex items-center gap-1 font-bold text-blue-700">
                          <Receipt size={12} /> TRX-{activeConv.booking_code}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleToggleArchive}
                    className="p-2 rounded-xl border border-border bg-white hover:bg-neutral-100 text-xs font-bold flex items-center gap-1.5 transition-all"
                    title={activeConv.status === "archived" ? "Buka dari Arsip" : "Arsipkan Percakapan"}
                  >
                    <Archive size={16} />
                    <span className="hidden sm:inline">
                      {activeConv.status === "archived" ? "Buka Arsip" : "Arsipkan"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Message Timeline */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50 min-h-[380px] max-h-[440px]">
                {loadingMsgs ? (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground gap-2">
                    <CircleNotch size={20} className="animate-spin text-emerald-600" />
                    Memuat pesan percakapan...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-muted-foreground">
                    Belum ada riwayat pesan. Ketik balasan pertama untuk menyapa traveler!
                  </div>
                ) : (
                  messages.map((m) => {
                    const isVendorMsg = m.sender_id !== activeConv.user_id;

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isVendorMsg ? "items-end" : "items-start"}`}
                      >
                        <div className="text-[10px] font-extrabold text-muted-foreground mb-1 px-1">
                          {isVendorMsg ? "Anda (Mitra)" : m.sender_name || "Customer"}
                        </div>

                        <div
                          className={`max-w-[82%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs shadow-xs leading-relaxed ${
                            isVendorMsg
                              ? "bg-emerald-600 text-white rounded-br-none"
                              : "bg-white text-slate-800 border border-border rounded-bl-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.text}</p>
                        </div>

                        <div className="text-[9px] text-muted-foreground mt-1 px-1 flex items-center gap-1">
                          <Clock size={10} />
                          {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Templates */}
              <div className="px-4 py-2 border-t border-border bg-neutral-50/80 overflow-x-auto flex items-center gap-2 text-xs">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase shrink-0 flex items-center gap-1">
                  <Sparkle size={12} className="text-amber-500" /> Templat Cepat:
                </span>
                {[
                  "Halo kak, slot kuota trip ini masih tersedia!",
                  "Jadwal meeting point di basecamp pukul 06.00 WIB.",
                  "Silakan siapkan bukti pembayaran atau e-tiket aplikasi.",
                  "Terima kasih sudah memesan trip bersama kami!"
                ].map((tmpl, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickTemplate(tmpl)}
                    className="px-2.5 py-1 rounded-lg border border-border bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-[11px] font-medium shrink-0 transition-all text-slate-700"
                  >
                    {tmpl}
                  </button>
                ))}
              </div>

              {/* Composer Input Footer */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-border bg-white flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Tulis pesan balasan untuk customer..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={sending}
                  className="flex-1 px-4 py-3 text-xs rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-neutral-50/50"
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim() || sending}
                  className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-extrabold text-xs flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50 transition-all shrink-0 shadow-xs"
                >
                  {sending ? (
                    <CircleNotch size={16} className="animate-spin" />
                  ) : (
                    <>
                      Kirim <PaperPlaneRight size={16} weight="bold" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <ChatCircleDots size={48} className="text-neutral-300 mb-3" />
              <h3 className="text-base font-black text-slate-800">Pilih Percakapan dari Kotak Masuk</h3>
              <p className="text-xs max-w-sm mt-1">
                Pilih pesan pelanggan di sebelah kiri untuk melihat detail diskusi produk, jadwal booking, dan memberikan balasan.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
