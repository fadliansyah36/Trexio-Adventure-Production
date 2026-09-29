import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import SEO from "@/components/site/SEO";
import TripCard from "@/components/site/TripCard";
import { User, Calendar, ArrowLeft, ShareNetwork, CheckCircle, ShieldCheck, Tag, Eye, MapPin, Storefront } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function ArticleDetail() {
  const { slug, id } = useParams();
  const articleKey = slug || id;

  const [article, setArticle] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/explore/articles/${articleKey}`)
      .then((res) => {
        if (res.data?.ok) {
          setArticle(res.data.article);
          setRelatedProducts(res.data.related_products || []);
          setMetadata(res.data.metadata || null);
        }
      })
      .catch(() => {
        // Fallback
        api.get(`/articles/${articleKey}`)
          .then((r) => setArticle(r.data))
          .catch(() => {});
      })
      .finally(() => setLoading(false));
  }, [articleKey]);

  if (loading) {
    return <div className="trx-container py-20 text-center text-sm text-slate-500">Memuat artikel terverifikasi...</div>;
  }

  if (!article) {
    return (
      <div className="trx-container py-20 text-center space-y-4">
        <h2 className="text-xl font-bold">Artikel Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500">Artikel yang Anda cari tidak tersedia atau telah dipindahkan.</p>
        <Link to="/articles" className="inline-block px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl">
          Kembali ke TREXIO Explore
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-20 bg-slate-50/30 dark:bg-slate-900/30 min-h-screen">
      <SEO
        title={metadata?.title || article.seo_title || article.title}
        description={metadata?.description || article.meta_description || article.excerpt}
        image={article.featured_image || article.cover_image}
        author={article.author_name || article.author || "Tim Redaksi TREXIO"}
        type="article"
        keywords={Array.isArray(article.keywords) ? article.keywords.join(', ') : (article.keywords || 'pendakian, gunung, trexio')}
        jsonLd={metadata?.jsonLd}
      />

      <div className="trx-container pt-8 max-w-4xl">
        <Link to="/articles" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 mb-6 transition">
          <ArrowLeft size={16} /> Kembali ke TREXIO Explore
        </Link>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-3 py-1 text-xs font-extrabold rounded-full">
            {article.category}
          </span>
          {article.source_verified && (
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-3 py-1 text-xs font-extrabold rounded-full flex items-center gap-1">
              <ShieldCheck size={14} /> Sumber Terverifikasi ({article.source_name || "Official"})
            </span>
          )}
        </div>

        <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-slate-900 dark:text-white">
          {article.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-500 border-y border-slate-200 dark:border-slate-700/80 py-3.5 gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <User size={16} className="text-emerald-600" /> {article.author_name || article.author || "Tim Redaksi TREXIO"}
              <span className="text-[10px] text-slate-400 font-normal">({article.author_role || "Content Editor"})</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={16} /> {new Date(article.published_date || article.published_at || article.created_at || Date.now()).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </span>
            {article.views_count > 0 && (
              <span className="flex items-center gap-1">
                <Eye size={16} /> {article.views_count} kali dibaca
              </span>
            )}
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link artikel berhasil disalin!");
            }}
            className="flex items-center gap-1.5 font-bold hover:text-emerald-600 transition"
          >
            <ShareNetwork size={16} /> Bagikan
          </button>
        </div>

        {/* Featured Image */}
        {(article.featured_image || article.cover_image) && (
          <div className="mt-6 rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700">
            <img
              src={article.featured_image || article.cover_image}
              alt={article.title}
              loading="lazy"
              className="w-full h-[380px] md:h-[460px] object-cover"
            />
          </div>
        )}

        {/* Article Body */}
        <div className="mt-8 text-base leading-relaxed space-y-4 text-slate-800 dark:text-slate-200 whitespace-pre-line bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          {article.content}
        </div>

        {/* Contextual Marketplace Inventory Widget */}
        {relatedProducts.length > 0 && (
          <div className="mt-12 p-6 bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Marketplace Terkait</span>
                <h3 className="text-xl font-bold">Open Trip & Layanan di {article.related_destination}</h3>
              </div>
              <Link to="/explore" className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl transition">
                Lihat Semua &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-slate-900">
              {relatedProducts.map((p) => (
                <div key={p.id} className="bg-white rounded-xl p-3 shadow-sm border border-slate-200 flex flex-col justify-between">
                  <div className="space-y-1">
                    <img src={p.image} alt={p.title || p.name} className="w-full h-28 object-cover rounded-lg" />
                    <h4 className="font-bold text-xs line-clamp-2">{p.title || p.name}</h4>
                    <p className="text-[11px] text-emerald-700 font-bold">Rp{(p.price || p.price_per_day || 0).toLocaleString('id-ID')}</p>
                  </div>
                  <Link
                    to={p.price_per_day ? `/rental/${p.id}` : `/trip/${p.id}`}
                    className="mt-3 block text-center py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition"
                  >
                    Pesan Sekarang
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
