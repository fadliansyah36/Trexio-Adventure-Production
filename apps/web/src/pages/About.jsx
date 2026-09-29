import { Users, MapTrifold, ShieldCheck, Trophy, Sparkle, Heart } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import SEO from "@/components/site/SEO";
import { TrexioLogo } from "@/components/site/TrexioLogo";

export default function About() {
  const stats = [
    { label: "Penjelajah Aktif", value: "15,000+", icon: Users },
    { label: "Destinasi Indonesia", value: "180+", icon: MapTrifold },
    { label: "Organizer Terverifikasi", value: "450+", icon: ShieldCheck },
    { label: "Trip Sukses", value: "8,200+", icon: Trophy },
  ];

  const values = [
    {
      title: "Transparansi Sepenuhnya",
      desc: "Semua rincian fasilitas, kuota peserta, lokasi meeting point, dan biaya dijelaskan secara terbuka tanpa biaya tersembunyi.",
      icon: Sparkle,
    },
    {
      title: "Organizer Terverifikasi Identitas",
      desc: "Tiap open trip diselenggarakan oleh vendor / merchant terverifikasi dengan lisensi pemandu wisata profesional.",
      icon: ShieldCheck,
    },
    {
      title: "Dampak Positif Komunitas Lokal",
      desc: "Memberdayakan pemandu lokal, porter daerah, armada transportasi lokal, serta mendukung ekonomi UMKM destinasi.",
      icon: Heart,
    },
  ];

  return (
    <div className="pb-24">
      <SEO
        title="Tentang TREXIO — Adventure Marketplace"
        description="TREXIO adalah ekosistem marketplace petualangan terbuka yang menghubungkan penjelajah dengan organizer trip, rental gear, dan pemandu lokal profesional."
        keywords="tentang trexio, marketplace outdoor, open trip marketplace, petualangan indonesia"
      />
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-background text-white py-20">
        <div className="trx-container text-center max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-4">
            <TrexioLogo variant="icon" size="xs" /> Tentang TREXIO
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Menghubungkan Penjelajah dengan Pesona Nusantara
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            TREXIO adalah marketplace open trip & adventure booking terdepan di Indonesia. Kami hadir untuk mempermudah petualang menemukan pengalaman outdoor aman, transparan, dan berkesan.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="trx-container -mt-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-card border border-border rounded-2xl p-6 shadow-md">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="text-center p-3">
                <Icon size={28} className="mx-auto text-emerald-500 mb-2" />
                <div className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Mission & Values */}
      <div className="trx-container mt-16 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="trx-overline text-emerald-600">Misi Kami</span>
            <h2 className="text-2xl sm:text-4xl font-black mt-2">
              Demokratisasi Akses Petualangan Outdoor di Indonesia
            </h2>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Kami percaya bahwa menjelajahi gunung, pulau, dan rimba raya Indonesia seharusnya tidak rumit. Melalui teknologi terintegrasi, sistem kuota real-time, pembayaran aman, serta dukungan komunitas terpercaya, TREXIO memberi keberanian bagi siapapun untuk mulai melangkah.
            </p>
            <div className="mt-6">
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-3 rounded-xl transition-all"
              >
                Mulai Petualanganmu Sekarang
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-900 to-slate-900 rounded-3xl p-8 text-white">
            <h3 className="text-xl font-bold mb-6">Mengapa TREXIO?</h3>
            <div className="space-y-6">
              {values.map((v, idx) => {
                const Icon = v.icon;
                return (
                  <div key={idx} className="flex gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{v.title}</h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{v.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
