import React, { useState, useEffect } from "react";
import backpackerService from "../../services/backpackerService";
import { Sparkle, CheckCircle, XCircle, Clock, ShieldCheck, UserCheck, MessageSquare, Instagram, MapPin, Calendar, Info, RefreshCw } from "lucide-react";

export default function MatchingAssistanceInbox({ onRequestNewAssistance }) {
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [reqRes, recRes] = await Promise.all([
        backpackerService.getMyAssistanceRequests().catch(() => ({ data: [] })),
        backpackerService.getMyGuidedRecommendations().catch(() => ({ data: [] }))
      ]);
      setAssistanceRequests(Array.isArray(reqRes.data) ? reqRes.data : []);
      setRecommendations(Array.isArray(recRes.data) ? recRes.data : []);
    } catch (err) {
      console.error("Error fetching matching assistance data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRespond(connectionId, action) {
    setActionLoadingId(connectionId);
    setMessage(null);
    try {
      const res = await backpackerService.respondToSuggestedMatch(connectionId, action);
      setMessage({ type: "success", text: res.message || (action === "ACCEPT" ? "Rekomendasi disetujui!" : "Rekomendasi ditolak.") });
      fetchData();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || err.message || "Gagal memproses respon." });
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 border border-emerald-500/30 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold font-mono">
              <Sparkle size={14} className="text-amber-400" />
              Pusat Bantuan Matching Terbimbing (System Mediated)
            </div>
            <h2 className="text-lg font-black text-white tracking-tight">
              Kawan Perjalanan Terbimbing Super Admin &amp; AI Matching
            </h2>
            <p className="text-xs text-slate-200 max-w-2xl leading-relaxed">
              Super Admin dan Engine AI membantu mencocokkan Anda dengan pendaki berintegritas tinggi. 
              <strong className="text-amber-300 font-bold"> Kontak pribadi hanya dibuka setelah kedua belah pihak menyetujui rekomendasi ini (Mutual Consent).</strong>
            </p>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all border border-white/20 shrink-0 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-emerald-400" : "text-emerald-400"} />
            Perbarui Status
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
          message.type === "success" 
            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-500/40" 
            : "bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-500/40"
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white font-bold ml-2">✕</button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400">
          <RefreshCw size={24} className="animate-spin text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
          <p className="text-xs font-bold">Memuat data rekomendasi terbimbing dan permintaan bantuan Anda...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* SECTION 1: GUIDED RECOMMENDATIONS INBOX */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
                Rekomendasi Terbimbing Siap Ditinjau ({recommendations.length})
              </h3>
            </div>

            {recommendations.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 space-y-2">
                <Info size={24} className="mx-auto text-slate-400 dark:text-slate-500" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Belum ada rekomendasi partner aktif dari Super Admin.</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Jika Anda kesulitan menemukan kawan trip, gunakan tombol <strong className="text-slate-700 dark:text-slate-300">"Ajukan Bantuan Matching"</strong> pada kartu Travel Intent Anda.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xs hover:border-emerald-500/50 transition-all">
                    {/* Header Candidate Info */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-400/30 flex items-center justify-center font-black text-emerald-800 dark:text-emerald-300 text-sm">
                          {rec.partner_name?.charAt(0) || "P"}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                            {rec.partner_name}
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-mono font-bold border border-emerald-200 dark:border-emerald-500/30">
                              {rec.match_score}% MATCH
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold mt-0.5">
                            Level: <span className="text-slate-700 dark:text-zinc-200">{rec.partner_hiking_level}</span> • Style: <span className="text-slate-700 dark:text-zinc-200">{rec.partner_travel_style}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <div>
                        {rec.is_mutual_accepted ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 text-[11px] font-bold">
                            <CheckCircle size={14} /> Mutual Match Confirmed
                          </span>
                        ) : rec.status === "REJECTED" ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/40 text-[11px] font-bold">
                            <XCircle size={14} /> Rekomendasi Ditolak
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 text-[11px] font-bold">
                            <Clock size={14} /> Menunggu Respon
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Match Reasons & Target Intent */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 dark:bg-zinc-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800/80 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">
                          Kriteria Evaluasi Engine AI &amp; Admin:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {rec.match_reasons?.map((reason, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/90 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-[11px] font-semibold">
                              ✓ {reason}
                            </span>
                          ))}
                        </div>
                      </div>

                      {rec.partner_intent && (
                        <div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">
                            Rencana Perjalanan Calon Partner:
                          </div>
                          <div className="text-slate-700 dark:text-slate-200 space-y-1 text-[11px]">
                            <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-extrabold">
                              <MapPin size={13} /> {rec.partner_intent.origin} ➔ {rec.partner_intent.destination}
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                              <Calendar size={13} /> {rec.partner_intent.travel_date}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* MUTUAL CONSENT UNLOCKED CONTACT GATE */}
                    {rec.is_mutual_accepted && rec.authorized_contacts ? (
                      <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/40 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-extrabold text-xs">
                          <UserCheck size={16} />
                          <span>Kontak Pribadi Berhasil Dibuka (Otorisasi Saling Setuju)</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          {rec.authorized_contacts.whatsapp_number && (
                            <a
                              href={`https://wa.me/${rec.authorized_contacts.whatsapp_number.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-sm"
                            >
                              <MessageSquare size={14} />
                              WhatsApp: {rec.authorized_contacts.whatsapp_number}
                            </a>
                          )}

                          {rec.authorized_contacts.instagram_username && (
                            <a
                              href={`https://instagram.com/${rec.authorized_contacts.instagram_username.replace("@", "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-xs transition-all shadow-sm"
                            >
                              <Instagram size={14} />
                              Instagram: @{rec.authorized_contacts.instagram_username.replace("@", "")}
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* CONSENT PENDING ACTIONS */
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 italic font-medium">
                          {rec.my_consent 
                            ? "✓ Anda menyetujui rekomendasi ini. Menunggu respon dari calon partner." 
                            : "⚠️ Tinjau rencana di atas. Kontak pribadi tidak akan diberikan jika salah satu pihak menolak."}
                        </div>

                        {!rec.is_mutual_accepted && rec.status !== "REJECTED" && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleRespond(rec.connection_id, "REJECT")}
                              disabled={actionLoadingId === rec.connection_id}
                              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all border border-slate-300 dark:border-zinc-700 cursor-pointer"
                            >
                              Tolak
                            </button>

                            <button
                              onClick={() => handleRespond(rec.connection_id, "ACCEPT")}
                              disabled={actionLoadingId === rec.connection_id || rec.my_consent}
                              className={`px-4 py-2 rounded-xl font-black text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                                rec.my_consent
                                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 cursor-not-allowed"
                                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
                              }`}
                            >
                              <CheckCircle size={14} />
                              {rec.my_consent ? "Sudah Disetujui" : "Terima Rekomendasi"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: MY ASSISTANCE REQUESTS LIFE CYCLE */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock size={18} className="text-amber-600 dark:text-amber-400" />
                Riwayat Bantuan Matching Saya ({assistanceRequests.length})
              </h3>
            </div>

            {assistanceRequests.length === 0 ? (
              <div className="p-6 text-center bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-slate-400 text-xs font-medium">
                Anda belum mengajukan permintaan bantuan matching kawan trip.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assistanceRequests.map((req) => (
                  <div key={req.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-amber-700 dark:text-amber-300 text-xs flex items-center gap-1">
                        <MapPin size={13} /> {req.destination}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        req.status === "OPEN" ? "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30" :
                        req.status === "WAITING_PARTNER_RESPONSE" ? "bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30" :
                        req.status === "CONNECTED" || req.status === "MUTUAL_ACCEPTED" ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30" :
                        "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-zinc-700"
                      }`}>
                        {req.status === "OPEN" ? "Sedang Ditinjau Admin & AI" : req.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-700 dark:text-slate-300 italic bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800">
                      "{req.reason}"
                    </div>

                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between pt-1">
                      <span>Tanggal: {req.travel_date}</span>
                      <span>ID: {req.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

