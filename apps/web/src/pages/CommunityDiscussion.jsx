import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import SEO from "@/components/site/SEO";
import VendorVerifiedBadge from "@/components/site/VendorVerifiedBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  ChatCircleDots,
  Plus,
  MagnifyingGlass,
  Heart,
  BookmarkSimple,
  ShareNetwork,
  DotsThreeVertical,
  Flag,
  Trash,
  PencilSimple,
  MapPin,
  Compass,
  Mountains,
  UsersThree,
  Package,
  HouseLine,
  UserCheck,
  Tent,
  Sparkle,
  Eye,
  LockKey,
  ShieldCheck,
  Storefront,
  ArrowRight,
  SlidersHorizontal,
  CheckCircle,
} from "@phosphor-icons/react";

const ICON_MAP = {
  Mountains: Mountains,
  Compass: Compass,
  MapPin: MapPin,
  UsersThree: UsersThree,
  Package: Package,
  HouseLine: HouseLine,
  UserCheck: UserCheck,
  Tent: Tent,
  Sparkle: Sparkle,
  ChatCircleDots: ChatCircleDots,
};

export default function CommunityDiscussion() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const activeTab = searchParams.get("tab") || "all"; // 'all', 'my_posts', 'saved'
  const activeCategory = searchParams.get("category") || "all";
  const searchQuery = searchParams.get("q") || "";
  const sortBy = searchParams.get("sort") || "latest";

  // Modal / Detail States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyingToParentId, setReplyingToParentId] = useState(null);

  // Create Form State
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState("pendakian");
  const [formImage, setFormImage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Report Modal State
  const [reportTarget, setReportTarget] = useState(null); // { type: 'post'|'comment', id: string }
  const [reportReason, setReportReason] = useState("Spam & Iklan Berlebihan");
  const [reportDetails, setReportDetails] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  // Edit Modal State
  const [editingPost, setEditingPost] = useState(null);

  // Load Categories
  useEffect(() => {
    api
      .get("/community-categories")
      .then((r) => setCategories(Array.isArray(r.data) ? r.data : []))
      .catch(() => setCategories([]));
  }, []);

  // Load Posts Feed
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (activeCategory !== "all") params.set("category", activeCategory);
      if (activeTab === "my_posts") params.set("my_posts", "true");
      if (activeTab === "saved") params.set("saved_only", "true");
      if (sortBy) params.set("sort", sortBy);

      const { data } = await api.get(`/community-posts?${params.toString()}`);
      setPosts(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, activeCategory, searchQuery, sortBy]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Load Comments for Selected Post
  const fetchComments = async (postId) => {
    setLoadingComments(true);
    try {
      const { data } = await api.get(`/community-posts/${postId}`);
      if (data?.post) setSelectedPost(data.post);
      if (data?.comments) setComments(data.comments);
    } catch (e) {
      toast.error("Gagal memuat detail diskusi");
    } finally {
      setLoadingComments(false);
    }
  };

  const handleOpenDetail = (post) => {
    setSelectedPost(post);
    fetchComments(post.id);
  };

  // Submit New Post
  const handleCreatePost = async () => {
    if (!user) {
      toast.info("Silakan login terlebih dahulu untuk membuat diskusi");
      return nav("/login?next=/community");
    }
    if (!formContent.trim()) {
      return toast.error("Isi diskusi tidak boleh kosong");
    }

    setSubmitting(true);
    try {
      await api.post("/community-posts", {
        title: formTitle,
        content: formContent,
        category_slug: formCategory,
        image: formImage,
      });

      toast.success("Diskusi Anda berhasil dipublikasikan!");
      setFormTitle("");
      setFormContent("");
      setFormImage("");
      setShowCreateModal(false);
      fetchPosts();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setSubmitting(false);
    }
  };

  // Like Toggle
  const handleLike = async (postId, e) => {
    if (e) e.stopPropagation();
    if (!user) return nav("/login?next=/community");

    try {
      const { data } = await api.post(`/community-posts/${postId}/like`);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, liked: data.liked, likes_count: data.likes }
            : p
        )
      );
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost((prev) => ({
          ...prev,
          liked: data.liked,
          likes_count: data.likes,
        }));
      }
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  // Bookmark Toggle
  const handleBookmark = async (postId, e) => {
    if (e) e.stopPropagation();
    if (!user) return nav("/login?next=/community");

    try {
      const { data } = await api.post(`/community-posts/${postId}/bookmark`);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, bookmarked: data.bookmarked } : p
        )
      );
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost((prev) => ({ ...prev, bookmarked: data.bookmarked }));
      }
      toast.success(
        data.bookmarked
          ? "Diskusi disimpan ke koleksi Anda"
          : "Diskusi dihapus dari koleksi"
      );
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  // Submit Comment
  const handleAddComment = async () => {
    if (!user) return nav("/login?next=/community");
    if (!replyText.trim() || !selectedPost) return;

    try {
      const { data } = await api.post(
        `/community-posts/${selectedPost.id}/comments`,
        {
          content: replyText,
          parent_id: replyingToParentId,
        }
      );

      setComments((prev) => [...prev, data]);
      setReplyText("");
      setReplyingToParentId(null);
      setSelectedPost((prev) => ({
        ...prev,
        comments_count: (prev.comments_count || 0) + 1,
      }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === selectedPost.id
            ? { ...p, comments_count: (p.comments_count || 0) + 1 }
            : p
        )
      );
      toast.success("Komentar terkirim");
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  // Delete Post
  const handleDeletePost = async (postId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Hapus diskusi ini secara permanen?")) return;

    try {
      await api.delete(`/community-posts/${postId}`);
      toast.success("Diskusi berhasil dihapus");
      if (selectedPost && selectedPost.id === postId) setSelectedPost(null);
      fetchPosts();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  // Report Content Submit
  const handleReportSubmit = async () => {
    if (!reportTarget) return;
    setSubmittingReport(true);
    try {
      await api.post("/community-reports", {
        target_type: reportTarget.type,
        target_id: reportTarget.id,
        reason: reportReason,
        details: reportDetails,
      });
      toast.success(
        "Laporan Anda telah dikirim dan akan ditinjau oleh Moderasi TREXIO."
      );
      setReportTarget(null);
      setReportDetails("");
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setSubmittingReport(false);
    }
  };

  // Share link
  const handleShare = (post, e) => {
    if (e) e.stopPropagation();
    const url = `${window.location.origin}/community?post=${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success("Tautan diskusi berhasil disalin ke clipboard!");
    }
  };

  const updateSearchParam = (key, val) => {
    const newParams = new URLSearchParams(searchParams);
    if (val && val !== "all") newParams.set(key, val);
    else newParams.delete(key);
    setSearchParams(newParams);
  };

  return (
    <div className="pb-20 min-h-screen bg-[hsl(var(--muted))]">
      <SEO
        title="Forum Komunitas & Diskusi Petualang"
        description="Diskusi jalur pendakian, info simaksi, rekomendasi gear, open trip, dan tanya jawab sesama hiker nusantara di Trexio Community."
        keywords="forum pendaki, diskusi gunung, info simaksi, kawan trip, komunitas outdoor"
      />

      {/* Header Banner */}
      <div className="bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] py-8 px-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
              <UsersThree size={16} weight="fill" /> TREXIO PETUALANG COMMUNITY
            </div>
            <h1 className="mt-1 text-2xl md:text-4xl font-black tracking-tight">
              Forum Diskusi & Tanya Jawab Outdoor
            </h1>
            <p className="mt-2 text-sm text-neutral-300 max-w-2xl">
              Berbagi pengalaman pendakian, tanya jawab jalur & simaksi, ulasan
              gear, serta terhubung langsung dengan Verified Partner & Official
              Guide TREXIO.
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            data-testid="btn-create-discussion"
            className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white font-extrabold px-6 py-3 rounded-xl shadow-lg shrink-0 gap-2 text-sm"
          >
            <Plus size={18} weight="bold" /> Buat Diskusi Baru
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Left Sidebar Filters */}
        <aside className="space-y-6">
          {/* Main Navigation Tabs */}
          <div className="bg-white border border-border rounded-2xl p-3 shadow-xs space-y-1">
            <button
              onClick={() => updateSearchParam("tab", "all")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "all"
                  ? "bg-[hsl(var(--secondary))] text-white shadow-xs"
                  : "text-muted-foreground hover:bg-neutral-100 hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <ChatCircleDots size={16} weight="bold" /> Semua Diskusi
              </span>
            </button>
            {user && (
              <>
                <button
                  onClick={() => updateSearchParam("tab", "my_posts")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "my_posts"
                      ? "bg-[hsl(var(--secondary))] text-white shadow-xs"
                      : "text-muted-foreground hover:bg-neutral-100 hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <PencilSimple size={16} weight="bold" /> Diskusi Saya
                  </span>
                </button>
                <button
                  onClick={() => updateSearchParam("tab", "saved")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === "saved"
                      ? "bg-[hsl(var(--secondary))] text-white shadow-xs"
                      : "text-muted-foreground hover:bg-neutral-100 hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <BookmarkSimple size={16} weight="bold" /> Disimpan
                  </span>
                </button>
              </>
            )}
            <Link
              to="/communities"
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all"
            >
              <span className="flex items-center gap-2">
                <UsersThree size={16} weight="bold" /> Klub & Komunitas
              </span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Topik & Kategori */}
          <div className="bg-white border border-border rounded-2xl p-4 shadow-xs">
            <div className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
              <span>Topik Diskusi</span>
              {activeCategory !== "all" && (
                <button
                  onClick={() => updateSearchParam("category", "all")}
                  className="text-[10px] text-emerald-600 font-bold hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="space-y-1">
              <button
                onClick={() => updateSearchParam("category", "all")}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                  activeCategory === "all"
                    ? "bg-emerald-50 text-emerald-700 font-black border border-emerald-200"
                    : "text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                <span>Semua Topik</span>
              </button>
              {categories.map((cat) => {
                const IconComp = ICON_MAP[cat.icon] || ChatCircleDots;
                const isSelected = activeCategory === cat.slug;
                return (
                  <button
                    key={cat.id}
                    onClick={() => updateSearchParam("category", cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-700 font-black border border-emerald-200"
                        : "text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    <IconComp size={15} className={isSelected ? "text-emerald-600" : "text-neutral-400"} />
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Content Feed Area */}
        <main className="space-y-4">
          {/* Top Search & Sorting Toolbar */}
          <div className="bg-white border border-border rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <MagnifyingGlass
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <Input
                type="text"
                placeholder="Cari topik, nama gunung, simaksi, atau gear..."
                value={searchQuery}
                onChange={(e) => updateSearchParam("q", e.target.value)}
                className="pl-9 pr-4 py-2 text-xs rounded-xl bg-neutral-50 border-border"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                <SlidersHorizontal size={14} /> Urutkan:
              </span>
              <select
                value={sortBy}
                onChange={(e) => updateSearchParam("sort", e.target.value)}
                className="text-xs font-bold bg-neutral-50 border border-border rounded-xl px-3 py-1.5 focus:outline-hidden"
              >
                <option value="latest">Terbaru</option>
                <option value="popular">Terpopuler</option>
                <option value="comments">Diskusi Terbanyak</option>
              </select>
            </div>
          </div>

          {/* Posts Feed */}
          {loading ? (
            <div className="bg-white border border-border rounded-2xl p-12 text-center text-muted-foreground font-bold text-sm">
              Memuat diskusi komunitas...
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white border border-border rounded-2xl p-12 text-center space-y-3">
              <ChatCircleDots size={48} className="mx-auto text-neutral-300" />
              <h3 className="text-base font-bold text-foreground">
                Belum Ada Diskusi
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {activeTab === "saved"
                  ? "Anda belum menyimpan diskusi apapun. Tandai diskusi yang bermanfaat untuk dibaca kembali."
                  : activeTab === "my_posts"
                  ? "Anda belum membuat diskusi. Mulai tanya atau bagikan cerita perjalanan Anda!"
                  : "Belum ada diskusi untuk topik ini. Jadilah yang pertama memulai obrolan!"}
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                size="sm"
                className="bg-[hsl(var(--primary))] text-white font-bold rounded-xl text-xs gap-1.5"
              >
                <Plus size={16} /> Mulai Diskusi
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => {
                const isOwner = user?.id === post.user_id;
                return (
                  <article
                    key={post.id}
                    onClick={() => handleOpenDetail(post)}
                    className="bg-white border border-border rounded-2xl p-5 shadow-2xs hover:border-emerald-400 transition-all cursor-pointer relative group"
                  >
                    {/* Author & Header Info */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {post.user_avatar ? (
                            <img
                              src={post.user_avatar}
                              alt={post.user_name}
                              className="h-10 w-10 rounded-full object-cover border border-border"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-[hsl(var(--secondary))] text-white grid place-items-center font-black text-sm">
                              {(post.vendor_name || post.user_name || "P")[0].toUpperCase()}
                            </div>
                          )}
                          {post.vendor_verified && (
                            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5" title="Verified Partner">
                              <CheckCircle size={10} weight="fill" />
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-foreground">
                              {post.vendor_name || post.user_name}
                            </span>
                            {post.vendor_name && (
                              <Badge variant="outline" className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border-emerald-200">
                                Official Partner
                              </Badge>
                            )}
                            {post.category_name && (
                              <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 text-[10px] font-extrabold">
                                {post.category_name}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(post.created_at).toLocaleString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Dropdown Options */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" aria-label="Opsi Diskusi" className="h-8 w-8 p-0 rounded-lg text-neutral-400 hover:text-foreground">
                              <DotsThreeVertical size={18} weight="bold" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            {isOwner && (
                              <DropdownMenuItem
                                onClick={(e) => handleDeletePost(post.id, e)}
                                className="text-rose-600 focus:text-rose-600 font-bold"
                              >
                                <Trash size={14} className="mr-2" /> Hapus Diskusi
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setReportTarget({ type: "post", id: post.id })}
                              className="text-amber-600 focus:text-amber-600 font-bold"
                            >
                              <Flag size={14} className="mr-2" /> Laporkan Diskusi
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Title & Body */}
                    <h2 className="mt-3.5 text-base font-black tracking-tight text-foreground group-hover:text-emerald-700 transition-colors">
                      {post.title}
                    </h2>
                    <p className="mt-1.5 text-xs text-neutral-600 leading-relaxed whitespace-pre-wrap line-clamp-3">
                      {post.content}
                    </p>

                    {/* Image Attachment Preview */}
                    {post.image && (
                      <div className="mt-3 rounded-xl overflow-hidden max-h-72 border border-border bg-neutral-100">
                        <img
                          src={post.image}
                          alt="Lampiran Diskusi"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Bottom Action Footer */}
                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-bold">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={(e) => handleLike(post.id, e)}
                          className={`inline-flex items-center gap-1.5 transition-colors ${
                            post.liked ? "text-rose-600 font-black" : "hover:text-foreground"
                          }`}
                        >
                          <Heart size={16} weight={post.liked ? "fill" : "bold"} />
                          <span>{post.likes_count || 0}</span>
                        </button>

                        <span className="inline-flex items-center gap-1.5 hover:text-foreground">
                          <ChatCircleDots size={16} weight="bold" />
                          <span>{post.comments_count || 0} Tanggapan</span>
                        </span>

                        <span className="inline-flex items-center gap-1.5 text-neutral-400">
                          <Eye size={15} />
                          <span>{post.view_count || 1}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleBookmark(post.id, e)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            post.bookmarked
                              ? "text-emerald-600 bg-emerald-50"
                              : "hover:bg-neutral-100 text-neutral-400"
                          }`}
                          title={post.bookmarked ? "Tersimpan" : "Simpan"}
                        >
                          <BookmarkSimple
                            size={16}
                            weight={post.bookmarked ? "fill" : "bold"}
                          />
                        </button>
                        <button
                          onClick={(e) => handleShare(post, e)}
                          className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400"
                          title="Bagikan Tautan"
                        >
                          <ShareNetwork size={16} weight="bold" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* CREATE DISCUSSION MODAL */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black tracking-tight flex items-center gap-2">
              <ChatCircleDots size={22} className="text-emerald-600" />
              Mulai Diskusi Baru
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-xs py-2">
            <div>
              <Label className="text-xs font-bold mb-1.5 block">Topik / Kategori</Label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full text-xs font-bold bg-neutral-50 border border-border rounded-xl p-2.5 focus:outline-hidden"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold mb-1.5 block">Judul Diskusi</Label>
              <Input
                placeholder="Contoh: Info Kuota Simaksi Gunung Rinjani Agustus 2026..."
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs font-bold mb-1.5 block">Isi Pertanyaan / Cerita</Label>
              <Textarea
                rows={5}
                placeholder="Tulis detail pertanyaan, kondisi jalur, atau pengalaman perjalananmu di sini..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs font-bold mb-1.5 block">URL Foto / Lampiran (Opsional)</Label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={formImage}
                onChange={(e) => setFormImage(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateModal(false)}
              className="text-xs rounded-xl font-bold"
            >
              Batal
            </Button>
            <Button
              onClick={handleCreatePost}
              disabled={submitting}
              size="sm"
              className="bg-[hsl(var(--primary))] text-white font-bold rounded-xl text-xs gap-1.5"
            >
              {submitting ? "Mempublikasikan..." : "Publikasikan Diskusi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DETAIL POST & COMMENTS DRAWER/MODAL */}
      <Dialog
        open={!!selectedPost}
        onOpenChange={(open) => !open && setSelectedPost(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-6">
          {selectedPost && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[hsl(var(--secondary))] text-white grid place-items-center font-black text-sm">
                    {(selectedPost.vendor_name || selectedPost.user_name || "P")[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">
                        {selectedPost.vendor_name || selectedPost.user_name}
                      </span>
                      {selectedPost.vendor_name && (
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 font-extrabold">
                          Official Partner
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(selectedPost.created_at).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px] font-bold">
                  {selectedPost.category_name}
                </Badge>
              </div>

              {/* Body Content */}
              <div>
                <h2 className="text-lg font-black tracking-tight text-foreground">
                  {selectedPost.title}
                </h2>
                <p className="mt-3 text-xs text-neutral-700 leading-relaxed whitespace-pre-wrap">
                  {selectedPost.content}
                </p>
                {selectedPost.image && (
                  <img
                    src={selectedPost.image}
                    alt="Lampiran"
                    className="mt-4 rounded-xl w-full max-h-80 object-cover border border-border"
                  />
                )}
              </div>

              {/* Likes & Stats */}
              <div className="flex items-center gap-4 py-2 border-y border-border text-xs font-bold text-muted-foreground">
                <button
                  onClick={() => handleLike(selectedPost.id)}
                  className={`inline-flex items-center gap-1.5 ${
                    selectedPost.liked ? "text-rose-600 font-black" : ""
                  }`}
                >
                  <Heart size={18} weight={selectedPost.liked ? "fill" : "bold"} />
                  <span>{selectedPost.likes_count || 0} Suka</span>
                </button>
                <span className="inline-flex items-center gap-1.5">
                  <ChatCircleDots size={18} weight="bold" />
                  <span>{comments.length} Tanggapan</span>
                </span>
              </div>

              {/* Reply Input Box */}
              <div className="bg-neutral-50 border border-border rounded-xl p-3.5 space-y-2">
                <div className="text-xs font-bold text-foreground">Tulis Tanggapan Anda:</div>
                <Textarea
                  rows={3}
                  placeholder="Tulis balasan atau jawaban membantu..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="text-xs bg-white rounded-xl"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddComment}
                    size="sm"
                    className="bg-[hsl(var(--primary))] text-white font-bold rounded-xl text-xs"
                  >
                    Kirim Balasan
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Diskusi & Balasan ({comments.length})
                </h3>
                {loadingComments ? (
                  <div className="text-xs text-muted-foreground">Memuat komentar...</div>
                ) : comments.length === 0 ? (
                  <div className="text-xs text-neutral-400 italic py-4 text-center">
                    Belum ada komentar. Jadilah yang pertama menanggapi!
                  </div>
                ) : (
                  comments.map((comm) => (
                    <div key={comm.id} className="bg-white border border-border rounded-xl p-3.5 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">
                            {comm.vendor_name || comm.user_name}
                          </span>
                          {comm.vendor_name && (
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-md">
                              Partner
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(comm.created_at).toLocaleString("id-ID")}
                        </span>
                      </div>
                      <p className="text-neutral-700 whitespace-pre-wrap leading-normal pt-1">
                        {comm.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* REPORT CONTENT MODAL */}
      <Dialog
        open={!!reportTarget}
        onOpenChange={(open) => !open && setReportTarget(null)}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2 text-rose-600">
              <Flag size={18} /> Laporkan Konten Ini
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs py-2">
            <div>
              <Label className="text-xs font-bold mb-1 block">Alasan Pelaporan</Label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full text-xs font-bold bg-neutral-50 border border-border rounded-xl p-2.5"
              >
                <option value="Spam & Iklan Berlebihan">Spam & Iklan Berlebihan</option>
                <option value="Informasi Palsu / Misinformasi Jalur">Informasi Palsu / Misinformasi Jalur</option>
                <option value="Ujaran Kebencian & Pelecehan">Ujaran Kebencian & Pelecehan</option>
                <option value="Penipuan / Transaksi Ilegal">Penipuan / Transaksi Ilegal</option>
                <option value="Konten Berbahaya / Melanggar Aturan">Konten Berbahaya / Melanggar Aturan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold mb-1 block">Detail Pelaporan (Opsional)</Label>
              <Textarea
                rows={3}
                placeholder="Jelaskan alasan mengapa konten ini melanggar panduan komunitas TREXIO..."
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReportTarget(null)}
              className="text-xs rounded-xl font-bold"
            >
              Batal
            </Button>
            <Button
              onClick={handleReportSubmit}
              disabled={submittingReport}
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs"
            >
              Kirim Laporan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
