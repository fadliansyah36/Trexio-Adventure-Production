import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Globe,
  ChartBar,
  ShieldCheck,
  CheckCircle,
  WarningCircle,
  XCircle,
  Sparkle,
  Article,
  MagnifyingGlass,
  Plus,
  Trash,
  PencilSimple,
  ArrowSquareOut,
  Link,
  ArrowClockwise,
  Check,
  Funnel,
  TrendUp,
  Lightbulb,
  FileCode,
  ShieldWarning,
  Eye
} from '@phosphor-icons/react';

export default function SuperSEOControl() {
  const [activeTab, setActiveTab] = useState('overview'); // overview | audit | keywords | articles | sitemaps
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [keywordsData, setKeywordsData] = useState(null);
  const [articles, setArticles] = useState([]);
  const [sources, setSources] = useState([]);

  // Article Modal State
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [articleForm, setArticleForm] = useState({
    title: '',
    slug: '',
    category: 'Adventure News',
    excerpt: '',
    content: '',
    featured_image: '',
    author_name: 'Tim Redaksi TREXIO',
    author_role: 'Outdoor Content Specialist',
    source_name: '',
    source_url: '',
    source_verified: true,
    status: 'published',
    seo_title: '',
    meta_description: '',
    keywords: '',
    related_destination: '',
  });

  // Source Verification State
  const [sourceUrlInput, setSourceUrlInput] = useState('');
  const [verifyingSource, setVerifyingSource] = useState(false);
  const [sourceAnalysis, setSourceAnalysis] = useState(null);

  // AI Draft Generating State
  const [generatingDraft, setGeneratingDraft] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [overviewRes, articlesRes, sourcesRes] = await Promise.all([
        api.get('/super/seo/overview'),
        api.get('/super/seo/articles'),
        api.get('/explore/sources')
      ]);

      if (overviewRes.data?.ok) setOverview(overviewRes.data);
      if (articlesRes.data?.ok) setArticles(articlesRes.data.articles || []);
      if (sourcesRes.data?.ok) setSources(sourcesRes.data.sources || []);
    } catch (err) {
      toast.error('Gagal memuat data SEO Engine: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditData = async () => {
    try {
      const res = await api.get('/super/seo/audit');
      if (res.data?.ok) {
        setAuditData(res.data);
        toast.success('Audit Technical SEO selesai!');
      }
    } catch (err) {
      toast.error('Gagal menjalankan Audit SEO');
    }
  };

  const fetchKeywordsData = async () => {
    try {
      const res = await api.get('/super/seo/keywords');
      if (res.data?.ok) {
        setKeywordsData(res.data);
      }
    } catch (err) {
      toast.error('Gagal memuat data Keyword Intelligence');
    }
  };

  useEffect(() => {
    if (activeTab === 'audit' && !auditData) fetchAuditData();
    if (activeTab === 'keywords' && !keywordsData) fetchKeywordsData();
  }, [activeTab]);

  // SSRF News Verification
  const handleVerifySource = async (e) => {
    e.preventDefault();
    if (!sourceUrlInput) return toast.error('Masukkan URL sumber berita');

    setVerifyingSource(true);
    setSourceAnalysis(null);
    try {
      const res = await api.post('/super/seo/articles/verify-source', { source_url: sourceUrlInput });
      if (res.data?.success) {
        setSourceAnalysis(res.data);
        toast.success(`Sumber ${res.data.domain} terverifikasi (${res.data.analysis.verification_score}/100)`);
      } else {
        toast.error('Gagal verifikasi sumber: ' + (res.data?.error || 'URL tidak valid'));
      }
    } catch (err) {
      toast.error('Gagal memproses verifikasi sumber berita');
    } finally {
      setVerifyingSource(false);
    }
  };

  // AI Draft Generator
  const handleGenerateDraftFromSource = async () => {
    if (!sourceAnalysis) return;
    setGeneratingDraft(true);
    try {
      const res = await api.post('/super/seo/articles/generate-draft', {
        title: sourceAnalysis.analysis.suggested_title,
        category: sourceAnalysis.analysis.suggested_category,
        outline: sourceAnalysis.analysis.suggested_outline,
        facts: sourceAnalysis.analysis.extracted_facts,
        sourceUrl: sourceAnalysis.source_url,
        sourceName: sourceAnalysis.analysis.source_name,
        relatedDestination: sourceAnalysis.analysis.target_keywords[0] || 'Umum',
      });

      if (res.data?.ok && res.data?.draft) {
        const d = res.data.draft;
        setArticleForm({
          title: sourceAnalysis.analysis.suggested_title,
          slug: sourceAnalysis.analysis.suggested_title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          category: sourceAnalysis.analysis.suggested_category || 'Adventure News',
          excerpt: d.excerpt || sourceAnalysis.analysis.suggested_excerpt,
          content: d.content_markdown,
          featured_image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
          author_name: 'Redaksi Kebencanaan & Safety TREXIO',
          author_role: 'Fact-Checked Editor',
          source_name: sourceAnalysis.analysis.source_name,
          source_url: sourceAnalysis.source_url,
          source_verified: true,
          status: 'published',
          seo_title: d.seo_title,
          meta_description: d.meta_description,
          keywords: (d.keywords || []).join(', '),
          related_destination: sourceAnalysis.analysis.target_keywords[0] || '',
        });
        setEditingArticle(null);
        setShowArticleModal(true);
        toast.success('Draf artikel berhasil dibuat oleh AI!');
      }
    } catch (err) {
      toast.error('Gagal menghasilkan draf artikel');
    } finally {
      setGeneratingDraft(false);
    }
  };

  // Article Submit
  const handleSaveArticle = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...articleForm,
        keywords: articleForm.keywords.split(',').map(k => k.trim()).filter(Boolean),
      };

      if (editingArticle) {
        const res = await api.put(`/super/seo/articles/${editingArticle.id}`, payload);
        if (res.data?.ok) {
          toast.success('Artikel berhasil diperbarui');
          setShowArticleModal(false);
          fetchInitialData();
        }
      } else {
        const res = await api.post('/super/seo/articles', payload);
        if (res.data?.ok) {
          toast.success('Artikel baru berhasil disimpan');
          setShowArticleModal(false);
          fetchInitialData();
        }
      }
    } catch (err) {
      toast.error('Gagal menyimpan artikel');
    }
  };

  const handleDeleteArticle = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus artikel ini?')) return;
    try {
      const res = await api.delete(`/super/seo/articles/${id}`);
      if (res.data?.ok) {
        toast.success('Artikel berhasil dihapus');
        fetchInitialData();
      }
    } catch (err) {
      toast.error('Gagal menghapus artikel');
    }
  };

  const openNewArticleModal = () => {
    setEditingArticle(null);
    setArticleForm({
      title: '',
      slug: '',
      category: 'Adventure News',
      excerpt: '',
      content: '',
      featured_image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
      author_name: 'Tim Redaksi TREXIO Explore',
      author_role: 'Outdoor Content Specialist',
      source_name: 'Verified Source',
      source_url: '',
      source_verified: true,
      status: 'published',
      seo_title: '',
      meta_description: '',
      keywords: '',
      related_destination: '',
    });
    setShowArticleModal(true);
  };

  const openEditArticleModal = (art) => {
    setEditingArticle(art);
    setArticleForm({
      title: art.title || '',
      slug: art.slug || '',
      category: art.category || 'Adventure News',
      excerpt: art.excerpt || '',
      content: art.content || '',
      featured_image: art.featured_image || '',
      author_name: art.author_name || '',
      author_role: art.author_role || '',
      source_name: art.source_name || '',
      source_url: art.source_url || '',
      source_verified: Boolean(art.source_verified),
      status: art.status || 'published',
      seo_title: art.seo_title || '',
      meta_description: art.meta_description || '',
      keywords: Array.isArray(art.keywords) ? art.keywords.join(', ') : '',
      related_destination: art.related_destination || '',
    });
    setShowArticleModal(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 rounded-2xl shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkle className="w-6 h-6 text-amber-400 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight">AI SEO & Content Intelligence</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-700/80 text-emerald-200 border border-emerald-500/30">
              SEO & Discovery Intelligence
            </span>
          </div>
          <p className="text-sm text-emerald-100/80 max-w-2xl">
            Pusat kendali Technical SEO, Programmatic Marketplace Routes, Ingest Berita Terverifikasi (SSRF-Safe), dan Analisis Permintaan Kata Kunci Pencarian Pintar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchInitialData}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <ArrowClockwise className="w-4 h-4" /> Refresh Engine
          </button>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold transition"
          >
            <Globe className="w-4 h-4" /> View Sitemap.xml
          </a>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SEO Health Score</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {overview?.seo_health_score || 92}%
            </span>
            <span className="text-xs text-emerald-600 font-medium">Optimal</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${overview?.seo_health_score || 92}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Artikel Explore Published</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50">
              <Article className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {overview?.published_articles || articles.filter(a => a.status === 'published').length}
            </span>
            <span className="text-xs text-slate-500">Artikel Terverifikasi</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Termasuk berita & panduan destinasi</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Audit Critical Issues</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50">
              <ShieldWarning className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {overview?.audit_summary?.critical_issues_count || 0}
            </span>
            <span className="text-xs text-amber-600 font-medium">Isu Perlu Perbaikan</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Dapat diperbaiki otomatis lewat AI Assistant</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Search Demand Gaps</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50">
              <TrendUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {overview?.content_gaps?.length || 2}
            </span>
            <span className="text-xs text-purple-600 font-medium">High Intent</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Kueri pencarian tanpa hasil (Peluang Konten)</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Ringkasan & Intelligence', icon: ChartBar },
          { id: 'audit', label: 'Technical SEO Auditor', icon: ShieldCheck },
          { id: 'keywords', label: 'Search & Keyword Demand', icon: MagnifyingGlass },
          { id: 'articles', label: 'Content Hub & News Ingest', icon: Article },
          { id: 'sitemaps', label: 'Sitemaps & Structured Data', icon: Globe },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium whitespace-nowrap transition ${
                isActive
                  ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & INTELLIGENCE */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Opportunities */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" /> Kata Kunci Berpeluang Tinggi (Search Analytics)
              </h3>
              <button
                onClick={() => setActiveTab('keywords')}
                className="text-xs font-semibold text-emerald-600 hover:underline"
              >
                Lihat Semua &rarr;
              </button>
            </div>

            <div className="space-y-3">
              {(overview?.top_keywords_opportunity || []).map((kw, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      {kw.keyword}
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                        Pos {kw.avg_position}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{kw.action_recommendation}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{kw.impressions} imp</span>
                    <p className="text-[10px] text-emerald-600 font-semibold">{kw.ctr_percent}% CTR</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trusted News Sources */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-500" /> Sumber Berita Terverifikasi (E-E-A-T)
              </h3>
              <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded-full font-semibold">
                SSRF Safe
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Sistem memverifikasi berita outdoor dan kondisi gunung hanya dari domain instansi atau asosiasi resmi terdaftar.
            </p>

            <div className="space-y-3">
              {sources.map((src) => (
                <div key={src.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                      {src.domain.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        {src.name}
                        {src.trusted && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <span className="text-xs text-slate-500">{src.domain} &bull; {src.category}</span>
                    </div>
                  </div>
                  <a
                    href={`https://${src.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Buka ${src.domain}`}
                    className="p-1.5 text-slate-400 hover:text-slate-600"
                  >
                    <ArrowSquareOut className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TECHNICAL SEO AUDITOR */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Pemindaian Technical SEO Live</h3>
              <p className="text-xs text-slate-500">
                Memeriksa keberadaan Meta Title, Description, Canonical URL, OpenGraph Image, dan Structuring Data pada seluruh data riil.
              </p>
            </div>
            <button
              onClick={fetchAuditData}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition"
            >
              <ArrowClockwise className="w-4 h-4" /> Jalankan Audit Sekarang
            </button>
          </div>

          {auditData && (
            <div className="space-y-6">
              {/* Critical Issues */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <h4 className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2 text-sm">
                  <XCircle className="w-5 h-5" /> Isu Kritis ({auditData.critical_issues.length})
                </h4>

                {auditData.critical_issues.length === 0 ? (
                  <p className="text-xs text-emerald-600 font-medium">Tidak ditemukan isu kritis pada seluruh entity!</p>
                ) : (
                  <div className="space-y-3">
                    {auditData.critical_issues.map((issue) => (
                      <div key={issue.id} className="p-4 bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-600 text-white">
                              {issue.type}
                            </span>
                            <span className="font-bold text-sm text-slate-900 dark:text-white">{issue.title}</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{issue.message}</p>
                          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mt-2 flex items-center gap-1">
                            <Sparkle className="w-3.5 h-3.5" /> Solusi AI: {issue.fix_recommendation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Warnings */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                <h4 className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2 text-sm">
                  <WarningCircle className="w-5 h-5" /> Peringatan Potensi Masalah ({auditData.warnings.length})
                </h4>

                <div className="space-y-3">
                  {auditData.warnings.map((warn) => (
                    <div key={warn.id} className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500 text-slate-900">
                          {warn.type}
                        </span>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{warn.title}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{warn.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: KEYWORD INTELLIGENCE */}
      {activeTab === 'keywords' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MagnifyingGlass className="w-5 h-5 text-emerald-600" /> Analisis Kata Kunci Mesin Pencarian Real-Time
            </h3>
            <p className="text-xs text-slate-500">
              Data ini diimpor secara langsung dari kueri riil pengguna pada fitur AI Smart Search dan transaksi transaksi marketplace TREXIO.
            </p>

            {keywordsData && (
              <div className="space-y-6 mt-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 uppercase font-bold">
                      <tr>
                        <th className="p-3 rounded-l-xl">Keyword</th>
                        <th className="p-3">Search Volume</th>
                        <th className="p-3">Impressions</th>
                        <th className="p-3">CTR</th>
                        <th className="p-3">Avg Position</th>
                        <th className="p-3 rounded-r-xl">Aksi Rekomendasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {keywordsData.high_opportunity_keywords.map((kw, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">{kw.keyword}</td>
                          <td className="p-3 font-medium">{kw.search_volume}/bln</td>
                          <td className="p-3">{kw.impressions}</td>
                          <td className="p-3 font-bold text-emerald-600">{kw.ctr_percent}%</td>
                          <td className="p-3 font-bold">{kw.avg_position}</td>
                          <td className="p-3 text-slate-500">{kw.action_recommendation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Supply Gaps */}
                <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-2xl space-y-3">
                  <h4 className="font-bold text-sm text-purple-900 dark:text-purple-300 flex items-center gap-2">
                    <Sparkle className="w-4 h-4 text-purple-600" /> Supply & Content Gaps (Peluang Pasar Baru)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {keywordsData.content_gaps.map((cg, idx) => (
                      <div key={idx} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-purple-100 dark:border-purple-900">
                        <div className="font-bold text-xs text-slate-900 dark:text-white">{cg.keyword}</div>
                        <p className="text-[11px] text-slate-500 mt-1">{cg.supply_status}</p>
                        <p className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 mt-1">&rarr; {cg.action_recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CONTENT HUB & NEWS INGESTION */}
      {activeTab === 'articles' && (
        <div className="space-y-6">
          {/* SSRF Safe Ingestion Box */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Fact-Checked News Ingestion Tool</h3>
              </div>
              <span className="text-xs bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-2.5 py-0.5 rounded-full font-semibold">
                SSRF-Protected Crawler
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Masukkan URL berita dari instansi resmi (seperti BMKG, BTNGR, Kemenparekraf). AI akan memeriksa fakta, menghitung skor autentisitas, serta menghasilkan draf artikel original.
            </p>

            <form onSubmit={handleVerifySource} className="flex gap-2">
              <input
                type="url"
                value={sourceUrlInput}
                onChange={(e) => setSourceUrlInput(e.target.value)}
                placeholder="https://rinjaninationalpark.id/berita-resmi-2026"
                className="flex-1 px-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={verifyingSource}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 disabled:opacity-50 transition"
              >
                {verifyingSource ? <ArrowClockwise className="w-4 h-4 animate-spin" /> : <Sparkle className="w-4 h-4" />}
                Verifikasi Sumber
              </button>
            </form>

            {/* Analysis Result */}
            {sourceAnalysis && (
              <div className="p-4 bg-slate-900/90 border border-slate-700 rounded-xl space-y-3 mt-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-sm">
                    <CheckCircle className="w-4 h-4" /> {sourceAnalysis.analysis.source_name}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800">
                    Verifikasi Score: {sourceAnalysis.analysis.verification_score}/100
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-slate-400">Fakta Terkstrak:</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-200 mt-1">
                    {sourceAnalysis.analysis.extracted_facts.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Rekomendasi Judul TREXIO: <strong className="text-white">{sourceAnalysis.analysis.suggested_title}</strong></span>
                  <button
                    onClick={handleGenerateDraftFromSource}
                    disabled={generatingDraft}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold rounded-lg flex items-center gap-1.5 transition"
                  >
                    {generatingDraft ? <ArrowClockwise className="w-3.5 h-3.5 animate-spin" /> : <Sparkle className="w-3.5 h-3.5" />}
                    Buat Draf Artikel AI
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Article List Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Daftar Artikel TREXIO Explore ({articles.length})</h3>
            <button
              onClick={openNewArticleModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" /> Tambah Artikel Manual
            </button>
          </div>

          {/* Articles Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 uppercase font-bold">
                  <tr>
                    <th className="p-4">Judul Artikel</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4">Sumber Berita</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Views</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {articles.map((art) => (
                    <tr key={art.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                      <td className="p-4 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                        {art.title}
                      </td>
                      <td className="p-4 font-medium">{art.category}</td>
                      <td className="p-4">
                        <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          {art.source_name}
                          {art.source_verified && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          art.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {art.status}
                        </span>
                      </td>
                      <td className="p-4 font-bold">{art.views_count || 0}</td>
                      <td className="p-4 text-right space-x-2">
                        <a
                          href={`/explore/${art.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-emerald-600 inline-block"
                          title="Lihat Halaman Artikel"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => openEditArticleModal(art)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 inline-block"
                          title="Edit Artikel"
                        >
                          <PencilSimple className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteArticle(art.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 inline-block"
                          title="Hapus Artikel"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SITEMAPS & STRUCTURED DATA */}
      {activeTab === 'sitemaps' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCode className="w-5 h-5 text-emerald-600" /> Sitemaps XML Tergenerasi
            </h3>
            <p className="text-xs text-slate-500">
              Setiap perubahan paket trip, sewa alat, maupun artikel berita secara langsung diperbarui dalam file sitemap resmi.
            </p>

            <div className="space-y-3">
              {[
                { name: 'Root Sitemap Index', path: '/sitemap.xml', desc: 'Indeks utama sitemap untuk Google Search Console' },
                { name: 'Products & Rentals Sitemap', path: '/sitemap-products.xml', desc: 'Paket Open Trip dan Sewa Peralatan' },
                { name: 'Destinations & Programmatic SEO', path: '/sitemap-destinations.xml', desc: 'Rute destinasi dan keyword lokasi' },
                { name: 'Articles Sitemap', path: '/sitemap-articles.xml', desc: 'Artikel portal TREXIO Explore' },
                { name: 'Google News Sitemap', path: '/news-sitemap.xml', desc: 'Format khusus Google News <news:news>' },
                { name: 'Robots.txt Engine', path: '/robots.txt', desc: 'Aturan crawler dan indeksation' },
              ].map((sm, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">{sm.name}</div>
                    <span className="text-[11px] text-slate-500">{sm.desc}</span>
                  </div>
                  <a
                    href={sm.path}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-emerald-600 hover:text-emerald-700 font-bold text-xs flex items-center gap-1"
                  >
                    Buka <ArrowSquareOut className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" /> Validation & Google Search Console
            </h3>
            <p className="text-xs text-slate-500">
              Gunakan alat validasi resmi Google untuk memeriksa kelayakan JSON-LD Structured Data dan sitemap.
            </p>

            <div className="space-y-3">
              <a
                href="https://search.google.com/test/rich-results"
                target="_blank"
                rel="noreferrer"
                className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl block hover:bg-blue-100 transition"
              >
                <div className="font-bold text-xs text-blue-900 dark:text-blue-300 flex items-center justify-between">
                  <span>Google Rich Results Test</span>
                  <ArrowSquareOut className="w-4 h-4" />
                </div>
                <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-1">Uji kelayakan schema Product, Offer, dan NewsArticle.</p>
              </a>

              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noreferrer"
                className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl block hover:bg-emerald-100 transition"
              >
                <div className="font-bold text-xs text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
                  <span>Google Search Console Dashboard</span>
                  <ArrowSquareOut className="w-4 h-4" />
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">Kirimkan URL sitemap.xml dan pantau performa indeksasi.</p>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ARTICLE MODAL */}
      {showArticleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {editingArticle ? 'Edit Artikel TREXIO Explore' : 'Tambah Artikel Baru'}
              </h3>
              <button
                onClick={() => setShowArticleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Judul Artikel *</label>
                  <input
                    type="text"
                    required
                    value={articleForm.title}
                    onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Kategori *</label>
                  <select
                    value={articleForm.category}
                    onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Adventure News">Adventure News</option>
                    <option value="Destination Guide">Destination Guide</option>
                    <option value="Gear Guide">Gear Guide</option>
                    <option value="Safety">Safety & Emergency</option>
                    <option value="Hiking Education">Hiking Education</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ringkasan Excerpt *</label>
                <textarea
                  rows={2}
                  required
                  value={articleForm.excerpt}
                  onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Isi Artikel (Markdown) *</label>
                <textarea
                  rows={10}
                  required
                  value={articleForm.content}
                  onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">SEO Title (Max 60 Karakter)</label>
                  <input
                    type="text"
                    value={articleForm.seo_title}
                    onChange={(e) => setArticleForm({ ...articleForm, seo_title: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Meta Description (Max 155 Karakter)</label>
                  <input
                    type="text"
                    value={articleForm.meta_description}
                    onChange={(e) => setArticleForm({ ...articleForm, meta_description: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Keywords (Pisahkan Komma)</label>
                  <input
                    type="text"
                    value={articleForm.keywords}
                    onChange={(e) => setArticleForm({ ...articleForm, keywords: e.target.value })}
                    placeholder="Gunung Prau, SIMAKSI, Guide APGI"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Destinasi Terkait</label>
                  <input
                    type="text"
                    value={articleForm.related_destination}
                    onChange={(e) => setArticleForm({ ...articleForm, related_destination: e.target.value })}
                    placeholder="Gunung Prau"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowArticleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                >
                  Simpan Artikel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
