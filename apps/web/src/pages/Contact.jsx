import { useState } from "react";
import { EnvelopeSimple, Phone, MapPin, ChatTeardropText, PaperPlaneTilt, CheckCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    category: "Pertanyaan Umum",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Mohon lengkapi nama, email, dan pesan anda");
      return;
    }
    setSubmitted(true);
    toast.success("Pesan anda berhasil dikirim! Tim CS kami akan menghubungi anda segera.");
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-slate-900 text-white py-16">
        <div className="trx-container text-center max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-3">
            <ChatTeardropText size={16} /> Layanan Pelanggan TREXIO
          </span>
          <h1 className="text-3xl sm:text-4xl font-black">Hubungi Kami</h1>
          <p className="mt-3 text-sm text-slate-300">
            Ada pertanyaan tentang open trip, pembatalan, pemesanan kustom, atau kemitraan organizer? Tim CS TREXIO siap membantu 24/7.
          </p>
        </div>
      </div>

      <div className="trx-container mt-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Contact info cards */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Phone size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Telepon & WhatsApp CS</h3>
                <p className="text-xs text-muted-foreground mt-0.5">+62 812-3456-7890</p>
                <span className="inline-block mt-2 text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                  24 Jam Responsif
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4 pt-4 border-t border-border">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <EnvelopeSimple size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Email Dukungan</h3>
                <p className="text-xs text-muted-foreground mt-0.5">support@trexio.id</p>
                <p className="text-xs text-muted-foreground">partner@trexio.id</p>
              </div>
            </div>

            <div className="flex items-start gap-4 pt-4 border-t border-border">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Kantor Pusat</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Gedung TREXIO Tower Lt. 8, Jl. Adventure No. 45, Jakarta Selatan 12930
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Form */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold mb-2">Kirim Pesan / Tiket Dukungan</h2>
            <p className="text-xs text-muted-foreground mb-6">
              Isi formulir di bawah ini untuk bantuan pemesanan atau kendala teknis.
            </p>

            {submitted ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-8 text-center space-y-3">
                <CheckCircle size={48} className="mx-auto text-emerald-500" />
                <h3 className="text-lg font-bold text-emerald-600">Pesan Terkirim!</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Terima kasih, <strong>{form.name}</strong>. Tiket dukungan kamu telah kami terima dan tim CS TREXIO akan merespons melalui email {form.email}.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 text-xs font-bold text-emerald-600 hover:underline"
                >
                  Kirim pesan lain
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Nama Lengkap *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="budi@example.com"
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Nomor WhatsApp / HP</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="08123456789"
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Kategori Pertanyaan</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-sm"
                    >
                      <option value="Pertanyaan Umum">Pertanyaan Umum</option>
                      <option value="Kendala Pembayaran">Kendala Pembayaran</option>
                      <option value="Perubahan / Reschedule Trip">Perubahan / Reschedule Trip</option>
                      <option value="Kemitraan Vendor / Organizer">Kemitraan Vendor / Organizer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Pesan / Detail Pertanyaan *</label>
                  <textarea
                    rows={4}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tuliskan detail pertanyaan atau kendala kamu..."
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-sm"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <PaperPlaneTilt size={18} /> Kirim Pesan CS
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
