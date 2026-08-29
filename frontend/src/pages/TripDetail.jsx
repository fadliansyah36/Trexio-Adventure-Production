import { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api, apiFetch, formatRupiah } from "@/lib/api";
import { resolveTripDates } from "@/lib/tripDates";
import { addItemToCart } from "@/lib/cartStorage";
import { useCompare } from "@/context/CompareContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import SEO from "@/components/site/SEO";
import { generateProductTripSchema } from "@/services/seoService";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import VendorVerifiedBadge from "@/components/site/VendorVerifiedBadge";
import {
  MapPin,
  Users,
  Mountains,
  CalendarBlank,
  Check,
  X as XIcon,
  Path,
  ArrowRight,
  Heart,
  ShareNetwork,
  Star,
  ShoppingCart,
  PaperPlaneRight,
  Scales,
  CheckCircle,
  ShieldWarning,
  Compass,
  SealCheck,
  Storefront as StoreIcon,
  ChatCircleDots,
} from "@phosphor-icons/react";

export default function TripDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [selectedTripDate, setSelectedTripDate] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const { toggleCompare, isInCompare } = useCompare();

  // Resolved list of departure batches
  const availableBatches = useMemo(() => {
    return resolveTripDates(trip);
  }, [trip]);

  // Reviews state & Audit eligibility
  const [reviewsData, setReviewsData] = useState({ reviews: [], total: 0, average: 5.0 });
  const [eligibility, setEligibility] = useState({ eligible: false, already_reviewed: false, reason: "", booking_id: null });
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const nav = useNavigate();

  const loadReviews = async (tripId) => {
    try {
      const res = await api.get(`/reviews/trip/${tripId}`);
      if (res.data) setReviewsData(res.data);
    } catch (e) {}
  };

  const loadEligibility = async (tripId) => {
    try {
      const res = await api.get(`/reviews/eligibility/trip/${tripId}`);
      if (res.data) setEligibility(res.data);
    } catch (e) {
      setEligibility({ eligible: false, already_reviewed: false, reason: "Gagal memeriksa kelayakan ulasan.", booking_id: null });
    }
  };

  useEffect(() => {
    api.get(`/trips/${id}`).then((r) => {
      setTrip(r.data);
      const batches = resolveTripDates(r.data);
      if (batches.length > 0) {
        setSelectedTripDate(batches[0].date);
      }
      const targetId = r.data.id || id;
      loadReviews(targetId);
      loadEligibility(targetId);
    });

    apiFetch("/wishlist")
      .then((items) => {
        if (Array.isArray(items)) {
          setIsSaved(items.some((w) => w.item_id === id && w.item_type === "trip"));
        }
      })
      .catch(() => {});
  }, [id, user]);

  const toggleWishlist = async () => {
    if (!trip) return;
    try {
      const res = await apiFetch("/wishlist", {
        method: "POST",
        body: JSON.stringify({
          item_id: trip.id,
          item_type: "trip",
          title: trip.title,
          price: trip.price,
          cover_image: trip.cover_image,
          category: trip.destination,
        }),
      });
      setIsSaved(res.saved);
      toast.success(res.message);
    } catch (e) {
      toast.error("Silakan login untuk menyimpan wishlist");
    }
  };

  const addToCart = async () => {
    if (!trip) return;
    try {
      const dateToBook = selectedTripDate || availableBatches[0]?.date || "";
      await addItemToCart({
        item_id: trip.id,
        item_type: "trip",
        title: trip.title,
        price: trip.price,
        quantity: 1,
        cover_image: trip.cover_image,
        departure_date: dateToBook,
      });
      toast.success("Berhasil ditambahkan ke keranjang!");
    } catch (e) {
      toast.error("Gagal menambahkan ke keranjang");
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return toast.error("Tuliskan komentar ulasan Anda.");
    setSubmittingReview(true);
    try {
      const res = await api.post("/reviews", {
        item_type: "trip",
        item_id: trip.id,
        booking_id: eligibility.booking_id,
        rating: newRating,
        comment: newComment,
      });

      toast.success(res.data?.message || "Ulasan & rating terverifikasi berhasil dikirim!");
      setNewComment("");
      loadReviews(trip.id);
      loadEligibility(trip.id);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Gagal mengirim ulasan. Pastikan Anda memiliki pesanan yang telah dikonfirmasi selesai.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleChatVendor = async () => {
    try {
      const vId = trip.vendor_id || trip.vendor?.id;
      if (!vId) {
        toast.error("Vendor penyelenggara untuk trip ini belum terhubung ke sistem perpesanan.");
        return;
      }
      const vName = trip.vendor_name || trip.vendor?.brand_name || trip.organizer || "Mitra Vendor";
      const res = await api.post("/chat/conversations", {
        vendor_id: vId,
        vendor_name: vName,
        product_id: trip.id,
        product_title: trip.title,
        initial_message: `Halo ${vName}, saya berminat dengan paket trip "${trip.title}". Boleh tanya ketersediaan slot dan detailnya?`
      });
      if (res.data?.id) {
        nav(`/messages?tab=chat&conversation_id=${res.data.id}`);
      }
    } catch (err) {
      toast.error("Gagal memulai chat dengan vendor.");
    }
  };

  if (!trip) {
    return (
      <div className="trx-container py-20 text-center trx-overline text-muted-foreground">
        Memuat...
      </div>
    );
  }

  const remaining = (trip.max_participants || 0) - (trip.booked_seats || 0);

  return (
    <div className="pb-20">
      <SEO
        title={trip.title}
        description={trip.description || `Pesan paket open trip ${trip.title} di destinasi ${trip.destination || "Indonesia"}. Harga mulai ${formatRupiah(trip.price)}.`}
        image={trip.cover_image || trip.gallery?.[0]}
        keywords={`open trip ${trip.title}, pendakian ${trip.destination || ''}, ${trip.title}, outdoor, trexio`}
        type="product"
        jsonLd={generateProductTripSchema(trip)}
      />
      {/* Breadcrumb */}
      <div className="trx-container pt-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Beranda</Link>
        <span className="mx-2">›</span>
        <Link to="/explore" className="hover:text-foreground">Trip</Link>
        <span className="mx-2">›</span>
        <span className="text-foreground font-medium truncate">{trip.title}</span>
      </div>

      {/* Gallery */}
      <section className="trx-container mt-4 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-3">
        <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-muted">
          <img
            src={trip.gallery?.[activeImg] || trip.cover_image}
            alt={trip.title ? `${trip.title} - Foto Utama` : "Foto Trip"}
            loading="lazy"
            className="h-full w-full object-cover"
            data-testid="trip-main-image"
          />
        </div>
        <div className="grid grid-cols-3 md:grid-cols-1 gap-3">
          {(Array.isArray(trip.gallery)
            ? trip.gallery
            : typeof trip.gallery === "string"
            ? trip.gallery.split(",").map((s) => s.trim()).filter(Boolean)
            : trip.cover_image
            ? [trip.cover_image]
            : []
          ).slice(0, 3).map((g, i) => (
            <button
              key={i}
              onClick={() => setActiveImg(i)}
              data-testid={`trip-thumb-${i}`}
              className={`aspect-[16/10] md:aspect-auto overflow-hidden rounded-md bg-muted border ${
                activeImg === i
                  ? "border-[hsl(var(--primary))]"
                  : "border-transparent"
              }`}
            >
              <img src={g} className="h-full w-full object-cover" alt={`${trip.title || "Trip"} Galeri ${i + 1}`} />
            </button>
          ))}
        </div>
      </section>

      {/* Header + Booking */}
      <section className="trx-container mt-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        <div>
          <div className="flex flex-wrap gap-2">
            {(Array.isArray(trip.badges)
              ? trip.badges
              : typeof trip.badges === "string"
              ? trip.badges.split(",").map((s) => s.trim()).filter(Boolean)
              : []
            ).map((b) => (
              <span
                key={b}
                className="rounded-sm bg-[hsl(var(--muted))] text-[hsl(var(--secondary))] px-2 py-1 text-[10px] font-bold tracking-wide"
              >
                {b}
              </span>
            ))}
          </div>
          <h1
            className="mt-3 text-3xl md:text-5xl font-black tracking-tighter"
            data-testid="trip-title"
          >
            {trip.title}
          </h1>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={16} />
              {trip.destination}, {trip.region}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarBlank size={16} />
              {trip.duration_days} hari
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Mountains size={16} weight="fill" />
              {trip.difficulty}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={16} />
              max {trip.max_participants} peserta
            </span>
            <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
              <Star size={16} weight="fill" />
              {reviewsData.average} ({reviewsData.total} ulasan)
            </span>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="mt-8">
            <TabsList className="bg-transparent border border-border rounded-md p-1">
              <TabsTrigger value="overview" data-testid="tab-overview">
                Ringkasan
              </TabsTrigger>
              <TabsTrigger value="itinerary" data-testid="tab-itinerary">
                Itinerary
              </TabsTrigger>
              <TabsTrigger value="include" data-testid="tab-include">
                Include/Exclude
              </TabsTrigger>
              <TabsTrigger value="meeting" data-testid="tab-meeting">
                Meeting Point
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-6 max-w-2xl">
              <p className="text-base leading-relaxed text-foreground/80">
                {trip.description}
              </p>
            </TabsContent>
            <TabsContent value="itinerary" className="mt-6">
              <div className="border-l-2 border-[hsl(var(--secondary))]/20 ml-2 pl-6 space-y-6">
                {(Array.isArray(trip.itinerary) ? trip.itinerary : []).map((it, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[33px] top-1.5 h-4 w-4 rounded-full bg-[hsl(var(--secondary))]" />
                    <div className="trx-overline text-muted-foreground">
                      {it.day}
                    </div>
                    <div className="mt-1 font-medium">{it.detail}</div>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="include" className="mt-6 grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-card border border-border rounded-md">
                <div className="trx-overline text-[hsl(var(--secondary))] mb-3">
                  Termasuk
                </div>
                <ul className="space-y-2">
                  {(Array.isArray(trip.includes)
                    ? trip.includes
                    : typeof trip.includes === "string"
                    ? trip.includes.split(",").map((s) => s.trim()).filter(Boolean)
                    : []
                  ).map((i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check size={16} className="mt-0.5 text-[hsl(var(--secondary))]" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 bg-card border border-border rounded-md">
                <div className="trx-overline text-[hsl(var(--primary))] mb-3">
                  Tidak Termasuk
                </div>
                <ul className="space-y-2">
                  {(Array.isArray(trip.excludes)
                    ? trip.excludes
                    : typeof trip.excludes === "string"
                    ? trip.excludes.split(",").map((s) => s.trim()).filter(Boolean)
                    : []
                  ).map((i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <XIcon size={16} className="mt-0.5 text-[hsl(var(--primary))]" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="meeting" className="mt-6">
              <div className="grid md:grid-cols-2 gap-3">
                {(Array.isArray(trip.meeting_points)
                  ? trip.meeting_points
                  : typeof trip.meeting_points === "string"
                  ? trip.meeting_points.split(",").map((s) => s.trim()).filter(Boolean)
                  : []
                ).map((m) => (
                  <div
                    key={m}
                    className="p-4 border border-border rounded-md bg-card flex items-center gap-3"
                  >
                    <div className="grid place-items-center h-10 w-10 rounded-md bg-[hsl(var(--muted))]">
                      <Path size={20} className="text-[hsl(var(--secondary))]" />
                    </div>
                    <div className="text-sm font-medium">{m}</div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Review Section */}
          <div className="mt-12 border-t pt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-2xl font-black tracking-tighter flex items-center gap-2">
                  <Star size={24} weight="fill" className="text-amber-500" />
                  Ulasan Peserta ({reviewsData.total})
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sistem Ulasan Terverifikasi TREXIO: Hanya peserta yang telah memesan & menyelesaikan trip yang diizinkan menulis rating.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 shrink-0">
                <SealCheck size={18} weight="fill" className="text-emerald-500" />
                <span>Verified Finisher Protection</span>
              </div>
            </div>

            {/* Submit Review or Lock Callout */}
            {eligibility.eligible ? (
              <form onSubmit={submitReview} className="p-4 border border-emerald-500/30 rounded-2xl bg-emerald-500/5 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                  <div className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                    <SealCheck size={18} className="text-emerald-600" weight="fill" />
                    Tulis Ulasan & Rating Peserta Terverifikasi
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-700 text-white px-2 py-0.5 rounded-md">
                    Pesanan Selesai #{eligibility.booking_code}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Berikan Bintang:</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setNewRating(s)}
                        className="p-1 text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star size={24} weight={s <= newRating ? "fill" : "regular"} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Ceritakan Pengalamanmu:</label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Bagikan pengalaman pendakian, keramahan guide, fasilitas tenda/makanan, dan kesan jalur..."
                    className="w-full text-xs p-3 border border-border rounded-xl bg-card min-h-[90px] focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div className="text-right pt-1">
                  <Button type="submit" disabled={submittingReview} size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-5 py-2 rounded-xl">
                    <PaperPlaneRight size={16} className="mr-1.5" /> {submittingReview ? "Mengirim..." : "Kirim Ulasan Terverifikasi"}
                  </Button>
                </div>
              </form>
            ) : eligibility.already_reviewed ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200 text-xs font-medium flex items-center gap-3">
                <CheckCircle size={24} className="text-emerald-600 shrink-0" weight="fill" />
                <div>
                  <div className="font-extrabold text-sm text-emerald-800 dark:text-emerald-300">Ulasan & Rating Telah Terkirim</div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Terima kasih! Anda telah memberikan ulasan terverifikasi untuk perjalanan ini. Feedback Anda sangat berharga bagi penjelajah lainnya.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                    <ShieldWarning size={22} weight="fill" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                      Fitur Ulasan Hanya untuk Peserta Terverifikasi
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {eligibility.reason || "Ulasan dan rating hanya dapat diisi oleh pendaki yang telah memesan produk ini dan mengonfirmasi bahwa seluruh aktivitas Trip telah dikonfirmasi SELESAI."}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-muted-foreground font-medium">
                    {!user ? "Silakan login untuk memeriksa riwayat pesanan Anda." : "Selesaikan trip Anda di menu My Bookings untuk membuka formulir ulasan."}
                  </div>

                  {!user ? (
                    <button
                      onClick={() => nav(`/login?next=/trip/${id}`)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      Login & Pemesanan Trip
                    </button>
                  ) : (
                    <Link
                      to="/my-bookings"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl shadow-xs transition-all"
                    >
                      <Compass size={16} /> Kelola Pesanan di My Bookings
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* List Reviews */}
            <div className="mt-6 space-y-4">
              {(!Array.isArray(reviewsData?.reviews) || reviewsData.reviews.length === 0) ? (
                <div className="text-sm text-muted-foreground italic bg-muted/30 p-4 rounded-2xl text-center">
                  Belum ada ulasan terverifikasi untuk trip ini.
                </div>
              ) : (
                reviewsData.reviews.map((r) => (
                  <div key={r.id} className="p-4 border border-border rounded-2xl bg-card text-xs space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-foreground">{r.user_name}</span>
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500/20">
                          <SealCheck size={12} weight="fill" className="text-emerald-500" /> Finisher Terverifikasi
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString("id-ID")}</span>
                    </div>

                    <div className="flex text-amber-500 items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={15} weight={s <= r.rating ? "fill" : "regular"} />
                      ))}
                      <span className="font-extrabold text-xs text-foreground ml-1">{r.rating}.0</span>
                    </div>

                    <p className="text-muted-foreground leading-relaxed italic bg-muted/20 p-3 rounded-xl border border-border/50">
                      "{r.comment}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-12">
            <h3 className="text-2xl font-black tracking-tighter">Pertanyaan umum</h3>
            <Accordion type="single" collapsible className="mt-4">
              <AccordionItem value="q1">
                <AccordionTrigger>Bagaimana proses booking?</AccordionTrigger>
                <AccordionContent>
                  Pilih tanggal keberangkatan, isi data peserta, pilih meeting point, dan lanjut ke pembayaran. Pembayaran melalui Trexio Dijamin Aman & terverifikasi otomatis dalam hitungan detik.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2">
                <AccordionTrigger>Apakah bisa dibatalkan?</AccordionTrigger>
                <AccordionContent>
                  Ya, dengan syarat dan ketentuan berlaku. Silakan hubungi CS TREXIO.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Sticky Booking Panel */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="border border-border rounded-md bg-card p-6 shadow-sm">
            <div className="trx-overline text-muted-foreground">Mulai dari</div>
            <div
              className="mt-1 text-3xl font-black text-[hsl(var(--secondary))]"
              data-testid="trip-price"
            >
              {formatRupiah(trip.price)}
              <span className="ml-1 text-sm font-medium text-muted-foreground">
                /orang
              </span>
            </div>

            <div className="mt-5 rounded-md border border-border p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Sisa kuota</span>
                <span
                  className={`font-semibold ${remaining <= 3 ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--secondary))]"}`}
                >
                  {remaining} / {trip.max_participants}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-[hsl(var(--primary))]"
                  style={{
                    width: `${(trip.booked_seats / trip.max_participants) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="trx-overline text-muted-foreground mb-2">
                Tanggal keberangkatan
              </div>
              <div className="flex flex-wrap gap-2">
                {availableBatches.slice(0, 8).map((d, idx) => {
                  const dateStr = d.date;
                  const label = d.label;
                  const isFull = d.status === "full" || d.seats_left === 0;
                  const seats = d.seats_left !== undefined ? d.seats_left : null;
                  const isSelected = selectedTripDate === dateStr;

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isFull}
                      onClick={() => setSelectedTripDate(dateStr)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-semibold flex flex-col gap-0.5 text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                          : isFull
                          ? "bg-slate-100 dark:bg-slate-900 border-border text-muted-foreground opacity-60 cursor-not-allowed"
                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/20"
                      }`}
                    >
                      <span className="font-extrabold text-[11px] truncate max-w-[140px]">
                        {label}
                      </span>
                      {dateStr && (
                        <span className="text-[10px] opacity-80 flex items-center justify-between gap-1">
                          <span>{dateStr}</span>
                          {isFull ? <span className="text-red-500 font-extrabold">FULL</span> : seats ? <span>({seats} seat)</span> : null}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Button
                data-testid="trip-book-btn"
                onClick={() => nav(`/booking/${trip.id}${selectedTripDate ? `?date=${encodeURIComponent(selectedTripDate)}` : ""}`)}
                disabled={remaining <= 0}
                className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-md trx-btn-press"
              >
                {remaining <= 0 ? "Kuota Habis" : "Booking Sekarang"}{" "}
                {remaining > 0 && <ArrowRight className="ml-2" size={16} />}
              </Button>

              <Button
                variant="outline"
                onClick={addToCart}
                className="w-full rounded-md border-[hsl(var(--secondary))] text-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/10"
              >
                <ShoppingCart size={16} className="mr-2" /> Tambah Ke Keranjang
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-1.5">
              <Button
                variant={isInCompare(trip?.id) ? "default" : "outline"}
                onClick={() => trip && toggleCompare(trip)}
                data-testid="trip-compare"
                className={`rounded-md text-xs px-2 ${isInCompare(trip?.id) ? "bg-emerald-600 text-white hover:bg-emerald-700" : "border-emerald-600/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"}`}
              >
                <Scales size={15} weight={isInCompare(trip?.id) ? "fill" : "bold"} className="mr-1 shrink-0" />
                <span className="truncate">{isInCompare(trip?.id) ? "Komparasi" : "+Bandingkan"}</span>
              </Button>

              <Button
                variant={isSaved ? "default" : "outline"}
                onClick={toggleWishlist}
                data-testid="trip-favorite"
                className={`rounded-md text-xs px-2 ${isSaved ? "bg-red-500 text-white hover:bg-red-600" : ""}`}
              >
                <Heart size={15} weight={isSaved ? "fill" : "regular"} className="mr-1 shrink-0" /> {isSaved ? "Disimpan" : "Simpan"}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Tautan berhasil disalin!");
                }}
                data-testid="trip-share"
                className="rounded-md text-xs px-2"
              >
                <ShareNetwork size={15} className="mr-1 shrink-0" /> Bagikan
              </Button>
            </div>

            <div className="mt-6 pt-5 border-t border-border space-y-3">
              <div className="trx-overline text-muted-foreground">Penyelenggara / Vendor Partner</div>
              <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-muted/20 hover:border-emerald-500/50 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-card border border-border overflow-hidden flex items-center justify-center shrink-0">
                  {trip.vendor_logo || trip.vendor?.logo ? (
                    <img src={trip.vendor_logo || trip.vendor?.logo} alt={trip.vendor_name || trip.vendor?.brand_name} className="w-full h-full object-cover" />
                  ) : (
                    <StoreIcon size={24} className="text-emerald-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-sm text-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      {trip.vendor_name || trip.vendor?.brand_name || trip.organizer || "TREXIO Official"}
                    </span>
                    <VendorVerifiedBadge verified={trip.vendor_verified || trip.vendor?.verified} showUnverified={false} />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                      <Star size={12} weight="fill" /> {trip.vendor_rating || trip.vendor?.rating || 5.0}
                    </span>
                    <span>•</span>
                    <span>{trip.vendor_guide_count || trip.vendor?.guide_count || 3} Guide APGI</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                <Link
                  to={`/vendor/${trip.vendor_slug || trip.vendor?.slug || 'trexio-official'}`}
                  data-testid="trip-vendor-storefront-btn"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-3 py-2.5 text-xs font-bold transition-all"
                >
                  <StoreIcon size={16} /> Storefront
                </Link>
                <button
                  type="button"
                  onClick={handleChatVendor}
                  data-testid="trip-vendor-chat-btn"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3 py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <ChatCircleDots size={16} className="text-emerald-400" /> Chat Organizer
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
