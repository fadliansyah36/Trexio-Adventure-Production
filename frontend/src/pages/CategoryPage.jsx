import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, formatRupiah, safeArray } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { addItemToCart } from "@/lib/cartStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CatalogFilterSidebar from "@/components/site/CatalogFilterSidebar";
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
  Compass,
  Sparkle,
  UserCheck,
  Backpack,
  Package,
  HouseLine,
  Tent,
  House,
  Bus,
  Car,
  Mountains,
  Ticket,
  Star,
  MapPin,
  MagnifyingGlass,
  ArrowRight,
  CheckCircle,
  CaretRight,
  ChatCircleText,
  SlidersHorizontal,
  Funnel,
  ShoppingCart,
  Calendar,
  Plus,
  Minus,
} from "@phosphor-icons/react";

const MODAL_CAT_CONFIGS = {
  "open-trip": {
    unitLabel: "Jumlah Peserta (Pax)",
    dateLabel: "Pilih Slot Batch Keberangkatan",
    notesPlaceholder: "Contoh: Nama peserta, nomor WhatsApp aktif, ukuran jersey/kaos...",
    defaultUnit: "orang",
  },
  "private-trip": {
    unitLabel: "Jumlah Anggota Grup (Pax)",
    dateLabel: "Pilih Tanggal Keberangkatan",
    notesPlaceholder: "Contoh: Permintaan kustom itinerary, titik penjemputan khusus...",
    defaultUnit: "orang",
  },
  guide: {
    unitLabel: "Jumlah Pemandu / Hari",
    dateLabel: "Pilih Tanggal Layanan Pemanduan",
    notesPlaceholder: "Contoh: Gunung tujuan, estimasi durasi pendakian, kebutuhan bahasa...",
    defaultUnit: "orang",
  },
  porter: {
    unitLabel: "Jumlah Porter / Pax",
    dateLabel: "Pilih Tanggal Layanan Porter",
    notesPlaceholder: "Contoh: Estimasi total muatan (kg), jalur pendakian, titik temu pos...",
    defaultUnit: "orang",
  },
  "rental-gear": {
    unitLabel: "Jumlah Unit / Set Alat",
    dateLabel: "Tanggal Mulai Sewa",
    notesPlaceholder: "Contoh: Durasi sewa (hari), ukuran tenda/sepatu, lokasi pengambilan...",
    defaultUnit: "unit",
  },
  basecamp: {
    unitLabel: "Jumlah Tamu Rehat",
    dateLabel: "Tanggal Rest / Check-in Basecamp",
    notesPlaceholder: "Contoh: Jam estimasi tiba di basecamp, bantuan SIMAKSI...",
    defaultUnit: "orang",
  },
  "camping-ground": {
    unitLabel: "Jumlah Plot / Kavling Tenda",
    dateLabel: "Tanggal Booking Plot Camping",
    notesPlaceholder: "Contoh: Bawa tenda sendiri atau sewa di lokasi, area dekat kawah/danau...",
    defaultUnit: "tenda",
  },
  homestay: {
    unitLabel: "Jumlah Kamar",
    dateLabel: "Tanggal Check-in Akomodasi",
    notesPlaceholder: "Contoh: Jam kedatangan, permintaan extra bed / sarapan lokal...",
    defaultUnit: "kamar",
  },
  shuttle: {
    unitLabel: "Jumlah Kursi Penumpang",
    dateLabel: "Tanggal Keberangkatan Shuttle",
    notesPlaceholder: "Contoh: Titik penjemputan (Stasiun/Bandara/Hotel), jam tiba...",
    defaultUnit: "orang",
  },
  transportasi: {
    unitLabel: "Jumlah Unit Armada / Jeep 4x4",
    dateLabel: "Tanggal Sewa Transportasi",
    notesPlaceholder: "Contoh: Titik jemput, pos/basecamp tujuan, muatan carrier...",
    defaultUnit: "unit",
  },
  "wisata-alam": {
    unitLabel: "Jumlah Tiket / Peserta",
    dateLabel: "Tanggal Kunjungan Wisata",
    notesPlaceholder: "Contoh: Rencana jam kedatangan, permintaan guide lokal...",
    defaultUnit: "orang",
  },
  event: {
    unitLabel: "Jumlah Tiket / BIB Number",
    dateLabel: "Tanggal Pelaksanaan Event",
    notesPlaceholder: "Contoh: Ukuran jersey race pack, nama untuk BIB number...",
    defaultUnit: "orang",
  },
};

const CATEGORY_META = {
  backpacker: {
    name: "Trexio Backpacker",
    icon: Compass,
    heroTitle: "Platform Backpacker, Rute Pintar & Split Cost",
    desc: "Cari rute multi-moda termurah, patungan biaya perjalanan, dan carpool nebeng sesama traveler.",
    badge: "Smart Route & Split Cost",
    actionText: "Buka Backpacker Hub",
    redirectUrl: "/backpacker",
  },
  "open-trip": {
    name: "Open Trip",
    icon: Compass,
    heroTitle: "Marketplace Open Trip & Tour Gabungan",
    desc: "Bergabung dengan petualang lain untuk jelajah destinasi impian dengan biaya lebih terjangkau.",
    badge: "Petualangan Hemat",
    actionText: "Pesan Seat",
  },
  "private-trip": {
    name: "Private Trip",
    icon: Sparkle,
    heroTitle: "Private Trip & Exclusive Custom Tour",
    desc: "Perjalanan eksklusif sesuai tanggal, grup, dan ritme Anda sendiri dengan pelayanan personal.",
    badge: "Eksklusif & Kustom",
    actionText: "Request Private",
  },
  guide: {
    name: "Guide",
    icon: UserCheck,
    heroTitle: "Pemandu Gunung & Local Guide Terlisensi",
    desc: "Temukan pemandu profesional bersertifikasi APGI / BNSP dengan standar keselamatan tinggi.",
    badge: "Sertifikasi APGI & BNSP",
    actionText: "Sewa Guide",
  },
  porter: {
    name: "Porter",
    icon: Backpack,
    heroTitle: "Jasa Porter Pendakian Gunung",
    desc: "Layanan angkut logistik & perlengkapan oleh warga lokal tangguh dan terpercaya.",
    badge: "Kapasitas 20kg - 25kg",
    actionText: "Sewa Porter",
  },
  "rental-gear": {
    name: "Rental Gear",
    icon: Package,
    heroTitle: "Sewa Tenda & Alat Outdoor Steril",
    desc: "Peralatan kemping berkualitas tinggi, terawat, dan bebas kuman siap pakai untuk pendakian Anda.",
    badge: "Peralatan Terawat",
    actionText: "Sewa Alat",
  },
  basecamp: {
    name: "Basecamp",
    icon: HouseLine,
    heroTitle: "Basecamp & Pos Registrasi Pendakian",
    desc: "Tempat rehat resmi, pengurusan SIMAKSI, cek kesehatan, dan persiapan fisik sebelum summit.",
    badge: "Pos Resmi & SIMAKSI",
    actionText: "Booking Rest Area",
  },
  "camping-ground": {
    name: "Camping Ground",
    icon: Tent,
    heroTitle: "Camping Ground & Glamping Alam",
    desc: "Lokasi berkemah terindah di tepi danau, kawah, dan hutan pinus dengan fasilitas lengkap.",
    badge: "Spot Danau & Kawah",
    actionText: "Booking Plot",
  },
  homestay: {
    name: "Homestay",
    icon: House,
    heroTitle: "Penginapan & Homestay Lokal Ramah Pendaki",
    desc: "Akomodasi bersih nan hangat dikelola oleh warga lokal sekitar lereng gunung.",
    badge: "Lokal & Nyaman",
    actionText: "Pesan Kamar",
  },
  shuttle: {
    name: "Shuttle",
    icon: Bus,
    heroTitle: "Shuttle Travel Antar-Jemput Stasiun & Bandara",
    desc: "Layanan transportasi terintegrasi langsung dari titik kedatangan ke pintu pendakian.",
    badge: "Koneksi Langsung",
    actionText: "Pesan Kursi",
  },
  transportasi: {
    name: "Transportasi",
    icon: Car,
    heroTitle: "Jeep 4x4, Pick-up, & Transportasi Lokal",
    desc: "Sewa Jeep Hardtop 4WD, pick-up bak pendaki, dan charter armada offroad resmi.",
    badge: "Armada Offroad 4WD",
    actionText: "Charter Jeep",
  },
  "wisata-alam": {
    name: "Wisata Alam",
    icon: Mountains,
    heroTitle: "Ekowisata, Air Terjun, & Kawah Alam",
    desc: "Eksplorasi keajaiban alam nusantara dengan tiket resmi dan pemandu habitat lokal.",
    badge: "Keajaiban Alam",
    actionText: "Beli Tiket Tour",
  },
  event: {
    name: "Event",
    icon: Ticket,
    heroTitle: "Outdoor Event, Festival, & Trail Run",
    desc: "Ikuti festival kebersihan gunung, lomba lari lintas alam, dan gathering komunitas outdoor.",
    badge: "Gathering & Lomba",
    actionText: "Daftar Event",
  },
};

export default function CategoryPage() {
  const { categorySlug } = useParams();
  const [searchParams] = useSearchParams();
  const slug = (categorySlug || "open-trip").toLowerCase();
  const meta = CATEGORY_META[slug] || CATEGORY_META["open-trip"];
  const CategoryIcon = meta.icon;

  const { user } = useAuth();
  const nav = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [priceRange, setPriceRange] = useState([0, 10000000]);
  const [selectedDifficulty, setSelectedDifficulty] = useState("Semua");
  const [selectedLocation, setSelectedLocation] = useState("Semua");
  const [sortBy, setSortBy] = useState("populer");
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderDate, setOrderDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]
  );
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/categories/${slug}`)
      .then((res) => {
        const fetchedItems = Array.isArray(res.data?.items) ? res.data.items : Array.isArray(res.data) ? res.data : [];
        setItems(fetchedItems);

        const targetItemId = searchParams.get("item") || searchParams.get("id");
        if (targetItemId) {
          const matchedItem = fetchedItems.find((i) => String(i.id) === String(targetItemId));
          if (matchedItem) {
            if (matchedItem.trip_id) {
              nav(`/trip/${matchedItem.trip_id}`);
            } else {
              setSelectedItem(matchedItem);
              setOrderModalOpen(true);
            }
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load category items", err);
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [slug, searchParams, nav]);

  const locationOptions = ["Semua", ...Array.from(new Set(items.map((i) => i.location?.trim()).filter(Boolean)))];
  const difficultyOptions = ["Semua", "Pemula", "Menengah", "Ekstrem"];

  const activeFiltersCount =
    (priceRange[0] > 0 || priceRange[1] < 10000000 ? 1 : 0) +
    (selectedDifficulty !== "Semua" ? 1 : 0) +
    (selectedLocation !== "Semua" ? 1 : 0);

  function resetFilters() {
    setPriceRange([0, 10000000]);
    setSelectedDifficulty("Semua");
    setSelectedLocation("Semua");
    setSortBy("populer");
    setSearch("");
  }

  const filteredItems = items
    .filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesSearch =
          item.title?.toLowerCase().includes(q) ||
          item.location?.toLowerCase().includes(q) ||
          item.provider?.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      const itemPrice = Number(item.price) || 0;
      if (itemPrice < priceRange[0] || itemPrice > priceRange[1]) {
        return false;
      }

      if (selectedDifficulty !== "Semua") {
        const specStr = safeArray(item.specs).join(" ");
        const text = (specStr + " " + (item.description || "") + " " + (item.title || "")).toLowerCase();
        if (!text.includes(selectedDifficulty.toLowerCase())) {
          return false;
        }
      }

      if (selectedLocation !== "Semua") {
        if (!item.location?.toLowerCase().includes(selectedLocation.toLowerCase())) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "termurah") return (a.price || 0) - (b.price || 0);
      if (sortBy === "termahal") return (b.price || 0) - (a.price || 0);
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      return 0;
    });

  const handleQuantityKeyDown = (e) => {
    // Prevent non-numeric key presses (e, E, +, -, ., ,)
    if (["e", "E", "+", "-", ".", ","].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleQuantityChange = (val) => {
    // Strip any non-digit characters
    const digitsOnly = String(val).replace(/\D/g, "");

    // Prevent clearing to empty string or 0 - enforce minimum value constraint 1 immediately
    if (!digitsOnly || parseInt(digitsOnly, 10) < 1) {
      setQuantity(1);
      return;
    }

    const parsed = parseInt(digitsOnly, 10);
    const maxVal = selectedItem?.seats_left || selectedItem?.stock || 999;
    const clamped = Math.max(1, Math.min(maxVal, parsed));
    setQuantity(clamped);
  };

  const handleQuantityBlur = () => {
    const maxVal = selectedItem?.seats_left || selectedItem?.stock || 999;
    const num = parseInt(quantity, 10);
    if (isNaN(num) || num < 1) {
      setQuantity(1);
    } else if (num > maxVal) {
      setQuantity(maxVal);
    }
  };

  function handleOpenOrder(item) {
    if (item.trip_id) {
      nav(`/trip/${item.trip_id}`);
      return;
    }
    setSelectedItem(item);
    setQuantity(1);
    setNotes("");

    const dates = Array.isArray(item.available_dates) && item.available_dates.length > 0
      ? item.available_dates
      : (Array.isArray(item.departure_dates) ? item.departure_dates : []);

    if (dates.length > 0) {
      const firstDate = typeof dates[0] === "object" ? (dates[0].date || "") : String(dates[0]);
      if (firstDate) setOrderDate(firstDate);
    } else {
      setOrderDate(new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]);
    }
    setOrderModalOpen(true);
  }

  async function handleProcessOrder(e, actionType = "cart") {
    if (e) e.preventDefault();
    if (!user) {
      toast.error("Silakan login terlebih dahulu untuk melakukan pemesanan");
      nav("/login");
      return;
    }

    const finalQty = Math.max(1, parseInt(quantity, 10) || 1);
    if (!orderDate) {
      toast.error("Silakan pilih tanggal terlebih dahulu");
      return;
    }

    setSubmitting(true);
    const catCfg = MODAL_CAT_CONFIGS[slug] || MODAL_CAT_CONFIGS["open-trip"];

    const payload = {
      item_id: selectedItem?.id || `cat_item_${Date.now()}`,
      item_type: selectedItem?.category || slug,
      title: selectedItem?.title || "Layanan Outdoor",
      price: Number(selectedItem?.price || 0),
      quantity: finalQty,
      cover_image: selectedItem?.image || "",
      departure_date: orderDate,
      options: {
        price_unit: selectedItem?.price_unit || catCfg.defaultUnit,
        provider: selectedItem?.provider || "Penyedia Terverifikasi",
        notes: notes,
        category: selectedItem?.category || slug,
        location: selectedItem?.location || "",
        rating: selectedItem?.rating || 5.0,
      },
    };

    try {
      await addItemToCart(payload);
      setOrderModalOpen(false);

      if (actionType === "checkout") {
        sessionStorage.setItem("trexio_checkout_cart", JSON.stringify([payload]));
        toast.success("Mengarahkan ke pembayaran...");
        nav("/checkout");
      } else {
        toast.success(`"${selectedItem?.title}" berhasil ditambahkan ke keranjang!`, {
          description: `${finalQty} x ${formatRupiah(selectedItem?.price || 0)} • ${orderDate}`,
        });
      }
    } catch (err) {
      console.error("Failed to add order to cart", err);
      toast.error("Gagal memproses pemesanan, silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  const currentCatConfig = MODAL_CAT_CONFIGS[slug] || MODAL_CAT_CONFIGS["open-trip"];
  const calcQuantityNum = parseInt(quantity, 10) || 1;

  return (
    <div className="pb-20 min-h-screen bg-slate-50/50 dark:bg-zinc-950">
      {/* HEADER BANNER */}
      <section className="bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-900 text-white pt-10 pb-14 border-b border-emerald-900/30">
        <div className="trx-container">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium mb-4">
            <Link to="/" className="hover:underline">
              Beranda
            </Link>
            <CaretRight size={12} />
            <span className="text-slate-300">Kategori</span>
            <CaretRight size={12} />
            <span className="text-emerald-400 font-bold">{meta.name}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 mb-3">
                <CategoryIcon size={16} weight="fill" />
                {meta.badge}
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
                {meta.heroTitle}
              </h1>
              <p className="mt-3 text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
                {meta.desc}
              </p>
            </div>

            {/* QUICK STAT BADGE */}
            <div className="bg-white/10 backdrop-blur border border-white/15 p-4 rounded-xl flex items-center gap-4 text-white min-w-[220px]">
              <div className="h-12 w-12 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <CategoryIcon size={26} weight="bold" />
              </div>
              <div>
                <div className="text-2xl font-black">{items.length} Layanan</div>
                <div className="text-xs text-slate-300">Tersedia di {meta.name}</div>
              </div>
            </div>
          </div>

          {/* SEARCH IN CATEGORY */}
          <div className="mt-8 max-w-2xl">
            <div className="relative flex items-center">
              <MagnifyingGlass
                size={18}
                className="absolute left-3.5 text-slate-400"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Cari nama, lokasi, atau penyedia ${meta.name.toLowerCase()}…`}
                className="pl-10 pr-4 py-2.5 h-11 bg-white dark:bg-zinc-900 border-white/20 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg shadow-lg focus-visible:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 12 CATEGORIES PWA SWIPABLE BAR */}
      <div className="sticky top-14 z-20 bg-background/95 backdrop-blur border-b border-border shadow-xs py-2.5">
        <div className="trx-container">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 pr-4">
            {Object.entries(CATEGORY_META).map(([catKey, catVal]) => {
              const IconComp = catVal.icon;
              const isActive = catKey === slug;
              return (
                <Link
                  key={catKey}
                  to={`/category/${catKey}`}
                  data-testid={`category-tab-${catKey}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 border ${
                    isActive
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs scale-105"
                      : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
                  }`}
                >
                  <IconComp size={15} weight={isActive ? "fill" : "regular"} />
                  <span>{catVal.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* CONTENT GRID WITH COLLAPSIBLE FILTER SIDEBAR */}
      <section className="trx-container mt-6">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-5">
          <div className="text-xs sm:text-sm font-semibold text-muted-foreground">
            Menampilkan <span className="text-foreground font-extrabold">{filteredItems.length}</span> produk & layanan
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowMobileFilter(!showMobileFilter)}
              variant="outline"
              size="sm"
              className="lg:hidden text-xs font-bold gap-1.5 rounded-xl border-border hover:bg-emerald-500/10"
              data-testid="toggle-filter-btn"
            >
              <SlidersHorizontal size={15} className="text-emerald-600" />
              <span>Filter</span>
              {activeFiltersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-700 text-white">
                  {activeFiltersCount}
                </span>
              )}
            </Button>

            <div className="text-[11px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-bold hidden sm:flex items-center gap-1">
              <CheckCircle size={14} weight="fill" /> Terverifikasi TREXIO
            </div>
          </div>
        </div>

        {/* MOBILE DRAWER / OVERLAY FILTER */}
        {showMobileFilter && (
          <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-xs flex justify-end lg:hidden animate-in fade-in duration-200">
            <div className="w-full max-w-xs sm:max-w-sm bg-background h-full overflow-y-auto p-4 pb-24 shadow-2xl">
              <CatalogFilterSidebar
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                selectedDifficulty={selectedDifficulty}
                setSelectedDifficulty={setSelectedDifficulty}
                selectedLocation={selectedLocation}
                setSelectedLocation={setSelectedLocation}
                difficultyOptions={difficultyOptions}
                locationOptions={locationOptions}
                sortBy={sortBy}
                setSortBy={setSortBy}
                resetFilters={resetFilters}
                activeFiltersCount={activeFiltersCount}
                isCollapsed={false}
                setIsCollapsed={() => setShowMobileFilter(false)}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* DESKTOP SIDEBAR FILTER */}
          <div className="hidden lg:block lg:col-span-1 sticky top-20">
            <CatalogFilterSidebar
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              selectedDifficulty={selectedDifficulty}
              setSelectedDifficulty={setSelectedDifficulty}
              selectedLocation={selectedLocation}
              setSelectedLocation={setSelectedLocation}
              difficultyOptions={difficultyOptions}
              locationOptions={locationOptions}
              sortBy={sortBy}
              setSortBy={setSortBy}
              resetFilters={resetFilters}
              activeFiltersCount={activeFiltersCount}
            />
          </div>

          {/* MAIN CATALOG GRID */}
          <div className="lg:col-span-3">
            {slug === "backpacker" && (
              <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-zinc-900 text-white border border-emerald-500/40 shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white">
                      TREXIO BACKPACKER HUB
                    </span>
                    <h3 className="text-lg font-black mt-1">
                      Platform Petualang Independen &amp; Hemat
                    </h3>
                    <p className="text-xs text-slate-300">
                      Akses rute multi-moda pintar, patungan biaya perjalanan (Equal/Split), dan temukan teman nebeng (carpool).
                    </p>
                  </div>
                  <Link
                    to="/backpacker"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shrink-0 flex items-center justify-center gap-1.5 self-start sm:self-auto"
                  >
                    Buka Trexio Backpacker →
                  </Link>
                </div>
              </div>
            )}

            {loading ? (
              <div className="py-20 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
                <p className="mt-3 text-xs text-muted-foreground font-medium">
                  Memuat katalog {meta.name}…
                </p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-16 border border-dashed border-border rounded-2xl p-8 text-center bg-card">
                <CategoryIcon size={48} className="mx-auto text-muted-foreground opacity-50 mb-3" />
                <h3 className="text-base font-bold">Belum Ada Produk Ditemukan</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  Tidak ada produk/layanan yang cocok dengan kriteria filter saat ini. Coba reset filter atau ganti kata kunci.
                </p>
                <Button
                  onClick={resetFilters}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                >
                  Reset Semua Filter
                </Button>
              </div>
            ) : (
              /* ONLINE STORE 2-COLUMN CATALOG GRID (grid grid-cols-2) */
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4 md:gap-5">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    data-testid={`category-card-${item.id}`}
                    className="bg-card border border-border/80 rounded-2xl overflow-hidden hover:border-emerald-500/60 hover:shadow-lg transition-all flex flex-col justify-between group h-full"
                  >
                    <div>
                      {/* COVER IMAGE CONTAINER */}
                      <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-muted">
                        <img
                          src={item.image}
                          alt={item.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute top-2 left-2 bg-emerald-700/90 backdrop-blur text-white px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-extrabold tracking-wider uppercase shadow-xs">
                          {item.badge}
                        </span>

                        {/* RATING OVERLAY */}
                        <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur text-amber-400 px-1.5 py-0.5 rounded-md text-[10px] font-black flex items-center gap-0.5 shadow-xs">
                          <Star size={11} weight="fill" />
                          <span className="text-white">{item.rating || "5.0"}</span>
                        </div>
                      </div>

                      {/* DETAILS BODY */}
                      <div className="p-2.5 sm:p-4">
                        <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground mb-1">
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 truncate max-w-[120px]">
                            {item.provider}
                          </span>
                          <span className="text-[10px] hidden sm:inline">
                            ({item.reviews_count || 12} ulasan)
                          </span>
                        </div>

                        <h3 className="font-extrabold text-xs sm:text-sm text-foreground group-hover:text-emerald-600 transition-colors line-clamp-2 leading-tight min-h-[2rem]">
                          {item.title}
                        </h3>

                        <div className="mt-1.5 flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>

                        <p className="mt-1.5 text-[10px] sm:text-xs text-muted-foreground line-clamp-2 leading-relaxed hidden sm:block">
                          {item.description}
                        </p>

                        {safeArray(item.specs).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {safeArray(item.specs).slice(0, 2).map((spec, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted text-[9px] sm:text-[10px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[110px]"
                              >
                                <CheckCircle size={9} className="text-emerald-500 shrink-0" />
                                <span className="truncate">{spec}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {((Array.isArray(item.available_dates) && item.available_dates.length > 0) || (Array.isArray(item.departure_dates) && item.departure_dates.length > 0)) && (
                          <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            <Calendar size={11} className="text-emerald-600 shrink-0" />
                            <span>{(item.available_dates?.length || item.departure_dates?.length)} Slot Keberangkatan</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* PRICING & ACTION FOOTER */}
                    <div className="p-2.5 sm:p-4 pt-2 sm:pt-3 border-t border-border/50 space-y-2">
                      <div className="flex items-baseline justify-between gap-1">
                        <div>
                          <div className="text-[9px] uppercase font-bold text-muted-foreground tracking-tight">
                            Mulai dari
                          </div>
                          <div className="text-xs sm:text-sm md:text-base font-black text-emerald-600 dark:text-emerald-400">
                            {formatRupiah(item.price)}
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          /{item.price_unit}
                        </span>
                      </div>

                      <Button
                        onClick={() => handleOpenOrder(item)}
                        data-testid={`btn-order-${item.id}`}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] sm:text-xs py-1.5 sm:py-2 h-auto rounded-xl shadow-xs flex items-center justify-center gap-1"
                      >
                        <span>{meta.actionText}</span>
                        <ArrowRight size={13} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ORDER / INQUIRY DIALOG */}
      <Dialog open={orderModalOpen} onOpenChange={setOrderModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-black flex items-center gap-2 text-foreground">
              <CategoryIcon className="text-emerald-600 shrink-0" size={24} />
              <span>Pemesanan {selectedItem?.title}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Pengajuan langsung ke penyedia mitra <b className="text-foreground">{selectedItem?.provider || "Trexio Partner"}</b>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => handleProcessOrder(e, "cart")} className="space-y-4 mt-2">
            <div className="p-3 bg-muted/60 border border-border rounded-xl flex items-center gap-3">
              <img
                src={selectedItem?.image}
                alt={selectedItem?.title || "Foto Produk"}
                loading="lazy"
                className="h-14 w-14 object-cover rounded-lg shrink-0 border border-border/50"
              />
              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-sm text-foreground truncate">{selectedItem?.title}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin size={12} className="text-emerald-600 shrink-0" />
                  <span className="truncate">{selectedItem?.location || "Indonesia"}</span>
                </div>
                <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatRupiah(selectedItem?.price || 0)}{" "}
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    / {selectedItem?.price_unit || currentCatConfig.defaultUnit}
                  </span>
                </div>
              </div>
            </div>

            {/* DATE & QUANTITY SELECTION */}
            <div className="space-y-3">
              {(() => {
                const dates = Array.isArray(selectedItem?.available_dates) && selectedItem.available_dates.length > 0
                  ? selectedItem.available_dates
                  : (Array.isArray(selectedItem?.departure_dates) ? selectedItem.departure_dates : []);

                if (dates.length > 0) {
                  return (
                    <div>
                      <label className="text-xs font-bold block mb-1.5 flex items-center justify-between text-foreground">
                        <span>{currentCatConfig.dateLabel}</span>
                        <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          {dates.length} Slot Tersedia
                        </span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1.5 bg-muted/30 border border-border rounded-xl">
                        {dates.map((d, idx) => {
                          const dateVal = typeof d === "object" ? (d.date || "") : String(d);
                          const label = typeof d === "object" && d.label ? d.label : `Batch ${idx + 1}`;
                          const isFull = typeof d === "object" && d.status === "full";
                          const seats = typeof d === "object" && d.seats_left !== undefined ? d.seats_left : null;
                          const isSelected = orderDate === dateVal;

                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={isFull}
                              onClick={() => setOrderDate(dateVal)}
                              className={`p-2.5 rounded-xl text-left transition-all border text-xs flex flex-col justify-between cursor-pointer ${
                                isSelected
                                  ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs"
                                  : isFull
                                  ? "bg-slate-100 dark:bg-slate-900 text-muted-foreground border-border opacity-50 cursor-not-allowed"
                                  : "bg-card text-foreground border-border hover:border-emerald-500"
                              }`}
                            >
                              <div className="font-extrabold text-[11px] truncate">{label}</div>
                              <div className="text-[10px] opacity-90 mt-1 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <Calendar size={11} /> {dateVal}
                                </span>
                                {isFull ? (
                                  <span className="text-red-500 font-extrabold">FULL</span>
                                ) : seats !== null ? (
                                  <span className="font-semibold">{seats} seat</span>
                                ) : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                return (
                  <div>
                    <label className="text-xs font-bold block mb-1 text-foreground">
                      {currentCatConfig.dateLabel || "Tanggal Rencana Pelaksanaan"}
                    </label>
                    <Input
                      type="date"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                      required
                      className="text-xs font-semibold rounded-xl"
                    />
                  </div>
                );
              })()}

              <div>
                <label className="text-xs font-bold block mb-1 text-foreground">
                  {currentCatConfig.unitLabel || `Jumlah (${selectedItem?.price_unit || "unit"})`}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(Math.max(1, (parseInt(quantity, 10) || 1) - 1))}
                    disabled={(parseInt(quantity, 10) || 1) <= 1}
                    className="w-10 h-10 rounded-xl border border-border bg-card hover:bg-muted font-bold flex items-center justify-center text-foreground transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Kurangi"
                  >
                    <Minus size={14} weight="bold" />
                  </button>
                  <Input
                    type="number"
                    min="1"
                    max={selectedItem?.seats_left || selectedItem?.stock || 999}
                    value={quantity}
                    onKeyDown={handleQuantityKeyDown}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    onBlur={handleQuantityBlur}
                    required
                    className="w-24 text-center font-black text-sm rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuantityChange((parseInt(quantity, 10) || 1) + 1)}
                    disabled={(parseInt(quantity, 10) || 1) >= (selectedItem?.seats_left || selectedItem?.stock || 999)}
                    className="w-10 h-10 rounded-xl border border-border bg-card hover:bg-muted font-bold flex items-center justify-center text-foreground transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Tambah"
                  >
                    <Plus size={14} weight="bold" />
                  </button>
                  <span className="text-xs font-bold text-muted-foreground ml-1 uppercase">
                    {selectedItem?.price_unit || currentCatConfig.defaultUnit}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1 text-foreground">Catatan Khusus / Detail Request</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={currentCatConfig.notesPlaceholder}
                className="w-full h-20 p-3 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="font-extrabold text-foreground block">Total Estimasi Biaya</span>
                <span className="text-[10px] text-muted-foreground">
                  {calcQuantityNum} x {formatRupiah(selectedItem?.price || 0)}
                </span>
              </div>
              <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                {formatRupiah((selectedItem?.price || 0) * calcQuantityNum)}
              </span>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-2 mt-5">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={(e) => handleProcessOrder(e, "cart")}
                className="w-full sm:w-auto flex-1 border-border hover:bg-muted font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShoppingCart size={16} />
                <span>+ Keranjang</span>
              </Button>
              <Button
                type="button"
                disabled={submitting}
                onClick={(e) => handleProcessOrder(e, "checkout")}
                className="w-full sm:w-auto flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{submitting ? "Memproses..." : "Pesan Sekarang"}</span>
                <ArrowRight size={15} weight="bold" />
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
