import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Compass,
  UsersThree,
  Car,
  Receipt,
  MapPin,
  Bus,
  Gauge,
  CheckCircle,
  XCircle,
  Clock,
  Sparkle,
  MagnifyingGlass,
  Funnel,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Info,
  Sliders,
  ChatCircleText,
  Lock,
  Eye,
  Check,
  NotePencil
} from "@phosphor-icons/react";

export default function SuperBackpackerOperations() {
  const [activeTab, setActiveTab] = useState("overview"); // overview, intents, assistance, rides, journeys, audit
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tab Data States
  const [intents, setIntents] = useState([]);
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [rides, setRides] = useState([]);
  const [journeys, setJourneys] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal / Assistance Match Selector State
  const [selectedAssistance, setSelectedAssistance] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  // Edit Status Modal
  const [editingItem, setEditingItem] = useState(null); // { type: 'intent'|'ride', item: {} }
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeTab === "overview") fetchOverview();
    else if (activeTab === "intents") fetchIntents();
    else if (activeTab === "assistance") fetchAssistanceRequests();
    else if (activeTab === "rides") fetchRides();
    else if (activeTab === "journeys") fetchJourneys();
  }, [activeTab, statusFilter]);

  async function fetchOverview() {
    setLoading(true);
    try {
      const res = await api.get("/backpacker/admin/overview");
      if (res.data?.success) {
        setOverview(res.data.data.stats);
      }
    } catch (err) {
      toast.error("Gagal memuat data overview Backpacker Operations");
    } finally {
      setLoading(false);
    }
  }

  async function fetchIntents() {
    setLoading(true);
    try {
      const res = await api.get("/backpacker/admin/intents", {
        params: { status: statusFilter, q: searchQuery }
      });
      if (res.data?.success) {
        setIntents(res.data.data);
      }
    } catch (err) {
      toast.error("Gagal memuat daftar Travel Intents");
    } finally {
      setLoading(false);
    }
  }

  async function fetchAssistanceRequests() {
    setLoading(true);
    try {
      const res = await api.get("/backpacker/admin/assistance-requests", {
        params: { status: statusFilter, q: searchQuery }
      });
      if (res.data?.success) {
        setAssistanceRequests(res.data.data);
      }
    } catch (err) {
      toast.error("Gagal memuat daftar Permintaan Bantuan Matching");
    } finally {
      setLoading(false);
    }
  }

  async function fetchRides() {
    setLoading(true);
    try {
      const res = await api.get("/backpacker/admin/rides", {
        params: { status: statusFilter, q: searchQuery }
      });
      if (res.data?.success) {
        setRides(res.data.data);
      }
    } catch (err) {
      toast.error("Gagal memuat daftar Shared Rides");
    } finally {
      setLoading(false);
    }
  }

  async function fetchJourneys() {
    setLoading(true);
    try {
      const res = await api.get("/backpacker/admin/journeys", {
        params: { status: statusFilter, q: searchQuery }
      });
      if (res.data?.success) {
        setJourneys(res.data.data);
      }
    } catch (err) {
      toast.error("Gagal memuat data Journeys & Cost Split");
    } finally {
      setLoading(false);
    }
  }

  async function openCandidateModal(request) {
    setSelectedAssistance(request);
    setLoadingCandidates(true);
    setCandidates([]);
    try {
      const res = await api.get(`/backpacker/admin/assistance-candidates/${request.travel_intent_id}`);
      if (res.data?.success) {
        setCandidates(res.data.data);
      }
    } catch (err) {
      toast.error("Gagal memuat calon kawan trip terbaik");
    } finally {
      setLoadingCandidates(false);
    }
  }

  async function handleSendMatchSuggestion(candidateIntentId) {
    if (!selectedAssistance) return;
    try {
      const res = await api.post(`/backpacker/admin/assistance-requests/${selectedAssistance.id}/suggest`, {
        candidate_intent_id: candidateIntentId,
        admin_note: adminNote
      });
      if (res.data?.success) {
        toast.success("Rekomendasi kawan trip terbimbing berhasil dikirim ke calon partner!");
        setSelectedAssistance(null);
        setAdminNote("");
        fetchAssistanceRequests();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Gagal mengirim rekomendasi kawan trip");
    }
  }

  async function handleCloseAssistance(reasonCode = "NO_MATCH") {
    if (!selectedAssistance) return;
    try {
      const res = await api.post(`/backpacker/admin/assistance-requests/${selectedAssistance.id}/close`, {
        admin_note: adminNote || "Tidak ditemukan kandidat yang cocok saat ini",
        status_reason: reasonCode
      });
      if (res.data?.success) {
        toast.success("Permintaan bantuan matching berhasil ditutup.");
        setSelectedAssistance(null);
        setAdminNote("");
        fetchAssistanceRequests();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Gagal menutup permintaan bantuan");
    }
  }

  async function handleSaveStatusUpdate() {
    if (!editingItem) return;
    try {
      if (editingItem.type === "intent") {
        await api.put(`/backpacker/admin/intents/${editingItem.item.id}`, {
          status: newStatus,
          admin_note: statusNote
        });
        toast.success("Status Travel Intent berhasil diperbarui");
        fetchIntents();
      } else if (editingItem.type === "ride") {
        await api.put(`/backpacker/admin/rides/${editingItem.item.id}`, {
          status: newStatus,
          admin_note: statusNote
        });
        toast.success("Status Shared Ride berhasil diperbarui");
        fetchRides();
      }
      setEditingItem(null);
    } catch (err) {
      toast.error("Gagal memperbarui status");
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto text-neutral-100">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/40 p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Compass weight="duotone" size={28} />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Backpacker Operations Center
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono font-semibold border border-amber-400/30">
                  SUPER ADMIN
                </span>
              </h1>
              <p className="text-sm text-neutral-400">
                Pusat Kendali, Pemantauan AI, Moderasi & Mediated Matching 6 Fitur Backpacker Trexio
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-black/40 p-2 rounded-xl border border-white/5">
          <ShieldCheck size={20} className="text-emerald-400" />
          <div className="text-xs">
            <p className="font-semibold text-neutral-200">Enforced Contact Privacy</p>
            <p className="text-neutral-400 text-[11px]">System Mediated Matching • No Public Leaks</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-white/10 pb-3 no-scrollbar">
        {[
          { id: "overview", label: "Overview & KPI", icon: Gauge },
          { id: "intents", label: "Find Your Buddy (Intents)", icon: UsersThree },
          { id: "assistance", label: "Matching Assistance Queue", icon: Sparkle, badge: overview?.open_assistance },
          { id: "rides", label: "Share Your Ride & Transport", icon: Car },
          { id: "journeys", label: "Cost Split & Tracking", icon: Receipt },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setStatusFilter("");
                setSearchQuery("");
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? "bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20"
                  : "bg-neutral-900/80 text-neutral-400 border-white/5 hover:text-white hover:bg-neutral-800"
              }`}
            >
              <Icon size={16} weight={isActive ? "bold" : "regular"} />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-bold ml-1">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & KPIS */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {loading ? (
            <div className="p-12 text-center text-neutral-400 bg-neutral-900/50 rounded-2xl border border-white/5">
              Memuat indikator kinerja backpacker ops center...
            </div>
          ) : (
            <>
              {/* Primary Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-neutral-900/90 p-5 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
                    <span>Active Travel Intents</span>
                    <UsersThree size={20} className="text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{overview?.active_intents || 0}</div>
                  <div className="text-[11px] text-neutral-400 flex items-center justify-between">
                    <span>Total Intents: {overview?.total_intents || 0}</span>
                    <span className="text-emerald-400 font-semibold">{overview?.rates?.match_rate || 0}% Matched</span>
                  </div>
                </div>

                <div className="bg-neutral-900/90 p-5 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
                    <span>Shared Rides Utilization</span>
                    <Car size={20} className="text-blue-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{overview?.open_rides || 0} Open Rides</div>
                  <div className="text-[11px] text-neutral-400 flex items-center justify-between">
                    <span>Seats: {overview?.booked_seats || 0}/{overview?.total_seats || 0}</span>
                    <span className="text-blue-400 font-semibold">{overview?.rates?.seat_utilization_rate || 0}% Filled</span>
                  </div>
                </div>

                <div className="bg-neutral-900/90 p-5 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
                    <span>Buddy Connections</span>
                    <UserCheck size={20} className="text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{overview?.accepted_connections || 0} Connected</div>
                  <div className="text-[11px] text-neutral-400 flex items-center justify-between">
                    <span>Pending: {overview?.pending_connections || 0}</span>
                    <span className="text-emerald-400 font-semibold">{overview?.rates?.connection_acceptance_rate || 0}% Accept Rate</span>
                  </div>
                </div>

                <div className="bg-neutral-900/90 p-5 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
                    <span>Matching Assistance Queue</span>
                    <Sparkle size={20} className="text-purple-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{overview?.open_assistance || 0} Pending Help</div>
                  <div className="text-[11px] text-neutral-400">
                    Total Assistance Requests: {overview?.total_assistance || 0}
                  </div>
                </div>
              </div>

              {/* 6 Feature Health Breakdown */}
              <div className="bg-neutral-900/80 p-6 rounded-2xl border border-white/10 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders size={20} className="text-amber-400" />
                  Status Modul & Layanan Backpacker Trexio
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="bg-black/50 p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">1. Find Your Route</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">HEALTHY</span>
                    </div>
                    <p className="text-neutral-400">Intercity, shuttle, ferry & overland route planner engine.</p>
                  </div>

                  <div className="bg-black/50 p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">2. Find Your Buddy</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">ACTIVE</span>
                    </div>
                    <p className="text-neutral-400">{overview?.active_intents || 0} travel intents aktif mencari teman seperjalanan.</p>
                  </div>

                  <div className="bg-black/50 p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">3. Share Your Ride</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">ACTIVE</span>
                    </div>
                    <p className="text-neutral-400">{overview?.open_rides || 0} ride-sharing terbuka dengan kuota kursi terkelola.</p>
                  </div>

                  <div className="bg-black/50 p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">4. Split Your Cost</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">ACTIVE</span>
                    </div>
                    <p className="text-neutral-400">{overview?.total_journeys || 0} perjalanan dengan pencatatan & pembagian biaya transparan.</p>
                  </div>

                  <div className="bg-black/50 p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">5. Track Your Journey</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">ENFORCED</span>
                    </div>
                    <p className="text-neutral-400">Pemberian izin lokasi hanya atas persetujuan eksplisit anggota kelompok.</p>
                  </div>

                  <div className="bg-black/50 p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">6. Find Local Transport</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">CONNECTED</span>
                    </div>
                    <p className="text-neutral-400">Integrasi penyedia lokal (shuttle, jeep, minibus, boat) terhubung.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* SEARCH AND FILTER BAR FOR LIST TABS */}
      {activeTab !== "overview" && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-900/60 p-4 rounded-2xl border border-white/10">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Cari destinasi, nama, atau ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <Funnel size={16} />
              <span>Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            >
              <option value="">Semua Status</option>
              {activeTab === "intents" && (
                <>
                  <option value="ACTIVE">Active</option>
                  <option value="MATCHED">Matched</option>
                  <option value="CANCELLED">Cancelled</option>
                </>
              )}
              {activeTab === "assistance" && (
                <>
                  <option value="OPEN">Open Assistance</option>
                  <option value="SUGGESTED">Suggested Match</option>
                  <option value="CONNECTED">Connected</option>
                </>
              )}
              {activeTab === "rides" && (
                <>
                  <option value="OPEN">Open</option>
                  <option value="FULL">Full Seats</option>
                  <option value="CANCELLED">Cancelled</option>
                </>
              )}
            </select>
          </div>
        </div>
      )}

      {/* TAB 2: FIND YOUR BUDDY (INTENTS) */}
      {activeTab === "intents" && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-neutral-400 bg-neutral-900/50 rounded-2xl border border-white/5">
              Memuat data Travel Intents...
            </div>
          ) : intents.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 bg-neutral-900/50 rounded-2xl border border-white/5">
              Tidak ada Travel Intent yang sesuai dengan filter.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-neutral-900/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/60 text-neutral-400 uppercase font-mono text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="p-4">Backpacker</th>
                    <th className="p-4">Destinasi & Tanggal</th>
                    <th className="p-4">Style & Anggaran</th>
                    <th className="p-4">Privacy</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Aksi Super Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {intents.map((intent) => (
                    <tr key={intent.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-medium text-white">
                        <div>{intent.user_name}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">{intent.user_level}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-amber-300">{intent.origin} ➔ {intent.destination}</div>
                        <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                          <Clock size={12} /> {intent.travel_date}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-white/5 text-neutral-300 font-mono text-[10px]">
                          {intent.travel_style}
                        </span>
                        <div className="text-[11px] text-neutral-400 mt-1">
                          Rp {intent.budget_min?.toLocaleString()} - {intent.budget_max?.toLocaleString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-neutral-400 font-mono text-[10px]">
                          {intent.privacy_setting || "PUBLIC"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          intent.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                          intent.status === "MATCHED" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                          "bg-neutral-800 text-neutral-400"
                        }`}>
                          {intent.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingItem({ type: "intent", item: intent });
                            setNewStatus(intent.status);
                            setStatusNote("");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold transition-all border border-white/10"
                        >
                          Kelola Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ASSISTANCE QUEUE & MEDIATED MATCHING */}
      {activeTab === "assistance" && (
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200 flex items-start gap-3">
            <Info size={20} className="shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">Pusat Bantuan Matching Terbimbing (System Mediated Matching)</p>
              <p className="mt-1 opacity-90">
                Super Admin dapat meninjau calon partner menggunakan AI Matching Engine, lalu mengirimkan <strong>Rekomendasi Terbimbing</strong>. Calon partner menerima rekomendasi dalam aplikasi dan berhak menerima/menolak. Kontak pribadi hanya dibuka setelah kedua belah pihak menyetujui.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-neutral-400 bg-neutral-900/50 rounded-2xl border border-white/5">
              Memuat antrean bantuan matching...
            </div>
          ) : assistanceRequests.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 bg-neutral-900/50 rounded-2xl border border-white/5">
              Tidak ada permintaan bantuan matching saat ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assistanceRequests.map((req) => (
                <div key={req.id} className="bg-neutral-900/80 p-5 rounded-2xl border border-white/10 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">{req.user_name}</div>
                      <div className="text-[11px] text-neutral-400 font-mono">{req.user_level}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      req.status === "OPEN" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                      req.status === "SUGGESTED" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                      "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}>
                      {req.status}
                    </span>
                  </div>

                  <div className="bg-black/50 p-3 rounded-xl border border-white/5 space-y-1 text-xs">
                    <div className="text-amber-300 font-semibold flex items-center gap-1.5">
                      <MapPin size={14} /> {req.destination}
                    </div>
                    <div className="text-neutral-400 text-[11px]">Tanggal: {req.travel_date}</div>
                    <div className="text-neutral-300 italic mt-2">"{req.reason}"</div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[10px] text-neutral-500 font-mono">
                      ID: {req.id}
                    </span>
                    <button
                      onClick={() => openCandidateModal(req)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-xs shadow-md hover:brightness-110 transition-all"
                    >
                      <Sparkle size={16} weight="fill" />
                      Proses & Cari Kawan Match
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SHARE YOUR RIDE */}
      {activeTab === "rides" && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-neutral-400 bg-neutral-900/50 rounded-2xl border border-white/5">
              Memuat data Shared Rides...
            </div>
          ) : rides.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 bg-neutral-900/50 rounded-2xl border border-white/5">
              Tidak ada Shared Rides ditemukan.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-neutral-900/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/60 text-neutral-400 uppercase font-mono text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="p-4">Driver / Host</th>
                    <th className="p-4">Rute & Kendaraan</th>
                    <th className="p-4">Kursi & Tarif</th>
                    <th className="p-4">Permintaan Nimbrung</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rides.map((ride) => (
                    <tr key={ride.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-medium text-white">
                        {ride.host_name}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-amber-300">{ride.origin} ➔ {ride.destination}</div>
                        <div className="text-[11px] text-neutral-400 font-mono mt-0.5">{ride.vehicle_type || "Mobil / Shuttle"}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-emerald-400">Rp {ride.price_per_seat?.toLocaleString()} / seat</div>
                        <div className="text-[11px] text-neutral-400">Sisa Kursi: {ride.available_seats} / {ride.capacity}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded bg-white/5 font-mono text-[11px] text-neutral-300">
                          {ride.requests_count || 0} Request ({ride.pending_requests_count || 0} Pending)
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          ride.status === "OPEN" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                          ride.status === "FULL" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                          "bg-neutral-800 text-neutral-400"
                        }`}>
                          {ride.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setEditingItem({ type: "ride", item: ride });
                            setNewStatus(ride.status);
                            setStatusNote("");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold transition-all border border-white/10"
                        >
                          Kelola Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: JOURNEYS & COST SPLIT */}
      {activeTab === "journeys" && (
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-neutral-400 bg-neutral-900/50 rounded-2xl border border-white/5">
              Memuat data Journeys & Cost Split...
            </div>
          ) : journeys.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 bg-neutral-900/50 rounded-2xl border border-white/5">
              Tidak ada data perjalanan aktif ditemukan.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {journeys.map((j) => (
                <div key={j.id} className="bg-neutral-900/80 p-5 rounded-2xl border border-white/10 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white text-base">{j.title}</h4>
                      <div className="text-xs text-neutral-400">Leader: {j.owner_name}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                      {j.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-black/40 p-3 rounded-xl border border-white/5">
                    <div>
                      <span className="text-neutral-500 block">Anggota Kelompok</span>
                      <span className="font-bold text-white">{j.participants_count} Anggota</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Total Pengeluaran</span>
                      <span className="font-bold text-emerald-400">Rp {j.total_expenses_amount?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <span className="text-neutral-400 font-semibold block">Catatan Pengeluaran Terdaftar:</span>
                    {j.expenses?.length === 0 ? (
                      <p className="text-neutral-500 italic text-[11px]">Belum ada pengeluaran dicatat.</p>
                    ) : (
                      j.expenses?.slice(0, 3).map((exp) => (
                        <div key={exp.id} className="flex items-center justify-between p-2 rounded bg-white/5 text-[11px]">
                          <span className="text-neutral-200">{exp.title} ({exp.category})</span>
                          <span className="font-mono text-emerald-300">Rp {exp.amount?.toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CANDIDATE MATCHING MODAL */}
      {selectedAssistance && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Sparkle size={24} className="text-amber-400" />
                <h3 className="text-lg font-bold">Rekomendasikan Kawan Trip Terbimbing</h3>
              </div>
              <button
                onClick={() => setSelectedAssistance(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="bg-black/50 p-4 rounded-xl border border-white/5 text-xs space-y-1">
              <span className="text-neutral-400 block font-mono uppercase text-[10px]">Pemohon Bantuan:</span>
              <div className="font-bold text-amber-300 text-sm">{selectedAssistance.user_name} ({selectedAssistance.destination})</div>
              <p className="text-neutral-300 italic">"{selectedAssistance.reason}"</p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-neutral-300 block">
                Catatan Super Admin (Opsional):
              </label>
              <input
                type="text"
                placeholder="misal: Kami telah mencocokkan jadwal dan anggaran pendakian Anda."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">
                Kandidat Kawan Trip Hasil Matching Engine AI ({candidates.length})
              </h4>

              {loadingCandidates ? (
                <div className="p-8 text-center text-xs text-neutral-400">
                  Menganalisis & mencocokkan travel intents pengguna...
                </div>
              ) : candidates.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400 bg-black/40 rounded-xl border border-white/5">
                  Belum ditemukan calon kawan trip aktif dengan kriteria kompatibel.
                </div>
              ) : (
                <div className="space-y-3">
                  {candidates.map((cand) => (
                    <div key={cand.candidate_intent_id} className="bg-black/40 p-4 rounded-xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{cand.display_name}</span>
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold font-mono text-[10px]">
                            {cand.match_score}% MATCH
                          </span>
                        </div>
                        <p className="text-neutral-400 text-[11px]">{cand.hiking_level} • Style: {cand.travel_style}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {cand.match_reasons.map((r, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                              ✓ {r}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleSendMatchSuggestion(cand.candidate_intent_id)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shrink-0 transition-all shadow-md"
                      >
                        Kirim Rekomendasi
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs">
              <button
                onClick={() => handleCloseAssistance("NO_MATCH")}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-rose-950 hover:text-rose-300 text-neutral-400 font-semibold transition-all border border-white/5"
              >
                Tutup Permintaan (Tidak Ditemukan Candidate)
              </button>

              <button
                onClick={() => setSelectedAssistance(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold"
              >
                Tutup Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STATUS MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-5 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-base">Kelola Status {editingItem.type === "intent" ? "Travel Intent" : "Shared Ride"}</h3>
              <button onClick={() => setEditingItem(null)} className="text-neutral-400 hover:text-white">
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Pilih Status Baru:</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {editingItem.type === "intent" ? (
                    <>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="MATCHED">MATCHED</option>
                      <option value="CANCELLED">CANCELLED / ARCHIVED</option>
                    </>
                  ) : (
                    <>
                      <option value="OPEN">OPEN</option>
                      <option value="FULL">FULL</option>
                      <option value="CANCELLED">CANCELLED</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Catatan Admin:</label>
                <textarea
                  rows={3}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Alasan perubahan atau catatan moderasi..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleSaveStatusUpdate}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
