import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, apiFetch, formatRupiah, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { getStoredCart, removeCartItem, clearCart, fetchAndSyncCart } from "@/lib/cartStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import SEO from "@/components/site/SEO";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CheckCircle,
  Bank,
  ArrowRight,
  ShieldCheck,
  CalendarBlank,
  MapPin,
  User,
  Users,
  Ticket,
  Sparkle,
  X,
  CreditCard,
  QrCode,
  Wallet,
  ShoppingCart,
  Compass,
  Phone,
  EnvelopeSimple,
  Tent,
} from "@phosphor-icons/react";

export default function Checkout() {
  const nav = useNavigate();
  const { user } = useAuth();

  const [checkoutItems, setCheckoutItems] = useState([]);
  const [singleBookingPayload, setSingleBookingPayload] = useState(null);
  const [singleTrip, setSingleTrip] = useState(null);

  // Contact form
  const [contactName, setContactName] = useState(user?.name || "");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [contactPhone, setContactPhone] = useState(user?.phone || "08123456789");
  const [notes, setNotes] = useState("");

  // Payment channel
  const [selectedChannel, setSelectedChannel] = useState("Virtual Account BCA");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [couponApplied, setCouponApplied] = useState(null);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (user) {
      if (!contactName) setContactName(user.name || "");
      if (!contactEmail) setContactEmail(user.email || "");
      if (!contactPhone) setContactPhone(user.phone || "08123456789");
    }
  }, [user]);

  useEffect(() => {
    // Check single pending booking
    const p = sessionStorage.getItem("trexio_pending_booking");
    const t = sessionStorage.getItem("trexio_pending_trip");
    if (p && t) {
      try {
        setSingleBookingPayload(JSON.parse(p));
        setSingleTrip(JSON.parse(t));
        return;
      } catch (e) {
        console.error(e);
      }
    }

    // Check cart checkout items
    const cCart = sessionStorage.getItem("trexio_checkout_cart");
    if (cCart) {
      try {
        const parsed = JSON.parse(cCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCheckoutItems(parsed);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Fallback to local stored cart
    const localCart = getStoredCart();
    if (localCart && localCart.length > 0) {
      setCheckoutItems(localCart);
    } else {
      // Redirect if no items at all
      toast.info("Pilih item di keranjang sebelum melakukan checkout");
      nav("/cart");
    }
  }, [nav]);

  const paymentChannels = [
    {
      id: "bca_va",
      name: "Virtual Account BCA",
      category: "Midtrans VA",
      badge: "Verifikasi Otomatis",
      icon: Bank,
    },
    {
      id: "mandiri_va",
      name: "Mandiri Livin VA",
      category: "Midtrans VA",
      badge: "Verifikasi Otomatis",
      icon: Bank,
    },
    {
      id: "bni_va",
      name: "BNI Mobile VA",
      category: "Midtrans VA",
      badge: "Verifikasi Otomatis",
      icon: Bank,
    },
    {
      id: "qris_gopay",
      name: "QRIS / GoPay / ShopeePay",
      category: "E-Wallet Instant",
      badge: "Scan QR Direct",
      icon: QrCode,
    },
    {
      id: "credit_card",
      name: "Kartu Kredit / Debit",
      category: "Visa / Mastercard",
      badge: "3D Secure SSL",
      icon: CreditCard,
    },
  ];

  // Calculate pricing
  let subtotal = 0;
  if (singleTrip && singleBookingPayload) {
    const qty = singleBookingPayload.participants?.length || 1;
    subtotal = (singleTrip.price || 0) * qty;
  } else if (checkoutItems.length > 0) {
    subtotal = checkoutItems.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );
  }

  const total = Math.max(0, subtotal - discount);

  async function applyCoupon() {
    if (!coupon.trim()) return;
    try {
      const { data } = await api.get(
        `/coupons/validate/${coupon.trim().toUpperCase()}`
      );
      const d =
        data.type === "percent"
          ? Math.floor((subtotal * data.value) / 100)
          : data.value;
      setDiscount(d);
      setCouponApplied(data);
      setCouponMsg(`✓ Diskon ${data.description} diterapkan`);
      toast.success("Kupon berhasil dipakai!");
    } catch (e) {
      setDiscount(0);
      setCouponApplied(null);
      setCouponMsg(formatApiError(e.response?.data?.detail) || "Kupon tidak valid");
      toast.error("Kupon tidak valid");
    }
  }

  function handleOpenConfirmation() {
    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      return toast.error("Lengkapi data pemesan (Nama, Email, WhatsApp) terlebih dahulu");
    }
    if (!terms) {
      return toast.error("Anda perlu menyetujui syarat & ketentuan sebelum melanjutkan");
    }
    setShowConfirmModal(true);
  }

  async function handleFinalSubmit() {
    if (!terms) return toast.error("Anda perlu menyetujui syarat & ketentuan");
    if (!user) {
      toast.error("Silakan login terlebih dahulu untuk melanjutkan pemesanan");
      nav("/login?next=/checkout");
      return;
    }
    setLoading(true);

    try {
      let bookingId = null;
      const idempotencyKey = `ik_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      if (singleTrip && singleBookingPayload) {
        const body = {
          ...singleBookingPayload,
          category: singleBookingPayload.category || singleTrip.category || "private-trip",
          quantity: singleBookingPayload.quantity || (singleBookingPayload.participants?.length || 1),
          price_unit: singleBookingPayload.price_unit || singleTrip.price_unit || "orang",
          price: singleBookingPayload.price || singleTrip.price || 0,
          contact_name: contactName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          notes: notes || singleBookingPayload.special_notes || singleBookingPayload.notes || "",
          special_notes: notes || singleBookingPayload.special_notes || "",
          coupon_code: couponApplied ? couponApplied.code : "",
          payment_method: selectedChannel,
          idempotency_key: idempotencyKey,
        };
        const { data } = await api.post("/bookings", body);
        bookingId = data.id;

        // Selective cart conversion for single booking if from cart
        if (singleBookingPayload.cart_item_id) {
          await removeCartItem(singleBookingPayload.cart_item_id);
        } else if (singleBookingPayload.trip_id) {
          await removeCartItem(singleBookingPayload.trip_id);
        }
        await fetchAndSyncCart();

        sessionStorage.removeItem("trexio_pending_booking");
        sessionStorage.removeItem("trexio_pending_trip");
      } else {
        // Multi-item cart checkout or CategoryPage checkout
        const mainItem = checkoutItems[0] || {};
        const mainCategory = mainItem.item_type || mainItem.options?.category || mainItem.category || "open-trip";
        const mainPriceUnit = mainItem.options?.price_unit || mainItem.price_unit || "orang";
        const mainPrice = Number(mainItem.price) || 0;
        const qtySum = checkoutItems.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0);

        const body = {
          trip_id: mainItem.item_id || mainItem.id || "custom_item",
          category: mainCategory,
          price_unit: mainPriceUnit,
          price: mainPrice,
          trip_title:
            checkoutItems.length > 1
              ? `${mainItem.title} (+${checkoutItems.length - 1} item lainnya)`
              : mainItem.title || "Layanan Trexio Outdoor",
          trip_cover: mainItem.cover_image || "",
          trip_destination: mainItem.options?.location || mainItem.location || "Indonesia",
          departure_date: mainItem.departure_date || new Date().toISOString().split("T")[0],
          meeting_point: mainItem.options?.meeting_point || mainItem.meeting_point || "Pos / Basecamp Resmi",
          contact_name: contactName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          participants: [
            {
              name: contactName,
              gender: "male",
              age: 25,
              id_type: "KTP",
              id_number: "3171000000000001",
            },
          ],
          total_amount: total,
          quantity: qtySum,
          checkout_items: checkoutItems.map(item => ({
            item_id: item.item_id || item.id,
            id: item.id || item.item_id,
            title: item.title,
            price: Number(item.price || 0),
            quantity: Number(item.quantity || 1),
            cover_image: item.cover_image,
            departure_date: item.departure_date,
            category: item.item_type || item.options?.category || item.category || mainCategory,
            price_unit: item.options?.price_unit || item.price_unit || mainPriceUnit
          })),
          coupon_code: couponApplied ? couponApplied.code : "",
          payment_method: selectedChannel,
          idempotency_key: idempotencyKey,
          notes: mainItem.options?.notes || notes || `Cart Items (${checkoutItems.length}): ${checkoutItems.map((i) => i.title).join(", ")}`,
          rental_start: mainItem.options?.rental_start || mainItem.rental_start || mainItem.departure_date,
          rental_end: mainItem.options?.rental_end || mainItem.rental_end,
          check_in: mainItem.options?.check_in || mainItem.check_in || mainItem.departure_date,
          check_out: mainItem.options?.check_out || mainItem.check_out,
          duration_days: mainItem.options?.duration_days || mainItem.duration_days || 1,
          visit_date: mainItem.options?.visit_date || mainItem.visit_date || mainItem.departure_date,
          event_date: mainItem.options?.event_date || mainItem.event_date || mainItem.departure_date,
          tickets: mainItem.options?.tickets || mainItem.tickets || qtySum,
          rooms: mainItem.options?.rooms || mainItem.rooms,
          guests: mainItem.options?.guests || mainItem.guests,
          passengers: mainItem.options?.passengers || mainItem.passengers,
          route: mainItem.options?.route || mainItem.route,
          vehicle_type: mainItem.options?.vehicle_type || mainItem.vehicle_type
        };

        const { data } = await api.post("/bookings", body);
        bookingId = data.id;

        // Remove ONLY the checked-out items from local cart storage
        for (const item of checkoutItems) {
          const cId = item.id || item.item_id;
          if (cId) {
            await removeCartItem(cId);
          }
        }
        await fetchAndSyncCart();

        sessionStorage.removeItem("trexio_checkout_cart");
      }

      setShowConfirmModal(false);
      window.dispatchEvent(new CustomEvent("trexio:booking-updated"));
      toast.success("Pesanan berhasil dibuat! Mengalihkan ke Pembayaran Trexio...");
      nav(`/payment/${bookingId}`);
    } catch (e) {
      console.error("❌ [Checkout Submission Error]:", e);
      if (e.response?.status === 401) {
        toast.error("Silakan login untuk melanjutkan booking");
        nav("/login?next=/checkout");
      } else {
        const backendData = e.response?.data;
        const errCodeStr = backendData?.code ? `[${backendData.code}] ` : "";
        const errorMsg = formatApiError(backendData, "Gagal membuat pesanan. Silakan periksa kembali data Anda.");
        toast.error(`${errCodeStr}${errorMsg}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pb-24 pt-8 bg-background min-h-screen">
      <SEO title="Checkout & Pembayaran Trexio" description="Review item pesanan dan selesaikan pembayaran." />

      <div className="trx-container max-w-6xl">
        {/* Header Title */}
        <div className="border-b border-border pb-5">
          <div className="trx-overline text-emerald-600 font-bold uppercase tracking-wider text-xs">
            Proses Transaksi Aman · Midtrans Payment Gateway
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-foreground mt-1 tracking-tight">
            Review Pesanan & Checkout
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Periksa rincian item, isi data pemesan, dan pilih metode pembayaran pilihan Anda.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          {/* Main Left Section */}
          <div className="space-y-6">
            {/* 1. Item Review Card */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <ShoppingCart size={20} className="text-emerald-600" /> Review Item Pesanan
                </h3>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {singleTrip ? "1 Ekspedisi" : `${checkoutItems.length} Item Keranjang`}
                </span>
              </div>

              {singleTrip && singleBookingPayload ? (
                <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-muted/40 border border-border">
                  <img
                    src={singleTrip.cover_image}
                    alt={singleTrip.title}
                    className="w-full sm:w-28 h-28 object-cover rounded-xl border border-border shrink-0"
                  />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-700 text-white uppercase">
                      Open Trip Ekspedisi
                    </span>
                    <h4 className="font-bold text-sm text-foreground line-clamp-2">
                      {singleTrip.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin size={14} className="text-emerald-600 shrink-0" />
                      <span>{singleTrip.destination} — {singleBookingPayload.meeting_point}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarBlank size={14} className="text-blue-500 shrink-0" />
                      <span>
                        Keberangkatan:{" "}
                        {new Date(singleBookingPayload.departure_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="font-black text-emerald-700 dark:text-emerald-400 text-sm pt-1">
                      {singleBookingPayload.participants?.length || 1} Peserta × {formatRupiah(singleTrip.price)} ={" "}
                      {formatRupiah(subtotal)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {checkoutItems.map((item) => {
                    const isTrip = item.item_type === "trip" || item.item_type === "open_trip";
                    return (
                      <div
                        key={item.id}
                        className="flex gap-3.5 items-center p-3.5 rounded-xl bg-muted/40 border border-border"
                      >
                        <img
                          src={item.cover_image || "/logo.png"}
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded-lg border border-border shrink-0"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                isTrip ? "bg-emerald-700 text-white" : "bg-blue-600 text-white"
                              }`}
                            >
                              {isTrip ? "Trip" : "Rental"}
                            </span>
                            <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">
                              {item.title}
                            </h4>
                          </div>

                          {item.departure_date && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <CalendarBlank size={12} className="text-emerald-600" />
                              <span>
                                {new Date(item.departure_date).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground">
                            {item.quantity} × {formatRupiah(item.price)}
                          </div>
                        </div>

                        <div className="font-black text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm shrink-0">
                          {formatRupiah(item.price * item.quantity)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Contact Details Form */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2 pb-3 border-b border-border">
                <User size={20} className="text-emerald-600" /> Informasi Data Pemesan
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                    <User size={14} /> Nama Lengkap (Sesuai KTP)
                  </Label>
                  <Input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Nama Lengkap"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                    <EnvelopeSimple size={14} /> Alamat Email
                  </Label>
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="email@contoh.com"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                    <Phone size={14} /> Nomor WhatsApp (Aktif untuk E-Tiket)
                  </Label>
                  <Input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="081234567890"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1">
                    Catatan Khusus (Opsional)
                  </Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Ukuran sepatu, lokasi penjemputan khusus, dll."
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* 3. Midtrans Payment Method Selection */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                    <ShieldCheck size={20} className="text-emerald-600" /> Metode Pembayaran
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sistem terhubung langsung dengan Payment Gateway Midtrans
                  </p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-700 text-white shadow-2xs">
                  Midtrans Secured
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentChannels.map((ch) => {
                  const IconComp = ch.icon;
                  const isSelected = selectedChannel === ch.name;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setSelectedChannel(ch.name)}
                      className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                          : "border-border bg-background hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <IconComp size={20} weight="bold" />
                        </div>
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-foreground">
                            {ch.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {ch.category} · {ch.badge}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle size={18} weight="fill" className="text-emerald-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Security info banner */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-muted-foreground">
                <CheckCircle size={18} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground font-bold">Pembayaran melalui Trexio Dijamin Aman.</strong> Transaksi dikonfirmasi secara instan oleh sistem tanpa perlu upload bukti/struk manual.
                </span>
              </div>
            </div>

            {/* 4. Terms and Coupon */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <Label className="font-bold text-xs text-foreground mb-1.5 block">
                  Punya Kode Kupon / Promo?
                </Label>
                <div className="flex gap-2">
                  <Input
                    data-testid="coupon-input"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    placeholder="Masukkan kode promo (mis. TREXIO10)"
                    className="h-10 text-xs rounded-xl"
                  />
                  <Button
                    data-testid="coupon-apply"
                    variant="outline"
                    onClick={applyCoupon}
                    className="h-10 text-xs font-bold rounded-xl border-emerald-600/40 text-emerald-700 dark:text-emerald-400"
                  >
                    Gunakan
                  </Button>
                </div>
                {couponMsg && (
                  <p
                    data-testid="coupon-msg"
                    className={`mt-2 text-xs font-medium ${
                      couponApplied ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"
                    }`}
                  >
                    {couponMsg}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-border">
                <label className="flex items-start gap-3 text-xs text-muted-foreground cursor-pointer">
                  <Checkbox
                    data-testid="terms-check"
                    checked={terms}
                    onCheckedChange={setTerms}
                    className="mt-0.5"
                  />
                  <span>
                    Saya menyetujui{" "}
                    <Link to="/help" className="text-emerald-600 underline font-semibold">
                      syarat & ketentuan
                    </Link>{" "}
                    serta kebijakan pembatalan dan manifes keselamatan ekspedisi TREXIO.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Cost Breakdown */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-md space-y-5">
              <h3 className="font-bold text-base text-foreground pb-3 border-b border-border flex items-center justify-between">
                <span>Rincian Pembayaran</span>
                <Ticket size={18} className="text-amber-500" />
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal Produk</span>
                  <span className="font-semibold text-foreground">{formatRupiah(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Diskon Kupon ({couponApplied?.code})</span>
                    <span>-{formatRupiah(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-muted-foreground">
                  <span>Biaya Penanganan / Layanan</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">GRATIS</span>
                </div>

                <div className="border-t border-border pt-3 flex justify-between items-baseline">
                  <span className="font-bold text-sm text-foreground">Total Bayar:</span>
                  <span
                    data-testid="checkout-total"
                    className="text-2xl font-black text-emerald-600 dark:text-emerald-400"
                  >
                    {formatRupiah(total)}
                  </span>
                </div>
              </div>

              <Button
                data-testid="checkout-submit"
                onClick={handleOpenConfirmation}
                disabled={loading}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 trx-btn-press"
              >
                {loading ? "Memproses..." : "Lanjut Pembayaran"}
                <ArrowRight size={18} weight="bold" />
              </Button>

              <div className="p-3 rounded-xl bg-muted/50 border border-border text-[11px] text-muted-foreground space-y-1">
                <div className="font-bold text-foreground flex items-center gap-1">
                  <ShieldCheck size={14} className="text-emerald-600" /> Jaminan Transaksi Trexio
                </div>
                <p className="leading-relaxed">
                  Detail pesanan akan ditampilkan dalam layar konfirmasi sebelum mengaktifkan gerbang pembayaran.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Confirmation Screen / Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6 bg-card border-border rounded-2xl shadow-2xl">
          <DialogHeader className="space-y-1 text-left pb-3 border-b border-border">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold w-fit border border-emerald-500/20">
              <ShieldCheck size={15} weight="fill" /> Konfirmasi Pesanan & Metode Bayar
            </div>
            <DialogTitle className="text-lg font-black text-foreground">
              Tinjau Detail Sebelum Pembayaran
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Pastikan nama pemesan dan metode pembayaran pilihan Anda sudah tepat.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Contact Card */}
            <div className="bg-muted/40 border border-border rounded-xl p-3.5 space-y-1">
              <div className="font-bold text-foreground text-xs flex items-center gap-1 text-emerald-600">
                <User size={14} /> Kontak Pemesan:
              </div>
              <div className="font-bold text-foreground">{contactName}</div>
              <div className="text-muted-foreground">{contactEmail} · {contactPhone}</div>
            </div>

            {/* Selected Channel */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold">Saluran Pembayaran:</div>
                <div className="font-black text-sm text-foreground">{selectedChannel}</div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-700 text-white">
                Otomatis
              </span>
            </div>

            {/* Items Summary */}
            <div className="bg-background border border-border rounded-xl p-3 space-y-2">
              <div className="font-bold text-xs text-foreground pb-1 border-b border-border flex justify-between">
                <span>Rincian Item</span>
                <span>{singleTrip ? "1 Trip" : `${checkoutItems.length} Item`}</span>
              </div>
              {singleTrip ? (
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span className="truncate pr-2">{singleTrip.title}</span>
                  <span className="font-bold text-foreground shrink-0">{formatRupiah(subtotal)}</span>
                </div>
              ) : (
                checkoutItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-muted-foreground text-xs">
                    <span className="truncate pr-2">{item.quantity}x {item.title}</span>
                    <span className="font-bold text-foreground shrink-0">
                      {formatRupiah(item.price * item.quantity)}
                    </span>
                  </div>
                ))
              )}

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold pt-1 border-t border-border">
                  <span>Diskon Kupon</span>
                  <span>-{formatRupiah(discount)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-border flex justify-between items-baseline text-sm font-black text-foreground">
                <span>Total Tagihan:</span>
                <span data-testid="confirm-modal-total" className="text-emerald-600 dark:text-emerald-400 text-base">
                  {formatRupiah(total)}
                </span>
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2 text-[11px] text-muted-foreground">
              <CheckCircle size={16} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">Pembayaran melalui Trexio Dijamin Aman.</strong> Setelah konfirmasi, Anda akan langsung dialihkan ke instruksi bayar.
              </span>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              className="w-full sm:w-auto text-xs font-semibold rounded-xl"
            >
              Kembali
            </Button>
            <Button
              type="button"
              data-testid="confirm-booking-btn"
              onClick={handleFinalSubmit}
              disabled={loading}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Memproses Pesanan...
                </>
              ) : (
                <>
                  Konfirmasi & Bayar ({formatRupiah(total)}) <ArrowRight size={16} weight="bold" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

