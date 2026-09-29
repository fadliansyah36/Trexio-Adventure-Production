import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import SEO from "@/components/site/SEO";
import { MapPin, Sun, Calendar, ShieldCheck, ArrowLeft, ArrowRight, Compass } from "@phosphor-icons/react";

export default function DestinationDetail() {
  const { id } = useParams();
  const [dest, setDest] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [dRes, tRes] = await Promise.all([
          api.get(`/destinations`).catch(() => ({ data: [] })),
          api.get(`/trips`).catch(() => ({ data: [] })),
        ]);

        const allD = Array.isArray(dRes.data) ? dRes.data : [];
        const found = allD.find(
          (d) => String(d.id) === String(id) || d.slug === id || d.name.toLowerCase() === id.toLowerCase()
        ) || allD[0];

        setDest(found);

        const allT = Array.isArray(tRes.data) ? tRes.data : [];
        if (found) {
          const matched = allT.filter(
            (t) =>
              t.destination_id === found.id ||
              t.location?.toLowerCase().includes(found.name.toLowerCase()) ||
              t.title?.toLowerCase().includes(found.name.toLowerCase())
          );
          setTrips(matched.length > 0 ? matched : allT.slice(0, 3));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        <p className="mt-3 text-sm text-muted-foreground">Memuat data destinasi...</p>
      </div>
    );
  }

  if (!dest) {
    return (
      <div className="trx-container py-20 text-center">
        <h2 className="text-2xl font-bold">Destinasi tidak ditemukan</h2>
        <Link to="/destinations" className="mt-4 inline-block text-emerald-600 hover:underline">
          &larr; Kembali ke Daftar Destinasi
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <SEO
        title={`Panduan & Trip ${dest.name}`}
        description={dest.description || `Eksplorasi keindahan ${dest.name}. Temukan rute pendakian, cuaca, estimasi biaya, dan paket open trip ${dest.name} di Trexio.`}
        image={dest.image}
        keywords={`destinasi ${dest.name}, trip ${dest.name}, pendakian ${dest.name}, panduan wisata ${dest.name}, trexio`}
      />
      {/* Banner Header */}
      <div className="relative h-80 sm:h-96 w-full overflow-hidden bg-slate-900">
        <img
          src={dest.image}
          alt={dest.name}
          loading="lazy"
          className="h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-black/40 to-black/20" />
        
        <div className="absolute inset-x-0 bottom-0 py-8">
          <div className="trx-container">
            <Link
              to="/destinations"
              className="inline-flex items-center gap-1.5 text-xs text-white/80 hover:text-white mb-3 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md"
            >
              <ArrowLeft size={14} /> Kembali ke Destinasi
            </Link>
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
              <MapPin size={16} weight="fill" /> {dest.region}
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white mt-1">
              {dest.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="trx-container mt-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Overview */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
              <Compass size={22} className="text-emerald-500" /> Tentang {dest.name}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {dest.description}
            </p>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-border text-xs">
              <div>
                <span className="text-muted-foreground block mb-1">Kategori Destinasi</span>
                <strong className="text-foreground text-sm">{dest.category || "Petualangan Alam"}</strong>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Waktu Terbaik Visit</span>
                <strong className="text-foreground text-sm flex items-center gap-1">
                  <Sun size={14} className="text-amber-500" /> Apr - Okt
                </strong>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Aksesibilitas</span>
                <strong className="text-foreground text-sm flex items-center gap-1">
                  <ShieldCheck size={14} className="text-emerald-500" /> Terjangkau & Terpandu
                </strong>
              </div>
            </div>
          </section>

          {/* Related Trips in Destination */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="trx-overline text-emerald-600">Open Trip Pilihan</span>
                <h3 className="text-2xl font-bold">Trip Tersedia di {dest.name}</h3>
              </div>
              <Link
                to={`/explore?q=${encodeURIComponent(dest.name)}`}
                className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
              >
                Lihat Semua <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {trips.map((t) => (
                <Link
                  key={t.id}
                  to={`/trip/${t.id}`}
                  data-testid={`dest-trip-card-${t.id}`}
                  className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <img
                      src={t.image || dest.image}
                      alt={t.title}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-slate-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-sm">
                      {t.category || "Adventure"}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <Calendar size={14} /> {t.duration || "3D2N"}
                    </div>
                    <h4 className="font-bold text-base line-clamp-1 group-hover:text-emerald-600 transition-colors">
                      {t.title}
                    </h4>
                    <div className="mt-3 flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">Mulai dari</span>
                      <span className="text-emerald-600 font-black text-sm">
                        Rp {(t.price || 0).toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold">Butuh Trip Custom?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ingin menjelajahi {dest.name} secara privat bersama grup, kantor, atau keluarga? Kami menyediakan paket custom trip sesuai anggaran & kebutuhanmu.
            </p>
            <Link
              to="/help"
              className="block text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition-all"
            >
              Konsultasi Trip Custom
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
