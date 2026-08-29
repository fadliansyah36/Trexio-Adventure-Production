import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, formatRupiah, formatApiError } from "@/lib/api";
import { addItemToCart } from "@/lib/cartStorage";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import SEO from "@/components/site/SEO";
import { generateRentalGearSchema } from "@/services/seoService";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Minus, Package, MapPin, ArrowLeft, Check, Storefront as StoreIcon, Star } from "@phosphor-icons/react";
import VendorVerifiedBadge from "@/components/site/VendorVerifiedBadge";

export default function RentalDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [item, setItem] = useState(null);
  const [qty, setQty] = useState(1);
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [pickupLoc, setPickupLoc] = useState("");
  const [contact, setContact] = useState({ name: user?.name || "", phone: "" });
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/rentals/${id}`).then((r) => {
      setItem(r.data);
      setPickupLoc(r.data.pickup_locations?.[0] || "");
    });
  }, [id]);

  if (!item) return <div className="trx-container py-20">Memuat...</div>;

  const features = Array.isArray(item.features)
    ? item.features
    : typeof item.features === "string"
    ? item.features.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const pickupLocations = Array.isArray(item.pickup_locations)
    ? item.pickup_locations
    : typeof item.pickup_locations === "string"
    ? item.pickup_locations.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const days =
    pickupDate && returnDate
      ? Math.max(1, Math.ceil((new Date(returnDate) - new Date(pickupDate)) / 86400000))
      : 1;
  const subtotal = item.price_per_day * qty * days;

  async function handleAddToCart() {
    if (!item) return;
    try {
      await addItemToCart({
        item_id: item.id,
        item_type: "rental",
        title: item.name || item.title,
        price: item.price_per_day,
        quantity: qty,
        cover_image: item.cover_image || item.image,
      });
      toast.success(`"${item.name || item.title}" telah ditambahkan ke keranjang!`);
    } catch (e) {
      toast.error("Gagal menambahkan ke keranjang");
    }
  }

  async function submit() {
    if (!user) return nav(`/login?next=/rental/${id}`);
    if (!pickupDate || !returnDate) return toast.error("Pilih tanggal ambil dan kembali");
    if (new Date(returnDate) <= new Date(pickupDate))
      return toast.error("Tanggal kembali harus setelah tanggal ambil");
    if (!contact.name || !contact.phone) return toast.error("Isi data kontak");
    setLoading(true);
    try {
      const { data } = await api.post("/rentals/orders", {
        items: [{ rental_id: id, quantity: qty }],
        pickup_date: pickupDate,
        return_date: returnDate,
        pickup_location: pickupLoc,
        contact_name: contact.name,
        contact_phone: contact.phone,
        notes,
      });
      toast.success(`Rental ${data.order_code} dibuat!`);
      window.dispatchEvent(new CustomEvent("trexio:booking-updated"));
      nav("/my-rentals");
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pb-20">
      <SEO
        title={`Sewa ${item.title}`}
        description={item.description || `Sewa ${item.title} berkualitas untuk keperluan camping dan outdoor. Harga sewa ${formatRupiah(item.price_per_day)}/hari di Trexio.`}
        image={item.image || item.cover_image}
        keywords={`sewa ${item.title}, rental outdoor, alat camping, peralatan naik gunung, trexio`}
        type="product"
        jsonLd={generateRentalGearSchema(item)}
      />
      <div className="trx-container pt-8">
        <Link to="/rental" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft size={14} /> Kembali ke rental
        </Link>
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10">
          <div>
            <div className="aspect-square max-h-[500px] overflow-hidden rounded-md bg-muted">
              <img src={item.cover_image} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
            </div>
            <div className="mt-6">
              <div className="trx-overline text-muted-foreground">{item.category}</div>
              <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tighter">
                {item.name}
              </h1>
              <p className="mt-3 text-foreground/80">{item.description}</p>
              {features.length > 0 && (
                <div className="mt-6">
                  <div className="font-bold">Fitur</div>
                  <ul className="mt-2 space-y-1">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check size={16} className="mt-0.5 text-[hsl(var(--secondary))]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="mt-6">
                <div className="font-bold">Lokasi Pickup</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {pickupLocations.map((l) => (
                    <span key={l} className="rounded-sm border border-border px-3 py-1 text-xs font-semibold inline-flex items-center gap-1">
                      <MapPin size={12} /> {l}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white border border-border rounded-md p-6">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Harga sewa</div>
              <div className="mt-1 text-3xl font-black text-[hsl(var(--secondary))]">
                {formatRupiah(item.price_per_day)}
                <span className="text-sm text-muted-foreground font-medium">/hari</span>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <Label>Jumlah</Label>
                  <div className="mt-2 inline-flex items-center gap-3 border border-border rounded-md p-1">
                    <button
                      data-testid="rental-qty-minus"
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="grid place-items-center h-9 w-9 hover:bg-muted rounded-sm"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-8 text-center font-bold">{qty}</span>
                    <button
                      data-testid="rental-qty-plus"
                      onClick={() => setQty(Math.min(item.stock, qty + 1))}
                      className="grid place-items-center h-9 w-9 hover:bg-muted rounded-sm"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Stok: {item.stock}</p>
                </div>
                <div>
                  <Label>Tanggal Ambil</Label>
                  <Input
                    data-testid="rental-pickup-date"
                    type="date"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Tanggal Kembali</Label>
                  <Input
                    data-testid="rental-return-date"
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Lokasi Pickup</Label>
                  <Select value={pickupLoc} onValueChange={setPickupLoc}>
                    <SelectTrigger data-testid="rental-pickup-loc">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pickupLocations.map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nama pemesan</Label>
                  <Input
                    data-testid="rental-name"
                    value={contact.name}
                    onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>No HP</Label>
                  <Input
                    data-testid="rental-phone"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Catatan (opsional)</Label>
                  <Textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-6 border-t border-border pt-4 space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{qty} × {formatRupiah(item.price_per_day)} × {days} hari</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between font-black text-lg">
                  <span>Total</span>
                  <span data-testid="rental-total" className="text-[hsl(var(--secondary))]">
                    {formatRupiah(subtotal)}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <Button
                  type="button"
                  onClick={handleAddToCart}
                  variant="outline"
                  className="w-full border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 font-bold rounded-md trx-btn-press"
                >
                  + Tambah ke Keranjang
                </Button>
                <Button
                  data-testid="rental-order-btn"
                  onClick={submit}
                  disabled={loading}
                  className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white font-bold rounded-md trx-btn-press"
                >
                  {loading ? "Memproses..." : "Pesan Sekarang"}
                </Button>
              </div>
              <p className="mt-2 text-[11px] text-center text-muted-foreground">
                Pembayaran dilakukan saat pickup di lokasi.
              </p>

              <div className="mt-6 pt-5 border-t border-border space-y-3">
                <div className="trx-overline text-muted-foreground">Mitra Penyedia Alat</div>
                <div className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-muted/20 hover:border-emerald-500/50 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-card border border-border overflow-hidden flex items-center justify-center shrink-0">
                    {item.vendor_logo || item.vendor?.logo ? (
                      <img src={item.vendor_logo || item.vendor?.logo} alt={item.vendor_name || item.vendor?.brand_name} className="w-full h-full object-cover" />
                    ) : (
                      <StoreIcon size={20} className="text-emerald-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-extrabold text-xs text-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        {item.vendor_name || item.vendor?.brand_name || "TREXIO Partner"}
                      </span>
                      <VendorVerifiedBadge verified={item.vendor_verified || item.vendor?.verified} showUnverified={false} />
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                        <Star size={11} weight="fill" /> {item.vendor_rating || item.vendor?.rating || 5.0}
                      </span>
                      <span>•</span>
                      <span>Official Store</span>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/vendor/${item.vendor_slug || item.vendor?.slug || 'trexio-official'}`}
                  data-testid="rental-vendor-storefront-btn"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-3.5 py-2 text-xs font-bold transition-all"
                >
                  <StoreIcon size={15} /> Lihat Store Vendor
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
