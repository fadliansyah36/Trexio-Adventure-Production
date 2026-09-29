import React, { useState, useEffect, useCallback } from "react";
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
import { toast } from "sonner";
import {
  UsersThree,
  Plus,
  ChatCircleDots,
  Heart,
  Eye,
  Trash,
  PencilSimple,
  CheckCircle,
  Megaphone,
  Sparkle,
  Compass,
  Package,
  Mountains,
  ShareNetwork,
  Tag,
  ArrowRight,
  BookmarkSimple,
} from "@phosphor-icons/react";

export default function VendorCommunity() {
  const { user } = useAuth();
  const [vendorData, setVendorData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [vendorPosts, setVendorPosts] = useState([]);
  const [publicFeed, setPublicFeed] = useState([]);
  const [activeTab, setActiveTab] = useState("my_vendor_posts"); // 'my_vendor_posts', 'public_feed'
  const [loading, setLoading] = useState(true);

  // Publisher Modal State
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categorySlug, setCategorySlug] = useState("pendakian");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load Vendor Profile Data
  useEffect(() => {
    api
      .get("/vendor/mine")
      .then((r) => setVendorData(r.data))
      .catch(() => setVendorData(null));

    api
      .get("/community-categories")
      .then((r) => setCategories(Array.isArray(r.data) ? r.data : []))
      .catch(() => setCategories([]));
  }, []);

  // Fetch Vendor Posts
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      if (vendorData?.id) {
        const { data: myData } = await api.get(
          `/community-posts?vendor_id=${vendorData.id}`
        );
        setVendorPosts(Array.isArray(myData) ? myData : []);
      }

      const { data: feedData } = await api.get("/community-posts?sort=latest");
      setPublicFeed(Array.isArray(feedData) ? feedData : []);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  }, [vendorData?.id]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Publish Vendor Post
  const handlePublish = async () => {
    if (!content.trim()) {
      return toast.error("Isi konten tidak boleh kosong");
    }

    setSubmitting(true);
    try {
      await api.post("/community-posts", {
        title,
        content,
        category_slug: categorySlug,
        image: imageUrl,
      });

      toast.success(
        "Konten / Informasi Edukasi Partner berhasil dipublikasikan ke Forum Komunitas!"
      );
      setTitle("");
      setContent("");
      setImageUrl("");
      setShowPublishModal(false);
      fetchPosts();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Post
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Hapus postingan ini dari forum komunitas?")) return;
    try {
      await api.delete(`/community-posts/${postId}`);
      toast.success("Postingan berhasil dihapus");
      fetchPosts();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <SEO
        title="Komunitas & Edukasi Partner — Vendor Dashboard TREXIO"
        description="Kelola publikasi edukasi, panduan perjalanan, dan partisipasi vendor dalam forum komunitas TREXIO."
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[hsl(var(--secondary))] to-emerald-950 text-white rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden border border-emerald-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              <Megaphone size={14} weight="fill" /> BRAND ENGAGEMENT & COMMUNITY
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2">
              Komunitas & Forum Outdoor Partner
            </h1>
            <p className="text-xs md:text-sm text-neutral-300 max-w-2xl">
              Publikasikan panduan perjalanan, kabar operasional basecamp,
              tips perawatan peralatan, atau jawab pertanyaan pendaki secara resmi
              sebagai Verified Vendor/Guide TREXIO.
            </p>
          </div>

          <Button
            onClick={() => setShowPublishModal(true)}
            data-testid="vendor-create-post-btn"
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-6 py-3 rounded-2xl shadow-lg shrink-0 text-xs gap-2"
          >
            <Plus size={18} weight="bold" /> Publikasikan Edukasi / Info
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab("my_vendor_posts")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "my_vendor_posts"
              ? "bg-[hsl(var(--secondary))] text-white shadow-xs"
              : "text-muted-foreground hover:bg-neutral-100"
          }`}
        >
          <Megaphone size={16} weight="bold" /> Postingan Resmi Partner ({vendorPosts.length})
        </button>

        <button
          onClick={() => setActiveTab("public_feed")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "public_feed"
              ? "bg-[hsl(var(--secondary))] text-white shadow-xs"
              : "text-muted-foreground hover:bg-neutral-100"
          }`}
        >
          <UsersThree size={16} weight="bold" /> Diskusi Publik Komunitas ({publicFeed.length})
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center text-xs font-bold text-muted-foreground">
          Memuat data komunitas partner...
        </div>
      ) : activeTab === "my_vendor_posts" ? (
        vendorPosts.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl p-12 text-center space-y-3">
            <Megaphone size={48} className="mx-auto text-neutral-300" />
            <h3 className="text-base font-bold text-foreground">
              Belum Ada Postingan Resmi Partner
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Bagikan info terkini seputar layanan, tips keselamatan, atau ulasan peralatan outdoor Anda untuk menarik minat calon pendaki.
            </p>
            <Button
              onClick={() => setShowPublishModal(true)}
              size="sm"
              className="bg-emerald-600 text-white font-bold rounded-xl text-xs gap-1.5"
            >
              <Plus size={16} /> Buat Postingan Pertama
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendorPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white border border-border rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
                      {post.category_name || "Edukasi"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString("id-ID")}
                    </span>
                  </div>

                  <h3 className="mt-2 text-base font-black text-foreground">
                    {post.title}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-600 line-clamp-3 leading-relaxed">
                    {post.content}
                  </p>

                  {post.image && (
                    <img
                      src={post.image}
                      alt="Lampiran"
                      className="mt-3 rounded-xl h-40 w-full object-cover border border-border"
                    />
                  )}
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-bold">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-rose-600">
                      <Heart size={15} weight="fill" /> {post.likes_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <ChatCircleDots size={15} /> {post.comments_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={15} /> {post.view_count || 1}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePost(post.id)}
                    className="text-rose-600 hover:bg-rose-50 h-8 px-2 rounded-lg text-xs font-bold"
                  >
                    <Trash size={14} className="mr-1" /> Hapus
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Public Feed View for Vendor */
        <div className="space-y-4">
          {publicFeed.map((post) => (
            <div
              key={post.id}
              className="bg-white border border-border rounded-2xl p-5 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">
                    {post.vendor_name || post.user_name}
                  </span>
                  {post.vendor_name && (
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                      Partner
                    </Badge>
                  )}
                  <span className="text-[10px] text-neutral-400">
                    • {new Date(post.created_at).toLocaleDateString("id-ID")}
                  </span>
                </div>
                <Badge variant="secondary" className="text-[10px] font-bold">
                  {post.category_name}
                </Badge>
              </div>

              <h3 className="text-base font-black text-foreground">
                {post.title}
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>

              <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground font-bold">
                <div className="flex items-center gap-3">
                  <span><Heart size={15} className="inline mr-1" /> {post.likes_count || 0}</span>
                  <span><ChatCircleDots size={15} className="inline mr-1" /> {post.comments_count || 0} Tanggapan</span>
                </div>
                <a
                  href={`/community?post=${post.id}`}
                  className="text-emerald-600 hover:underline flex items-center gap-1 font-extrabold text-xs"
                >
                  Buka & Tanggapi <ArrowRight size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PUBLISH CONTENT MODAL */}
      <Dialog open={showPublishModal} onOpenChange={setShowPublishModal}>
        <DialogContent className="max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2 text-foreground">
              <Megaphone size={22} className="text-emerald-600" />
              Publikasikan Info / Edukasi Partner
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-xs py-2">
            <div>
              <Label className="text-xs font-bold mb-1.5 block">Kategori Topik</Label>
              <select
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
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
              <Label className="text-xs font-bold mb-1.5 block">Judul Postingan / Pengumuman</Label>
              <Input
                placeholder="Contoh: Tips Memilih Tenda 4-Musim & Panduan Packing..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs font-bold mb-1.5 block">Isi Informasi / Edukasi</Label>
              <Textarea
                rows={6}
                placeholder="Tuliskan ulasan teknis, panduan operasional basecamp, atau tips pendakian untuk audiens TREXIO..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs font-bold mb-1.5 block">URL Cover Foto / Infografis (Opsional)</Label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPublishModal(false)}
              className="text-xs rounded-xl font-bold"
            >
              Batal
            </Button>
            <Button
              onClick={handlePublish}
              disabled={submitting}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs gap-1.5"
            >
              {submitting ? "Mempublikasikan..." : "Publikasikan Sekarang"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
