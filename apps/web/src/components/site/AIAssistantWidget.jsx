import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiError } from "@/lib/api";
import { buildProductUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Sparkle,
  PaperPlaneRight,
  X,
  Trash,
  Compass,
  ArrowRight,
  ChatCircleDots,
  Lightning,
  Tag,
  Star,
  MapPin,
  CheckCircle,
  Question,
  Storefront,
} from "@phosphor-icons/react";

export default function AIAssistantWidget({ onSwitchToVendorChat }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => {
    try {
      return localStorage.getItem("trexio_ai_session_id") || `sess_ai_${Date.now()}`;
    } catch (e) {
      return `sess_ai_${Date.now()}`;
    }
  });
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("trexio_ai_messages");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem("trexio_ai_messages", JSON.stringify(messages));
        localStorage.setItem("trexio_ai_session_id", sessionId);
      }
    } catch (e) {}
  }, [messages, sessionId]);
  const [suggestedPrompts, setSuggestedPrompts] = useState([
    "Cari open trip Gunung Prau di bawah 700rb",
    "Cek prakiraan cuaca & status jalur Gunung Prau",
    "Rekomendasi trip untuk pendaki pemula",
    "Cari guide bersertifikat Gunung Gede",
    "Sewa tenda dome & carrier 60L",
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      loadInitialPrompts();
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function loadInitialPrompts() {
    try {
      const { data } = await api.get("/ai/assistant/prompts");
      if (data.ok && Array.isArray(data.prompts)) {
        setSuggestedPrompts(data.prompts);
      }
    } catch (e) {
      // Use default fallback prompts
    }
  }

  async function handleSendMessage(promptText) {
    const textToSend = promptText || input;
    if (!textToSend || !textToSend.trim()) return;

    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptText) setInput("");
    setLoading(true);

    try {
      const { data } = await api.post("/ai/assistant/chat", {
        message: textToSend.trim(),
        sessionId,
      });

      if (data.ok) {
        const aiMsg = {
          id: `ai_${Date.now()}`,
          sender: "assistant",
          content: data.answer,
          products: data.products || [],
          intent: data.intent,
          suggestedPrompts: data.suggestedPrompts || [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, aiMsg]);
        if (data.suggestedPrompts && data.suggestedPrompts.length > 0) {
          setSuggestedPrompts(data.suggestedPrompts);
        }
      } else {
        toast.error(data.error || "Gagal mendapatkan respon AI.");
      }
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.error) || "Layanan AI Assistant sedang mengalami masalah.");
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          sender: "assistant",
          content: "Maaf, sistem AI mengalami kendala koneksi. Anda dapat mencari trip atau sewa alat langsung melalui menu Katalog Marketplace.",
          products: [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetChat() {
    try {
      await api.delete(`/ai/assistant/chat/${sessionId}`);
    } catch (e) {
      // ignore error
    }
    const newSess = `sess_ai_${Date.now()}`;
    setSessionId(newSess);
    setMessages([]);
    try {
      localStorage.removeItem("trexio_ai_messages");
      localStorage.setItem("trexio_ai_session_id", newSess);
    } catch (e) {}
    toast.success("Sesi obrolan AI berhasil direset.");
  }

  return (
    <>
      {/* Floating AI Assistant Trigger Button */}
      <button
        type="button"
        data-testid="floating-ai-assistant-btn"
        aria-label="Trexio AI Assistant"
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-50 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 hover:from-emerald-900 hover:to-teal-800 text-white rounded-full shadow-2xl flex items-center gap-2 sm:gap-2.5 font-bold text-xs transition-all hover:scale-105 active:scale-95 border-2 border-amber-300/40 cursor-pointer"
      >
        <div className="p-1 rounded-full bg-amber-400 text-emerald-950 animate-pulse">
          <Sparkle size={18} weight="fill" />
        </div>
        <span className="font-extrabold tracking-wide">Trexio AI</span>
      </button>

      {/* AI Assistant Modal Window */}
      {open && (
        <div className="fixed bottom-20 md:bottom-6 right-1.5 sm:right-6 z-50 w-[calc(100vw-1rem)] sm:w-[420px] max-w-[420px] h-[calc(100vh-130px)] max-h-[580px] min-h-[360px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white flex items-center justify-between shrink-0 border-b border-emerald-700/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Sparkle size={20} weight="fill" />
              </div>
              <div>
                <div className="font-extrabold text-xs flex items-center gap-1.5">
                  <span>TREXIO AI Assistant</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[9px] font-bold border border-amber-300/30">
                    Grounded DB
                  </span>
                </div>
                <div className="text-[10px] text-emerald-200 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Pencarian Cerdas & Rekomendasi Marketplace</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Switch to Vendor Chat */}
              {onSwitchToVendorChat && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onSwitchToVendorChat();
                  }}
                  title="Switch to Chat Mitra"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold flex items-center gap-1"
                >
                  <Storefront size={16} />
                  <span className="hidden sm:inline">Chat Mitra</span>
                </button>
              )}

              {/* Reset Session Button */}
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetChat}
                  title="Reset Obrolan (Chat Baru)"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <Trash size={16} />
                </button>
              )}

              <button
                type="button"
                aria-label="Tutup AI"
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
          </div>

          {/* Messages / Welcome Container */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-4 bg-muted/20 text-xs">
            {messages.length === 0 ? (
              /* Welcome Screen with Suggested Chips */
              <div className="h-full flex flex-col justify-between p-2">
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 text-center space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-emerald-700 text-amber-300 flex items-center justify-center shadow-md">
                      <Sparkle size={22} weight="fill" />
                    </div>
                    <h4 className="font-extrabold text-sm text-foreground">
                      Halo! Mau Cari Trip / Alat Outdoor Mana Hari Ini?
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Saya dapat membantu rekomendasi open trip, sewa tenda, pemandu APGI, porter, dan perbandingan harga berdasarkan data resmi Trexio.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-muted-foreground flex items-center gap-1 px-1">
                      <Lightning size={14} className="text-amber-500" weight="fill" />
                      <span>Coba Pertanyaan Cepat:</span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      {suggestedPrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(prompt)}
                          className="w-full text-left p-2.5 rounded-xl bg-card hover:bg-emerald-50 hover:border-emerald-300 text-foreground text-xs font-medium border border-border/80 transition-all shadow-xs flex items-center justify-between group"
                        >
                          <span className="line-clamp-1">{prompt}</span>
                          <ArrowRight size={14} className="text-muted-foreground group-hover:text-emerald-700 shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-card border border-border text-[10px] text-muted-foreground flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-600 shrink-0" weight="fill" />
                  <span>Data terhubung langsung dengan ketersediaan vendor di Trexio.</span>
                </div>
              </div>
            ) : (
              /* Chat Conversation Stream */
              messages.map((m) => {
                const isUser = m.sender === "user";
                return (
                  <div key={m.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-1 mb-1 px-1 text-[10px] text-muted-foreground">
                      <span>{isUser ? user?.name || "Pendaki" : "Trexio AI"}</span>
                      <span>•</span>
                      <span>{m.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-[90%] p-3 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? "bg-emerald-800 text-white rounded-br-none font-medium shadow-xs"
                          : "bg-card text-foreground border border-border/80 rounded-bl-none shadow-xs"
                      }`}
                    >
                      <div className="whitespace-pre-line">{m.content}</div>

                      {/* Render Product Cards if available */}
                      {Array.isArray(m.products) && m.products.length > 0 && (
                        <div className="mt-3 space-y-2 pt-2 border-t border-border/50">
                          <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <Tag size={12} weight="fill" />
                            <span>Produk Terkait di Trexio:</span>
                          </div>

                          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                            {m.products.map((p, idx) => {
                              const targetUrl = buildProductUrl(p);
                              return (
                                <Link
                                  key={p.id || p.slug || idx}
                                  to={targetUrl}
                                  onClick={() => setOpen(false)}
                                  className="w-[200px] shrink-0 bg-background rounded-xl border border-border p-2.5 shadow-xs flex flex-col justify-between hover:border-emerald-600 dark:hover:border-emerald-500 transition-all cursor-pointer group"
                                >
                                  <div>
                                    {p.cover_image && (
                                      <img
                                        src={p.cover_image}
                                        alt={p.title}
                                        className="w-full h-24 object-cover rounded-lg mb-2 group-hover:scale-105 transition-transform duration-200"
                                      />
                                    )}
                                    <div className="font-bold text-xs text-foreground line-clamp-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                                      {p.title}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                      <MapPin size={10} className="text-emerald-600 shrink-0" />
                                      <span className="truncate">{p.destination || p.location || "Indonesia"}</span>
                                    </div>
                                    <div className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
                                      {p.formatted_price || (p.price ? `Rp ${Number(p.price).toLocaleString("id-ID")}` : "Cek Detail")}
                                    </div>
                                  </div>

                                  <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                                    <div className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                      <Star size={10} weight="fill" className="text-amber-500" />
                                      <span>{p.rating || 4.9}</span>
                                    </div>
                                    <span className="h-6 px-2.5 text-[10px] bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold flex items-center justify-center">
                                      {p.action_label || "Lihat Detail"}
                                    </span>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Loading Spinner */}
            {loading && (
              <div className="flex items-center gap-2 p-3 bg-card border border-border rounded-2xl max-w-[200px]">
                <Sparkle size={18} className="text-amber-500 animate-spin" />
                <span className="text-xs font-semibold text-muted-foreground">Trexio AI berpikir...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-card border-t border-border flex items-center gap-2 shrink-0"
          >
            <Input
              placeholder="Tanya Trexio AI (misal: 'open trip Bromo 800rb')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="bg-background text-xs h-9 rounded-xl flex-1 border-border focus-visible:ring-emerald-700"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Kirim Pesan"
              className="h-9 w-9 p-0 bg-gradient-to-r from-emerald-800 to-teal-700 hover:from-emerald-900 hover:to-teal-800 text-white rounded-xl shrink-0 font-bold"
            >
              <PaperPlaneRight size={16} weight="fill" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
