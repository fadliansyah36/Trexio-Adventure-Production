import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Compass,
  MapPin,
  Users,
  Car,
  Calculator,
  Navigation,
  Clock,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  UserCheck,
  Shield,
  Tag,
  DollarSign,
  TrendingUp,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Layers,
  Sparkles,
  Info,
  Phone,
  ExternalLink,
  MessageSquare,
  Lock,
  Unlock,
  UserX,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import backpackerService from "@/services/backpackerService";
import MatchingAssistanceInbox from "../../components/backpacker/MatchingAssistanceInbox";
import { useAuth } from "@/context/AuthContext";
import BookingReferenceSelector from "@/components/backpacker/BookingReferenceSelector";

export default function BackpackerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") || "overview";
  const setTab = (tab) => setSearchParams({ tab });

  // State
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [intents, setIntents] = useState([]);
  const [buddyMatches, setBuddyMatches] = useState([]);
  const [connections, setConnections] = useState([]);
  const [sharedRides, setSharedRides] = useState([]);
  const [journeys, setJourneys] = useState([]);
  const [routeResults, setRouteResults] = useState(null);
  const [localTransports, setLocalTransports] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [costSplitSummary, setCostSplitSummary] = useState(null);
  const [selectedJourneyId, setSelectedJourneyId] = useState("");

  // Phase 8A Activity Center & Lifecycle States
  const [activitiesData, setActivitiesData] = useState(null);
  const [activitySubTab, setActivitySubTab] = useState("incoming");

  // Phase 4 Tracking, Consent, and Social States
  const [activeJourneyDetail, setActiveJourneyDetail] = useState(null);
  const [locationConsentActive, setLocationConsentActive] = useState(false);
  const [participantLocations, setParticipantLocations] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTargetId, setReportTargetId] = useState("");
  const [reportReason, setReportReason] = useState("SPAM_ABUSE");
  const [reportDetails, setReportDetails] = useState("");
  const [showNewStopModal, setShowNewStopModal] = useState(false);
  const [newStopForm, setNewStopForm] = useState({ location: "", arrival_time: "" });

  // Phase N3 Contact Access & Profile Contact States
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactModalData, setContactModalData] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);

  const [showProfileContactModal, setShowProfileContactModal] = useState(false);
  const [profileContactForm, setProfileContactForm] = useState({
    whatsapp_number: "",
    instagram_username: "",
    preferred_contact: "WHATSAPP",
    contact_visibility: "CONNECTIONS_ONLY"
  });

  // Form States
  const [routeQuery, setRouteResultQuery] = useState({
    origin: "Jakarta",
    destination: "Sembalun",
    date: "2026-09-01",
    passenger: 1,
    budget: 2000000,
    preference: "BALANCED"
  });

  const [localQuery, setLocalQuery] = useState({
    location: "Lombok",
    destination: "Sembalun",
    date: "2026-09-01"
  });

  const [intentForm, setIntentForm] = useState({
    origin: "Jakarta",
    destination: "Sembalun",
    travel_date: "2026-09-01",
    budget_min: 500000,
    budget_max: 1500000,
    route_preference: "BALANCED",
    travel_style: "ADVENTURE",
    number_of_travelers: 1,
    adventure_preference: "Pendakian Rinjani & Camping"
  });

  const [rideForm, setRideForm] = useState({
    origin: "Bandara Lombok (LOP)",
    destination: "Sembalun",
    date: "2026-09-01",
    departure_time: "10:00",
    vehicle_info: "Toyota Avanza White (4 Seats)",
    capacity: 4,
    estimated_cost: 600000
  });

  const [journeyForm, setJourneyForm] = useState({
    title: "Ekspedisi Gunung Rinjani 2026",
    origin: "Jakarta",
    destination: "Gunung Rinjani",
    start_date: "2026-09-01",
    end_date: "2026-09-05"
  });

  const [expenseSourceType, setExpenseSourceType] = useState("MANUAL"); // MANUAL, EXISTING_BOOKING, SHARED_RIDE
  const [expenseForm, setExpenseForm] = useState({
    journey_id: "",
    title: "Sewa Elf Bandara -> Basecamp",
    category: "Transport",
    amount: 600000,
    split_model: "EQUAL",
    source_type: "MANUAL",
    source_id: null
  });

  // Modal triggers
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [showRideModal, setShowRideModal] = useState(false);
  const [showJourneyModal, setShowJourneyModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profRes, intentsRes, matchesRes, ridesRes, journeysRes, bookingsRes, localTransRes, activitiesRes] = await Promise.all([
        backpackerService.getProfile().catch(() => null),
        backpackerService.getMyTravelIntents().catch(() => ({ data: [] })),
        backpackerService.getBuddyMatches().catch(() => ({ data: [] })),
        backpackerService.getSharedRides().catch(() => ({ data: [] })),
        backpackerService.getJourneys().catch(() => ({ data: [] })),
        backpackerService.getMyBookings().catch(() => ({ data: [] })),
        backpackerService.getLocalTransports(localQuery).catch(() => ({ data: { items: [] } })),
        backpackerService.getActivities().catch(() => ({ data: null }))
      ]);

      if (profRes?.data) {
        setProfile(profRes.data);
        setProfileContactForm({
          whatsapp_number: profRes.data.whatsapp_number || profRes.data.phone || "",
          instagram_username: profRes.data.instagram_username || profRes.data.instagram || "",
          preferred_contact: profRes.data.preferred_contact || "WHATSAPP",
          contact_visibility: profRes.data.contact_visibility || "CONNECTIONS_ONLY"
        });
      }
      if (intentsRes?.data) setIntents(intentsRes.data);
      if (matchesRes?.data) setBuddyMatches(matchesRes.data);
      if (ridesRes?.data) setSharedRides(ridesRes.data);
      if (bookingsRes?.data) setMyBookings(bookingsRes.data);
      if (localTransRes?.data?.items) setLocalTransports(localTransRes.data.items);
      if (activitiesRes?.data) setActivitiesData(activitiesRes.data);

      if (journeysRes?.data) {
        setJourneys(journeysRes.data);
        if (journeysRes.data.length > 0) {
          const defaultJId = journeysRes.data[0].id;
          setSelectedJourneyId(defaultJId);
          setExpenseForm((prev) => ({ ...prev, journey_id: defaultJId }));
          fetchCostSplit(defaultJId);
        }
      }

      // Auto load initial route search
      if (!routeResults) {
        const routeRes = await backpackerService.searchRoutes(routeQuery).catch(() => null);
        if (routeRes?.data) setRouteResults(routeRes.data);
      }
    } catch (err) {
      toast.error("Gagal memuat data Trexio Backpacker");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedJourneyId) {
      loadJourneyDetail(selectedJourneyId);
    }
  }, [selectedJourneyId]);

  const loadJourneyDetail = async (jId) => {
    if (!jId) return;
    try {
      const detailRes = await backpackerService.getJourneyDetail(jId);
      setActiveJourneyDetail(detailRes.data);

      const consentRes = await backpackerService.getLocationConsent(jId).catch(() => ({ data: { consent: false } }));
      setLocationConsentActive(!!consentRes?.data?.consent);

      if (consentRes?.data?.consent) {
        const locsRes = await backpackerService.getJourneyLocations(jId).catch(() => ({ data: [] }));
        setParticipantLocations(locsRes?.data || []);
      } else {
        setParticipantLocations([]);
      }
    } catch (err) {
      console.error("Gagal memuat detail journey:", err);
    }
  };

  const handleUpdateJourneyStatus = async (jId, status) => {
    try {
      await backpackerService.updateJourneyStatus(jId, status);
      toast.success(`Status Journey diperbarui menjadi ${status}`);
      loadData();
      loadJourneyDetail(jId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal memperbarui status journey");
    }
  };

  const handleUpdateStopStatus = async (stopId, status) => {
    try {
      await backpackerService.updateStopStatus(stopId, status);
      toast.success(`Waypoint/Stop diperbarui menjadi ${status}`);
      loadJourneyDetail(selectedJourneyId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal memperbarui status waypoint");
    }
  };

  const handleToggleLocationConsent = async (jId, consentBool) => {
    try {
      await backpackerService.toggleLocationConsent(jId, consentBool);
      setLocationConsentActive(consentBool);
      if (consentBool) {
        toast.success("Izin Berbagi Lokasi Presisi (Live GPS) DIAKTIFKAN");
        // Update mock location update
        await backpackerService.updateLocation(jId, {
          lat: -8.375 + Math.random() * 0.02,
          lng: 116.42 + Math.random() * 0.02,
          location_name: "Basecamp / Jalur Pendakian Active"
        }).catch(() => null);

        const locsRes = await backpackerService.getJourneyLocations(jId).catch(() => ({ data: [] }));
        setParticipantLocations(locsRes.data || []);
      } else {
        toast.info("Izin Berbagi Lokasi MATI. Data lokasi Anda telah DIBERSIHKAN dari server.");
        setParticipantLocations([]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengubah izin lokasi");
    }
  };

  const handleAddJourneyStop = async (e) => {
    e.preventDefault();
    if (!selectedJourneyId || !newStopForm.location) return;
    try {
      await backpackerService.addJourneyStop(selectedJourneyId, newStopForm);
      toast.success("Waypoint Baru berhasil ditambahkan");
      setShowNewStopModal(false);
      setNewStopForm({ location: "", arrival_time: "" });
      loadJourneyDetail(selectedJourneyId);
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menambah waypoint");
    }
  };

  const handleUpdateBuddyConnection = async (connId, action) => {
    try {
      await backpackerService.updateBuddyConnection(connId, action);
      toast.success(`Koneksi Buddy berhasil di-${action.toLowerCase()}`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal memproses koneksi");
    }
  };

  const handleReportUser = async (e) => {
    e.preventDefault();
    if (!reportTargetId) return;
    try {
      await backpackerService.reportUser(reportTargetId, reportReason, reportDetails);
      toast.success("Laporan dikirim. Tim Trexio akan menindaklanjuti dalam 1x24 jam.");
      setShowReportModal(false);
      setReportDetails("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengirim laporan");
    }
  };

  // Actions
  const handleRouteSearch = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await backpackerService.searchRoutes(routeQuery);
      setRouteResults(res.data);
      toast.success("Rute perjalanan berhasil dihitung");
    } catch (err) {
      toast.error("Gagal mencari rute");
    } finally {
      setLoading(false);
    }
  };

  const handleLocalSearch = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await backpackerService.getLocalTransports(localQuery);
      setLocalTransports(res.data?.items || []);
      toast.success("Transportasi lokal berhasil ditemukan");
    } catch (err) {
      toast.error("Gagal mencari transportasi lokal");
    } finally {
      setLoading(false);
    }
  };

  const isContactComplete = () => {
    const hasWa = Boolean(profile?.whatsapp_number || profile?.phone);
    const hasIg = Boolean(profile?.instagram_username || profile?.instagram);
    return hasWa || hasIg;
  };

  const handleCreateIntent = async (e) => {
    e.preventDefault();
    if (!isContactComplete()) {
      toast.warning("Lengkapi kontak Anda (WhatsApp atau Instagram) terlebih dahulu sebelum membuat Travel Intent.");
      setShowProfileContactModal(true);
      return;
    }
    try {
      await backpackerService.createTravelIntent(intentForm);
      toast.success("Rencana Perjalanan (Travel Intent) berhasil diterbitkan!");
      setShowIntentModal(false);
      loadData();
    } catch (err) {
      if (err.response?.data?.details?.code === 'CONTACT_PROFILE_INCOMPLETE' || err.response?.data?.message?.includes("contact")) {
        setShowProfileContactModal(true);
      }
      toast.error(err.response?.data?.message || "Gagal membuat Travel Intent");
    }
  };

  const handleCreateRide = async (e) => {
    e.preventDefault();
    if (!isContactComplete()) {
      toast.warning("Lengkapi kontak Anda (WhatsApp atau Instagram) terlebih dahulu sebelum membuat penawaran Shared Ride.");
      setShowProfileContactModal(true);
      return;
    }
    try {
      await backpackerService.createSharedRide(rideForm);
      toast.success("Tawaran Nebeng (Shared Ride) berhasil dibuat!");
      setShowRideModal(false);
      loadData();
    } catch (err) {
      if (err.response?.data?.details?.code === 'CONTACT_PROFILE_INCOMPLETE' || err.response?.data?.message?.includes("contact")) {
        setShowProfileContactModal(true);
      }
      toast.error(err.response?.data?.message || "Gagal membuat Shared Ride");
    }
  };

  const handleJoinRide = async (rideId, seats = 1, note = "") => {
    if (!isContactComplete()) {
      toast.warning("Lengkapi kontak Anda (WhatsApp atau Instagram) terlebih dahulu sebelum meminta bergabung ke Nebeng Ride.");
      setShowProfileContactModal(true);
      return;
    }
    try {
      const res = await backpackerService.joinSharedRide(rideId, seats, note);
      toast.success(res.message || "Permintaan bergabung ke Nebeng Ride berhasil dikirim (PENDING)!");
      setTab("activity");
      loadData();
    } catch (err) {
      if (err.response?.data?.details?.code === 'CONTACT_PROFILE_INCOMPLETE' || err.response?.data?.message?.includes("contact")) {
        setShowProfileContactModal(true);
      }
      toast.error(err.response?.data?.message || "Gagal mengirim permintaan bergabung");
    }
  };

  const handleRespondRideRequest = async (requestId, action) => {
    try {
      const res = await backpackerService.respondToRideRequest(requestId, action);
      toast.success(res.message || `Permintaan Nebeng Ride berhasil di-${action.toLowerCase()}`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal memproses permintaan");
    }
  };

  const handleCancelSharedRide = async (rideId) => {
    try {
      await backpackerService.cancelSharedRide(rideId);
      toast.success("Nebeng Ride berhasil dibatalkan!");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal membatalkan ride");
    }
  };

  const handleRespondBuddyRequest = async (connectionId, action) => {
    try {
      await backpackerService.updateBuddyConnection(connectionId, action);
      toast.success(`Koneksi Buddy berhasil di-${action.toLowerCase()}`);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal memproses koneksi");
    }
  };

  const handleViewContact = async (targetUserId) => {
    setContactLoading(true);
    setShowContactModal(true);
    try {
      const res = await backpackerService.getAuthorizedContact(targetUserId);
      setContactModalData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal memuat kontak kawan trip");
      setShowContactModal(false);
    } finally {
      setContactLoading(false);
    }
  };

  const handleSaveProfileContact = async (e) => {
    e.preventDefault();
    try {
      const updated = await backpackerService.updateProfile(profileContactForm);
      toast.success("Kontak & Privasi Profil Backpacker berhasil disimpan!");
      setProfile(updated.data);
      setShowProfileContactModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan kontak profil");
    }
  };

  const handleConnectBuddy = async (targetId, matchPct) => {
    const hasWa = Boolean(profile?.whatsapp_number || profile?.phone);
    const hasIg = Boolean(profile?.instagram_username || profile?.instagram);
    if (!hasWa && !hasIg) {
      toast.warning("Mohon isi minimal 1 metode kontak (WhatsApp / Instagram) pada profil Anda terlebih dahulu.");
      setShowProfileContactModal(true);
      return;
    }
    try {
      await backpackerService.requestBuddyConnection(targetId, matchPct);
      toast.success("Permintaan teman (Buddy Connection) telah dikirim!");
      loadData();
    } catch (err) {
      if (err.response?.data?.message?.includes("contact method")) {
        setShowProfileContactModal(true);
      }
      toast.error(err.response?.data?.message || "Gagal mengirimkan permintaan koneksi");
    }
  };

  const handleCreateJourney = async (e) => {
    e.preventDefault();
    try {
      await backpackerService.createJourney(journeyForm);
      toast.success("Journey berhasil dibuat!");
      setShowJourneyModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal membuat journey");
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.journey_id) {
      toast.error("Pilih journey terlebih dahulu");
      return;
    }
    try {
      await backpackerService.addJourneyExpense(expenseForm.journey_id, expenseForm);
      toast.success("Pengeluaran berhasil dicatat dan dipatungkan!");
      setShowExpenseModal(false);
      fetchCostSplit(expenseForm.journey_id);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mencatat pengeluaran");
    }
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num || 0);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans pb-20">
      {/* Top Banner Header */}
      <div className="bg-emerald-950 text-white border-b border-emerald-900 py-8 px-4 sm:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-emerald-700 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Compass size={14} className="text-emerald-400" />
              Trexio Backpacker Journey Layer
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Pusat Kendali Perjalanan Backpacker
            </h1>
            <p className="text-emerald-200/90 text-sm mt-1 max-w-2xl">
              Rencanakan rute termurah, temukan teman jalan seperjuangan, patungan kendaraan, dan kelola biaya perjalanan dalam satu ekosistem Trexio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowProfileContactModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 font-bold text-xs border border-emerald-700/80 shadow-xs transition-all cursor-pointer"
            >
              <Phone size={15} className="text-emerald-400" />
              <span>Kontak Profil</span>
              {(profile?.whatsapp_number || profile?.phone || profile?.instagram_username) ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Belum diisi"></span>
              )}
            </button>
            <button
              onClick={() => setShowIntentModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Plus size={16} /> Buat Travel Intent
            </button>
            <button
              onClick={() => setShowJourneyModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 shadow-sm transition-all cursor-pointer"
            >
              <MapPin size={16} /> Buat Journey Baru
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Bar */}
      <div className="sticky top-16 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 shadow-xs px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
          {[
            { id: "overview", label: "Ringkasan", icon: Compass },
            { id: "activity", label: "Request & Activity", icon: Clock, badge: activitiesData?.action_required_count },
            { id: "route", label: "Find Your Route", icon: Navigation },
            { id: "buddy", label: "Find Your Buddy", icon: Users },
            { id: "assistance", label: "Bantuan Matching (Mediated)", icon: Sparkles },
            { id: "ride", label: "Share Your Ride", icon: Car },
            { id: "split", label: "Split Your Cost", icon: Calculator },
            { id: "track", label: "Track Journey", icon: MapPin },
            { id: "transport", label: "Find Local Transport", icon: Tag }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer relative ${
                  active
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800"
                }`}
              >
                <Icon size={15} />
                {tab.label}
                {tab.badge > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Container Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        {/* Contact Profile Gate Prerequisite Banner */}
        {profile && !isContactComplete() && (
          <div className="bg-emerald-950/90 border border-emerald-600/60 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                <Phone size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  Kontak Profil Belum Lengkap! <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase">Prerequisite Gate</span>
                </h4>
                <p className="text-xs text-emerald-100/90 mt-0.5">
                  Tambahkan WhatsApp atau Instagram Anda untuk mengaktifkan Find Your Buddy & Share Your Ride. Kontak Anda selalu diproteksi secara privat.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowProfileContactModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shrink-0 cursor-pointer shadow-md transition-all flex items-center gap-2"
            >
              <Phone size={14} /> Lengkapi Kontak
            </button>
          </div>
        )}

        {/* Action Required Alert Banner */}
        {activitiesData?.action_required_count > 0 && activeTab !== "activity" && (
          <div className="bg-amber-500/15 border border-amber-500/30 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {activitiesData.action_required_count} Permintaan Menunggu Tindakan Anda!
                </h4>
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  Ada traveler yang meminta bergabung ke Nebeng Ride Anda atau mengirim permintaan koneksi Kawan Buddy.
                </p>
              </div>
            </div>
            <button
              onClick={() => setTab("activity")}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs transition-all"
            >
              Buka Activity Center
            </button>
          </div>
        )}

        {/* TAB 0: REQUEST & ACTIVITY CENTER */}
        {activeTab === "activity" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Source of Truth: Backend Database Synchronized
                  </span>
                  {activitiesData?.action_required_count > 0 && (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {activitiesData.action_required_count} Action Required
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-2">
                  <Clock className="text-emerald-600" size={22} /> Request &amp; Activity Lifecycle Center
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-2xl">
                  Pantau status permintaan Nebeng Ride, Kawan Buddy, dan aksi persetujuan secara real-time. Seluruh lifecycle (PENDING, ACCEPTED, REJECTED, CANCELLED) tersimpan aman di database server.
                </p>
              </div>

              <button
                onClick={loadData}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-zinc-700 transition-all shrink-0 cursor-pointer"
              >
                🔄 Refresh Status
              </button>
            </div>

            {/* Sub-Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2 overflow-x-auto no-scrollbar">
              {[
                { id: "incoming", label: `Permintaan Masuk (${(activitiesData?.incoming_ride_requests?.filter(r=>r.status==='PENDING').length || 0) + (activitiesData?.incoming_buddy_requests?.length || 0)})` },
                { id: "outgoing", label: `Permintaan Keluar Saya (${activitiesData?.outgoing_ride_requests?.length || 0})` },
                { id: "my_rides", label: `Nebeng Ride Saya (${activitiesData?.my_shared_rides?.length || 0})` },
                { id: "buddies", label: `Koneksi Buddy (${activitiesData?.outgoing_buddy_requests?.length || 0})` }
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setActivitySubTab(sub.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activitySubTab === sub.id
                      ? "bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs"
                      : "bg-slate-100 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* SUB-PANEL 1: INCOMING REQUESTS (ACTION REQUIRED) */}
            {activitySubTab === "incoming" && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Car size={16} className="text-emerald-600" /> Permintaan Nebeng Ride Masuk
                  </h3>

                  {!activitiesData?.incoming_ride_requests || activitiesData.incoming_ride_requests.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center italic">
                      Belum ada permintaan masuk untuk Nebeng Ride milik Anda.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activitiesData.incoming_ride_requests.map((req) => (
                        <div
                          key={req.id}
                          className={`p-5 rounded-2xl border transition-all ${
                            req.status === 'PENDING'
                              ? 'bg-amber-500/5 border-amber-500/30'
                              : 'bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              req.status === 'PENDING'
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                                : req.status === 'ACCEPTED'
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                              {req.status === 'PENDING' ? '⏳ MENUNGGU PERSETUJUAN ANDA' : req.status}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {new Date(req.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="mt-3">
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {req.requester_profile?.display_name || 'Traveler'}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                              Tingkat Pendakian: <strong>{req.requester_profile?.hiking_level || 'Pemula'}</strong>
                            </p>
                            {req.ride_info && (
                              <div className="mt-2 text-xs bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-700 space-y-1">
                                <p>📍 Rute: <strong>{req.ride_info.origin} &rarr; {req.ride_info.destination}</strong></p>
                                <p>📅 Tanggal: {req.ride_info.date} ({req.ride_info.departure_time})</p>
                                <p>💺 Kursi Diminta: <strong>{req.seats_requested} Kursi</strong></p>
                                {req.note && <p className="italic text-slate-600 dark:text-zinc-300 mt-1">"{req.note}"</p>}
                              </div>
                            )}
                          </div>

                          {req.status === 'PENDING' && (
                            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-zinc-700 flex items-center gap-2">
                              <button
                                onClick={() => handleRespondRideRequest(req.id, 'ACCEPT')}
                                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                              >
                                <CheckCircle size={14} /> Setujui
                              </button>
                              <button
                                onClick={() => handleRespondRideRequest(req.id, 'REJECT')}
                                className="flex-1 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                              >
                                <XCircle size={14} /> Tolak
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Users size={16} className="text-emerald-600" /> Permintaan Koneksi Kawan Buddy Masuk
                  </h3>

                  {!activitiesData?.incoming_buddy_requests || activitiesData.incoming_buddy_requests.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center italic">
                      Belum ada permintaan koneksi Buddy yang perlu disetujui.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activitiesData.incoming_buddy_requests.map((conn) => (
                        <div key={conn.id} className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/30">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-700 dark:text-amber-400">
                              PENDING BUDDY REQUEST
                            </span>
                            <span className="text-xs font-bold text-emerald-600">
                              {conn.match_percentage}% Match
                            </span>
                          </div>

                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-2">
                            {conn.requester_profile?.display_name || 'Traveler'}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-zinc-400">
                            {conn.requester_profile?.bio || 'Ingin terhubung sebagai kawan perjalanan'}
                          </p>

                          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-zinc-700 flex items-center gap-2">
                            <button
                              onClick={() => handleRespondBuddyRequest(conn.id, 'ACCEPT')}
                              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                            >
                              Terima Koneksi
                            </button>
                            <button
                              onClick={() => handleRespondBuddyRequest(conn.id, 'REJECT')}
                              className="flex-1 py-2 rounded-xl bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs cursor-pointer"
                            >
                              Tolak
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-PANEL 2: OUTGOING REQUESTS */}
            {activitySubTab === "outgoing" && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Car size={16} className="text-emerald-600" /> Permintaan Nebeng Ride yang Saya Kirim
                </h3>

                {!activitiesData?.outgoing_ride_requests || activitiesData.outgoing_ride_requests.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center italic">
                    Anda belum pernah mengirim permintaan bergabung Nebeng Ride.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activitiesData.outgoing_ride_requests.map((req) => (
                      <div
                        key={req.id}
                        className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              req.status === 'PENDING'
                                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                : req.status === 'ACCEPTED'
                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                : req.status === 'REJECTED'
                                ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                              {req.status === 'PENDING'
                                ? '⏳ MENUNGGU PERSETUJUAN PEMILIK'
                                : req.status === 'ACCEPTED'
                                ? '🎉 DITERIMA (PESERTA RESMI)'
                                : req.status === 'REJECTED'
                                ? '❌ DITOLAK PEMILIK'
                                : req.status === 'RIDE_CANCELLED'
                                ? '🚫 RIDE DIBATALKAN'
                                : req.status}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {req.seats_requested} Kursi
                            </span>
                          </div>

                          {req.ride_info ? (
                            <div className="mt-3 space-y-1">
                              <h4 className="font-black text-sm text-slate-900 dark:text-white">
                                {req.ride_info.origin} &rarr; {req.ride_info.destination}
                              </h4>
                              <p className="text-xs text-slate-500">
                                Pemilik: <strong>{req.ride_info.owner_name}</strong> • Tanggal: {req.ride_info.date} ({req.ride_info.departure_time})
                              </p>
                              <p className="text-xs text-slate-500">
                                Kendaraan: {req.ride_info.vehicle_info} • Tarif: {formatRupiah(req.ride_info.cost_per_person)} / org
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 mt-2 italic">Informasi ride tidak tersedia</p>
                          )}
                        </div>

                        {req.status === 'PENDING' && (
                          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-zinc-700">
                            <button
                              onClick={() => handleRespondRideRequest(req.id, 'CANCEL')}
                              className="w-full py-2 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              Batalkan Request
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-PANEL 3: MY SHARED RIDES */}
            {activitySubTab === "my_rides" && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Car size={16} className="text-emerald-600" /> Nebeng Ride yang Saya Tawarkan
                  </h3>
                  <button
                    onClick={() => setShowRideModal(true)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    + Buat Ride Baru
                  </button>
                </div>

                {!activitiesData?.my_shared_rides || activitiesData.my_shared_rides.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center italic">
                    Anda belum pernah menawarkan Nebeng Ride.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activitiesData.my_shared_rides.map((ride) => (
                      <div key={ride.id} className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40">
                        <div className="flex items-center justify-between">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            ride.status === 'OPEN'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-600 border border-red-500/20'
                          }`}>
                            {ride.status}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {ride.available_seats} / {ride.capacity} Kursi Tersedia
                          </span>
                        </div>

                        <h4 className="font-extrabold text-base text-slate-900 dark:text-white mt-2">
                          {ride.origin} &rarr; {ride.destination}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          📅 {ride.date} jam {ride.departure_time} • {ride.vehicle_info}
                        </p>

                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-zinc-700">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Peserta Terdaftar ({ride.participants?.length || 0}):
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {ride.participants?.map((p) => (
                              <span key={p.id} className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
                                👤 {p.display_name} ({p.seats_booked} seats)
                              </span>
                            ))}
                          </div>
                        </div>

                        {ride.status !== 'CANCELLED' && (
                          <div className="mt-4 pt-2 flex items-center justify-end">
                            <button
                              onClick={() => handleCancelSharedRide(ride.id)}
                              className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded-xl text-xs font-bold cursor-pointer"
                            >
                              Batalkan Ride Ini
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-PANEL 4: BUDDY CONNECTIONS */}
            {activitySubTab === "buddies" && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Users size={16} className="text-emerald-600" /> Status Permintaan & Koneksi Kawan Buddy
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold">
                    Double Opt-In Contact Security Active
                  </span>
                </div>

                {!activitiesData?.outgoing_buddy_requests || activitiesData.outgoing_buddy_requests.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center italic">
                    Belum ada permintaan koneksi Buddy yang Anda kirim.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activitiesData.outgoing_buddy_requests.map((conn) => {
                      const targetUser = conn.target_profile;
                      const isAccepted = conn.status === 'ACCEPTED';
                      const isPending = conn.status === 'PENDING';

                      return (
                        <div key={conn.id} className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                                {targetUser?.display_name || 'Traveler Backpacker'}
                                {isAccepted && <ShieldCheck size={14} className="text-emerald-500" title="Terverifikasi & Connected" />}
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Match: <strong>{conn.match_percentage}%</strong> • {targetUser?.hiking_level || 'Backpacker'}
                              </p>
                            </div>

                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              isPending
                                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                : isAccepted
                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                              {conn.status}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-700/60 flex items-center justify-between gap-2">
                            {isAccepted && (
                              <>
                                <button
                                  onClick={() => handleViewContact(conn.target_id)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
                                >
                                  <Phone size={13} /> Lihat Kontak WA/IG
                                </button>
                                <button
                                  onClick={() => handleUpdateBuddyConnection(conn.id, 'DISCONNECT')}
                                  className="px-2.5 py-1.5 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 dark:bg-zinc-800 dark:hover:bg-rose-950 text-slate-700 dark:text-zinc-300 rounded-xl text-[11px] font-bold cursor-pointer transition-all"
                                  title="Putuskan koneksi kawan trip"
                                >
                                  Putuskan Koneksi
                                </button>
                              </>
                            )}

                            {isPending && (
                              <button
                                onClick={() => handleUpdateBuddyConnection(conn.id, 'CANCEL')}
                                className="px-3 py-1.5 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 dark:bg-zinc-800 dark:hover:bg-rose-950 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold cursor-pointer transition-all"
                              >
                                Batalkan Request
                              </button>
                            )}

                            {!isAccepted && !isPending && (
                              <span className="text-[11px] text-slate-400 italic">Status: {conn.status}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
                <div className="text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">
                  Journey Aktif
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {journeys.length}
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                  <CheckCircle size={12} /> {journeys.filter((j) => j.status === "PLANNED").length} Planned
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
                <div className="text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">
                  Travel Intent
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {intents.length}
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 block">
                  Aktif Mencari Buddy
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
                <div className="text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">
                  Buddy Match
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {buddyMatches.length}
                </div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-1 block">
                  Match &gt; 50%
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs">
                <div className="text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">
                  Shared Ride
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {sharedRides.length}
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 block">
                  Open Capacity
                </span>
              </div>
            </div>

            {/* Quick Action Hub Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                onClick={() => setTab("route")}
                className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Navigation size={20} />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Find Your Route
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed">
                  Bandingkan transportasi termurah, tercepat, dan kombinasi terbaik menuju destinasi adventure Anda.
                </p>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-4">
                  Cari Rute Perjalanan <ChevronRight size={14} />
                </div>
              </div>

              <div
                onClick={() => setTab("buddy")}
                className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Users size={20} />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Find Your Buddy
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed">
                  Temukan teman jalan dengan tanggal, tujuan, dan gaya perjalanan yang sama secara aman &amp; privacy-safe.
                </p>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-4">
                  Lihat Rekomendasi Buddy <ChevronRight size={14} />
                </div>
              </div>

              <div
                onClick={() => setTab("ride")}
                className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Car size={20} />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Share Your Ride
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed">
                  Tawarkan nebeng atau gabung rombongan van/elf dari bandara/stasiun menuju basecamp untuk hemat ongkos.
                </p>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-4">
                  Cari Ride Sharing <ChevronRight size={14} />
                </div>
              </div>
            </div>

            {/* Recent Active Journey Card Section */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="text-emerald-600" size={18} /> Journey Perjalanan Anda
                </h2>
                <button
                  onClick={() => setShowJourneyModal(true)}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Plus size={14} /> Tambah Journey
                </button>
              </div>

              {journeys.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-zinc-400">
                  <p className="text-sm font-semibold">Belum ada journey perjalanan aktif.</p>
                  <button
                    onClick={() => setShowJourneyModal(true)}
                    className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                  >
                    Buat Journey Pertama Anda
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {journeys.map((j) => (
                    <div
                      key={j.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/50 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {j.status}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-semibold">
                            {j.start_date}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base mt-2">
                          {j.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                          {j.origin} &rarr; {j.destination}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-zinc-700 flex items-center justify-between">
                        <button
                          onClick={() => setTab("track")}
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          Pantau Timeline &amp; Stop &rarr;
                        </button>
                        <button
                          onClick={() => {
                            setExpenseForm((prev) => ({ ...prev, journey_id: j.id }));
                            setShowExpenseModal(true);
                          }}
                          className="text-xs font-bold text-slate-700 dark:text-zinc-300 hover:text-emerald-600"
                        >
                          + Patungan Biaya
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FIND YOUR ROUTE */}
        {activeTab === "route" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-xs">
              <h2 className="text-lg font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Navigation className="text-emerald-600" size={18} /> Find Your Route Engine
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
                Cari rute perjalanan dari asal ke destinasi tujuan menggunakan supply shuttle &amp; armada terverifikasi dari Marketplace Trexio.
              </p>

              <form onSubmit={handleRouteSearch} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
                <div className="md:col-span-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1 block">
                    Asal (Origin)
                  </label>
                  <input
                    type="text"
                    value={routeQuery.origin}
                    onChange={(e) => setRouteResultQuery({ ...routeQuery, origin: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold"
                    placeholder="Contoh: Jakarta"
                    required
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1 block">
                    Tujuan (Destination)
                  </label>
                  <input
                    type="text"
                    value={routeQuery.destination}
                    onChange={(e) => setRouteResultQuery({ ...routeQuery, destination: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold"
                    placeholder="Contoh: Sembalun"
                    required
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1 block">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={routeQuery.date}
                    onChange={(e) => setRouteResultQuery({ ...routeQuery, date: e.target.value })}
                    className="w-full h-9 px-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1 block">
                    Max Anggaran
                  </label>
                  <input
                    type="number"
                    value={routeQuery.budget}
                    onChange={(e) => setRouteResultQuery({ ...routeQuery, budget: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 mb-1 block">
                    Prioritas Rute
                  </label>
                  <select
                    value={routeQuery.preference}
                    onChange={(e) => setRouteResultQuery({ ...routeQuery, preference: e.target.value })}
                    className="w-full h-9 px-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold"
                  >
                    <option value="CHEAPEST">Termurah</option>
                    <option value="FASTEST">Tercepat</option>
                    <option value="BALANCED">Seimbang</option>
                    <option value="FEWEST_TRANSFERS">Tanpa Transit</option>
                  </select>
                </div>

                <div className="md:col-span-1 flex items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Search size={14} /> {loading ? "Mencari..." : "Cari Rute"}
                  </button>
                </div>
              </form>
            </div>

            {/* Results */}
            {routeResults && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                    Hasil Rekomendasi Rute Intelligence ({routeResults.results?.length || 0} Opsi Perjalanan)
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold">
                    Supply Rute Terverifikasi dari Trexio Transport
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {routeResults.results.map((r) => (
                    <div
                      key={r.route_id}
                      className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-emerald-500 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              r.type === "CHEAPEST"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : r.type === "FASTEST"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                : r.type === "FEWEST_TRANSFERS"
                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                            }`}
                          >
                            {r.type}
                          </span>
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {formatRupiah(r.total_price)}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                          {r.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-2 font-medium">
                          <span>⏱️ {r.estimated_duration}</span>
                          <span>🔄 {r.transfer_count} Transit</span>
                        </p>

                        <div className="mt-3 space-y-2 border-t border-slate-100 dark:border-zinc-800 pt-2.5">
                          {r.segments.map((seg, idx) => (
                            <div key={seg.segment_id || idx} className="text-xs bg-slate-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800">
                              <div className="font-bold text-slate-800 dark:text-zinc-200 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  {seg.mode}
                                </div>
                                <span className="text-[11px] font-black text-emerald-600">
                                  {formatRupiah(seg.price)}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 pl-5">
                                {seg.from} &rarr; {seg.to} ({seg.duration})
                              </div>
                              {seg.productId && (
                                <div className="mt-2 pl-5">
                                  <Link
                                    to={`/trip/${seg.productId}`}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-500 underline"
                                  >
                                    Pesan &amp; Lihat Product Detail &rarr;
                                  </Link>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          Kombinasi Supply Marketplace
                        </span>
                        <Link
                          to="/explore?category=shuttle"
                          className="text-[11px] font-bold text-emerald-600 hover:underline"
                        >
                          Cari Transport &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FIND YOUR BUDDY */}
        {activeTab === "buddy" && (
          <div className="space-y-6">
            <MatchingAssistanceInbox onRequestNewAssistance={() => setShowIntentModal(true)} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="text-emerald-600" size={18} /> Find Your Buddy (Direct Intent Matches)
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Pencocokan langsung berdasarkan tanggal, destinasi, dan anggaran secara terarah &amp; privasi terjamin.
                </p>
              </div>
              <button
                onClick={() => setShowIntentModal(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs shrink-0 cursor-pointer"
              >
                + Buat Travel Intent Baru
              </button>
            </div>

            {/* Privacy Rules Banner */}
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-2xl flex items-start gap-3 text-xs text-emerald-900 dark:text-emerald-200">
              <Shield size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold uppercase tracking-wide text-[11px] text-emerald-800 dark:text-emerald-300 mb-0.5">
                  Proteksi Privasi Default: PRIVATE
                </p>
                <p>
                  Nomor Telepon, Email, Lokasi Rumah, dan Live GPS Anda <strong>tersembunyi secara default</strong>. Data kontak baru hanya akan dibagikan jika kedua belah pihak menyetujui koneksi Buddy (Double Opt-In).
                </p>
              </div>
            </div>

            {/* Matches List */}
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Rekomendasi Buddy Teratas (Travel Intent Matching)
              </h3>

              {buddyMatches.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center text-slate-500">
                  Belum ada calon buddy yang cocok. Buat Travel Intent baru untuk meningkatkan pencocokan!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {buddyMatches.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl flex flex-col justify-between shadow-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            ⚡ {m.match_percentage}% Match
                          </span>
                          <span className="text-xs text-slate-500 font-semibold">
                            📅 {m.buddy_intent?.travel_date}
                          </span>
                        </div>

                        <div className="mt-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                              {m.buddy_profile?.display_name || "Traveler Backpacker"}
                            </h4>
                            <span className="text-[10px] font-black text-slate-400 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 rounded-md uppercase">
                              🔒 Profile Private
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block mt-1">
                            {m.buddy_profile?.hiking_level || "Backpacker"}
                          </span>
                          <p className="text-xs text-slate-600 dark:text-zinc-300 mt-2">
                            "{m.buddy_intent?.adventure_preference || "Rencana petualangan bersama"}"
                          </p>
                          <div className="text-xs text-slate-500 dark:text-zinc-400 mt-2">
                            📍 {m.buddy_intent?.origin} &rarr; {m.buddy_intent?.destination}
                          </div>
                          {m.buddy_intent?.booking_reference_name && (
                            <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/80 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300">
                              🎟️ Booking Ref: {m.buddy_intent.booking_reference_name}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500 font-bold uppercase">
                          Status: {m.connection_status}
                        </span>

                        <div className="flex items-center gap-2">
                          {m.connection_status === "NONE" && (
                            <button
                              onClick={() => handleConnectBuddy(m.buddy_intent?.user_id, m.match_percentage)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                            >
                              Ajukan Connect &rarr;
                            </button>
                          )}

                          {m.connection_status === "PENDING" && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleUpdateBuddyConnection(m.connection_id, "ACCEPT")}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                              >
                                Terima
                              </button>
                              <button
                                onClick={() => handleUpdateBuddyConnection(m.connection_id, "REJECT")}
                                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                              >
                                Tolak
                              </button>
                              <button
                                onClick={() => handleUpdateBuddyConnection(m.connection_id, "BLOCK")}
                                className="px-2 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold cursor-pointer"
                              >
                                Blokir
                              </button>
                            </div>
                          )}

                          {m.connection_status === "ACCEPTED" && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleViewContact(m.buddy_intent?.user_id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
                              >
                                <Phone size={13} /> Kontak WA/IG
                              </button>
                              <button
                                onClick={() => handleUpdateBuddyConnection(m.connection_id, "DISCONNECT")}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-100 hover:text-rose-700 dark:bg-zinc-800 dark:hover:bg-rose-950 text-slate-600 dark:text-zinc-300 rounded-xl text-xs font-bold cursor-pointer transition-all"
                                title="Putuskan koneksi"
                              >
                                Putuskan
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => {
                              setReportTargetId(m.buddy_intent?.user_id);
                              setShowReportModal(true);
                            }}
                            className="px-2.5 py-1 text-slate-400 hover:text-red-500 text-xs font-semibold cursor-pointer"
                            title="Laporkan Abuse / Fake"
                          >
                            ⚠️ Laporkan
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: BANTUAN MATCHING (MEDIATED) */}
        {activeTab === "assistance" && (
          <div className="space-y-6">
            <MatchingAssistanceInbox onRequestNewAssistance={() => setShowIntentModal(true)} />
          </div>
        )}

        {/* TAB 4: SHARE YOUR RIDE */}
        {activeTab === "ride" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Car className="text-emerald-600" size={18} /> Share Your Ride (Patungan Nebeng)
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Bagi kapasitas tempat duduk armada/van menuju basecamp secara transparan dan terkunci secara atomik.
                </p>
              </div>
              <button
                onClick={() => setShowRideModal(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs shrink-0"
              >
                + Tawarkan Ride Baru
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sharedRides.map((ride) => (
                <div
                  key={ride.id}
                  className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          ride.status === "OPEN"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                        }`}
                      >
                        {ride.status}
                      </span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {formatRupiah(ride.cost_per_person)} / Orang
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-3">
                      {ride.origin} &rarr; {ride.destination}
                    </h3>

                    <div className="text-xs text-slate-500 dark:text-zinc-400 mt-2 space-y-1">
                      <p>📅 Tanggal: {ride.date} ({ride.departure_time})</p>
                      <p>🚘 Kendaraan: {ride.vehicle_info}</p>
                      <p>💺 Sisa Kursi: <strong className="text-emerald-600">{ride.available_seats}</strong> dari {ride.capacity}</p>
                      {ride.booking_reference_name && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/80 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300">
                          🎟️ Booking Ref: {ride.booking_reference_name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">
                      Total Estimasi: {formatRupiah(ride.estimated_cost)}
                    </span>
                    {(() => {
                      const existingReq = activitiesData?.outgoing_ride_requests?.find((r) => r.shared_ride_id === ride.id);
                      if (existingReq) {
                        return (
                          <button
                            onClick={() => setTab("activity")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                              existingReq.status === "PENDING"
                                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
                                : existingReq.status === "ACCEPTED"
                                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {existingReq.status === "PENDING"
                              ? "⏳ Request Pending (Cek Center)"
                              : existingReq.status === "ACCEPTED"
                              ? "✓ Diterima (Peserta Resmi)"
                              : "Status: " + existingReq.status}
                          </button>
                        );
                      }
                      if (ride.owner_id === user?.id) {
                        return (
                          <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-xs font-bold">
                            👑 Pemilik Ride
                          </span>
                        );
                      }
                      if (ride.status === "OPEN" && ride.available_seats > 0) {
                        return (
                          <button
                            onClick={() => handleJoinRide(ride.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
                          >
                            Ajukan Minta Nebeng
                          </button>
                        );
                      }
                      return (
                        <span className="text-xs text-slate-400 font-bold">Penuh</span>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: SPLIT YOUR COST */}
        {activeTab === "split" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Calculator className="text-emerald-600" size={18} /> Split Your Cost (Kalkulator Patungan)
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Hitung dan alokasikan biaya pengeluaran perjalanan (Equal, Custom, Percentage) serta pantau saldo reimburse antar peserta.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <select
                  value={selectedJourneyId}
                  onChange={(e) => {
                    const jId = e.target.value;
                    setSelectedJourneyId(jId);
                    setExpenseForm((prev) => ({ ...prev, journey_id: jId }));
                    fetchCostSplit(jId);
                  }}
                  className="h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-bold"
                >
                  {journeys.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.destination})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs shrink-0 cursor-pointer"
                >
                  + Catat Pengeluaran
                </button>
              </div>
            </div>

            {/* Cost Split Summary & Settlement Panel */}
            {costSplitSummary && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Total & Category Card */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-4">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Total Pengeluaran Journey
                    </span>
                    <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                      {formatRupiah(costSplitSummary.total_journey_expense)}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-zinc-800">
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-2">
                      Rincian Per Kategori
                    </span>
                    <div className="space-y-2">
                      {Object.entries(costSplitSummary.categories || {}).map(([cat, amt]) => (
                        <div key={cat} className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-500">{cat}</span>
                          <span className="text-slate-900 dark:text-white font-bold">{formatRupiah(amt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Settlement Balance Table */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center justify-between">
                    <span>Status Pelunasan &amp; Saldo Reimburse Peserta</span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full">
                      {costSplitSummary.participants?.length || 0} Peserta
                    </span>
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-zinc-800 text-slate-400 uppercase font-black">
                          <th className="pb-2">Peserta</th>
                          <th className="pb-2">Total Dibayar</th>
                          <th className="pb-2">Alokasi Biaya</th>
                          <th className="pb-2">Saldo Akhir</th>
                          <th className="pb-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                        {(costSplitSummary.participants || []).map((p) => {
                          const isSettled = Math.abs(p.net_balance) < 1;
                          const isOwes = p.net_balance < -1;
                          const isReceives = p.net_balance > 1;

                          return (
                            <tr key={p.user_id} className="font-semibold">
                              <td className="py-3 text-slate-900 dark:text-white font-bold">
                                {p.display_name}
                              </td>
                              <td className="py-3 text-slate-600 dark:text-zinc-300">
                                {formatRupiah(p.total_paid)}
                              </td>
                              <td className="py-3 text-slate-600 dark:text-zinc-300">
                                {formatRupiah(p.total_assigned)}
                              </td>
                              <td className="py-3 font-bold">
                                <span className={isReceives ? "text-emerald-600" : isOwes ? "text-red-500" : "text-slate-500"}>
                                  {formatRupiah(Math.abs(p.net_balance))}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                {isSettled && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600">
                                    SELESAI / LUNAS
                                  </span>
                                )}
                                {isOwes && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-500/10 text-red-600">
                                    BAYAR KE ROMBONGAN
                                  </span>
                                )}
                                {isReceives && (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-600">
                                    MENERIMA REIMBURSE
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* List of Recorded Expenses */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                Daftar Item Pengeluaran
              </h3>

              {!costSplitSummary?.expenses || costSplitSummary.expenses.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Belum ada item pengeluaran pada journey ini. Klik tombol "+ Catat Pengeluaran" di atas!
                </div>
              ) : (
                <div className="space-y-3">
                  {costSplitSummary.expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-4 rounded-xl border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/10 text-emerald-600 uppercase">
                            {exp.category}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {exp.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Model Split: <strong>{exp.split_model}</strong> • Sumber: {exp.source_type}
                        </p>
                        {exp.booking_reference_name && (
                          <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/80 text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300">
                            🎟️ Booking Ref: {exp.booking_reference_name}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {formatRupiah(exp.amount)}
                        </span>
                        <div className="text-[11px] text-slate-400 font-medium">
                          Oleh {exp.paid_by_name || "Peserta"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: TRACK YOUR JOURNEY */}
        {activeTab === "track" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="text-emerald-600" size={18} /> Track Your Journey &amp; Live Check-in
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Sistem monitoring tahapan ekspedisi, update status titik perhentian (stops), dan fitur Live GPS Opt-in.
                </p>
              </div>

              {/* Journey Selector */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">Pilih Journey:</span>
                <select
                  value={selectedJourneyId}
                  onChange={(e) => setSelectedJourneyId(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-bold text-slate-900 dark:text-white"
                >
                  {journeys.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activeJourneyDetail && (
              <div className="space-y-6">
                {/* Lifecycle Status & Leader Controls */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Status Ekspedisi Saat Ini:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                        activeJourneyDetail.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : activeJourneyDetail.status === 'COMPLETED'
                          ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}>
                        {activeJourneyDetail.status}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                      {activeJourneyDetail.title} ({activeJourneyDetail.origin} &rarr; {activeJourneyDetail.destination})
                    </h3>
                    {activeJourneyDetail.booking_reference_name && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/80 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300">
                        🎟️ Booking Ref: {activeJourneyDetail.booking_reference_name}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {activeJourneyDetail.status !== 'ACTIVE' && (
                      <button
                        onClick={() => handleUpdateJourneyStatus(selectedJourneyId, 'ACTIVE')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                      >
                        🚀 Start Journey (Mulai Ekspedisi)
                      </button>
                    )}

                    {activeJourneyDetail.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleUpdateJourneyStatus(selectedJourneyId, 'PAUSED')}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                      >
                        ⏸️ Istirahat / Pause
                      </button>
                    )}

                    {activeJourneyDetail.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleUpdateJourneyStatus(selectedJourneyId, 'COMPLETED')}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 shadow-xs cursor-pointer"
                      >
                        🏁 Selesaikan Ekspedisi
                      </button>
                    )}
                  </div>
                </div>

                {/* OPT-IN Live GPS Tracking & Privacy Control Card */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Shield size={20} />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          Live GPS Sharing (Arsitektur strictly OPT-IN)
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                          Lokasi persis Anda <strong>HANYA</strong> dibagikan jika Anda mengaktifkan sakelar izin ini. Pencabutan izin langsung menghapus seluruh cache lokasi server.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleLocationConsent(selectedJourneyId, !locationConsentActive)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                        locationConsentActive
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                      }`}
                    >
                      {locationConsentActive ? '🟢 Live GPS: AKTIF' : '⚪ Live GPS: NON-AKTIF'}
                    </button>
                  </div>

                  {locationConsentActive ? (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                          Menyiarkan Posisi Koordinat GPS Secara Real-time
                        </span>
                        <button
                          onClick={() => handleToggleLocationConsent(selectedJourneyId, true)}
                          className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[11px] cursor-pointer"
                        >
                          Ping GPS Baru
                        </button>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wide">
                          Posisi Kawan Trip Yang Menyetujui Sharing:
                        </h4>
                        {participantLocations.length === 0 ? (
                          <div className="text-xs text-slate-400 italic bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-xl">
                            Belum ada peserta lain yang mengaktifkan Live GPS.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {participantLocations.map((loc, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/80 flex items-center justify-between text-xs"
                              >
                                <div>
                                  <span className="font-extrabold text-slate-900 dark:text-white">
                                    {loc.display_name}
                                  </span>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    📍 {loc.location_name || `${loc.latitude?.toFixed(4)}, ${loc.longitude?.toFixed(4)}`}
                                  </div>
                                </div>
                                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                  Live GPS
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800 text-center text-xs text-slate-500">
                      🔒 GPS Sharing Matikan. Lokasi Anda aman &amp; tidak disiarkan kepada siapapun.
                    </div>
                  )}
                </div>

                {/* Waypoints & Stops Check-in Timeline */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                        Timeline Pos &amp; Titik Check-In (Stops)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Lakukan check-in setiap tiba di Pos Pendakian atau Rest Area.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowNewStopModal(true)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      + Tambah Waypoint / Stop
                    </button>
                  </div>

                  {(!activeJourneyDetail.stops || activeJourneyDetail.stops.length === 0) ? (
                    <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
                      Belum ada Waypoint/Stop yang ditambahkan. Klik "+ Tambah Waypoint / Stop" untuk memulai!
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-emerald-500/30 ml-4 pl-6 space-y-6">
                      {activeJourneyDetail.stops.map((stop, sIdx) => (
                        <div key={stop.id} className="relative">
                          <span className={`absolute -left-[31px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                            stop.status === 'COMPLETED'
                              ? 'bg-emerald-600 text-white'
                              : stop.status === 'ARRIVED'
                              ? 'bg-amber-500 text-white animate-pulse'
                              : 'bg-slate-300 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                          }`}>
                            {sIdx + 1}
                          </span>

                          <div className="bg-slate-50 dark:bg-zinc-800/60 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                  {stop.location}
                                </h4>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                  stop.status === 'COMPLETED'
                                    ? 'bg-emerald-500/10 text-emerald-600'
                                    : stop.status === 'ARRIVED'
                                    ? 'bg-amber-500/10 text-amber-600'
                                    : 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-zinc-300'
                                }`}>
                                  {stop.status}
                                </span>
                              </div>
                              {stop.arrival_time && (
                                <p className="text-xs text-slate-500 mt-1">
                                  ⏰ Estimasi/Tiba: {stop.arrival_time}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {stop.status === 'PENDING' && (
                                <button
                                  onClick={() => handleUpdateStopStatus(stop.id, 'ARRIVED')}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold rounded-lg cursor-pointer"
                                >
                                  📍 Check-in: Tiba di Pos
                                </button>
                              )}

                              {stop.status === 'ARRIVED' && (
                                <button
                                  onClick={() => handleUpdateStopStatus(stop.id, 'COMPLETED')}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer"
                                >
                                  ✓ Selesaikan Waypoint
                                </button>
                              )}

                              {stop.status === 'COMPLETED' && (
                                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                  <CheckCircle size={14} /> Selesai
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: LOCAL TRANSPORT */}
        {activeTab === "transport" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800">
              <h2 className="text-lg font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Tag className="text-emerald-600" size={18} /> Find Local Transport (Angkutan Lokal)
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
                Cari angkutan lokal, shuttle ke trailhead, atau antar-jemput basecamp dari mitra resmi Trexio.
              </p>

              <form onSubmit={handleLocalSearch} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    Lokasi / Asal
                  </label>
                  <input
                    type="text"
                    value={localQuery.location || ""}
                    onChange={(e) => setLocalQuery({ ...localQuery, location: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold"
                    placeholder="Contoh: Lombok, Jakarta"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    Tujuan Basecamp / Trailhead
                  </label>
                  <input
                    type="text"
                    value={localQuery.destination || ""}
                    onChange={(e) => setLocalQuery({ ...localQuery, destination: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold"
                    placeholder="Contoh: Sembalun, Cibodas"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 block mb-1">
                    Kata Kunci / Armada
                  </label>
                  <input
                    type="text"
                    value={localQuery.keyword || ""}
                    onChange={(e) => setLocalQuery({ ...localQuery, keyword: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold"
                    placeholder="Contoh: Jeep, HiAce, Elf"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Search size={14} /> Cari
                  </button>
                  {(localQuery.location || localQuery.destination || localQuery.keyword) && (
                    <button
                      type="button"
                      onClick={async () => {
                        const resetQuery = { location: "", destination: "", keyword: "" };
                        setLocalQuery(resetQuery);
                        setLoading(true);
                        try {
                          const res = await backpackerService.getLocalTransports(resetQuery);
                          setLocalTransports(res.data?.items || []);
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="h-9 px-3 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Local Transport Items */}
            {localTransports.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 text-center">
                <Car className="mx-auto text-slate-400 mb-2" size={32} />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Tidak Ada Angkutan Lokal Ditemukan</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
                  Silakan sesuaikan lokasi asal atau tujuan basecamp untuk menemukan shuttle dan angkutan lokal mitra resmi Trexio.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {localTransports.map((item, idx) => {
                  const targetId = item.product_id || item.id || item.slug;
                  const targetUrl = targetId ? `/trip/${targetId}` : "/explore";

                  return (
                    <div
                      key={targetId || idx}
                      className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase">
                            {item.vendor_badge || "Partner Resmi Trexio"}
                          </span>
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {formatRupiah(item.price)}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-2">
                          {item.title}
                        </h3>

                        <div className="text-xs text-slate-500 dark:text-zinc-400 mt-2 space-y-1 font-medium">
                          <p>📍 Rute: {item.pickup_point || item.pickup_points?.join(", ")} &rarr; {item.dropoff_point || item.dropoff}</p>
                          <p>⏰ Jadwal Berangkat: {Array.isArray(item.departure_schedules) ? item.departure_schedules.join(", ") : (item.schedules?.join(", ") || "Setiap Hari")}</p>
                          <p>💺 Kursi Tersedia: <strong className="text-emerald-600">{item.available_seats ?? item.availability ?? 8} Kursi</strong></p>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-bold">
                          Mitra Resmi Trexio
                        </span>
                        <Link
                          to={targetUrl}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                        >
                          Pesan &amp; Lihat Detail &rarr;
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: CREATE INTENT */}
      {showIntentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Buat Travel Intent (Rencana Perjalanan)
              </h3>
              <button onClick={() => setShowIntentModal(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateIntent} className="space-y-3 max-h-[80vh] overflow-y-auto pr-1">
              <BookingReferenceSelector
                selectedBookingId={intentForm.booking_reference_id}
                selectedBookingName={intentForm.booking_reference_name}
                onSelectBooking={(b) => {
                  if (b) {
                    setIntentForm((prev) => ({
                      ...prev,
                      booking_reference_id: b.id,
                      booking_reference_name: b.product_name,
                      destination: b.destination || prev.destination,
                      travel_date: b.trip_date || prev.travel_date
                    }));
                  } else {
                    setIntentForm((prev) => ({
                      ...prev,
                      booking_reference_id: null,
                      booking_reference_name: null
                    }));
                  }
                }}
                onAutoFill={(info) => {
                  setIntentForm((prev) => ({
                    ...prev,
                    destination: info.destination || prev.destination,
                    travel_date: info.travel_date || prev.travel_date
                  }));
                }}
              />

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Kota Asal</label>
                <input
                  type="text"
                  value={intentForm.origin}
                  onChange={(e) => setIntentForm({ ...intentForm, origin: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Kota/Destinasi Tujuan</label>
                <input
                  type="text"
                  value={intentForm.destination}
                  onChange={(e) => setIntentForm({ ...intentForm, destination: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Tanggal Berangkat</label>
                  <input
                    type="date"
                    value={intentForm.travel_date}
                    onChange={(e) => setIntentForm({ ...intentForm, travel_date: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Target Anggaran (Rp)</label>
                  <input
                    type="number"
                    value={intentForm.budget_max}
                    onChange={(e) => setIntentForm({ ...intentForm, budget_max: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Catatan/Kebutuhan Petualangan</label>
                <textarea
                  value={intentForm.adventure_preference}
                  onChange={(e) => setIntentForm({ ...intentForm, adventure_preference: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold h-20"
                  placeholder="Contoh: Cari 2 orang tambahan untuk patungan Elf & Porter Rinjani"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowIntentModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
                >
                  Terbitkan Intent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE JOURNEY */}
      {showJourneyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Buat Journey Perjalanan Baru
              </h3>
              <button onClick={() => setShowJourneyModal(false)} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateJourney} className="space-y-3 max-h-[80vh] overflow-y-auto pr-1">
              <BookingReferenceSelector
                selectedBookingId={journeyForm.booking_reference_id}
                selectedBookingName={journeyForm.booking_reference_name}
                onSelectBooking={(b) => {
                  if (b) {
                    setJourneyForm((prev) => ({
                      ...prev,
                      booking_reference_id: b.id,
                      booking_reference_name: b.product_name,
                      destination: b.destination || prev.destination,
                      start_date: b.trip_date || prev.start_date,
                      title: b.product_name ? `Journey: ${b.product_name}` : prev.title
                    }));
                  } else {
                    setJourneyForm((prev) => ({
                      ...prev,
                      booking_reference_id: null,
                      booking_reference_name: null
                    }));
                  }
                }}
                onAutoFill={(info) => {
                  setJourneyForm((prev) => ({
                    ...prev,
                    destination: info.destination || prev.destination,
                    start_date: info.travel_date || prev.start_date,
                    title: info.product_name ? `Journey: ${info.product_name}` : prev.title
                  }));
                }}
              />

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Judul Journey</label>
                <input
                  type="text"
                  value={journeyForm.title}
                  onChange={(e) => setJourneyForm({ ...journeyForm, title: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Asal</label>
                  <input
                    type="text"
                    value={journeyForm.origin}
                    onChange={(e) => setJourneyForm({ ...journeyForm, origin: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Tujuan</label>
                  <input
                    type="text"
                    value={journeyForm.destination}
                    onChange={(e) => setJourneyForm({ ...journeyForm, destination: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowJourneyModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Simpan Journey
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE SHARED RIDE */}
      {showRideModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Tawarkan Shared Ride / Nebeng Rombongan
              </h3>
              <button onClick={() => setShowRideModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateRide} className="space-y-3 max-h-[80vh] overflow-y-auto pr-1">
              <BookingReferenceSelector
                selectedBookingId={rideForm.booking_reference_id}
                selectedBookingName={rideForm.booking_reference_name}
                onSelectBooking={(b) => {
                  if (b) {
                    setRideForm((prev) => ({
                      ...prev,
                      booking_reference_id: b.id,
                      booking_reference_name: b.product_name,
                      destination: b.destination || prev.destination,
                      date: b.trip_date || prev.date
                    }));
                  } else {
                    setRideForm((prev) => ({
                      ...prev,
                      booking_reference_id: null,
                      booking_reference_name: null
                    }));
                  }
                }}
                onAutoFill={(info) => {
                  setRideForm((prev) => ({
                    ...prev,
                    destination: info.destination || prev.destination,
                    date: info.travel_date || prev.date
                  }));
                }}
              />

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Titik Keberangkatan (Origin)</label>
                <input
                  type="text"
                  value={rideForm.origin}
                  onChange={(e) => setRideForm({ ...rideForm, origin: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                  placeholder="Contoh: Bandara Lombok (LOP)"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Destinasi Tujuan</label>
                <input
                  type="text"
                  value={rideForm.destination}
                  onChange={(e) => setRideForm({ ...rideForm, destination: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                  placeholder="Contoh: Sembalun / Senaru Basecamp"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={rideForm.date}
                    onChange={(e) => setRideForm({ ...rideForm, date: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Jam Keberangkatan</label>
                  <input
                    type="time"
                    value={rideForm.departure_time}
                    onChange={(e) => setRideForm({ ...rideForm, departure_time: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Kapasitas Tempat Duduk</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={rideForm.capacity}
                    onChange={(e) => setRideForm({ ...rideForm, capacity: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Estimasi Total Biaya (Rp)</label>
                  <input
                    type="number"
                    value={rideForm.estimated_cost}
                    onChange={(e) => setRideForm({ ...rideForm, estimated_cost: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Informasi Kendaraan / Elf</label>
                <input
                  type="text"
                  value={rideForm.vehicle_info}
                  onChange={(e) => setRideForm({ ...rideForm, vehicle_info: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                  placeholder="Contoh: Toyota Avanza / Isuzu Elf White"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRideModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Terbitkan Shared Ride
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD EXPENSE & SPLIT */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Tambah Pengeluaran &amp; Split Cost
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                &times;
              </button>
            </div>

            {/* Expense Source selector */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-zinc-800 rounded-xl mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setExpenseSourceType("MANUAL")}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  expenseSourceType === "MANUAL"
                    ? "bg-white dark:bg-zinc-700 text-emerald-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Kustom / Manual
              </button>
              <button
                type="button"
                onClick={() => setExpenseSourceType("EXISTING_BOOKING")}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  expenseSourceType === "EXISTING_BOOKING"
                    ? "bg-white dark:bg-zinc-700 text-emerald-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Dari Booking
              </button>
              <button
                type="button"
                onClick={() => setExpenseSourceType("SHARED_RIDE")}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                  expenseSourceType === "SHARED_RIDE"
                    ? "bg-white dark:bg-zinc-700 text-emerald-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Dari Nebeng Ride
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Pilih Journey</label>
                <select
                  value={expenseForm.journey_id}
                  onChange={(e) => setExpenseForm({ ...expenseForm, journey_id: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                  required
                >
                  <option value="">-- Pilih Journey --</option>
                  {journeys.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.destination})
                    </option>
                  ))}
                </select>
              </div>

              {/* Source-specific select */}
              {expenseSourceType === "EXISTING_BOOKING" && (
                <div>
                  <BookingReferenceSelector
                    selectedBookingId={expenseForm.booking_reference_id || expenseForm.source_id}
                    selectedBookingName={expenseForm.booking_reference_name}
                    label="PILIH BOOKING MARKETPLACE TERVERIFIKASI"
                    onSelectBooking={(b) => {
                      if (b) {
                        setExpenseForm((prev) => ({
                          ...prev,
                          source_type: "EXISTING_BOOKING",
                          source_id: b.id,
                          booking_reference_id: b.id,
                          booking_reference_name: b.product_name,
                          title: `Booking: ${b.product_name}`,
                          category: "Transport"
                        }));
                      } else {
                        setExpenseForm((prev) => ({
                          ...prev,
                          booking_reference_id: null,
                          booking_reference_name: null,
                          source_id: null
                        }));
                      }
                    }}
                    onAutoFill={(info) => {
                      setExpenseForm((prev) => ({
                        ...prev,
                        title: info.product_name ? `Booking: ${info.product_name}` : prev.title
                      }));
                    }}
                  />
                </div>
              )}

              {expenseSourceType === "SHARED_RIDE" && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Pilih Shared Ride / Nebeng</label>
                  <select
                    onChange={(e) => {
                      const r = sharedRides.find((item) => item.id === e.target.value);
                      if (r) {
                        setExpenseForm({
                          ...expenseForm,
                          source_type: "SHARED_RIDE",
                          source_id: r.id,
                          title: `Nebeng: ${r.origin} -> ${r.destination}`,
                          category: "Transport",
                          amount: Number(r.estimated_cost)
                        });
                      }
                    }}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                  >
                    <option value="">-- Pilih Nebeng Rombongan --</option>
                    {sharedRides.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.origin} &rarr; {r.destination} ({formatRupiah(r.estimated_cost)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Deskripsi Pengeluaran</label>
                <input
                  type="text"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                  placeholder="Contoh: Sewa Elf / Porter Basecamp"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Kategori</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                  >
                    <option value="Transport">Transportasi / Shuttle</option>
                    <option value="Accommodation">Akomodasi / Homestay</option>
                    <option value="Rental Gear">Sewa Alat Camping</option>
                    <option value="Food">Konsumsi / Logistik</option>
                    <option value="Other">Lain-lain</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Total Biaya (Rp)</label>
                  <input
                    type="number"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Skema Pembagian (Split Model)</label>
                <select
                  value={expenseForm.split_model}
                  onChange={(e) => setExpenseForm({ ...expenseForm, split_model: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                >
                  <option value="EQUAL">Bagi Rata Sesuai Jumlah Peserta (Equal)</option>
                  <option value="CUSTOM">Nominal Custom</option>
                  <option value="PERCENTAGE">Persentase (%)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: REPORT USER */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <AlertCircle className="text-red-500" size={18} /> Laporkan Pengguna / Pelanggaran
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                &times;
              </button>
            </div>

            <form onSubmit={handleReportUser} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Alasan Pelaporan</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                >
                  <option value="SPAM_ABUSE">Spam / Pesan Mengganggu</option>
                  <option value="FAKE_RIDE">Ride / Penawaran Palsu</option>
                  <option value="UNSAFE">Perilaku Tidak Aman / Mencurigakan</option>
                  <option value="HARASSMENT">Pelecehan / Kejahatan Cyber</option>
                  <option value="OTHER">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Detail Kejadian</label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold h-24"
                  placeholder="Jelaskan secara rinci kronologi kejadian untuk ditindaklanjuti oleh Tim Komunitas Trexio..."
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Kirim Laporan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD WAYPOINT / STOP */}
      {showNewStopModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <MapPin className="text-emerald-600" size={18} /> Tambah Waypoint / Pos Perhentian
              </h3>
              <button onClick={() => setShowNewStopModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddJourneyStop} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Nama Waypoint / Pos</label>
                <input
                  type="text"
                  value={newStopForm.location}
                  onChange={(e) => setNewStopForm({ ...newStopForm, location: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                  placeholder="Contoh: Pos 2 Montong Satas / Pelawangan Sembalun"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Estimasi Jam Tiba (Opsional)</label>
                <input
                  type="time"
                  value={newStopForm.arrival_time}
                  onChange={(e) => setNewStopForm({ ...newStopForm, arrival_time: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewStopModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Tambah Waypoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW AUTHORIZED CONTACT DETAILS */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Phone className="text-emerald-600" size={18} /> Detail Kontak Kawan Trip
              </h3>
              <button onClick={() => setShowContactModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer">
                &times;
              </button>
            </div>

            {contactLoading ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-500 font-semibold">Memverifikasi otorisasi koneksi & memuat kontak...</p>
              </div>
            ) : contactModalData?.is_connected ? (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck size={16} className="shrink-0" />
                  <span>Koneksi Terverifikasi & Mutual Accepted</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Nama Traveler</span>
                    <p className="font-extrabold text-slate-900 dark:text-white text-base">{contactModalData.display_name}</p>
                  </div>

                  {contactModalData.whatsapp_number && (
                    <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <MessageSquare size={14} className="text-emerald-600" /> WhatsApp
                        </span>
                        {contactModalData.preferred_contact === 'WHATSAPP' && (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black rounded-full">UTAMA</span>
                        )}
                      </div>
                      <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">{contactModalData.whatsapp_number}</p>
                      <a
                        href={`https://wa.me/${contactModalData.whatsapp_number.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(contactModalData.display_name)},%20saya%20kawan%20trip%20dari%20Trexio%20Backpacker!`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        <MessageSquare size={14} /> Buka Chat WhatsApp <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  {contactModalData.instagram_username && (
                    <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <ExternalLink size={14} className="text-rose-500" /> Instagram
                        </span>
                        {contactModalData.preferred_contact === 'INSTAGRAM' && (
                          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] font-black rounded-full">UTAMA</span>
                        )}
                      </div>
                      <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">@{contactModalData.instagram_username}</p>
                      <a
                        href={`https://instagram.com/${contactModalData.instagram_username.replace(/^@/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        Buka Profil Instagram <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 italic text-center pt-2 border-t border-slate-100 dark:border-zinc-800">
                  Data kontak ini secara ketat dilindungi dan hanya dapat diakses oleh kawan perjalanan terverifikasi.
                </p>
              </div>
            ) : (
              <div className="py-6 text-center space-y-3">
                <Lock size={32} className="text-amber-500 mx-auto" />
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Akses Kontak Terkunci</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {contactModalData?.message || "Informasi kontak hanya akan ditampilkan setelah permintaan koneksi disetujui secara mutual."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: SETUP PROFILE CONTACT (WHATSAPP / INSTAGRAM) */}
      {showProfileContactModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Phone className="text-emerald-600" size={18} /> Pengaturan Kontak & Privasi Profil
              </h3>
              <button onClick={() => setShowProfileContactModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer">
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
              <strong>Aturan Privasi:</strong> Isi minimal 1 kontak (WhatsApp atau Instagram). Kontak Anda <strong>TIDAK AKAN</strong> dipublikasikan ke publik. Hanya akan dibagikan kepada kawan perjalanan yang koneksinya Anda setujui.
            </p>

            <form onSubmit={handleSaveProfileContact} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Nomor WhatsApp (Contoh: 628123456789)</label>
                <input
                  type="text"
                  value={profileContactForm.whatsapp_number}
                  onChange={(e) => setProfileContactForm({ ...profileContactForm, whatsapp_number: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                  placeholder="628xxxxxxxx"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1">Username Instagram (Opsional, tanpa @)</label>
                <input
                  type="text"
                  value={profileContactForm.instagram_username}
                  onChange={(e) => setProfileContactForm({ ...profileContactForm, instagram_username: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                  placeholder="username_instagram"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 block mb-1">Kontak Utama</label>
                  <select
                    value={profileContactForm.preferred_contact}
                    onChange={(e) => setProfileContactForm({ ...profileContactForm, preferred_contact: e.target.value })}
                    className="w-full h-9 px-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="INSTAGRAM">Instagram</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 block mb-1">Visibilitas Kontak</label>
                  <select
                    value={profileContactForm.contact_visibility}
                    onChange={(e) => setProfileContactForm({ ...profileContactForm, contact_visibility: e.target.value })}
                    className="w-full h-9 px-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                  >
                    <option value="CONNECTIONS_ONLY">Koneksi Disetujui (Rekomendasi)</option>
                    <option value="MUTUAL_ONLY">Mutual Friends</option>
                    <option value="HIDDEN">Sembunyikan Semua</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowProfileContactModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  Simpan Kontak Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
