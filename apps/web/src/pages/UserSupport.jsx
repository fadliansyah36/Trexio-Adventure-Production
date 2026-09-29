import React, { useState } from "react";
import { Lifebuoy, Plus, CheckCircle, Clock, Warning, FileText, ArrowRight, ShieldWarning, ChatCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function UserSupport() {
  const [activeTab, setActiveTab] = useState("tickets");
  const [newTicketModal, setNewTicketModal] = useState(false);

  const [tickets, setTickets] = useState([]);
  const [disputes, setDisputes] = useState([]);

  const handleCreateTicket = (e) => {
    e.preventDefault();
    const form = e.target;
    const cat = form.category.value;
    const sub = form.subject.value;
    const msg = form.message.value;

    const newT = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      category: cat,
      subject: sub,
      booking_code: "TRX-GENERAL",
      status: "OPEN",
      updated_at: "Baru saja",
      replies: [{ sender: "user", text: msg, time: "Baru saja" }],
    };

    setTickets([newT, ...tickets]);
    toast.success("Tiket bantuan berhasil dibuat!");
    setNewTicketModal(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-1">
              <Lifebuoy size={16} weight="fill" /> 24/7 Adventure Support & Resolution Center
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              Bantuan & Resolusi Kendala
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Pusat tiket bantuan operasional dan arbitrase transaksi aman bersama tim Trexio Care.
            </p>
          </div>

          <button
            onClick={() => setNewTicketModal(true)}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-xs"
          >
            <Plus size={16} /> Buat Tiket Bantuan
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border gap-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab("tickets")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "tickets" ? "border-emerald-500 text-emerald-600" : "border-transparent text-muted-foreground"
            }`}
          >
            <ChatCircle size={18} /> Tiket Bantuan ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab("disputes")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "disputes" ? "border-emerald-500 text-emerald-600" : "border-transparent text-muted-foreground"
            }`}
          >
            <ShieldWarning size={18} /> Center Dispute ({disputes.length})
          </button>
        </div>

        {/* Tickets Section */}
        {activeTab === "tickets" && (
          <div className="space-y-4">
            {tickets.map((t) => (
              <div key={t.id} className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-xs">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      {t.id}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">{t.category}</span>
                  </div>
                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase ${
                      t.status === "RESOLVED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : t.status === "IN_PROGRESS"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-foreground">{t.subject}</h3>

                <div className="bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-border/60 space-y-2 text-xs">
                  {t.replies.map((r, i) => (
                    <div key={i} className={`flex gap-2 ${r.sender === "user" ? "text-foreground" : "text-emerald-600 font-medium"}`}>
                      <strong className="capitalize">{r.sender}:</strong>
                      <span>{r.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dispute Section */}
        {activeTab === "disputes" && (
          <div className="space-y-4">
            {disputes.map((d) => (
              <div key={d.id} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="flex justify-between items-center">
                  <div className="font-mono font-black text-sm text-rose-600">{d.id} • {d.booking_code}</div>
                  <span className="bg-amber-50 text-amber-800 text-xs font-bold px-3 py-1 rounded-full border border-amber-200">
                    Trexio Reviewing Evidence
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-black text-sm text-foreground">Mitra Terlibat: {d.partner_name}</h4>
                  <p className="text-xs text-muted-foreground">Alasan Sengketa: {d.reason}</p>
                </div>

                {/* Timeline */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  {d.timeline.map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border text-center text-[11px] font-bold ${
                        step.done
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-slate-50 text-muted-foreground border-border"
                      }`}
                    >
                      {step.step}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal New Ticket */}
        {newTicketModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 pb-20 md:pb-6 overflow-y-auto min-h-screen">
            <form onSubmit={handleCreateTicket} className="bg-card border border-border rounded-2xl max-w-md w-full p-4 sm:p-6 space-y-4 shadow-2xl my-auto max-h-[calc(100dvh-5.5rem)] sm:max-h-[85vh] flex flex-col">
              <h3 className="shrink-0 font-black text-base text-foreground border-b border-border pb-2">
                Buat Tiket Bantuan
              </h3>

              <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
                <div>
                  <label className="font-bold text-foreground block mb-1">Kategori Kendala:</label>
                  <select name="category" required className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-medium">
                    <option value="Booking & Logistics">Booking & Logistik Trip</option>
                    <option value="Payment & Refund">Pembayaran & Settlement Refund</option>
                    <option value="Partner Service">Kualitas Layanan Partner</option>
                    <option value="Technical">Kendala Aplikasi / Akun</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Subjek / Judul:</label>
                  <input
                    name="subject"
                    type="text"
                    required
                    placeholder="Judul kendala singkat..."
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Pesan / Detail Kendala:</label>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    placeholder="Jelaskan detail kendala secara rinci..."
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-medium"
                  />
                </div>
              </div>

              <div className="shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setNewTicketModal(false)}
                  className="px-4 py-2.5 border border-border rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold"
                >
                  Kirim Tiket
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
