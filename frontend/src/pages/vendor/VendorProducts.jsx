import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api, formatRupiah } from "@/lib/api";
import {
  Package,
  Plus,
  Pencil,
  Trash,
  Compass,
  Sparkle,
  UserCheck,
  Backpack,
  HouseLine,
  Tent,
  House,
  Bus,
  Car,
  Mountains,
  Ticket,
  CheckCircle,
  Tag,
  Eye,
  Info,
  MapPin,
  Clock,
  Users,
  ShieldCheck,
  Star,
  Calendar,
  CalendarBlank,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import ProductImageUploader from "@/components/vendor/ProductImageUploader";
import EmptyState from "@/components/EmptyState";
import { PackageSearch } from "lucide-react";
import { useAutoSave, AutoSaveBadge } from "@/components/vendor/AutoSaveIndicator";

export const MARKETPLACE_12_CATEGORIES = [
  { id: "open-trip", label: "Open Trip" },
  { id: "private-trip", label: "Private Trip" },
  { id: "guide", label: "Guide Gunung / Outdoor" },
  { id: "porter", label: "Porter Pendakian" },
  { id: "rental-gear", label: "Rental Gear & Alat Camping" },
  { id: "basecamp", label: "Basecamp & Pos Pendakian" },
  { id: "camping-ground", label: "Camping Ground Site" },
  { id: "homestay", label: "Homestay & Penginapan Lokal" },
  { id: "shuttle", label: "Shuttle & Antar-Jemput" },
  { id: "transportasi", label: "Transportasi & Armada Jeep 4x4" },
  { id: "wisata-alam", label: "Wisata Alam & Kawah" },
  { id: "event", label: "Event & Outdoor Festival" },
];

export const CATEGORY_CONFIGS = {
  "open-trip": {
    label: "Open Trip",
    icon: Compass,
    badge: "Trip Gabungan",
    priceUnitDefault: "orang",
    titlePlaceholder: "Contoh: Open Trip Rinjani 3D2N via Sembalun - Torean",
    destPlaceholder: "Gunung Rinjani, Lombok NTB",
    priceUnitOptions: ["orang", "peserta", "pax"],
    fields: {
      locationLabel: "Destinasi & Gunung",
      durationLabel: "Durasi Trip",
      maxCapacityLabel: "Kuota Maksimal Seat per Batch (Orang)",
      showRoute: true,
      showEquipment: true,
      showScheduleDates: true,
      scheduleLabel: "Tanggal Keberangkatan & Batch Trip (Multi-Batch)",
    },
    presetSpecs: ["Guide Professional", "SIMAKSI & Asuransi", "Makan 3x Sehari", "Tenda & Logistik"],
    presetIncluded: ["Guide APGI", "Porter Kelompok", "Tenda Dome Kap. 4", "Makan 3x/hari", "SIMAKSI / Izin", "P3K First Aid"],
    presetExcluded: ["Perlengkapan Pribadi", "Transportasi ke Meeting Point", "Tips Guide / Porter"],
    presetEquipment: ["Carrier 50-70L", "Sepatu Gunung Non-Slip", "Jas Hujan / Ponco", "Headlamp & Baterai"],
  },
  "private-trip": {
    label: "Private Trip",
    icon: Sparkle,
    badge: "Eksklusif & Kustom",
    priceUnitDefault: "paket",
    titlePlaceholder: "Contoh: Private Luxury Trip Bromo - Ijen 3D2N Family Group",
    destPlaceholder: "Taman Nasional Bromo Tengger Semeru",
    priceUnitOptions: ["paket", "orang", "grup"],
    fields: {
      locationLabel: "Destinasi / Rute Kustom",
      durationLabel: "Durasi Fleksibel",
      maxCapacityLabel: "Maksimal Anggota Grup (Orang)",
      showRoute: true,
      showEquipment: true,
      showScheduleDates: true,
      scheduleLabel: "Pilihan Slot Tanggal Keberangkatan Private Trip",
    },
    presetSpecs: ["Jadwal Bebas Kustom", "Private Transport & Chef", "Layanan VIP", "Dokumentasi Drone"],
    presetIncluded: ["Private Guide & Porter", "Private Transport HiAce", "Makan Chef Camp", "SIMAKSI & Asuransi"],
    presetExcluded: ["Pengeluaran Pribadi", "Tiket Pesawat / Kereta"],
    presetEquipment: ["Pakaian Hangat", "Sepatu Tracking", "Kamera / HP"],
  },
  guide: {
    label: "Guide Gunung / Outdoor",
    icon: UserCheck,
    badge: "Lisensi APGI & BNSP",
    priceUnitDefault: "hari",
    titlePlaceholder: "Contoh: Jasa Guide Pendakian Gunung Semeru & Bromo - Senior APGI",
    destPlaceholder: "Gunung Semeru & Bromo, Jawa Timur",
    priceUnitOptions: ["hari", "trip", "24 jam"],
    fields: {
      locationLabel: "Cakupan Area Gunung",
      durationLabel: "Durasi Pendampingan",
      maxCapacityLabel: "Maksimal Peserta Didampingi",
      showLicense: true,
      showLanguages: true,
      showScheduleDates: true,
      scheduleLabel: "Jadwal Tanggal Ketersediaan Pendampingan Guide",
    },
    presetSpecs: ["Sertifikasi APGI", "BNSP First Aid", "10+ Thn Pengalaman", "Paham Navigasi Darat"],
    presetIncluded: ["Navigasi Darat & Breifing", "Masak & Logistik Support", "Peralatan Safety & First Aid"],
    presetExcluded: ["Perlengkapan Pribadi Guide", "Tiket Masuk Pendaki"],
    presetEquipment: ["Peralatan Safety Standar", "GPS & Peta Topo", "P3K Komplit"],
  },
  porter: {
    label: "Porter Pendakian",
    icon: Backpack,
    badge: "Kapasitas 20-25kg",
    priceUnitDefault: "hari",
    titlePlaceholder: "Contoh: Jasa Porter Angkut & Masak Gunung Rinjani (Warga Lokal Sembalun)",
    destPlaceholder: "Gunung Rinjani (Sembalun / Senaru)",
    priceUnitOptions: ["hari", "trip", "24 jam"],
    fields: {
      locationLabel: "Area Pos & Gunung",
      durationLabel: "Durasi Layanan",
      maxCapacityLabel: "Kapasitas Angkut Maksimal (kg)",
      showScheduleDates: true,
      scheduleLabel: "Jadwal Tanggal Ketersediaan Jasa Porter",
    },
    presetSpecs: ["Kapasitas 25kg", "Warga Asli Local", "Ahli Masak Camp", "Tangguh & Ramah"],
    presetIncluded: ["Angkut Logistik Max 25kg", "Bantu Pasang Tenda", "Masak Air & Logistik"],
    presetExcluded: ["Barang Pribadi Melebihi 25kg", "Pengeluaran Pribadi"],
    presetEquipment: ["Ransel Angkut Terpal", "Tali Pengikat Aman", "Sepatu Boot Rubber"],
  },
  "rental-gear": {
    label: "Rental Gear & Alat Camping",
    icon: Package,
    badge: "Peralatan Terawat & Steril",
    priceUnitDefault: "hari",
    titlePlaceholder: "Contoh: Sewa Tenda Great Outdoor Camp 4 Person Double Layer Waterproof",
    destPlaceholder: "Basecamp / Toko Outdoor Malang",
    priceUnitOptions: ["hari", "24 jam", "unit/hari"],
    fields: {
      locationLabel: "Lokasi Ambil / Toko",
      durationLabel: "Durasi Sewa Minimum",
      maxCapacityLabel: "Stok Unit Tersedia (Unit)",
      showStock: true,
      showCondition: true,
      showDeposit: true,
      showScheduleDates: false,
    },
    presetSpecs: ["Telah Dicuci Steril", "Waterproof 3000mm", "Frame Alloy Ringan", "Kondisi 98% Baru"],
    presetIncluded: ["Frame & Pasak Lengkap", "Pasak Cadangan & Tas Tenda", "Petunjuk Pemasangan"],
    presetExcluded: ["Kerusakan Akibat Kelalaian", "Ongkir Pengiriman Toko"],
    presetEquipment: ["KTP / SIM Asli (Jaminan)", "Uang Deposit Rp 50.000"],
  },
  basecamp: {
    label: "Basecamp & Pos Pendakian",
    icon: HouseLine,
    badge: "Pos Resmi & Rest Area",
    priceUnitDefault: "malam",
    titlePlaceholder: "Contoh: Basecamp & Rest Area Pendaki Gunung Slamet via Bambangan",
    destPlaceholder: "Desa Kutabawa, Purbalingga (Bambangan)",
    priceUnitOptions: ["malam", "orang/malam", "24 jam"],
    fields: {
      locationLabel: "Alamat / Pos Registrasi",
      durationLabel: "Waktu Rehat / Check-in",
      maxCapacityLabel: "Kapasitas Tamu Rehat (Orang)",
      showScheduleDates: false,
    },
    presetSpecs: ["Shower Air Hangat 24h", "Free Wi-Fi Kencang", "Titip Barang Aman", "Colokan Listrik Banyak"],
    presetIncluded: ["Tempat Baring / Rehat", "Air Minum & Teh/Kopi", "Parkir Motor/Mobil 24 Jam", "Mandi Air Hangat"],
    presetExcluded: ["Makan Besar (Tersedia Warung)", "Pengurusan SIMAKSI (Terpisah)"],
    presetEquipment: ["Identitas Diri (KTP)", "Surat Sehat Dokter"],
  },
  "camping-ground": {
    label: "Camping Ground Site",
    icon: Tent,
    badge: "Spot Danau & Kawah",
    priceUnitDefault: "kavling/malam",
    titlePlaceholder: "Contoh: Kavling Tenda Camping Ground Tepi Danau Ranu Kumbolo",
    destPlaceholder: "Ranu Kumbolo, TNBTS Jawa Timur",
    priceUnitOptions: ["kavling/malam", "orang/malam", "malam"],
    fields: {
      locationLabel: "Lokasi Site / Pemandangan",
      durationLabel: "Durasi Sewa Plot",
      maxCapacityLabel: "Kapasitas Tenda per Kavling",
      showScheduleDates: true,
      scheduleLabel: "Pilihan Tanggal Slot Booking Camping Ground",
    },
    presetSpecs: ["View Danau/Kawah", "Toilet & Air Bersih", "Spot Api Unggun", "Aman & Terjaga"],
    presetIncluded: ["Kavling Tenda Ukuran 4x4m", "Akses Toilet & Air Bersih", "Akses Area Api Unggun"],
    presetExcluded: ["Tenda & Alat Camp (Bisa Sewa)", "Kayu Bakar (Beli di Lokasi)"],
    presetEquipment: ["Tenda & Matras", "Sleeping Bag Warm", "Lampu Tenda"],
  },
  homestay: {
    label: "Homestay & Penginapan Lokal",
    icon: House,
    badge: "Lokal & Nyaman",
    priceUnitDefault: "malam",
    titlePlaceholder: "Contoh: Homestay Rinjani Cozy Room - Kamar Mandi Dalam + Air Hangat",
    destPlaceholder: "Desa Senaru, Lombok Utara",
    priceUnitOptions: ["malam", "kamar/malam", "orang/malam"],
    fields: {
      locationLabel: "Lokasi Homestay",
      durationLabel: "Durasi Menginap",
      maxCapacityLabel: "Maksimal Tamu per Kamar",
      showRoomType: true,
      showScheduleDates: false,
    },
    presetSpecs: ["Kamar Mandi Dalam", "Air Hangat Shower", "Termasuk Sarapan", "Free Wi-Fi & Kopi"],
    presetIncluded: ["Sarapan Lokal Hangat", "Handuk & Perlengkapan Mandi", "Air Mineral & Teh/Kopi 24h"],
    presetExcluded: ["Laundry Baju", "Layanan Antar Jemput"],
    presetEquipment: ["Kartu Identitas (KTP/Passport)"],
  },
  shuttle: {
    label: "Shuttle & Antar-Jemput",
    icon: Bus,
    badge: "Koneksi Langsung",
    priceUnitDefault: "orang",
    titlePlaceholder: "Contoh: Shuttle Travel Bandara Lombok ➔ Basecamp Sembalun Rinjani (HiAce)",
    destPlaceholder: "Bandara Lombok (LOP) ke Sembalun",
    priceUnitOptions: ["orang", "trip", "sekali jalan"],
    fields: {
      locationLabel: "Rute Asal ➔ Tujuan",
      durationLabel: "Estimasi Waktu Perjalanan",
      maxCapacityLabel: "Jumlah Kursi Penumpang",
      showPickupPoint: true,
      showVehicleType: true,
      showScheduleDates: false,
    },
    presetSpecs: ["Direct Basecamp", "Full AC & Reclining", "Bagasi Logistik Luas", "Port Charger HP"],
    presetIncluded: ["Armada Full AC", "BBM & E-Toll", "Driver Pengalaman", "Bagasi Carrier Luas"],
    presetExcluded: ["Makan Driver (Bila Bermalam)", "Tips Volunter Driver"],
    presetEquipment: ["Tiket Shuttle / E-Voucher"],
  },
  transportasi: {
    label: "Transportasi Armada Jeep 4x4",
    icon: Car,
    badge: "Armada Offroad 4WD",
    priceUnitDefault: "jeep/trip",
    titlePlaceholder: "Contoh: Charter Jeep Hardtop 4x4 Bromo Sunrise Tour (6 Kursi)",
    destPlaceholder: "Taman Nasional Bromo (Penanjakan - Kawah)",
    priceUnitOptions: ["jeep/trip", "hari", "trip"],
    fields: {
      locationLabel: "Rute & Area Offroad",
      durationLabel: "Durasi Sewa Jeep",
      maxCapacityLabel: "Kapasitas Maksimal Penumpang",
      showVehicleType: true,
      showScheduleDates: false,
    },
    presetSpecs: ["Hardtop 4WD Aktif", "BBM Full Termasuk", "Driver Offroad Handal", "Antar-Jemput Hotel"],
    presetIncluded: ["Jeep 4x4 + Driver", "BBM Full", "Karcis Parkir Area", "Antar Jemput Pos/Hotel"],
    presetExcluded: ["Tiket Masuk Taman Nasional", "Makan & Minum Peserta"],
    presetEquipment: ["Jaket Tebal & Masker", "Kamera / HP"],
  },
  "wisata-alam": {
    label: "Wisata Alam & Kawah",
    icon: Mountains,
    badge: "Keajaiban Alam",
    priceUnitDefault: "tiket",
    titlePlaceholder: "Contoh: Tiket Masuk Eksplorasi Air Terjun Madakaripura + Pemandu Lokal",
    destPlaceholder: "Air Terjun Madakaripura, Probolinggo",
    priceUnitOptions: ["tiket", "orang", "paket"],
    fields: {
      locationLabel: "Lokasi Destinasi Alam",
      durationLabel: "Jam Operasional",
      maxCapacityLabel: "Kapasitas Kuota Harian",
      showScheduleDates: true,
      scheduleLabel: "Jadwal Tanggal Operasional / Event Wisata",
    },
    presetSpecs: ["Tiket Resmi Pemda", "Termasuk Asuransi", "Spot Foto Air Terjun", "Pemandu Lokal Guide"],
    presetIncluded: ["Tiket Masuk Resmi", "Pemandu Air Terjun Lokal", "Jas Hujan Sekali Pakai", "Asuransi Wisata"],
    presetExcluded: ["Sewa Ojek (Bila Ada)", "Pengeluaran Pribadi"],
    presetEquipment: ["Sandal Gunung / Waterproof", "Baju Ganti & Bungkusan HP"],
  },
  event: {
    label: "Event & Outdoor Festival",
    icon: Ticket,
    badge: "Gathering & Lomba",
    priceUnitDefault: "peserta",
    titlePlaceholder: "Contoh: Tiket Registration Rinjani Ultra Trail Run 2026 - Category 21K",
    destPlaceholder: "Sembalun, Lombok NTB",
    priceUnitOptions: ["peserta", "slot", "tiket"],
    fields: {
      locationLabel: "Lokasi Venue Event",
      durationLabel: "Hari Pelaksanaan",
      maxCapacityLabel: "Kuota Slot Tiket (Peserta)",
      showEventDate: true,
      showScheduleDates: true,
      scheduleLabel: "Jadwal Tanggal Pelaksanaan Event / Festival",
    },
    presetSpecs: ["Official Race Jersey", "Finisher Medal", "BIB Number & Timing Chip", "Refreshment Station"],
    presetIncluded: ["Race Pack & Jersey", "BIB Number + Chip", "Medali Finisher", "Refreshment & Water Station", "Gala Dinner"],
    presetExcluded: ["Akomodasi Penginapan", "Transportasi ke Venue"],
    presetEquipment: ["Surat Sehat Dokter", "Sepatu Trail Running"],
  },
};

const INITIAL_FORM = {
  id: null,
  title: "",
  category: "open-trip",
  destination: "Gunung Rinjani, NTB",
  mountain: "Gunung Rinjani",
  route: "Sembalun",
  price: "",
  promo_price: "",
  price_unit: "orang",
  duration: "3 Hari 2 Malam",
  max_participants: "20",
  unit_stock: "10",
  condition: "Steril & Sangat Baik",
  deposit: "0",
  pickup_point: "",
  vehicle_type: "HiAce / Jeep 4x4",
  license: "APGI / BNSP",
  languages: "Indonesian, English",
  room_type: "Kamar Mandi Dalam",
  event_date: "",
  available_dates: [],
  description: "",
  specsStr: "Guide APGI, SIMAKSI, Makan 3x, Tenda Dome",
  includedStr: "Guide Professional, Simaksi / Izin, Tenda & Logistik, Makan 3x Sehari",
  excludedStr: "Perlengkapan Pribadi, Transportasi ke Meeting Point, Pengeluaran Pribadi",
  equipmentStr: "Carrier 50L+, Sepatu Gunung, Jas Hujan, Headlamp, Obat-obatan Pribadi",
  cover_image: "",
  images: [],
};

export default function VendorProducts() {
  const { vendor } = useOutletContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterCat, setFilterCat] = useState("all");
  const [showPreview, setShowPreview] = useState(false);

  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Phase 8 AI Listing Assistant States
  const [aiAssistantLoading, setAiAssistantLoading] = useState(false);
  const [aiDraftResult, setAiDraftResult] = useState(null);
  const [showAiDraftModal, setShowAiDraftModal] = useState(false);

  const handleRunAIListingAssistant = async () => {
    setAiAssistantLoading(true);
    try {
      const res = await api.post("/ai/vendor/copilot/listing-assistant", {
        title: form.title,
        destination: form.location || form.mountain,
        trip_type: currentCategoryConfig.label,
        duration: form.duration,
        highlights_input: form.specsStr,
      });

      if (res.data?.ok && res.data?.draft) {
        setAiDraftResult(res.data.draft);
        setShowAiDraftModal(true);
        toast.success("Draf AI Listing Assistant berhasil dibuat!");
      } else {
        toast.error(res.data?.error || "Gagal membuat draf AI");
      }
    } catch (e) {
      toast.error("Gagal menghubungi AI Listing Assistant");
    } finally {
      setAiAssistantLoading(false);
    }
  };

  const handleApplyAIDraft = () => {
    if (!aiDraftResult) return;
    setForm((prev) => ({
      ...prev,
      title: aiDraftResult.suggested_title || prev.title,
      description: aiDraftResult.description || prev.description,
      specsStr: Array.isArray(aiDraftResult.highlights) ? aiDraftResult.highlights.join(", ") : prev.specsStr,
    }));
    setShowAiDraftModal(false);
    toast.success("Draf AI disetujui & berhasil diterapkan ke formulir produk!");
  };

  // States for adding dynamic schedule/batch booking dates
  const [newScheduleDate, setNewScheduleDate] = useState("");
  const [newScheduleLabel, setNewScheduleLabel] = useState("");
  const [newScheduleSeats, setNewScheduleSeats] = useState("20");

  const currentCategoryConfig = CATEGORY_CONFIGS[form.category] || CATEGORY_CONFIGS["open-trip"];

  const handleAddScheduleDate = () => {
    if (!newScheduleDate) {
      toast.error("Pilih tanggal terlebih dahulu");
      return;
    }
    const dateObj = {
      id: `date_${Date.now()}`,
      date: newScheduleDate,
      label: newScheduleLabel.trim() || `Batch ${(form.available_dates || []).length + 1} (${newScheduleDate})`,
      seats_left: Number(newScheduleSeats) || Number(form.max_participants) || 20,
      status: "open",
    };
    setForm((prev) => ({
      ...prev,
      available_dates: [...(prev.available_dates || []), dateObj],
    }));
    setNewScheduleDate("");
    setNewScheduleLabel("");
    toast.success("Slot tanggal booking berhasil ditambahkan!");
  };

  const handleGeneratePresetBatches = () => {
    const today = new Date();
    const presets = [14, 28, 42].map((daysToAdd, idx) => {
      const d = new Date(today);
      d.setDate(d.getDate() + daysToAdd);
      const dateStr = d.toISOString().split("T")[0];
      const dateFormatted = d.toLocaleDateString("id-ID", { month: "short", day: "numeric" });
      return {
        id: `preset_batch_${idx + 1}_${Date.now()}`,
        date: dateStr,
        label: `Batch ${idx + 1} (${dateFormatted})`,
        seats_left: Number(form.max_participants) || 20,
        status: "open",
      };
    });

    setForm((prev) => ({
      ...prev,
      available_dates: [...(prev.available_dates || []), ...presets],
    }));
    toast.success("3 Slot Batch Tanggal Otomatis Ditambahkan!");
  };

  const handleRemoveScheduleDate = (id) => {
    setForm((prev) => ({
      ...prev,
      available_dates: (prev.available_dates || []).filter((d) => d.id !== id),
    }));
  };

  const handleToggleScheduleStatus = (id) => {
    setForm((prev) => ({
      ...prev,
      available_dates: (prev.available_dates || []).map((d) =>
        d.id === id ? { ...d, status: d.status === "open" ? "full" : "open" } : d
      ),
    }));
  };

  const handleAutoSaveProduct = async (productData) => {
    if (!productData.title && !productData.price) return;
    if (productData.id) {
      await api.patch(`/vendor/products/${productData.id}`, productData);
    }
  };

  const { status: productAutoSaveStatus, lastSavedAt: productAutoSaveTime } = useAutoSave({
    data: form,
    onSave: handleAutoSaveProduct,
    storageKey: `trx_product_draft_${form.id || "new"}`,
    debounceMs: 700,
    enabled: showModal,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const r = await api.get("/vendor/products");
      setProducts(Array.isArray(r.data) ? r.data : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenAdd() {
    const selectedCat = filterCat !== "all" ? filterCat : "open-trip";
    const cfg = CATEGORY_CONFIGS[selectedCat] || CATEGORY_CONFIGS["open-trip"];

    // Default sample batches for open-trip or private-trip
    let initialDates = [];
    if (cfg.fields?.showScheduleDates) {
      const today = new Date();
      initialDates = [14, 28].map((days, idx) => {
        const d = new Date(today);
        d.setDate(d.getDate() + days);
        const dateStr = d.toISOString().split("T")[0];
        const dateFormatted = d.toLocaleDateString("id-ID", { month: "short", day: "numeric" });
        return {
          id: `batch_${idx + 1}_${Date.now()}`,
          date: dateStr,
          label: `Batch ${idx + 1} (${dateFormatted})`,
          seats_left: 20,
          status: "open",
        };
      });
    }

    setForm({
      ...INITIAL_FORM,
      category: selectedCat,
      price_unit: cfg.priceUnitDefault || "orang",
      available_dates: initialDates,
    });
    setShowModal(true);
  }

  function handleCategoryChange(newCat) {
    const config = CATEGORY_CONFIGS[newCat] || CATEGORY_CONFIGS["open-trip"];
    setForm((prev) => ({
      ...prev,
      category: newCat,
      price_unit: config.priceUnitDefault || "orang",
      specsStr: config.presetSpecs ? config.presetSpecs.join(", ") : prev.specsStr,
      includedStr: config.presetIncluded ? config.presetIncluded.join(", ") : prev.includedStr,
      excludedStr: config.presetExcluded ? config.presetExcluded.join(", ") : prev.excludedStr,
      equipmentStr: config.presetEquipment ? config.presetEquipment.join(", ") : prev.equipmentStr,
    }));
  }

  function handleOpenEdit(p) {
    const existingImages =
      Array.isArray(p.images) && p.images.length > 0
        ? p.images
        : Array.isArray(p.gallery) && p.gallery.length > 0
        ? p.gallery
        : p.cover_image
        ? [p.cover_image]
        : [];

    const cat = p.category || "open-trip";
    const cfg = CATEGORY_CONFIGS[cat] || CATEGORY_CONFIGS["open-trip"];

    const loadedDates = Array.isArray(p.available_dates) && p.available_dates.length > 0
      ? p.available_dates.map((d, idx) => {
          if (typeof d === "object" && d !== null) {
            return {
              id: d.id || `date_${idx}_${Date.now()}`,
              date: d.date || "",
              label: d.label || d.date || `Batch ${idx + 1}`,
              seats_left: d.seats_left !== undefined ? Number(d.seats_left) : (p.max_participants || 20),
              status: d.status || "open",
            };
          }
          return {
            id: `date_${idx}_${Date.now()}`,
            date: String(d),
            label: `Batch ${idx + 1} (${String(d)})`,
            seats_left: Number(p.max_participants) || 20,
            status: "open",
          };
        })
      : (Array.isArray(p.departure_dates)
          ? p.departure_dates.map((d, idx) => ({
              id: `date_${idx}_${Date.now()}`,
              date: String(d),
              label: `Batch ${idx + 1} (${String(d)})`,
              seats_left: Number(p.max_participants) || 20,
              status: "open",
            }))
          : []);

    setForm({
      id: p.id,
      title: p.title || "",
      category: cat,
      destination: p.destination || cfg.destPlaceholder || "Indonesia",
      mountain: p.mountain || "",
      route: p.route || "",
      price: p.price || "",
      promo_price: p.promo_price || "",
      price_unit: p.price_unit || cfg.priceUnitDefault || "orang",
      duration: p.duration || "3 Hari 2 Malam",
      max_participants: p.max_participants || "20",
      unit_stock: p.unit_stock || "10",
      condition: p.condition || "Steril & Sangat Baik",
      deposit: p.deposit || "0",
      pickup_point: p.pickup_point || "",
      vehicle_type: p.vehicle_type || "",
      license: p.license || "",
      languages: Array.isArray(p.languages) ? p.languages.join(", ") : p.languages || "",
      room_type: p.room_type || "",
      event_date: p.event_date || "",
      available_dates: loadedDates,
      description: p.description || "",
      specsStr: Array.isArray(p.specs) ? p.specs.join(", ") : p.specs || "",
      includedStr: Array.isArray(p.included) ? p.included.join(", ") : p.included || "",
      excludedStr: Array.isArray(p.excluded) ? p.excluded.join(", ") : p.excluded || "",
      equipmentStr: Array.isArray(p.equipment) ? p.equipment.join(", ") : p.equipment || "",
      cover_image: p.cover_image || existingImages[0] || "",
      images: existingImages,
    });
    setShowModal(true);
  }

  async function handleDeleteProduct(id) {
    if (!window.confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
    try {
      await api.delete(`/vendor/products/${id}`);
      toast.success("Produk berhasil dihapus");
      loadProducts();
    } catch (e) {
      toast.error("Gagal menghapus produk");
    }
  }

  const appendTag = (fieldKey, tag) => {
    setForm((prev) => {
      const currentVal = prev[fieldKey] || "";
      const items = currentVal.split(",").map((s) => s.trim()).filter(Boolean);
      if (items.includes(tag)) return prev;
      items.push(tag);
      return { ...prev, [fieldKey]: items.join(", ") };
    });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || form.price === undefined || form.price === null || form.price === "") {
      toast.error("Judul produk dan harga wajib diisi");
      return;
    }

    if (!form.images || form.images.length === 0) {
      toast.error("Mohon upload minimal 1 foto produk.");
      return;
    }

    setSubmitting(true);
    try {
      const cover = form.cover_image || form.images[0] || "";
      const payload = {
        title: form.title,
        category: form.category,
        destination: form.destination,
        mountain: form.mountain,
        route: form.route,
        price: Number(form.price),
        promo_price: form.promo_price ? Number(form.promo_price) : null,
        price_unit: form.price_unit,
        duration: form.duration,
        max_participants: Number(form.max_participants) || 20,
        unit_stock: Number(form.unit_stock) || 10,
        condition: form.condition,
        deposit: Number(form.deposit) || 0,
        pickup_point: form.pickup_point,
        vehicle_type: form.vehicle_type,
        license: form.license,
        languages: form.languages.split(",").map((s) => s.trim()).filter(Boolean),
        room_type: form.room_type,
        event_date: form.event_date,
        available_dates: form.available_dates || [],
        departure_dates: (form.available_dates || []).map((d) => (typeof d === "object" ? d.date : String(d))),
        description: form.description,
        specs: form.specsStr.split(",").map((s) => s.trim()).filter(Boolean),
        included: form.includedStr.split(",").map((s) => s.trim()).filter(Boolean),
        excluded: form.excludedStr.split(",").map((s) => s.trim()).filter(Boolean),
        equipment: form.equipmentStr.split(",").map((s) => s.trim()).filter(Boolean),
        cover_image: cover,
        images: form.images,
        gallery: form.images,
      };

      if (form.id) {
        await api.patch(`/vendor/products/${form.id}`, payload);
        toast.success("Produk berhasil diperbarui!");
      } else {
        await api.post("/vendor/products", payload);
        toast.success("Produk baru berhasil ditambahkan!");
      }

      setShowModal(false);
      loadProducts();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Gagal menyimpan produk");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = filterCat === "all" ? products : products.filter((p) => p.category === filterCat);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900/10 via-emerald-800/5 to-slate-900/10 p-5 rounded-2xl border border-emerald-500/20 shadow-xs">
        <div>
          <div className="trx-overline text-emerald-600 font-black">Katalog Provider Trexio</div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground">
            Manajemen Produk & Inventory
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Formulir adaptif otomatis disesuaikan dengan karakter khas dari <strong>12 Kategori Marketplace Trexio</strong>.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          data-testid="btn-vendor-add-product"
          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all shadow-md cursor-pointer shrink-0"
        >
          <Plus size={16} weight="bold" /> Tambah Produk Baru
        </button>
      </div>

      {/* Filter Category Bar (12 Categories) */}
      <div className="flex border-b border-border gap-2 text-xs font-bold overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setFilterCat("all")}
          className={`px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer ${
            filterCat === "all"
              ? "bg-slate-900 text-white dark:bg-emerald-600 font-extrabold shadow-xs"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          Semua ({products.length})
        </button>
        {MARKETPLACE_12_CATEGORIES.map((c) => {
          const cfg = CATEGORY_CONFIGS[c.id];
          const IconComp = cfg?.icon || Compass;
          const count = products.filter((p) => p.category === c.id).length;

          return (
            <button
              key={c.id}
              onClick={() => setFilterCat(c.id)}
              className={`px-3 py-1.5 rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                filterCat === c.id
                  ? "bg-emerald-600 text-white font-extrabold shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <IconComp size={14} />
              <span>{c.label}</span>
              <span className="opacity-80 text-[10px] bg-black/10 dark:bg-white/10 px-1.5 py-0.2 rounded-full font-black">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid Catalog */}
      {loading ? (
        <div className="p-12 text-center text-xs font-bold text-muted-foreground">Memuat inventaris produk...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Belum Ada Produk di Kategori Ini"
          description="Tambahkan produk atau layanan adventure Anda agar langsung tampil di marketplace Trexio."
          icon={PackageSearch}
          actionLabel="Tambah Produk Baru"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => {
            const cfg = CATEGORY_CONFIGS[p.category] || CATEGORY_CONFIGS["open-trip"];
            const catLabel = cfg?.label || p.category;
            const photoCount =
              (Array.isArray(p.images) && p.images.length) ||
              (Array.isArray(p.gallery) && p.gallery.length) ||
              (p.cover_image ? 1 : 0);

            return (
              <div
                key={p.id}
                data-testid={`product-card-${p.id}`}
                className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between group hover:border-emerald-500/50 hover:shadow-md transition-all"
              >
                <div>
                  <div className="aspect-[16/9] bg-muted relative overflow-hidden">
                    <img
                      src={
                        p.cover_image ||
                        p.images?.[0] ||
                        p.gallery?.[0] ||
                        "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80"
                      }
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 right-3 bg-slate-900/85 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {catLabel}
                    </span>
                    <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                      <span>📷 {photoCount} Foto</span>
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">{p.destination || "Indonesia"}</span>
                    </div>

                    <h3 className="font-black text-sm text-foreground line-clamp-2 leading-tight">{p.title}</h3>

                    {/* Highlights / Specs Chips */}
                    {Array.isArray(p.specs) && p.specs.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {p.specs.slice(0, 3).map((sp, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold"
                          >
                            <CheckCircle size={10} className="shrink-0" />
                            <span className="truncate">{sp}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground line-clamp-2 pt-1">{p.description}</p>

                    {/* Schedule Dates Badge */}
                    {((Array.isArray(p.available_dates) && p.available_dates.length > 0) || (Array.isArray(p.departure_dates) && p.departure_dates.length > 0)) && (
                      <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 mt-1">
                        <Calendar size={12} weight="bold" className="shrink-0 text-emerald-600" />
                        <span>{(p.available_dates?.length || p.departure_dates?.length)} Slot Batch Tanggal Terbuka</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-border/60 flex justify-between items-center text-xs">
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold">Harga Layanan</div>
                        <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          {formatRupiah(p.price)}{" "}
                          <span className="text-[10px] font-normal text-muted-foreground">/{p.price_unit || "orang"}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground uppercase font-bold">Kapasitas / Stok</div>
                        <div className="font-extrabold text-foreground">
                          {p.category === "rental-gear"
                            ? `${p.unit_stock || 10} Unit`
                            : `${p.booked_seats || 0} / ${p.max_participants || 20} Seat`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-muted/40 border-t border-border flex justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(p)}
                    data-testid={`btn-edit-product-${p.id}`}
                    className="px-3 py-1.5 text-xs font-extrabold bg-card border border-border rounded-xl text-foreground hover:bg-muted flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Pencil size={14} className="text-blue-500" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    data-testid={`btn-delete-product-${p.id}`}
                    className="px-3 py-1.5 text-xs font-extrabold bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-600 rounded-xl hover:bg-rose-100 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash size={14} /> Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Product (Fully Dynamic per 12 Categories) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto min-h-screen">
          <div className="relative bg-card text-card-foreground border border-border rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl my-auto max-h-[calc(100dvh-2rem)] flex flex-col">
            {/* Modal Header */}
            <div className="shrink-0 flex justify-between items-center border-b border-border pb-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Package size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-foreground leading-tight">
                    {form.id ? "Edit Produk / Layanan" : "Tambah Produk / Layanan Baru"}
                  </h3>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                    <span>Kategori: <strong>{currentCategoryConfig.label}</strong></span>
                    <AutoSaveBadge
                      status={productAutoSaveStatus}
                      lastSavedAt={productAutoSaveTime}
                      testid="vendor-product-autosave-badge"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunAIListingAssistant}
                  disabled={aiAssistantLoading}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-[11px] rounded-xl flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Sparkle size={14} weight="fill" />
                  <span>{aiAssistantLoading ? "AI Memproses..." : "AI Listing Assistant"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-3 py-1.5 rounded-xl border border-border bg-muted text-[11px] font-bold flex items-center gap-1.5 hover:bg-accent cursor-pointer"
                >
                  <Eye size={14} /> {showPreview ? "Sembunyikan Preview" : "Live Preview"}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-muted-foreground hover:text-foreground font-black text-lg p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              {/* Category Selector Tab Buttons */}
              <div className="bg-muted/60 p-2.5 rounded-2xl border border-border">
                <label className="font-extrabold uppercase text-[10px] text-muted-foreground block mb-1.5">
                  Pilih 12 Kategori Marketplace Trexio *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                  {MARKETPLACE_12_CATEGORIES.map((c) => {
                    const cfg = CATEGORY_CONFIGS[c.id];
                    const IconC = cfg?.icon || Compass;
                    const isSelected = form.category === c.id;

                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleCategoryChange(c.id)}
                        className={`p-2 rounded-xl text-left border text-[11px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                            : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                        }`}
                      >
                        <IconC size={14} className="shrink-0" />
                        <span className="truncate">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Card Preview Panel (Optional Toggle) */}
              {showPreview && (
                <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-2">
                  <div className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1">
                    <Eye size={14} /> Live Tampilan Customer di Marketplace
                  </div>
                  <div className="bg-card border border-border rounded-xl p-3 shadow-xs space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="w-20 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
                        <img
                          src={form.cover_image || form.images?.[0] || "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=800&q=80"}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-500/20 text-emerald-600 rounded-md uppercase">
                          {currentCategoryConfig.label}
                        </span>
                        <h4 className="font-extrabold text-xs text-foreground truncate mt-1">
                          {form.title || "Judul Layanan / Produk"}
                        </h4>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin size={11} /> {form.destination || "Lokasi"}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-border text-[11px]">
                      <div>
                        <span className="text-muted-foreground text-[9px] block uppercase font-bold">Harga</span>
                        <strong className="text-emerald-600 font-black">
                          {formatRupiah(form.price || 0)} <span className="text-[9px] font-normal">/{form.price_unit}</span>
                        </strong>
                      </div>
                      <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-lg">
                        {form.category === "rental-gear" ? `Stok: ${form.unit_stock} Unit` : `Maks: ${form.max_participants} Seat`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Core Title & Pricing Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="font-extrabold uppercase text-muted-foreground text-[10px] block mb-1">
                      Judul Produk / Layanan ({currentCategoryConfig.label}) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={currentCategoryConfig.titlePlaceholder}
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full p-2.5 bg-background border border-border rounded-xl font-bold text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold uppercase text-muted-foreground text-[10px] block mb-1">
                      {currentCategoryConfig.fields.locationLabel} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={currentCategoryConfig.destPlaceholder}
                      value={form.destination}
                      onChange={(e) => setForm({ ...form, destination: e.target.value })}
                      className="w-full p-2.5 bg-background border border-border rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold uppercase text-muted-foreground text-[10px] block mb-1">
                      {currentCategoryConfig.fields.durationLabel}
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 3 Hari 2 Malam / 24 Jam"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      className="w-full p-2.5 bg-background border border-border rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold uppercase text-muted-foreground text-[10px] block mb-1">
                      Harga Layanan (Rp) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="1500000"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="w-full p-2.5 bg-background border border-border rounded-xl font-black text-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold uppercase text-muted-foreground text-[10px] block mb-1">
                      Satuan Harga *
                    </label>
                    <select
                      value={form.price_unit}
                      onChange={(e) => setForm({ ...form, price_unit: e.target.value })}
                      className="w-full p-2.5 bg-background border border-border rounded-xl font-bold cursor-pointer"
                    >
                      {currentCategoryConfig.priceUnitOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          / {opt}
                        </option>
                      ))}
                      <option value="hari">/ hari</option>
                      <option value="malam">/ malam</option>
                      <option value="orang">/ orang</option>
                      <option value="trip">/ trip</option>
                      <option value="paket">/ paket</option>
                      <option value="unit/hari">/ unit/hari</option>
                    </select>
                  </div>

                  {/* Category-Specific Dynamic Inputs */}
                  {form.category === "rental-gear" && (
                    <>
                      <div>
                        <label className="font-extrabold uppercase text-muted-foreground text-[10px] block mb-1">
                          Stok Unit Tersedia (Inventory Count)
                        </label>
                        <input
                          type="number"
                          value={form.unit_stock}
                          onChange={(e) => setForm({ ...form, unit_stock: e.target.value })}
                          className="w-full p-2.5 bg-background border border-border rounded-xl font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-extrabold uppercase text-muted-foreground text-[10px] block mb-1">
                          Kondisi Alat / Kebersihan
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Dicuci Steril & 98% Baru"
                          value={form.condition}
                          onChange={(e) => setForm({ ...form, condition: e.target.value })}
                          className="w-full p-2.5 bg-background border border-border rounded-xl font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-extrabold uppercase text-muted-foreground text-[10px] block mb-1">
                          Deposit / Uang Jaminan (Rp)
                        </label>
                        <input
                          type="number"
                          placeholder="50000"
                          value={form.deposit}
                          onChange={(e) => setForm({ ...form, deposit: e.target.value })}
                          className="w-full p-2.5 bg-background border border-border rounded-xl font-bold"
                        />
                      </div>
                    </>
                  )}

                  {form.category === "guide" && (
                    <>
                      <div>
                        <label className="font-extrabold uppercase text-muted-foreground text-[10px] block mb-1">
                          Lisensi & Sertifikasi
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: APGI Utama / BNSP First Aid"
                          value={form.license}
                          onChange={(e) => setForm({ ...form, license: e.target.value })}
                          className="w-full p-2.5 bg-background border border-border rounded-xl font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-extrabold uppercase text-muted-foreground text-[10px] block mb-1">
                          Bahasa Dikuasai
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Indonesian, English, Japanese"
                          value={form.languages}
                          onChange={(e) => setForm({ ...form, languages: e.target.value })}
                          className="w-full p-2.5 bg-background border border-border rounded-xl font-bold"
                        />
                      </div>
                    </>
                  )}

                  {(form.category === "shuttle" || form.category === "transportasi") && (
                    <>
                      <div>
                        <label className="font-extrabold uppercase text-muted-foreground text-[10px] block mb-1">
                          Jenis Armada / Kendaraan
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Toyota HiAce / Jeep Hardtop 4x4"
                          value={form.vehicle_type}
                          onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
                          className="w-full p-2.5 bg-background border border-border rounded-xl font-bold"
                        />
                      </div>
                      <div>
                        <label className="font-extrabold uppercase text-muted-foreground text-[10px] block mb-1">
                          Titik Penjemputan / Meeting Point
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Stasiun Malang / Bandara LOP"
                          value={form.pickup_point}
                          onChange={(e) => setForm({ ...form, pickup_point: e.target.value })}
                          className="w-full p-2.5 bg-background border border-border rounded-xl font-bold"
                        />
                      </div>
                    </>
                  )}

                  {form.category === "homestay" && (
                    <div>
                      <label className="font-extrabold uppercase text-muted-foreground text-[10px] block mb-1">
                        Tipe Kamar / Fasilitas Utama
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Kamar Mandi Dalam + Shower Air Hangat"
                        value={form.room_type}
                        onChange={(e) => setForm({ ...form, room_type: e.target.value })}
                        className="w-full p-2.5 bg-background border border-border rounded-xl font-bold"
                      />
                    </div>
                  )}

                  {form.category === "event" && (
                    <div>
                      <label className="font-extrabold uppercase text-muted-foreground text-[10px] block mb-1">
                        Tanggal Pelaksanaan Event
                      </label>
                      <input
                        type="date"
                        value={form.event_date}
                        onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                        className="w-full p-2.5 bg-background border border-border rounded-xl font-bold"
                      />
                    </div>
                  )}

                  <div>
                    <label className="font-extrabold uppercase text-muted-foreground text-[10px] block mb-1">
                      {currentCategoryConfig.fields.maxCapacityLabel || "Kuota Maksimal"}
                    </label>
                    <input
                      type="number"
                      value={form.max_participants}
                      onChange={(e) => setForm({ ...form, max_participants: e.target.value })}
                      className="w-full p-2.5 bg-background border border-border rounded-xl font-bold"
                    />
                  </div>
                </div>

                {/* Multi-Date Schedule & Batch Manager for relevant categories */}
                {currentCategoryConfig.fields?.showScheduleDates && (
                  <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <label className="font-black text-xs text-foreground uppercase flex items-center gap-1.5">
                          <Calendar size={16} className="text-emerald-600" />
                          {currentCategoryConfig.fields.scheduleLabel || "Jadwal Tanggal & Batch Booking (Multi-Slot)"}
                        </label>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Buka beberapa pilihan tanggal booking/trip sekaligus untuk produk ini.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleGeneratePresetBatches}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Sparkle size={13} weight="bold" /> ⚡ Auto-Generate 3 Batch
                      </button>
                    </div>

                    {/* Input controls to add new date */}
                    <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr_90px_auto] gap-2 items-center bg-card p-2.5 rounded-xl border border-border">
                      <input
                        type="date"
                        value={newScheduleDate}
                        onChange={(e) => setNewScheduleDate(e.target.value)}
                        className="p-2 bg-background border border-border rounded-lg font-bold text-xs focus:border-emerald-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Label Batch (misal: Batch 1 - High Season)"
                        value={newScheduleLabel}
                        onChange={(e) => setNewScheduleLabel(e.target.value)}
                        className="p-2 bg-background border border-border rounded-lg text-xs font-medium focus:border-emerald-500 focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Kuota"
                        value={newScheduleSeats}
                        onChange={(e) => setNewScheduleSeats(e.target.value)}
                        className="p-2 bg-background border border-border rounded-lg text-xs font-bold focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddScheduleDate}
                        className="px-3 py-2 bg-foreground text-background font-black text-xs rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus size={14} weight="bold" /> Tambah
                      </button>
                    </div>

                    {/* List of active dates */}
                    {Array.isArray(form.available_dates) && form.available_dates.length > 0 ? (
                      <div className="space-y-2 pt-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase px-1">
                          <span>Daftar Tanggal / Batch ({form.available_dates.length} Slot)</span>
                          <span>Status Slot</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                          {form.available_dates.map((d, index) => {
                            const dateDisplay = d.date
                              ? new Date(d.date).toLocaleDateString("id-ID", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "Tanggal belum set";

                            return (
                              <div
                                key={d.id || index}
                                className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                                  d.status === "full"
                                    ? "bg-muted/60 border-border opacity-70"
                                    : "bg-card border-emerald-500/20 shadow-xs"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 font-black text-[10px] flex items-center justify-center shrink-0">
                                    #{index + 1}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="font-extrabold text-foreground truncate">
                                      {d.label || `Batch ${index + 1}`}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-2">
                                      <span>📅 {dateDisplay}</span>
                                      <span>•</span>
                                      <span>👥 Kuota: {d.seats_left || form.max_participants || 20} seat</span>
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleScheduleStatus(d.id)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                                      d.status === "open"
                                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                                        : "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                                    }`}
                                  >
                                    {d.status === "open" ? "Tersedia (Open)" : "Penuh (Full)"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveScheduleDate(d.id)}
                                    className="p-1 text-muted-foreground hover:text-red-600 transition-colors cursor-pointer"
                                    title="Hapus Tanggal"
                                  >
                                    <Trash size={15} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 text-center border border-dashed border-border rounded-xl text-[11px] text-muted-foreground">
                        Belum ada slot tanggal ditambahkan. Klik <strong>Auto-Generate 3 Batch</strong> atau masukkan tanggal di atas.
                      </div>
                    )}
                  </div>
                )}

                {/* Upload Foto Galeri (Max 5 Fotos) */}
                <div className="p-3.5 bg-muted/50 border border-border rounded-2xl space-y-1">
                  <ProductImageUploader
                    images={form.images}
                    coverImage={form.cover_image}
                    onChange={(imagesList, coverUrl) => {
                      setForm((prev) => ({
                        ...prev,
                        images: imagesList,
                        cover_image: coverUrl,
                      }));
                    }}
                    maxPhotos={5}
                  />
                </div>

                {/* Highlights / Specs Chips Builder */}
                <div className="p-3 bg-muted/30 border border-border rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-extrabold uppercase text-[10px] text-muted-foreground flex items-center gap-1">
                      <Tag size={13} className="text-emerald-500" /> Highlights Badge / Spesifikasi Khas (Pisahkan Koma)
                    </label>
                    <span className="text-[10px] text-muted-foreground">Tap preset untuk tambah:</span>
                  </div>
                  <input
                    type="text"
                    value={form.specsStr}
                    onChange={(e) => setForm({ ...form, specsStr: e.target.value })}
                    placeholder="Contoh: Guide APGI, Tenda Steril, Makan 3x, P3K First Aid"
                    className="w-full p-2.5 bg-background border border-border rounded-xl font-medium"
                  />
                  {currentCategoryConfig.presetSpecs && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {currentCategoryConfig.presetSpecs.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => appendTag("specsStr", tag)}
                          className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold transition-all cursor-pointer"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Included Services */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-extrabold uppercase text-[10px] text-muted-foreground">
                      Fasilitas Termasuk (Included Services)
                    </label>
                    <span className="text-[10px] text-muted-foreground">Tap preset:</span>
                  </div>
                  <input
                    type="text"
                    value={form.includedStr}
                    onChange={(e) => setForm({ ...form, includedStr: e.target.value })}
                    className="w-full p-2.5 bg-background border border-border rounded-xl font-medium"
                  />
                  {currentCategoryConfig.presetIncluded && (
                    <div className="flex flex-wrap gap-1">
                      {currentCategoryConfig.presetIncluded.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => appendTag("includedStr", tag)}
                          className="px-2 py-0.5 rounded bg-muted hover:bg-accent text-[10px] font-medium text-foreground cursor-pointer"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Excluded Services */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-extrabold uppercase text-[10px] text-muted-foreground">
                      Tidak Termasuk (Excluded Services)
                    </label>
                  </div>
                  <input
                    type="text"
                    value={form.excludedStr}
                    onChange={(e) => setForm({ ...form, excludedStr: e.target.value })}
                    className="w-full p-2.5 bg-background border border-border rounded-xl font-medium"
                  />
                </div>

                {/* Checklist / Equipment Requirements */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-extrabold uppercase text-[10px] text-muted-foreground">
                      Perlengkapan Wajib / Syarat Peserta (Checklist)
                    </label>
                  </div>
                  <input
                    type="text"
                    value={form.equipmentStr}
                    onChange={(e) => setForm({ ...form, equipmentStr: e.target.value })}
                    className="w-full p-2.5 bg-background border border-border rounded-xl font-medium"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="font-extrabold uppercase text-[10px] text-muted-foreground block mb-1">
                    Deskripsi Lengkap
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full p-2.5 bg-background border border-border rounded-xl font-medium"
                    placeholder="Jelaskan secara detail keunggulan layanan, rute, aturan, atau catatan penting..."
                  />
                </div>

                {/* Footer Submit Buttons */}
                <div className="shrink-0 flex justify-end gap-2 pt-3 border-t border-border mt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 font-bold border border-border rounded-xl hover:bg-muted cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    data-testid="btn-submit-vendor-product"
                    className="px-6 py-2.5 font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? "Menyimpan..." : form.id ? "Update Produk" : "Simpan Produk Baru"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* AI Listing Assistant Draft Confirmation Modal */}
      {showAiDraftModal && aiDraftResult && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border border-emerald-500/30 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <Sparkle size={22} weight="fill" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-foreground">Draf AI Listing Assistant</h3>
                  <p className="text-xs text-muted-foreground">Tinjau dan beri persetujuan sebelum diterapkan ke formulir produk Anda.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiDraftModal(false)}
                className="text-muted-foreground hover:text-foreground font-extrabold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              <div className="space-y-1 bg-muted/40 p-3 rounded-2xl border border-border">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase">Rekomendasi Judul SEO:</span>
                <p className="font-extrabold text-sm text-foreground">{aiDraftResult.suggested_title}</p>
              </div>

              <div className="space-y-1 bg-muted/40 p-3 rounded-2xl border border-border">
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase">Deskripsi Penjualan AI:</span>
                <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">{aiDraftResult.description}</p>
              </div>

              {Array.isArray(aiDraftResult.highlights) && (
                <div className="space-y-1 bg-muted/40 p-3 rounded-2xl border border-border">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase">Keunggulan Utama (Highlights):</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {aiDraftResult.highlights.map((h, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                        ✓ {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {aiDraftResult.seo_title && (
                <div className="space-y-1 bg-blue-500/5 p-3 rounded-2xl border border-blue-500/20">
                  <span className="text-[10px] font-extrabold text-blue-500 uppercase">Preview Google Search SEO:</span>
                  <p className="font-bold text-blue-600 text-xs">{aiDraftResult.seo_title}</p>
                  <p className="text-[11px] text-muted-foreground">{aiDraftResult.meta_description}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border gap-3">
              <p className="text-[11px] text-muted-foreground font-medium">
                Penting: Mengklik "Terapkan Draf AI" akan memperbarui judul dan deskripsi produk Anda.
              </p>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAiDraftModal(false)}
                  className="px-4 py-2 text-xs font-bold border border-border rounded-xl hover:bg-muted"
                >
                  Batal / Tolak
                </button>
                <button
                  type="button"
                  onClick={handleApplyAIDraft}
                  className="px-5 py-2 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <CheckCircle size={16} weight="fill" />
                  <span>Terapkan Draf AI</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
