import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import SEO from "@/components/site/SEO";
import { ArrowRight, MapPin, Mountains, Compass } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";

export default function Destinations() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/destinations").then((r) => setItems(Array.isArray(r.data) ? r.data : []));
  }, []);

  const filteredItems = (Array.isArray(items) ? items : []).filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return d.name?.toLowerCase().includes(q) || d.region?.toLowerCase().includes(q);
  });

  return (
    <div className="pb-20 bg-slate-50/50 dark:bg-zinc-950 min-h-screen">
      <SEO
        title="Destinasi Pendakian & Wisata Alam Indonesia"
        description="Temukan direktori gunung impian, taman nasional, kawah, dan panduan rute pendakian di seluruh Indonesia."
        keywords="destinasi pendakian, gunung indonesia, rute pendakian, wisata alam, gunung rinjani, bromo, semeru, trexio"
      />
      {/* HEADER BANNER */}
      <section className="bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-900 text-white pt-12 pb-16 border-b border-emerald-900/30">
        <div className="trx-container">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 mb-3">
            <Compass size={16} weight="fill" />
            Eksplorasi Gunung & Destinasi Alam
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Destinasi Pendakian & Wisata Nusantara
          </h1>
          <p className="mt-3 text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Temukan lokasi gunung impian, taman nasional, kawah, dan surga tropis di seluruh penjuru Indonesia.
          </p>

          <div className="mt-6 max-w-md">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama gunung, pulau, atau provinsi..."
              className="bg-white/10 backdrop-blur border-white/20 text-white placeholder:text-slate-400 h-11 px-4 rounded-xl shadow-lg"
            />
          </div>
        </div>
      </section>

      <div className="trx-container pt-10">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-8">
          <div className="text-sm font-semibold text-muted-foreground">
            Menampilkan <span className="text-foreground font-bold">{filteredItems.length}</span> destinasi populer
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 md:gap-6">
          {filteredItems.map((d) => (
            <Link
              key={d.id}
              to={`/explore?q=${encodeURIComponent(d.name)}`}
              data-testid={`dest-card-${d.slug}`}
              className="group block bg-card border border-border/80 rounded-2xl overflow-hidden hover:border-emerald-500/60 hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full"
            >
              <div>
                <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-muted">
                  <img
                    src={d.image}
                    alt={d.name}
                    loading="lazy"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                  <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-emerald-700/95 backdrop-blur text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] font-bold tracking-wider uppercase shadow-xs">
                    {d.region}
                  </span>
                  <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 text-white flex items-center justify-between">
                    <span className="font-extrabold text-xs sm:text-lg flex items-center gap-1 drop-shadow truncate">
                      <Mountains size={16} className="text-emerald-400 shrink-0" /> {d.name}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 sm:p-5">
                  <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {d.description}
                  </p>
                </div>
              </div>

              <div className="px-2.5 pb-2.5 sm:px-5 sm:pb-5 pt-2 sm:pt-3 border-t border-border/50 flex items-center justify-between text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span className="inline-flex items-center gap-1 truncate max-w-[60%]">
                  <MapPin size={12} className="shrink-0" /> {d.region}
                </span>
                <span className="group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5 shrink-0">
                  Lihat Trip <ArrowRight size={12} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

