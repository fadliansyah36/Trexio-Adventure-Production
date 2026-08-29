import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import SEO from "@/components/site/SEO";
import { BookOpen, Calendar, User, CheckCircle, ShieldCheck } from "@phosphor-icons/react";

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [category, setCategory] = useState("Semua");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/explore/articles")
      .then((res) => {
        if (res.data?.ok && Array.isArray(res.data.articles)) {
          setArticles(res.data.articles);
        } else if (Array.isArray(res.data)) {
          setArticles(res.data);
        }
      })
      .catch(() => {
        // Fallback to legacy route if needed
        api.get("/articles")
          .then((r) => setArticles(Array.isArray(r.data) ? r.data : []))
          .catch(() => {});
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = ["Semua", ...new Set(articles.map((a) => a.category).filter(Boolean))];
  const filtered = category === "Semua" ? articles : articles.filter((a) => a.category === category);

  return (
    <div className="pb-20 bg-slate-50/50 dark:bg-slate-900/50 min-h-screen">
      <SEO
        title="TREXIO Explore — Berita Terverifikasi, Panduan Pendakian, & Outdoor Intelligence"
        description="Jurnal petualangan outdoor, berita keselamatan gunung terverifikasi, dan panduan lengkap pendakian gunung di Indonesia."
        keywords="berita gunung, panduan pendakian, SIMAKSI, guide APGI, sewa alat outdoor, trexio explore"
      />
      <div className="trx-container pt-10">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Content Intelligence
          </span>
          <span className="text-xs text-muted-foreground">&bull; Fact-Checked Articles</span>
        </div>

        <h1 className="mt-2 text-3xl md:text-5xl font-black tracking-tighter">
          TREXIO Explore & News
        </h1>
        <p className="mt-2 text-muted-foreground max-w-2xl text-sm md:text-base">
          Informasi pendakian terverifikasi dari instansi resmi, berita cuaca keselamatan gunung, dan panduan teknis petualangan alam bebas.
        </p>

        {/* Category Filters */}
        <div className="mt-6 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-1.5 text-xs rounded-full font-bold transition-all ${
                category === c
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-white dark:bg-slate-800 text-foreground border border-slate-200 dark:border-slate-700 hover:border-slate-300"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Article Grid */}
        {loading ? (
          <div className="mt-12 text-center text-sm text-slate-500">Memuat artikel terverifikasi...</div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((art) => (
              <Link
                key={art.id}
                to={`/explore/${art.slug || art.id}`}
                className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={art.featured_image || art.cover_image || "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800"}
                    alt={art.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                      {art.category}
                    </span>
                    {art.source_verified && (
                      <span className="bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow">
                        <CheckCircle className="w-3 h-3" /> Terverifikasi
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base md:text-lg group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                      {art.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {art.excerpt}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <User size={14} className="text-emerald-600" /> {art.author_name || art.author || "Redaksi TREXIO"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} /> {new Date(art.published_date || art.published_at || art.created_at || Date.now()).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
