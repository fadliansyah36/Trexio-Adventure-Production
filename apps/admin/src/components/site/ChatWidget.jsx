import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import ChatHistory from "./ChatHistory";
import {
  ChatCircleDots,
  PaperPlaneRight,
  X,
  Storefront,
  Sparkle,
  LockKey,
  ClockCounterClockwise,
} from "@phosphor-icons/react";

export default function ChatWidget({ onSwitchToAI }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("chat"); // 'chat' | 'history'
  const [historyLogs, setHistoryLogs] = useState({});
  const messagesEndRef = useRef(null);

  const storageKey = user ? `trexio_chat_logs_${user.id}` : "trexio_chat_logs_guest";

  // Load history from localStorage on mount/user change
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setHistoryLogs(JSON.parse(saved));
      } else {
        setHistoryLogs({});
      }
    } catch {
      setHistoryLogs({});
    }
  }, [user, storageKey]);

  // Helper to persist logs to localStorage
  function saveLogsToStorage(updatedLogs) {
    try {
      setHistoryLogs(updatedLogs);
      localStorage.setItem(storageKey, JSON.stringify(updatedLogs));
    } catch (e) {
      console.warn("Gagal menyimpan ke localStorage:", e);
    }
  }

  useEffect(() => {
    if (user && open) {
      loadConversations();
    }
  }, [user, open]);

  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv.id);
    }
  }, [activeConv]);

  useEffect(() => {
    if (viewMode === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, viewMode]);

  async function loadConversations() {
    try {
      const { data } = await api.get("/chat/conversations");
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.conversations)
        ? data.conversations
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setConversations(list);

      if (list.length > 0) {
        if (!activeConv || !list.some((c) => c && c.id === activeConv.id)) {
          setActiveConv(list[0]);
        }
      }

      // Sync metadata with historyLogs
      setHistoryLogs((prev) => {
        const next = { ...(prev || {}) };
        if (Array.isArray(list)) {
          list.forEach((c) => {
            if (c && c.id) {
              if (!next[c.id]) {
                next[c.id] = {
                  conv_id: c.id,
                  vendor_name: c.vendor_name || "Mitra TREXIO",
                  updated_at: c.updated_at,
                  messages: [],
                };
              } else {
                next[c.id].vendor_name = c.vendor_name || next[c.id].vendor_name;
                if (c.updated_at) next[c.id].updated_at = c.updated_at;
              }
            }
          });
        }
        saveLogsToStorage(next);
        return next;
      });
    } catch (err) {
      // Offline fallback: load conversations from localStorage
      if (historyLogs && Object.keys(historyLogs).length > 0) {
        const offlineList = Object.values(historyLogs).map((item) => ({
          id: item.conv_id,
          vendor_name: item.vendor_name,
          updated_at: item.updated_at,
        }));
        setConversations(offlineList);
        if (!activeConv && offlineList.length > 0) {
          setActiveConv(offlineList[0]);
        }
      }
    }
  }

  async function loadMessages(convId) {
    if (!convId) return;
    // Check localStorage cache first
    const cached = Array.isArray(historyLogs?.[convId]?.messages)
      ? historyLogs[convId].messages
      : [];
    if (cached.length > 0) {
      setMessages(cached);
    }

    try {
      const { data } = await api.get(`/chat/conversations/${convId}/messages`);
      const freshMessages = Array.isArray(data)
        ? data
        : Array.isArray(data?.messages)
        ? data.messages
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setMessages(freshMessages);

      // Update localStorage with fresh messages
      setHistoryLogs((prev) => {
        const currentConv = prev?.[convId] || {
          conv_id: convId,
          vendor_name: activeConv?.vendor_name || "Mitra TREXIO",
        };
        const updatedLogs = {
          ...(prev || {}),
          [convId]: {
            ...currentConv,
            vendor_name: activeConv?.vendor_name || currentConv.vendor_name,
            updated_at: new Date().toISOString(),
            messages: freshMessages,
          },
        };
        saveLogsToStorage(updatedLogs);
        return updatedLogs;
      });
    } catch (err) {
      if (cached.length === 0) {
        toast.error("Gagal memuat pesan chat");
      }
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!text.trim() || !activeConv) return;

    const currentText = text;
    setText("");
    setLoading(true);

    try {
      const { data } = await api.post(`/chat/conversations/${activeConv.id}/messages`, {
        text: currentText,
      });

      const newMsg = data;
      setMessages((prev) => {
        const updatedMsgs = [...prev, newMsg];

        // Save to localStorage
        setHistoryLogs((prevLogs) => {
          const convData = prevLogs[activeConv.id] || {
            conv_id: activeConv.id,
            vendor_name: activeConv.vendor_name,
          };
          const updatedLogs = {
            ...prevLogs,
            [activeConv.id]: {
              ...convData,
              vendor_name: activeConv.vendor_name,
              updated_at: new Date().toISOString(),
              messages: updatedMsgs,
            },
          };
          saveLogsToStorage(updatedLogs);
          return updatedLogs;
        });

        return updatedMsgs;
      });

      setConversations((prev) =>
        prev.map((c) => (c.id === activeConv.id ? { ...c, last_message: currentText } : c))
      );
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Gagal mengirim pesan");
    } finally {
      setLoading(false);
    }
  }

  function handleClearHistory() {
    try {
      localStorage.removeItem(storageKey);
      setHistoryLogs({});
    } catch (e) {
      console.warn("Gagal menghapus localStorage:", e);
    }
  }

  function handleSelectFromHistory(convId, data) {
    const matched = (Array.isArray(conversations) ? conversations : []).find((c) => c.id === convId) || {
      id: convId,
      vendor_name: data.vendor_name,
    };
    setActiveConv(matched);
    setViewMode("chat");
  }

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <button
        type="button"
        data-testid="floating-chat-btn"
        aria-label="Chat Bantuan & Mitra"
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-50 p-3 sm:p-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full shadow-2xl flex items-center gap-2 font-bold text-xs transition-all hover:scale-105 active:scale-95 border-2 border-white/20 cursor-pointer"
      >
        <ChatCircleDots size={22} weight="fill" />
        <span className="hidden sm:inline">Chat Bantuan</span>
      </button>

      {/* Chat Floating Window */}
      {open && (
        <div className="fixed bottom-20 md:bottom-6 right-1.5 sm:right-6 z-50 w-[calc(100vw-1rem)] sm:w-[400px] max-w-[400px] h-[calc(100vh-130px)] max-h-[540px] min-h-[360px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          {/* Top Header */}
          <div className="p-3.5 bg-emerald-700 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-white/20">
                <Storefront size={20} weight="fill" />
              </div>
              <div>
                <div className="font-bold text-xs truncate">
                  {user && activeConv ? activeConv.vendor_name : "Chat Bantuan TREXIO"}
                </div>
                <div className="text-[10px] text-white/80 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  <span>Layanan Pelanggan 24/7</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Switch to Trexio AI */}
              {onSwitchToAI && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onSwitchToAI();
                  }}
                  title="Trexio AI Assistant"
                  className="p-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 text-[11px] font-bold flex items-center gap-1 border border-amber-300/30"
                >
                  <Sparkle size={16} weight="fill" />
                  <span className="hidden sm:inline">Trexio AI</span>
                </button>
              )}

              {/* History Mode Toggle Button */}
              {user && (
                <button
                  type="button"
                  title="Riwayat Percakapan (localStorage)"
                  aria-label="Riwayat Percakapan"
                  onClick={() => setViewMode(viewMode === "chat" ? "history" : "chat")}
                  className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold ${
                    viewMode === "history"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                >
                  <ClockCounterClockwise size={18} weight="bold" />
                  <span className="hidden sm:inline text-[11px]">Riwayat</span>
                </button>
              )}

              <button
                type="button"
                aria-label="Tutup Chat"
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
          </div>

          {!user ? (
            /* Guest Login Prompt Panel */
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4 bg-background">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <LockKey size={28} weight="bold" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">Autentikasi Diperlukan</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-[260px] leading-relaxed">
                  Silakan masuk atau daftar akun terlebih dahulu untuk memulai percakapan langsung dengan Mitra TREXIO.
                </p>
              </div>
              <Button
                asChild
                onClick={() => setOpen(false)}
                className="w-full max-w-[220px] bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl"
              >
                <Link to="/login">Masuk Akun Sekarang</Link>
              </Button>
            </div>
          ) : viewMode === "history" ? (
            /* History Component View */
            <ChatHistory
              historyLogs={historyLogs}
              onSelectConversation={handleSelectFromHistory}
              onClearHistory={handleClearHistory}
              onBackToChat={() => setViewMode("chat")}
            />
          ) : (
            /* Logged In User Chat View */
            <>
              {/* Conversations Selector */}
              {conversations.length > 1 && (
                <div className="p-2 bg-muted/50 border-b border-border flex gap-1.5 overflow-x-auto shrink-0">
                  {conversations.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveConv(c)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                        activeConv?.id === c.id
                          ? "bg-emerald-700 text-white"
                          : "bg-background text-muted-foreground border border-border"
                      }`}
                    >
                      {c.vendor_name}
                    </button>
                  ))}
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-background text-xs">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground space-y-2">
                    <Sparkle size={32} className="text-emerald-500 animate-bounce" />
                    <p className="font-bold text-xs text-foreground">Diskusi Langsung Dengan Penyelenggara</p>
                    <p className="text-[11px] leading-relaxed">
                      Tanyakan info ketersediaan slot, meeting point, peralatan wajib, atau permintaan trip khusus.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_id === user.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <span className="text-[9px] text-muted-foreground mb-0.5 px-1">
                          {m.sender_name}
                        </span>
                        <div
                          className={`max-w-[82%] p-2.5 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? "bg-emerald-700 text-white rounded-br-none font-medium"
                              : "bg-muted text-foreground border border-border rounded-bl-none"
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Footer */}
              <form onSubmit={handleSendMessage} className="p-2.5 bg-card border-t border-border flex items-center gap-2 shrink-0">
                <Input
                  placeholder="Tulis pesan ke mitra..."
                  aria-label="Pesan ke mitra"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="bg-background text-xs h-9 rounded-xl flex-1"
                />
                <Button
                  type="submit"
                  aria-label="Kirim Pesan"
                  disabled={loading || !text.trim() || !activeConv}
                  className="h-9 w-9 p-0 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shrink-0"
                >
                  <PaperPlaneRight size={16} weight="fill" />
                </Button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}

