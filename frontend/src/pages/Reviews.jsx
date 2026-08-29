import { Star, CheckCircle, MapPin, ThumbsUp, SealCheck, ShieldCheck } from "@phosphor-icons/react";

export default function Reviews() {
  const reviews = [
    {
      id: 1,
      name: "Rizky Pratama",
      trip: "Open Trip Mount Rinjani 4D3N",
      organizer: "Jejak Rimba Adventure",
      rating: 5,
      date: "12 Juli 2026",
      comment: "Pelayanan sangat memuaskan! Pemandunya ramah, makanan di basecamp & tempat camp melimpah, dan peralatan yang disediakan dalam kondisi prima.",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
      location: "Lombok, NTB",
    },
    {
      id: 2,
      name: "Siti Nurhaliza",
      trip: "Sailing Komodo Premium Phinisi",
      organizer: "Bahari Nusantara",
      rating: 5,
      date: "28 Juni 2026",
      comment: "Kapal phinisi sangat bersih, crew super helpful pas foto-foto di Padar & Pink Beach. Recomended banget booking lewat TREXIO!",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      location: "Labuan Bajo, NTT",
    },
    {
      id: 3,
      name: "Dimas Anggara",
      trip: "Eksplorasi Raja Ampat Wayag",
      organizer: "Papua Wonder",
      rating: 5,
      date: "05 Mei 2026",
      comment: "Pasti bakal langganan terus! Poin pendaftaran & konfirmasi otomatis via dompet TREXIO bikin proses checkout praktis banget.",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80",
      location: "Raja Ampat, Papua Barat",
    },
    {
      id: 4,
      name: "Anita Wijaya",
      trip: "Pendakian Gunung Bromo & Ijen",
      organizer: "Jawa Timur Excursions",
      rating: 4,
      date: "19 April 2026",
      comment: "Pemandangan sunrise Bromo luar biasa. Driver jeep tepat waktu jemput di Malang. Pengalaman berkesan!",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80",
      location: "Probolinggo, Jawa Timur",
    },
  ];

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white py-16">
        <div className="trx-container text-center max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 mb-3">
            <Star size={16} weight="fill" /> Ulasan & Pengalaman Penjelajah
          </div>
          <h1 className="text-3xl sm:text-5xl font-black">Apa Kata Mereka Tentang TREXIO?</h1>
          <p className="mt-3 text-sm text-slate-300">
            Ribuan penjelajah telah membuktikan kemudahan booking open trip & adventure terpercaya melalui platform TREXIO.
          </p>

          <div className="mt-8 flex justify-center items-center gap-8 bg-white/5 border border-white/10 rounded-2xl p-4 max-w-md mx-auto">
            <div>
              <div className="text-3xl font-black text-amber-400">4.9 / 5.0</div>
              <div className="flex justify-center gap-0.5 text-amber-400 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} weight="fill" />
                ))}
              </div>
            </div>
            <div className="border-l border-white/10 pl-6 text-left">
              <div className="text-lg font-bold">3,200+</div>
              <div className="text-xs text-slate-400">Ulasan Terverifikasi</div>
            </div>
          </div>
        </div>
      </div>

      {/* Review cards */}
      <div className="trx-container mt-10 space-y-8">
        {/* Strict Review Policy Notice */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck size={28} weight="fill" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                Garansi Keaslian Ulasan: Kebijakan Strict Verified Finisher
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Di TREXIO, hanya pendaki yang memiliki booking terverifikasi dan telah mengonfirmasi bahwa perjalanan Trip mereka SELESAI yang dapat mengirimkan ulasan & rating. Tidak ada ulasan palsu atau bot.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 text-white font-extrabold text-xs shrink-0 shadow-xs">
            <SealCheck size={18} weight="fill" /> 100% Verified Finisher
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={r.avatar}
                      alt={r.name}
                      className="h-11 w-11 rounded-full object-cover border border-border"
                    />
                    <div>
                      <h3 className="font-bold text-sm flex items-center gap-1.5">
                        {r.name} <CheckCircle size={14} weight="fill" className="text-emerald-500" />
                      </h3>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <MapPin size={12} /> {r.location}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star size={16} weight="fill" />
                    <span className="font-bold text-xs text-foreground">{r.rating}.0</span>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-xl border border-border mb-3">
                  <span className="text-[11px] text-muted-foreground block">Trip yang Diikuti:</span>
                  <strong className="text-xs font-bold text-foreground">{r.trip}</strong>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
                    Organizer: {r.organizer}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed italic relative pl-4 border-l-2 border-emerald-500/50">
                  "{r.comment}"
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Tanggal Trip: {r.date}</span>
                <span className="flex items-center gap-1 text-emerald-600 font-semibold cursor-pointer hover:underline">
                  <ThumbsUp size={12} /> Terbantu (14)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
