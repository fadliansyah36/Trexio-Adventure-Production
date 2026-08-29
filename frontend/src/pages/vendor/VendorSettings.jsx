import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { api, formatApiError, ASSET_BASE } from "@/lib/api";
import {
  ShieldCheck,
  UserPlus,
  Bank,
  Gear,
  Lock,
  CheckCircle,
  UploadSimple,
  FloppyDisk,
  SealCheck,
  Compass,
  Trash,
  Eye,
  Plus,
  Certificate,
  Briefcase,
  Paperclip,
  Clock,
  ShieldWarning,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import { UserX } from "lucide-react";
import { useAutoSave, AutoSaveBadge } from "@/components/vendor/AutoSaveIndicator";

export default function VendorSettings() {
  const { vendor, refresh } = useOutletContext();
  const [activeTab, setActiveTab] = useState("certifications"); // certifications | kyc | staff | booking
  const [uploading, setUploading] = useState("");
  const [saving, setSaving] = useState(false);

  // BNSP & APGI Certification state
  const [bnspForm, setBnspForm] = useState({
    bnsp_number: vendor?.documents?.bnsp_number || "",
    bnsp_holder_name: vendor?.documents?.bnsp_holder_name || "",
    bnsp_expiry_date: vendor?.documents?.bnsp_expiry_date || "",
  });

  const [apgiForm, setApgiForm] = useState({
    apgi_number: vendor?.documents?.apgi_number || "",
    apgi_holder_name: vendor?.documents?.apgi_holder_name || "",
    apgi_level: vendor?.documents?.apgi_level || "Level Muda",
    apgi_expiry_date: vendor?.documents?.apgi_expiry_date || "",
  });

  // Guide Roster state
  const [guidesList, setGuidesList] = useState([]);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideForm, setGuideForm] = useState({
    name: "",
    phone: "",
    cert_type: "BNSP_APGI",
    bnsp_number: "",
    apgi_number: "",
    apgi_level: "Level Muda",
    expiry_date: "",
  });
  const [guideFile, setGuideFile] = useState(null);
  const [submittingGuide, setSubmittingGuide] = useState(false);

  // Staff state
  const [staffList, setStaffList] = useState([]);
  const [staffForm, setStaffForm] = useState({ name: "", email: "", role: "Operations" });
  const [showStaffModal, setShowStaffModal] = useState(false);

  useEffect(() => {
    loadStaff();
    loadGuides();
  }, []);

  useEffect(() => {
    if (vendor?.documents) {
      setBnspForm({
        bnsp_number: vendor.documents.bnsp_number || "",
        bnsp_holder_name: vendor.documents.bnsp_holder_name || "",
        bnsp_expiry_date: vendor.documents.bnsp_expiry_date || "",
      });
      setApgiForm({
        apgi_number: vendor.documents.apgi_number || "",
        apgi_holder_name: vendor.documents.apgi_holder_name || "",
        apgi_level: vendor.documents.apgi_level || "Level Muda",
        apgi_expiry_date: vendor.documents.apgi_expiry_date || "",
      });
    }
  }, [vendor]);

  async function loadStaff() {
    try {
      const res = await api.get("/vendor/staff");
      setStaffList(Array.isArray(res.data) ? res.data : []);
    } catch {
      setStaffList([]);
    }
  }

  async function loadGuides() {
    setLoadingGuides(true);
    try {
      const res = await api.get("/vendor/guides");
      setGuidesList(Array.isArray(res.data) ? res.data : []);
    } catch {
      setGuidesList([]);
    } finally {
      setLoadingGuides(false);
    }
  }

  // Booking settings
  const [bookingRules, setBookingRules] = useState({
    auto_confirmation: true,
    booking_deadline_days: 2,
    min_participants: 5,
    cancellation_policy: "Refund 100% jika pembatalan dilakukan H-7 keberangkatan. H-3 refund 50%.",
  });

  const handleAutoSaveBooking = async (rules) => {
    await api.patch("/vendor/me", { booking_rules: rules });
  };

  const { status: bookingAutoSaveStatus, lastSavedAt: bookingAutoSaveTime } = useAutoSave({
    data: bookingRules,
    onSave: handleAutoSaveBooking,
    storageKey: "trx_vendor_booking_rules_draft",
    debounceMs: 600,
    enabled: activeTab === "booking",
  });

  async function uploadDoc(docType, file, extraData = {}) {
    if (!file && Object.keys(extraData).length === 0) return;
    setUploading(docType);
    try {
      const fd = new FormData();
      if (file) fd.append("file", file);
      Object.entries(extraData).forEach(([k, v]) => {
        if (v) fd.append(k, v);
      });

      const { data } = await api.post(`/vendor/me/documents/${docType}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      const docName = 
        docType === "ktp" ? "KTP/Identitas" : 
        docType === "bnsp_cert" ? "Sertifikat BNSP" : 
        docType === "apgi_cert" ? "Lisensi APGI" : "Izin Usaha/NIB";

      toast.success(`Dokumen & Data ${docName} berhasil disimpan!`);
      refresh();
    } catch (e) {
      toast.error(formatApiError(e?.response?.data?.detail));
    } finally {
      setUploading("");
    }
  }

  async function handleAddGuide(e) {
    e.preventDefault();
    if (!guideForm.name.trim()) return toast.error("Nama lengkap guide wajib diisi.");
    setSubmittingGuide(true);

    try {
      const fd = new FormData();
      Object.entries(guideForm).forEach(([k, v]) => fd.append(k, v));
      if (guideFile) fd.append("file", guideFile);

      const res = await api.post("/vendor/guides", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(res.data?.message || "Guide terlisensi berhasil ditambahkan!");
      setShowGuideModal(false);
      setGuideForm({
        name: "",
        phone: "",
        cert_type: "BNSP_APGI",
        bnsp_number: "",
        apgi_number: "",
        apgi_level: "Level Muda",
        expiry_date: "",
      });
      setGuideFile(null);
      loadGuides();
      refresh();
    } catch (e) {
      toast.error(formatApiError(e?.response?.data?.detail) || "Gagal menambahkan data guide.");
    } finally {
      setSubmittingGuide(false);
    }
  }

  async function handleDeleteGuide(id) {
    if (!confirm("Hapus data guide terlisensi ini dari tim mitra?")) return;
    try {
      await api.delete(`/vendor/guides/${id}`);
      toast.success("Data guide berhasil dihapus.");
      loadGuides();
      refresh();
    } catch (e) {
      toast.error(formatApiError(e?.response?.data?.detail));
    }
  }

  function handleAddStaff(e) {
    e.preventDefault();
    if (!staffForm.name || !staffForm.email) return;
    setStaffList([...staffList, { ...staffForm, id: `st_${Date.now()}`, status: "invited" }]);
    toast.success(`Undangan dikirim ke ${staffForm.email}`);
    setShowStaffModal(false);
    setStaffForm({ name: "", email: "", role: "Operations" });
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="trx-overline text-muted-foreground">Pengaturan & Verifikasi</div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tighter">Pengaturan Mitra & Upload Sertifikasi Guide</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Upload Sertifikat BNSP & APGI Pemandu Gunung, kelola daftar tim guide terlisensi, dokumen KYC legalitas, dan aturan booking.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-6 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab("certifications")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === "certifications" ? "border-emerald-600 text-emerald-600 dark:text-emerald-400" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <SealCheck size={18} className="text-emerald-500" /> Sertifikasi BNSP & APGI
        </button>
        <button
          onClick={() => setActiveTab("kyc")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === "kyc" ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldCheck size={18} /> Legalitas & KYC Usaha
        </button>
        <button
          onClick={() => setActiveTab("staff")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === "staff" ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserPlus size={18} /> Tim & Akses Staf
        </button>
        <button
          onClick={() => setActiveTab("booking")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all shrink-0 ${
            activeTab === "booking" ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Gear size={18} /> Aturan Booking
        </button>
      </div>

      {/* TAB 1: Sertifikasi BNSP & APGI */}
      {activeTab === "certifications" && (
        <div className="space-y-6">
          {/* Banner Callout */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white shadow-md border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[11px] border border-emerald-500/30">
                <SealCheck size={16} weight="fill" /> Verified BNSP & APGI Certification Center
              </div>
              <h2 className="text-lg font-black tracking-tight text-white">
                Verifikasi Sertifikat BNSP & Lisensi APGI Pemandu Gunung
              </h2>
              <p className="text-xs text-emerald-100/80 leading-relaxed">
                Vendor yang mengunggah sertifikat BNSP (Badan Nasional Sertifikasi Profesi) dan lisensi APGI (Asosiasi Pemandu Gunung Indonesia) yang terverifikasi akan mendapatkan **Badge Khusus Guide Terlisensi**, kepercayaan tertinggi pendaki, serta prioritas teratas pada pencarian paket Open Trip TREXIO.
              </p>
            </div>
            <button
              onClick={() => setShowGuideModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <Plus size={18} weight="bold" /> Tambah Guide Terlisensi
            </button>
          </div>

          {/* Grid 2 Sertifikat Utama */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* BNSP Card */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <Certificate size={24} weight="fill" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground">1. Sertifikat BNSP Pemandu Gunung</h3>
                    <p className="text-[11px] text-muted-foreground">Badan Nasional Sertifikasi Profesi (Kompetensi Kerja)</p>
                  </div>
                </div>

                {vendor?.documents?.bnsp_cert_url ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    <SealCheck weight="fill" size={14} className="text-emerald-500" /> Terverifikasi
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/30">
                    Belum Upload
                  </span>
                )}
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-extrabold text-foreground block mb-1">No. Registrasi / Sertifikat BNSP:</label>
                  <input
                    type="text"
                    placeholder="Contoh: REG.PAR.0123.00456.2024"
                    value={bnspForm.bnsp_number}
                    onChange={(e) => setBnspForm({ ...bnspForm, bnsp_number: e.target.value })}
                    className="w-full p-2.5 border border-border rounded-xl bg-background font-mono font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-extrabold text-foreground block mb-1">Nama Pemegang Sertifikat:</label>
                    <input
                      type="text"
                      placeholder="Nama Sesuai BNSP"
                      value={bnspForm.bnsp_holder_name}
                      onChange={(e) => setBnspForm({ ...bnspForm, bnsp_holder_name: e.target.value })}
                      className="w-full p-2.5 border border-border rounded-xl bg-background font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-extrabold text-foreground block mb-1">Berlaku Sampai (Expiry):</label>
                    <input
                      type="date"
                      value={bnspForm.bnsp_expiry_date}
                      onChange={(e) => setBnspForm({ ...bnspForm, bnsp_expiry_date: e.target.value })}
                      className="w-full p-2.5 border border-border rounded-xl bg-background font-bold"
                    />
                  </div>
                </div>

                {vendor?.documents?.bnsp_cert_url && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                    <span className="font-bold flex items-center gap-1.5">
                      <Paperclip size={16} /> File Sertifikat Terlampir
                    </span>
                    <a
                      href={`${ASSET_BASE}${vendor.documents.bnsp_cert_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      <Eye size={14} /> Lihat PDF / Dokumen
                    </a>
                  </div>
                )}

                <div>
                  <label className="block w-full text-center border-2 border-dashed border-border hover:border-emerald-500 p-4 rounded-xl cursor-pointer bg-muted/20 hover:bg-emerald-500/5 transition-all">
                    <UploadSimple size={24} className="mx-auto text-emerald-600 mb-1" />
                    <span className="text-xs font-bold text-foreground block">
                      {uploading === "bnsp_cert" ? "Mengunggah Sertifikat BNSP..." : vendor?.documents?.bnsp_cert_url ? "Ganti File Sertifikat BNSP (PDF/Gambar)" : "Upload File Sertifikat BNSP (PDF / Foto)"}
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">Format JPG, PNG, atau PDF (Maks 10MB)</span>
                    <input
                      type="file"
                      hidden
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadDoc("bnsp_cert", file, bnspForm);
                      }}
                    />
                  </label>
                </div>

                <div className="pt-2 text-right">
                  <button
                    type="button"
                    disabled={uploading === "bnsp_cert"}
                    onClick={() => uploadDoc("bnsp_cert", null, bnspForm)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                  >
                    <FloppyDisk size={16} /> Simpan Data BNSP
                  </button>
                </div>
              </div>
            </div>

            {/* APGI Card */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    <Compass size={24} weight="fill" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground">2. Lisensi & Anggota APGI</h3>
                    <p className="text-[11px] text-muted-foreground">Asosiasi Pemandu Gunung Indonesia</p>
                  </div>
                </div>

                {vendor?.documents?.apgi_cert_url ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    <SealCheck weight="fill" size={14} className="text-emerald-500" /> Terverifikasi
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full border border-blue-500/30">
                    Belum Upload
                  </span>
                )}
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-extrabold text-foreground block mb-1">No. Anggota / Lisensi APGI:</label>
                  <input
                    type="text"
                    placeholder="Contoh: APGI-JBT-2024-00892"
                    value={apgiForm.apgi_number}
                    onChange={(e) => setApgiForm({ ...apgiForm, apgi_number: e.target.value })}
                    className="w-full p-2.5 border border-border rounded-xl bg-background font-mono font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-extrabold text-foreground block mb-1">Nama Pemegang Card/Lisensi:</label>
                    <input
                      type="text"
                      placeholder="Nama Sesuai APGI"
                      value={apgiForm.apgi_holder_name}
                      onChange={(e) => setApgiForm({ ...apgiForm, apgi_holder_name: e.target.value })}
                      className="w-full p-2.5 border border-border rounded-xl bg-background font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-extrabold text-foreground block mb-1">Level Sertifikasi APGI:</label>
                    <select
                      value={apgiForm.apgi_level}
                      onChange={(e) => setApgiForm({ ...apgiForm, apgi_level: e.target.value })}
                      className="w-full p-2.5 border border-border rounded-xl bg-background font-bold"
                    >
                      <option value="Level Muda">Level Muda (Mountain Guide Muda)</option>
                      <option value="Level Madya">Level Madya (Mountain Guide Madya)</option>
                      <option value="Level Utama">Level Utama (Senior Mountain Guide)</option>
                      <option value="Asesor / Instruktur">Instruktur / Asesor APGI</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-extrabold text-foreground block mb-1">Berlaku Sampai (Expiry):</label>
                  <input
                    type="date"
                    value={apgiForm.apgi_expiry_date}
                    onChange={(e) => setApgiForm({ ...apgiForm, apgi_expiry_date: e.target.value })}
                    className="w-full p-2.5 border border-border rounded-xl bg-background font-bold"
                  />
                </div>

                {vendor?.documents?.apgi_cert_url && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-xs text-blue-900 dark:text-blue-300">
                    <span className="font-bold flex items-center gap-1.5">
                      <Paperclip size={16} /> File Lisensi APGI Terlampir
                    </span>
                    <a
                      href={`${ASSET_BASE}${vendor.documents.apgi_cert_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-extrabold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Eye size={14} /> Lihat PDF / Kartu
                    </a>
                  </div>
                )}

                <div>
                  <label className="block w-full text-center border-2 border-dashed border-border hover:border-blue-500 p-4 rounded-xl cursor-pointer bg-muted/20 hover:bg-blue-500/5 transition-all">
                    <UploadSimple size={24} className="mx-auto text-blue-600 mb-1" />
                    <span className="text-xs font-bold text-foreground block">
                      {uploading === "apgi_cert" ? "Mengunggah Kartu APGI..." : vendor?.documents?.apgi_cert_url ? "Ganti File Kartu APGI (PDF/Gambar)" : "Upload File Kartu / Sertifikat APGI (PDF / Foto)"}
                    </span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">Format JPG, PNG, atau PDF (Maks 10MB)</span>
                    <input
                      type="file"
                      hidden
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadDoc("apgi_cert", file, apgiForm);
                      }}
                    />
                  </label>
                </div>

                <div className="pt-2 text-right">
                  <button
                    type="button"
                    disabled={uploading === "apgi_cert"}
                    onClick={() => uploadDoc("apgi_cert", null, apgiForm)}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                  >
                    <FloppyDisk size={16} /> Simpan Data APGI
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Certified Guide Roster */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h3 className="font-black text-base text-foreground flex items-center gap-2">
                  <Briefcase size={20} className="text-emerald-500" />
                  Daftar Tim Pemandu Gunung Terlisensi (Guide Roster)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Daftarkan seluruh guide/leader lapangan di bawah mitra Anda yang memegang lisensi resmi BNSP / APGI untuk verifikasi manifes pendakian.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus size={16} weight="bold" /> Tambah Guide Terlisensi
              </button>
            </div>

            {loadingGuides ? (
              <div className="text-center py-8 text-xs text-muted-foreground">Memuat daftar tim guide terlisensi...</div>
            ) : guidesList.length === 0 ? (
              <EmptyState
                title="Belum Ada Guide Terlisensi Didaftarkan"
                description="Tambahkan anggota tim pemandu gunung Anda yang telah memiliki sertifikasi BNSP atau keanggotaan lisensi APGI."
                icon={UserX}
                actionLabel="Tambah Guide Terlisensi"
                onAction={() => setShowGuideModal(true)}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 font-bold text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                    <tr>
                      <th className="px-4 py-3">Nama Guide</th>
                      <th className="px-4 py-3">Kontak / WA</th>
                      <th className="px-4 py-3">Sertifikasi & Lisensi</th>
                      <th className="px-4 py-3">Level APGI</th>
                      <th className="px-4 py-3">Masa Berlaku</th>
                      <th className="px-4 py-3 text-center">Dokumen</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {guidesList.map((g) => (
                      <tr key={g.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 font-extrabold text-foreground">
                          <div className="flex items-center gap-2">
                            <span>{g.name}</span>
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <SealCheck size={12} weight="fill" className="text-emerald-500" />
                              {g.cert_type}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">{g.phone || "—"}</td>
                        <td className="px-4 py-3 space-y-0.5">
                          {g.bnsp_number && <div className="font-mono text-[11px]">BNSP: {g.bnsp_number}</div>}
                          {g.apgi_number && <div className="font-mono text-[11px] text-blue-600 dark:text-blue-400">APGI: {g.apgi_number}</div>}
                        </td>
                        <td className="px-4 py-3 font-bold">{g.apgi_level || "Level Muda"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{g.expiry_date || "—"}</td>
                        <td className="px-4 py-3 text-center">
                          {g.cert_url ? (
                            <a
                              href={`${ASSET_BASE}${g.cert_url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                            >
                              <Paperclip size={14} /> View
                            </a>
                          ) : (
                            <span className="text-muted-foreground italic text-[10px]">Belum Upload</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteGuide(g.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Hapus Guide"
                          >
                            <Trash size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal Tambah Guide */}
          {showGuideModal && (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 pb-20 lg:pb-6 overflow-y-auto min-h-screen">
              <div className="relative bg-card text-card-foreground border border-border rounded-2xl max-w-lg w-full p-5 shadow-2xl my-auto max-h-[90vh] flex flex-col">
                <div className="shrink-0 flex justify-between items-center border-b border-border pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600">
                      <SealCheck size={20} weight="fill" />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-foreground">Daftarkan Guide Terlisensi</h3>
                      <p className="text-[11px] text-muted-foreground">Sertifikasi BNSP / APGI Pemandu Gunung</p>
                    </div>
                  </div>
                  <button onClick={() => setShowGuideModal(false)} className="font-extrabold text-muted-foreground p-1 hover:text-foreground">✕</button>
                </div>

                <form onSubmit={handleAddGuide} className="flex-1 overflow-y-auto space-y-3.5 text-xs pr-1">
                  <div>
                    <label className="font-extrabold text-foreground block mb-1">Nama Lengkap Guide <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Sesuai KTP / Sertifikat BNSP"
                      value={guideForm.name}
                      onChange={(e) => setGuideForm({ ...guideForm, name: e.target.value })}
                      className="w-full p-2.5 border border-border rounded-xl bg-background font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-foreground block mb-1">Nomor WhatsApp / HP Guide</label>
                    <input
                      type="text"
                      placeholder="081234567890"
                      value={guideForm.phone}
                      onChange={(e) => setGuideForm({ ...guideForm, phone: e.target.value })}
                      className="w-full p-2.5 border border-border rounded-xl bg-background font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-extrabold text-foreground block mb-1">Jenis Sertifikasi</label>
                      <select
                        value={guideForm.cert_type}
                        onChange={(e) => setGuideForm({ ...guideForm, cert_type: e.target.value })}
                        className="w-full p-2.5 border border-border rounded-xl bg-background font-bold"
                      >
                        <option value="BNSP_APGI">BNSP & APGI (Lengkap)</option>
                        <option value="BNSP">BNSP (Pemandu Gunung)</option>
                        <option value="APGI">APGI (Lisensi Anggota)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-extrabold text-foreground block mb-1">Level APGI</label>
                      <select
                        value={guideForm.apgi_level}
                        onChange={(e) => setGuideForm({ ...guideForm, apgi_level: e.target.value })}
                        className="w-full p-2.5 border border-border rounded-xl bg-background font-bold"
                      >
                        <option value="Level Muda">Level Muda</option>
                        <option value="Level Madya">Level Madya</option>
                        <option value="Level Utama">Level Utama</option>
                        <option value="Asesor / Instruktur">Instruktur / Asesor</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-extrabold text-foreground block mb-1">No. Sertifikat BNSP</label>
                      <input
                        type="text"
                        placeholder="No. BNSP"
                        value={guideForm.bnsp_number}
                        onChange={(e) => setGuideForm({ ...guideForm, bnsp_number: e.target.value })}
                        className="w-full p-2.5 border border-border rounded-xl bg-background font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="font-extrabold text-foreground block mb-1">No. Lisensi APGI</label>
                      <input
                        type="text"
                        placeholder="No. APGI"
                        value={guideForm.apgi_number}
                        onChange={(e) => setGuideForm({ ...guideForm, apgi_number: e.target.value })}
                        className="w-full p-2.5 border border-border rounded-xl bg-background font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-extrabold text-foreground block mb-1">Tanggal Masa Berlaku Sertifikat</label>
                    <input
                      type="date"
                      value={guideForm.expiry_date}
                      onChange={(e) => setGuideForm({ ...guideForm, expiry_date: e.target.value })}
                      className="w-full p-2.5 border border-border rounded-xl bg-background font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-foreground block mb-1">Upload Foto / Dokumen Sertifikat BNSP / APGI</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setGuideFile(e.target.files?.[0] || null)}
                      className="w-full text-xs p-2 border border-border rounded-xl bg-background"
                    />
                  </div>

                  <div className="shrink-0 flex justify-end gap-2 pt-3 border-t border-border mt-3">
                    <button
                      type="button"
                      onClick={() => setShowGuideModal(false)}
                      className="px-4 py-2 font-bold border border-border rounded-xl hover:bg-muted cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submittingGuide}
                      className="px-5 py-2 font-black bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs cursor-pointer"
                    >
                      {submittingGuide ? "Menyimpan..." : "Simpan Guide Terlisensi"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Legalitas KYC */}
      {activeTab === "kyc" && (
        <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-sm font-black text-foreground uppercase tracking-wider">Verifikasi Dokumen Identitas & Usaha</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Dokumen disimpan terenkripsi secara aman dan hanya digunakan untuk proses verifikasi oleh Super Admin Trexio.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-border rounded-xl space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-xs text-foreground">Kartu Tanda Penduduk (KTP) Owner / PIC</div>
                  <div className="text-[11px] text-muted-foreground">Wajib untuk verifikasi akun penarikan dana.</div>
                </div>
                {vendor.documents?.ktp_url ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    <CheckCircle weight="fill" size={12} /> Terverifikasi
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">Belum Upload</span>
                )}
              </div>

              <label className="block w-full text-center border border-dashed border-border p-4 rounded-xl cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all">
                <UploadSimple size={20} className="mx-auto text-neutral-400 mb-1" />
                <span className="text-xs font-bold text-[hsl(var(--primary))]">
                  {uploading === "ktp" ? "Uploading..." : vendor.documents?.ktp_url ? "Ganti File KTP" : "Pilih File KTP"}
                </span>
                <input
                  type="file"
                  hidden
                  accept="image/*,application/pdf"
                  onChange={(e) => uploadDoc("ktp", e.target.files?.[0])}
                />
              </label>
            </div>

            <div className="p-4 border border-border rounded-xl space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-xs text-foreground">NIB / Surat Izin Usaha / NPWP (Opsional)</div>
                  <div className="text-[11px] text-muted-foreground">Meningkatkan kepercayaan dan skor prioritas listing.</div>
                </div>
                {vendor.documents?.izin_usaha_url ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    <CheckCircle weight="fill" size={12} /> Terverifikasi
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">Opsional</span>
                )}
              </div>

              <label className="block w-full text-center border border-dashed border-border p-4 rounded-xl cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all">
                <UploadSimple size={20} className="mx-auto text-neutral-400 mb-1" />
                <span className="text-xs font-bold text-[hsl(var(--primary))]">
                  {uploading === "izin_usaha" ? "Uploading..." : vendor.documents?.izin_usaha_url ? "Ganti Dokumen Usaha" : "Pilih Dokumen Usaha"}
                </span>
                <input
                  type="file"
                  hidden
                  accept="image/*,application/pdf"
                  onChange={(e) => uploadDoc("izin_usaha", e.target.files?.[0])}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Staff */}
      {activeTab === "staff" && (
        <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-black text-foreground uppercase tracking-wider">Akses Manajemen Staf Internal</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Berikan akses peran khusus untuk staf operasional atau keuangan tanpa membagikan akun utama.</p>
            </div>
            <button
              onClick={() => setShowStaffModal(true)}
              className="inline-flex items-center gap-1.5 bg-[hsl(var(--primary))] text-white font-extrabold text-xs px-4 py-2 rounded-xl hover:opacity-90 cursor-pointer"
            >
              <UserPlus size={16} /> Undang Staf
            </button>
          </div>

          {staffList.length === 0 ? (
            <EmptyState
              title="Belum Ada Staf Tambahan"
              description="Undang anggota tim operasional atau keuangan untuk mengelola akun mitra vendor ini."
              icon={UserX}
              actionLabel="Undang Staf"
              onAction={() => setShowStaffModal(true)}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-50 font-bold text-neutral-500 uppercase border-b border-border">
                  <tr>
                    <th className="px-4 py-3">Nama Staf</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Peran / Role</th>
                    <th className="px-4 py-3 text-right">Status Akses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {staffList.map((st) => (
                    <tr key={st.id}>
                      <td className="px-4 py-3 font-bold text-foreground">{st.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{st.email}</td>
                      <td className="px-4 py-3 font-bold">{st.role}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {st.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showStaffModal && (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 pb-20 lg:pb-6 overflow-y-auto min-h-screen">
              <div className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-xl my-auto max-h-[calc(100dvh-5.5rem)] sm:max-h-[90vh] flex flex-col">
                <div className="shrink-0 flex justify-between items-center border-b border-border pb-3 mb-3">
                  <h3 className="font-black text-base sm:text-lg">Undang Anggota Staf</h3>
                  <button onClick={() => setShowStaffModal(false)} className="font-bold text-muted-foreground p-1">✕</button>
                </div>
                <form onSubmit={handleAddStaff} className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
                  <div>
                    <label className="font-extrabold uppercase text-neutral-500">Nama Lengkap Staf</label>
                    <input
                      type="text"
                      required
                      value={staffForm.name}
                      onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                      className="mt-1 w-full min-w-0 p-2.5 border border-border rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-extrabold uppercase text-neutral-500">Email Staf</label>
                    <input
                      type="email"
                      required
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      className="mt-1 w-full min-w-0 p-2.5 border border-border rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-extrabold uppercase text-neutral-500">Peran Akses</label>
                    <select
                      value={staffForm.role}
                      onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                      className="mt-1 w-full min-w-0 p-2.5 border border-border rounded-xl font-bold bg-white dark:bg-slate-800"
                    >
                      <option value="Operations">Operations (Kelola Trip & Manifest)</option>
                      <option value="Finance">Finance (Kelola Saldo & Penarikan)</option>
                      <option value="Customer Service">Customer Service (Kelola Chat & Ulasan)</option>
                    </select>
                  </div>
                  <div className="shrink-0 flex justify-end gap-2 pt-3 border-t border-border mt-3">
                    <button type="button" onClick={() => setShowStaffModal(false)} className="px-4 py-2 font-bold border border-border rounded-xl hover:bg-neutral-100">Batal</button>
                    <button type="submit" className="px-5 py-2 font-bold bg-[hsl(var(--primary))] text-white rounded-xl hover:opacity-90">Kirim Undangan</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Booking Rules */}
      {activeTab === "booking" && (
        <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h2 className="text-sm font-black text-foreground uppercase tracking-wider">Aturan Konfirmasi & Kebijakan Pembatalan</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Atur alur konfirmasi booking otomatis dan syarat pengembalian dana bagi peserta.</p>
            </div>
            <AutoSaveBadge status={bookingAutoSaveStatus} lastSavedAt={bookingAutoSaveTime} testid="booking-rules-autosave-badge" />
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
              <div>
                <div className="font-bold text-foreground">Konfirmasi Booking Otomatis</div>
                <div className="text-[11px] text-muted-foreground">Booking langsung berstatus "Confirmed" secara otomatis begitu pembayaran verified via Trexio Secure Payment.</div>
              </div>
              <input
                type="checkbox"
                checked={bookingRules.auto_confirmation}
                onChange={(e) => setBookingRules({ ...bookingRules, auto_confirmation: e.target.checked })}
                className="h-5 w-5 accent-[hsl(var(--primary))] cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-extrabold uppercase text-neutral-500">Batas Tutup Booking (H- Hari Keberangkatan)</label>
                <input
                  type="number"
                  value={bookingRules.booking_deadline_days}
                  onChange={(e) => setBookingRules({ ...bookingRules, booking_deadline_days: Number(e.target.value) })}
                  className="mt-1 w-full p-2.5 border border-border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-extrabold uppercase text-neutral-500">Kuota Minimal Peserta Per Trip</label>
                <input
                  type="number"
                  value={bookingRules.min_participants}
                  onChange={(e) => setBookingRules({ ...bookingRules, min_participants: Number(e.target.value) })}
                  className="mt-1 w-full p-2.5 border border-border rounded-xl font-bold"
                />
              </div>
            </div>

            <div>
              <label className="font-extrabold uppercase text-neutral-500">Aturan Reschedule & Policy Pembatalan</label>
              <textarea
                rows={3}
                value={bookingRules.cancellation_policy}
                onChange={(e) => setBookingRules({ ...bookingRules, cancellation_policy: e.target.value })}
                className="mt-1 w-full p-3 border border-border rounded-xl font-medium focus:outline-none focus:border-[hsl(var(--primary))]"
              />
            </div>

            <button
              onClick={() => toast.success("Aturan booking berhasil diperbarui!")}
              className="inline-flex items-center gap-2 bg-[hsl(var(--primary))] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl hover:opacity-90 cursor-pointer"
            >
              <FloppyDisk size={16} /> Simpan Aturan Booking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
