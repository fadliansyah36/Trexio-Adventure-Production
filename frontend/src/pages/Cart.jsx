import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, formatRupiah } from "@/lib/api";
import {
  getStoredCart,
  fetchAndSyncCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} from "@/lib/cartStorage";
import { useAuth } from "@/context/AuthContext";
import SEO from "@/components/site/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  ShoppingCart,
  Trash,
  Plus,
  Minus,
  ArrowRight,
  Sparkle,
  Ticket,
  Compass,
  Tent,
  ShieldCheck,
  CheckCircle,
  Tag,
  ArrowLeft,
  CalendarBlank,
} from "@phosphor-icons/react";

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState(() => getStoredCart());
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => getStoredCart().map((item) => item.id));
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  useEffect(() => {
    fetchCart();

    const handleCartUpdated = (e) => {
      const updated = e.detail || getStoredCart();
      if (Array.isArray(updated)) {
        setCartItems(updated);
        setSelectedIds((prev) => {
          // Keep selection valid
          const validPrev = prev.filter((id) => updated.some((i) => i.id === id));
          return validPrev.length > 0 ? validPrev : updated.map((i) => i.id);
        });
      }
    };

    window.addEventListener("cart-updated", handleCartUpdated);
    return () => window.removeEventListener("cart-updated", handleCartUpdated);
  }, []);

  const fetchCart = async () => {
    const cached = getStoredCart();
    if (cached.length === 0) setLoading(true);
    try {
      const data = await fetchAndSyncCart();
      if (Array.isArray(data)) {
        setCartItems(data);
        setSelectedIds(data.map((item) => item.id));
      }
    } catch (err) {
      console.error("Fetch cart error:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartId, newQty) => {
    if (newQty < 1) return;
    try {
      const updated = await updateCartItemQuantity(cartId, newQty);
      setCartItems(updated);
    } catch (err) {
      toast.error("Gagal memperbarui jumlah item");
    }
  };

  const removeItem = async (cartId, itemTitle) => {
    try {
      const updated = await removeCartItem(cartId);
      setCartItems(updated);
      setSelectedIds((prev) => prev.filter((id) => id !== cartId));
      toast.success(`"${itemTitle || 'Item'}" dihapus dari keranjang`);
    } catch (err) {
      toast.error("Gagal menghapus item");
    }
  };

  const clearAllCart = async () => {
    if (!window.confirm("Apakah Anda yakin ingin mengosongkan seluruh isi keranjang?")) return;
    try {
      await clearCart();
      setCartItems([]);
      setSelectedIds([]);
      toast.success("Keranjang berhasil dikosongkan");
    } catch (err) {
      toast.error("Gagal mengosongkan keranjang");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === cartItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cartItems.map((item) => item.id));
    }
  };

  const toggleSelectItem = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    } else {
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    try {
      const res = await apiFetch(`/coupons/validate/${couponCode.trim().toUpperCase()}`);
      if (res) {
        setAppliedCoupon(res);
        const subtotal = calculateSelectedSubtotal();
        const d =
          res.type === "percent"
            ? Math.floor((subtotal * res.value) / 100)
            : res.value;
        setDiscountAmount(d);
        toast.success(`Kupon ${res.code} berhasil dipasang! Diskon ${formatRupiah(d)}`);
      }
    } catch (err) {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      toast.error(err?.detail || "Kode promo tidak valid atau telah kadaluarsa");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode("");
    toast.info("Kupon dilepas");
  };

  const calculateSelectedSubtotal = () => {
    return cartItems
      .filter((item) => selectedIds.includes(item.id))
      .reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  };

  const subtotal = calculateSelectedSubtotal();
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleProceedToCheckout = () => {
    const selectedItems = cartItems.filter((item) => selectedIds.includes(item.id));
    if (selectedItems.length === 0) {
      toast.error("Pilih setidaknya 1 item di keranjang untuk melanjutkan pemesanan");
      return;
    }

    // Find first trip item or main booking item
    const tripItem = selectedItems.find((i) => i.item_type === "trip" || i.item_type === "open_trip" || i.item_type === "open-trip" || i.item_type === "private-trip");

    if (tripItem) {
      // Store in session storage for checkout workflow
      const pendingBooking = {
        trip_id: tripItem.item_id || tripItem.id,
        category: tripItem.item_type || tripItem.options?.category || tripItem.category || "open-trip",
        meeting_point: tripItem.options?.meeting_point || "Pos / Basecamp Resmi",
        departure_date: tripItem.departure_date || new Date().toISOString().split("T")[0],
        price: Number(tripItem.price) || 0,
        price_unit: tripItem.options?.price_unit || tripItem.price_unit || "orang",
        quantity: tripItem.quantity || 1,
        participants: Array.from({ length: tripItem.quantity || 1 }, (_, i) => ({
          name: user?.name || `Peserta ${i + 1}`,
          phone: user?.phone || "",
          id_card: "",
        })),
        cart_item_id: tripItem.id,
      };

      const pendingTrip = {
        id: tripItem.item_id || tripItem.id,
        title: tripItem.title,
        price: tripItem.price,
        cover_image: tripItem.cover_image,
        destination: tripItem.options?.destination || tripItem.options?.location || "Gunung & Alam",
        category: tripItem.item_type || tripItem.options?.category || tripItem.category || "open-trip",
      };

      sessionStorage.setItem("trexio_pending_booking", JSON.stringify(pendingBooking));
      sessionStorage.setItem("trexio_pending_trip", JSON.stringify(pendingTrip));
      navigate("/checkout");
    } else {
      // For any non-trip items (rental gear, guide, porter, basecamp, camping, homestay, shuttle, transport, wisata, event)
      sessionStorage.removeItem("trexio_pending_booking");
      sessionStorage.removeItem("trexio_pending_trip");
      sessionStorage.setItem("trexio_checkout_cart", JSON.stringify(selectedItems));
      navigate("/checkout");
    }
  };

  if (!user) {
    return (
      <div className="trx-container py-20 flex flex-col items-center text-center">
        <div className="h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
          <ShoppingCart size={40} weight="duotone" />
        </div>
        <h1 className="text-2xl font-black">Keranjang Pemesanan</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          Silakan masuk ke akun pendaki Anda untuk melihat dan mengelola item perjalanan serta alat gunung dalam keranjang.
        </p>
        <Link to="/login?next=/cart" className="mt-6">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-emerald-600/20">
            Masuk ke Akun Pendaki
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Keranjang Pemesanan | Trexio Outdoor"
        description="Kelola jadwal open trip, privat trip, dan peralatan sewa gunung Anda sebelum melangkah ke pendakian impian."
      />

      <div className="trx-container py-8 md:py-12">
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/60">
          <div>
            <Link to="/explore" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-emerald-600 mb-2 transition-colors">
              <ArrowLeft size={14} /> Kembali Jelajahi Perjalanan
            </Link>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
              Keranjang Pendaki
              <span className="text-xs font-bold px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                {cartItems.length} Item
              </span>
            </h1>
          </div>

          {cartItems.length > 0 && (
            <button
              onClick={clearAllCart}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition-colors self-start md:self-auto"
            >
              <Trash size={14} /> Kosongkan Keranjang
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
            <p className="mt-3 text-sm text-muted-foreground font-medium">Memuat isi keranjang...</p>
          </div>
        ) : cartItems.length === 0 ? (
          /* Empty Cart State */
          <div className="py-16 md:py-24 flex flex-col items-center text-center max-w-lg mx-auto">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-inner">
                <ShoppingCart size={48} weight="duotone" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1.5 rounded-full shadow-md">
                <Compass size={16} weight="bold" />
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground">
              Keranjang Anda Masih Kosong
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Belum ada Open Trip atau peralatan gunung yang ditambahkan. Mari jelajahi ekspedisi puncak gunung terbaik Indonesia atau persiapkan perlengkapan pendakianmu!
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              <Link to="/explore" className="flex-1">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-2 shadow-md shadow-emerald-600/20">
                  <Compass size={18} /> Ekspedisi Trip
                </Button>
              </Link>
              <Link to="/rental" className="flex-1">
                <Button variant="outline" className="w-full border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-bold rounded-xl gap-2">
                  <Tent size={18} /> Sewa Alat
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Cart Content Layout */
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
            {/* Left Items Column */}
            <div className="space-y-4">
              {/* Select All Bar */}
              <div className="flex items-center justify-between bg-card border border-border/80 rounded-2xl px-5 py-3.5 shadow-sm">
                <label className="flex items-center gap-3 cursor-pointer select-none text-sm font-semibold">
                  <Checkbox
                    checked={selectedIds.length === cartItems.length && cartItems.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Pilih Semua Item"
                    className="data-[state=checked]:bg-emerald-600 border-border"
                  />
                  Pilih Semua ({selectedIds.length}/{cartItems.length} item)
                </label>
                <span className="text-xs text-muted-foreground">
                  Hanya item terpilih yang diproses ke checkout
                </span>
              </div>

              {/* Cart Item Cards */}
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isTrip = item.item_type === "trip" || item.item_type === "open_trip";

                  return (
                    <div
                      key={item.id}
                      data-testid={`cart-item-${item.id}`}
                      className={`group relative bg-card border rounded-2xl p-4 sm:p-5 transition-all duration-200 flex flex-col sm:flex-row sm:items-center gap-4 ${
                        isSelected
                          ? "border-emerald-500/60 shadow-md shadow-emerald-500/5 bg-emerald-500/[0.02]"
                          : "border-border/80 opacity-80"
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="flex items-center self-start sm:self-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectItem(item.id)}
                          aria-label={`Pilih ${item.title}`}
                          className="data-[state=checked]:bg-emerald-600 border-border"
                        />
                      </div>

                      {/* Image Thumbnail */}
                      <div className="relative w-24 h-24 sm:w-28 sm:h-24 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/40">
                        <img
                          src={item.cover_image || "/logo.png"}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                          isTrip ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
                        }`}>
                          {isTrip ? "Trip" : "Rental"}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <h3 className="font-bold text-base text-foreground leading-snug line-clamp-1 group-hover:text-emerald-600 transition-colors">
                          {item.title}
                        </h3>

                        {item.departure_date && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarBlank size={14} className="text-emerald-600" />
                            <span>
                              Keberangkatan:{" "}
                              <strong className="text-foreground">
                                {new Date(item.departure_date).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </strong>
                            </span>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground font-medium">
                          Harga Satuan: <span className="text-foreground font-semibold">{formatRupiah(item.price)}</span>
                        </div>

                        {/* Mobile view subtotal */}
                        <div className="sm:hidden pt-2 font-black text-emerald-700 dark:text-emerald-400 text-sm">
                          Subtotal: {formatRupiah(item.price * item.quantity)}
                        </div>
                      </div>

                      {/* Actions & Quantity Controls */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/40">
                        <div className="hidden sm:block font-black text-emerald-700 dark:text-emerald-400 text-base">
                          {formatRupiah(item.price * item.quantity)}
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Quantity Counter */}
                          <div className="flex items-center border border-border rounded-xl bg-background overflow-hidden p-0.5 shadow-sm">
                            <button
                              type="button"
                              aria-label="Kurangi Jumlah"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 rounded-lg transition-colors"
                            >
                              <Minus size={13} weight="bold" />
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-foreground">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="Tambah Jumlah"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                              <Plus size={13} weight="bold" />
                            </button>
                          </div>

                          {/* Delete Item Button */}
                          <button
                            type="button"
                            aria-label={`Hapus ${item.title}`}
                            onClick={() => removeItem(item.id, item.title)}
                            className="p-2 rounded-xl text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                            title="Hapus dari keranjang"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Order Summary Column */}
            <div className="space-y-4 lg:sticky lg:top-24">
              <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm space-y-5">
                <h3 className="font-black text-lg text-foreground flex items-center justify-between border-b border-border/60 pb-3">
                  Ringkasan Pemesanan
                  <Ticket size={20} className="text-emerald-600" />
                </h3>

                {/* Promo Code Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Tag size={14} className="text-emerald-600" /> Kode Voucher / Kupon
                  </label>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle size={16} className="text-emerald-600" />
                        Voucher {appliedCoupon.code}
                      </span>
                      <button
                        onClick={removeCoupon}
                        className="text-rose-500 hover:underline font-bold text-[11px]"
                      >
                        Lepas
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Contoh: TREXIO10"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="rounded-xl border-border bg-background text-xs font-semibold uppercase"
                      />
                      <Button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={isValidatingCoupon || !couponCode.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl px-4 shrink-0"
                      >
                        {isValidatingCoupon ? "..." : "Pakai"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Calculations Breakdown */}
                <div className="space-y-2.5 text-sm pt-2 border-t border-border/60">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal ({selectedIds.length} item)</span>
                    <span className="font-semibold text-foreground">{formatRupiah(subtotal)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-800 dark:text-emerald-400 font-semibold">
                      <span>Diskon Kupon</span>
                      <span>-{formatRupiah(discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>Biaya Layanan</span>
                    <span className="text-emerald-800 dark:text-emerald-400 font-bold">GRATIS</span>
                  </div>

                  <div className="pt-3 border-t border-border/80 flex justify-between items-baseline">
                    <span className="font-black text-base text-foreground">Total Pembayaran</span>
                    <div className="text-right">
                      <span className="text-xl font-black text-emerald-800 dark:text-emerald-400">
                        {formatRupiah(finalTotal)}
                      </span>
                      <p className="text-[10px] text-muted-foreground">Sudah termasuk pajak & jaminan</p>
                    </div>
                  </div>
                </div>

                {/* Checkout CTA Button */}
                <Button
                  data-testid="cart-checkout-btn"
                  onClick={handleProceedToCheckout}
                  disabled={selectedIds.length === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-sm gap-2 shadow-lg shadow-emerald-600/20 trx-btn-press"
                >
                  Lanjut Pemesanan <ArrowRight size={18} weight="bold" />
                </Button>

                {/* Security Guarantee Badge */}
                <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-muted-foreground font-medium">
                  <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                  Pemesanan Aman & Terverifikasi Mitra Trexio
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
