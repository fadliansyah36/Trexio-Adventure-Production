import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  Sparkle,
  TrendUp,
  Package,
  ShoppingBag,
  CurrencyDollar,
  Eye,
  Star,
  MagnifyingGlass,
  CheckCircle,
  Warning,
  PaperPlaneRight,
  ArrowsClockwise,
  Rocket,
  Funnel,
  ShieldCheck,
  Megaphone,
  ArrowRight,
  Globe,
  Tag,
  Lightning,
  Compass,
  Sparkle as SparkleIcon,
} from "@phosphor-icons/react";

export default function VendorAICopilot() {
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [copilotData, setCopilotData] = useState(null);
  const [activeTab, setActiveTab] = useState("chat");

  // Chat States
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId] = useState(`sess_copilot_${Date.now()}`);

  const quickPrompts = [
    "Bagaimana cara optimasi trip saya agar muncul teratas di AI Trip Discovery?",
    "Bagaimana performa bisnis saya bulan ini?",
    "Produk mana paling bagus?",
    "Kenapa produk saya sedikit booking?",
    "Destinasi apa yang sedang banyak dicari?",
    "Bagaimana meningkatkan conversion?",
    "Bagaimana performa iklan saya?",
  ];

  useEffect(() => {
    fetchCopilotOverview();
  }, [period]);

  async function fetchCopilotOverview() {
    setLoading(true);
    try {
      const res = await api.get(`/ai/vendor/copilot/overview?period=${period}`);
      if (res.data?.ok) {
        setCopilotData(res.data);
      } else {
        toast.error(res.data?.error || "Gagal memuat data AI Copilot");
      }
    } catch (e) {
      toast.error("Gagal menghubungkan ke server AI Copilot");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage(msgToSend = null) {
    const text = msgToSend || inputMessage;
    if (!text || !text.trim() || chatLoading) return;

    const userMsg = { role: "user", content: text, time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) };
    setMessages((prev) => [...prev, userMsg]);
    if (!msgToSend) setInputMessage("");
    setChatLoading(true);

    try {
      const res = await api.post("/ai/vendor/copilot/chat", {
        message: text,
        sessionId,
        period,
      });

      if (res.data?.ok) {
        const aiMsg = {
          role: "assistant",
          content: res.data.answer,
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          suggestedPrompts: res.data.suggestedPrompts || [],
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        toast.error("Gagal memproses pesan AI Copilot");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan pada layanan AI Copilot");
    } finally {
      setChatLoading(false);
    }
  }

  if (loading && !copilotData) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <Sparkle className="animate-spin text-emerald-500" size={40} />
        <p className="text-sm font-bold text-neutral-600">Menghubungkan ke Trexio AI Vendor Copilot Engine...</p>
      </div>
    );
  }

  const overview = copilotData?.overview || {};
  const productIntel = copilotData?.product_intelligence || {};
  const demandIntel = copilotData?.demand_opportunities || {};
  const pricingInsights = copilotData?.pricing_insights || [];
  const reviewIntel = copilotData?.review_insights || {};
  const storefrontCopilot = copilotData?.storefront_copilot || {};
  const seoCopilot = copilotData?.seo_copilot || {};
  const adsCopilot = copilotData?.advertising_copilot || {};
  const actionCenter = copilotData?.action_center || [];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-emerald-950 to-neutral-900 text-white p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-emerald-500/20">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkle size={200} weight="fill" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkle weight="fill" size={14} />
              <span>AI Vendor Business Copilot</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              AI Business Copilot — {copilotData?.vendor?.brand_name}
            </h1>
            <p className="text-xs md:text-sm text-neutral-300 max-w-2xl leading-relaxed">
              Analisis performa bisnis real-time, kecerdasan produk, identifikasi peluang pasar, optimasi SEO & iklan, serta saran tindakan taktis bersertifikat backend.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 bg-white/10 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
            {[
              { id: "7d", label: "7 Hari" },
              { id: "30d", label: "30 Hari" },
              { id: "this_month", label: "Bulan Ini" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  period === p.id
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                    : "text-neutral-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Business Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Total Omset</span>
          <p className="text-lg font-black text-emerald-600">
            IDR {overview.total_revenue ? overview.total_revenue.toLocaleString("id-ID") : 0}
          </p>
          <span className="text-[10px] text-neutral-500 font-medium">Certified Verified DB</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Total Booking</span>
          <p className="text-lg font-black text-neutral-900">{overview.total_bookings || 0}</p>
          <span className="text-[10px] text-emerald-600 font-bold">{overview.completed_bookings || 0} Selesai</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Produk Dilihat</span>
          <p className="text-lg font-black text-neutral-900">{overview.total_views || 0}</p>
          <span className="text-[10px] text-neutral-500 font-medium">Aktivitas Katalog</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Konversi Sales</span>
          <p className="text-lg font-black text-blue-600">{overview.conversion_rate || 0}%</p>
          <span className="text-[10px] text-neutral-500 font-medium">Bookings / Tayangan</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Rating & Review</span>
          <p className="text-lg font-black text-amber-500 flex items-center gap-1">
            <Star size={18} weight="fill" />
            <span>{overview.average_rating || 5.0}</span>
          </p>
          <span className="text-[10px] text-neutral-500 font-medium">{overview.total_reviews || 0} Ulasan Publik</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Iklan & Promosi</span>
          <p className="text-lg font-black text-purple-600">{adsCopilot.active_campaigns_count || 0} Kampanye</p>
          <span className="text-[10px] text-neutral-500 font-medium">CTR {adsCopilot.ctr || 0}%</span>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "chat", label: "Tanya AI Copilot", icon: Sparkle },
          { id: "ai_discovery", label: "Optimasi AI Discovery", icon: Compass },
          { id: "actions", label: "AI Action Center", icon: Rocket, count: actionCenter.length },
          { id: "products", label: "Kecerdasan Produk", icon: Package },
          { id: "demand", label: "Peluang Pasar", icon: MagnifyingGlass },
          { id: "pricing", label: "Insights Harga", icon: Tag },
          { id: "reviews", label: "Ulasan & Reputasi", icon: Star },
          { id: "storefront", label: "Storefront & SEO", icon: Globe },
          { id: "ads", label: "Iklan & Promosi", icon: Megaphone },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                activeTab === tab.id
                  ? "bg-neutral-900 text-white shadow-md"
                  : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              <Icon size={16} weight={activeTab === tab.id ? "fill" : "regular"} />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-black">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: CONVERSATIONAL AI COPILOT CHAT */}
      {activeTab === "chat" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-neutral-200 p-6 shadow-sm flex flex-col h-[600px]">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <Sparkle size={20} weight="fill" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-neutral-900">Conversational Business Assistant</h3>
                  <p className="text-[11px] text-neutral-500">Menganalisis data real {copilotData?.vendor?.brand_name}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700">
                Grounded Real-Time DB
              </span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="p-4 rounded-full bg-emerald-50 text-emerald-500">
                    <Sparkle size={32} weight="fill" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-neutral-800">Halo! Ada yang ingin ditanyakan tentang bisnis Anda?</h4>
                    <p className="text-xs text-neutral-500 max-w-sm">
                      Saya siap membantu menganalisis omset, strategi harga, performa iklan, serta memberikan saran peningkatan pemesanan.
                    </p>
                  </div>

                  <div className="w-full max-w-md pt-4 space-y-2">
                    <p className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Pertanyaan Populer Mitra:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {quickPrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(prompt)}
                          className="text-left text-xs p-3 rounded-xl bg-neutral-50 hover:bg-emerald-50 border border-neutral-200 hover:border-emerald-300 text-neutral-700 hover:text-emerald-800 transition-all font-medium"
                        >
                          "{prompt}"
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"} space-y-1`}
                  >
                    <div
                      className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                        m.role === "user"
                          ? "bg-emerald-600 text-white rounded-br-none"
                          : "bg-neutral-100 text-neutral-800 rounded-bl-none border border-neutral-200/80"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-medium px-1">{m.time}</span>
                  </div>
                ))
              )}

              {chatLoading && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-neutral-100 text-neutral-500 text-xs font-bold w-fit">
                  <Sparkle className="animate-spin text-emerald-500" size={16} />
                  <span>AI Copilot sedang menganalisis data bisnis Anda...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <div className="pt-4 border-t border-neutral-100 flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Tanyakan analisis bisnis, misal: 'Kenapa produk saya sedikit booking?'"
                className="flex-1 px-4 py-3 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={chatLoading || !inputMessage.trim()}
                className="p-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl transition-all shadow-md"
              >
                <PaperPlaneRight size={18} weight="fill" />
              </button>
            </div>
          </div>

          {/* Sidebar Quick Action Items */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <Rocket size={16} className="text-emerald-500" weight="fill" />
                <span>Rekomendasi Tindakan Cepat</span>
              </h3>

              <div className="space-y-3">
                {actionCenter.slice(0, 4).map((act) => (
                  <div key={act.id} className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        {act.severity}
                      </span>
                      <span className="text-[10px] font-bold text-neutral-400">{act.category}</span>
                    </div>
                    <h4 className="text-xs font-bold text-neutral-900">{act.title}</h4>
                    <p className="text-[11px] text-neutral-500 leading-snug">{act.description}</p>
                    <Link
                      to={act.target_route}
                      className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 hover:text-emerald-700 pt-1"
                    >
                      <span>{act.action_label}</span>
                      <ArrowRight size={12} weight="bold" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: AI DISCOVERY OPTIMIZER FOR VENDORS */}
      {activeTab === "ai_discovery" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 space-y-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-200">
                  AI Trip Discovery Vendor Copilot
                </span>
                <h3 className="text-base font-black text-neutral-900 flex items-center gap-2 mt-1">
                  <Compass size={22} className="text-emerald-600" weight="fill" />
                  <span>Pusat Optimasi Ranking AI Discovery Produk Mitra</span>
                </h3>
                <p className="text-xs text-neutral-500">
                  Pastikan produk trip & rental Anda terindeks sempurna oleh mesin AI Trip Discovery dengan melengkapi kriteria format pengisian vendor resmi.
                </p>
              </div>

              <Link to="/ai-trip-discovery">
                <button className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20">
                  <Sparkle size={16} weight="fill" />
                  <span>Uji Simulasi Pencarian AI</span>
                </button>
              </Link>
            </div>

            {/* OPTIMIZATION TIPS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-800">
                  <CheckCircle size={18} className="text-emerald-600" weight="fill" />
                  <span>Format Itinerary Lengkap</span>
                </div>
                <p className="text-xs text-emerald-900/80">
                  Sertakan jadwal per hari (Day 1, Day 2, dst) beserta estimasi waktu jam & aktivitas detail. AI mengutamakan produk berkategori itinery lengkap.
                </p>
              </div>

              <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-blue-800">
                  <CheckCircle size={18} className="text-blue-600" weight="fill" />
                  <span>Simaksi & Meeting Point Clear</span>
                </div>
                <p className="text-xs text-blue-900/80">
                  Tuliskan titik temu penjemputan spesifik (misal: "Basecamp Sembalun / Stasiun Malang") & centang status gratis tiket Simaksi.
                </p>
              </div>

              <div className="p-4 bg-purple-50/60 border border-purple-200/80 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-purple-800">
                  <CheckCircle size={18} className="text-purple-600" weight="fill" />
                  <span>Fasilitas Included & Excluded</span>
                </div>
                <p className="text-xs text-purple-900/80">
                  Rincikan logistik, tenda, guide, & konsumsi yang didapat traveler. AI mencocokkan kata kunci " include tenda " secara otomatis.
                </p>
              </div>
            </div>

            {/* QUICK AI OPTIMIZATION ACTION BUTTON */}
            <div className="p-5 bg-neutral-900 text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center md:text-left">
                <div className="text-xs font-black uppercase text-emerald-400">
                  Tanyakan Saran Kustom AI Copilot
                </div>
                <p className="text-xs text-neutral-300">
                  Minta AI menganalisis produk mana dari toko Anda yang memerlukan penyempurnaan deskripsi & tag kueri.
                </p>
              </div>
              <button
                onClick={() => handleSendMessage("Bagaimana cara optimasi trip saya agar muncul teratas di AI Trip Discovery?")}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs transition-all shrink-0 flex items-center gap-1.5"
              >
                <Sparkle size={16} weight="fill" />
                <span>Minta Analisis AI Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {activeTab === "actions" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 space-y-4">
            <h3 className="text-base font-black text-neutral-900 flex items-center gap-2">
              <Rocket size={20} className="text-emerald-500" weight="fill" />
              <span>Pusat Tindakan Strategis AI Copilot</span>
            </h3>
            <p className="text-xs text-neutral-500">
              Tindakan prioritas yang diidentifikasi oleh AI untuk langsung meningkatkan omset, impresi, dan kepuasan pelanggan.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {actionCenter.map((act) => (
                <div key={act.id} className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md border uppercase ${
                        act.severity === "HIGH"
                          ? "bg-rose-100 text-rose-700 border-rose-200"
                          : act.severity === "MEDIUM"
                          ? "bg-amber-100 text-amber-700 border-amber-200"
                          : "bg-blue-100 text-blue-700 border-blue-200"
                      }`}
                    >
                      Prioritas {act.severity}
                    </span>
                    <span className="text-[10px] font-extrabold text-neutral-400">{act.category}</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-neutral-900">{act.title}</h4>
                    <p className="text-xs text-neutral-600 mt-1">{act.description}</p>
                  </div>

                  <Link
                    to={act.target_route}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    <span>{act.action_label}</span>
                    <ArrowRight size={14} weight="bold" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: PRODUCT INTELLIGENCE */}
      {activeTab === "products" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 space-y-2">
              <span className="text-xs font-extrabold text-emerald-600 uppercase">High Performer</span>
              <p className="text-2xl font-black text-neutral-900">{productIntel.high_performers?.length || 0}</p>
              <p className="text-[11px] text-neutral-500">Produk omset & booking tertinggi di katalog Anda.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-neutral-200 space-y-2">
              <span className="text-xs font-extrabold text-amber-600 uppercase">Rendah Konversi</span>
              <p className="text-2xl font-black text-neutral-900">{productIntel.low_conversion?.length || 0}</p>
              <p className="text-[11px] text-neutral-500">Banyak dilihat namun pembelian masih di bawah 1%.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-neutral-200 space-y-2">
              <span className="text-xs font-extrabold text-rose-600 uppercase">Perlu Perhatian</span>
              <p className="text-2xl font-black text-neutral-900">{productIntel.needs_attention?.length || 0}</p>
              <p className="text-[11px] text-neutral-500">Jadwal keberangkatan lampau atau kuota habis.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-neutral-200 space-y-4">
            <h3 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wider">Katalog Produk & Analisis Performa</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-400 font-extrabold uppercase text-[10px]">
                    <th className="pb-3">Judul Produk</th>
                    <th className="pb-3">Destinasi</th>
                    <th className="pb-3">Harga</th>
                    <th className="pb-3">Views</th>
                    <th className="pb-3">Bookings</th>
                    <th className="pb-3">Konversi</th>
                    <th className="pb-3">Status AI</th>
                    <th className="pb-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                  {(copilotData?.product_intelligence?.high_performers || [])
                    .concat(copilotData?.product_intelligence?.growing || [])
                    .concat(copilotData?.product_intelligence?.low_conversion || [])
                    .map((p) => (
                      <tr key={p.id} className="hover:bg-neutral-50">
                        <td className="py-3 font-bold text-neutral-900">{p.title}</td>
                        <td className="py-3">{p.destination}</td>
                        <td className="py-3 font-bold text-emerald-600">IDR {p.price?.toLocaleString("id-ID")}</td>
                        <td className="py-3">{p.views}</td>
                        <td className="py-3">{p.bookings_count}</td>
                        <td className="py-3 font-bold text-blue-600">{p.conversion_rate}%</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.conversion_rate >= 2.0
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {p.conversion_rate >= 2.0 ? "High Performer" : "Perlu Optimasi"}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            to="/vendor/products"
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: DEMAND OPPORTUNITY */}
      {activeTab === "demand" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 space-y-4">
            <h3 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <MagnifyingGlass size={18} className="text-emerald-500" weight="bold" />
              <span>Deteksi Pencarian Pasar & Celah Suplai (Supply Gap)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(demandIntel.demand_opportunities || []).map((opp, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-neutral-900">"{opp.query}"</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        opp.opportunity_level === "HIGH_SUPPLY_GAP"
                          ? "bg-rose-100 text-rose-700 border border-rose-200"
                          : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {opp.opportunity_level}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <span>Volume Cari: <strong>{opp.search_volume}</strong></span>
                    <span>Suplai Aktif: <strong>{opp.existing_supply_count} Produk</strong></span>
                  </div>
                  <p className="text-xs text-neutral-600 bg-white p-2.5 rounded-xl border border-neutral-200 leading-relaxed">
                    {opp.recommended_action}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: PRICING INSIGHTS */}
      {activeTab === "pricing" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 space-y-4">
            <h3 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wider">
              Analisis Benchmark Harga Destinasi vs Produk Anda
            </h3>
            <p className="text-xs text-neutral-500">
              Perbandingan harga teragregasi secara anonim untuk membantu penetapan harga yang kompetitif tanpa manipulasi pasar.
            </p>

            <div className="space-y-3">
              {pricingInsights.map((pi) => (
                <div key={pi.product_id} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-neutral-900">{pi.title}</h4>
                    <span className="text-xs font-bold text-emerald-600">IDR {pi.vendor_price?.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <span>Destinasi: {pi.destination}</span>
                    <span>Rata-Rata Pasar: IDR {pi.benchmark_avg_price?.toLocaleString("id-ID")}</span>
                  </div>
                  <p className="text-xs text-neutral-600 bg-white p-3 rounded-xl border border-neutral-200">
                    💡 <strong>Analisis AI:</strong> {pi.pricing_advice}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: REVIEWS & REPUTATION */}
      {activeTab === "reviews" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 space-y-4">
            <h3 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wider">Sentimen Ulasan Pelanggan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-emerald-600 uppercase">Poin Positif Utama:</h4>
                <ul className="space-y-1.5 text-xs text-neutral-700">
                  {(reviewIntel.positive_themes || []).map((theme, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-emerald-500" weight="fill" />
                      <span>{theme}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-rose-600 uppercase">Peluang Perbaikan / Complaints:</h4>
                {reviewIntel.common_complaints?.length === 0 ? (
                  <p className="text-xs text-neutral-500">Tidak ada keluhan kritis tercatat pada periode ini.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs text-neutral-700">
                    {(reviewIntel.common_complaints || []).map((c, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Warning size={16} className="text-rose-500" weight="fill" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 7: STOREFRONT & SEO */}
      {activeTab === "storefront" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wider">
                Kelengkapan Profile Storefront ({storefrontCopilot.completeness_score}%)
              </h3>
              <Link
                to="/vendor/profile"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                Lengkapi Profil
              </Link>
            </div>

            <div className="space-y-2">
              {storefrontCopilot.recommendations?.map((rec, i) => (
                <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
                  {rec}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 8: ADVERTISING COPILOT */}
      {activeTab === "ads" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 space-y-4">
            <h3 className="text-sm font-extrabold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <Megaphone size={18} className="text-purple-500" weight="fill" />
              <span>Performa Promosi & Iklan Kampanye</span>
            </h3>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-xs text-purple-900 leading-relaxed">
              <strong>Catatan Keamanan AI:</strong> AI Business Copilot memberikan saran optimasi tayangan iklan. AI tidak akan pernah otomatis memotong saldo atau mengaktifkan iklan berbayar tanpa persetujuan eksplisit vendor.
            </div>

            <div className="space-y-2">
              {adsCopilot.recommendations?.map((rec, i) => (
                <div key={i} className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-700">
                  💡 {rec}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
