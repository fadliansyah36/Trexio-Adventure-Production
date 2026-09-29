import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import SEO from "@/components/site/SEO";
import {
  ShieldCheck,
  CloudSun,
  WarningOctagon,
  CheckSquare,
  PhoneCall,
  MapPin,
  ListChecks,
  Compass,
  Thermometer,
  Wind,
  Drop,
  Sparkle,
  ArrowRight,
  FirstAid,
  Broadcast,
  Info,
  Calendar,
  Package,
  ShoppingBag,
  ArrowClockwise,
  Quotes,
} from "@phosphor-icons/react";

export default function SafetyCenter() {
  const [activeTab, setActiveTab] = useState("readiness"); // readiness | weather | packing | emergency
  const [selectedDestination, setSelectedDestination] = useState("dest_prau");
  const [destinations, setDestinations] = useState([]);
  const [destIntel, setDestIntel] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Readiness Form State
  const [tripDate, setTripDate] = useState(new Date().toISOString().split("T")[0]);
  const [durationDays, setDurationDays] = useState(2);
  const [tripType, setTripType] = useState("camping");
  const [userExperience, setUserExperience] = useState("Pemula");
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState(["eq_carrier", "eq_boots", "eq_water", "eq_first_aid"]);
  const [readinessResult, setReadinessResult] = useState(null);
  const [loadingReadiness, setLoadingReadiness] = useState(false);

  // Packing Checklist State
  const [checklist, setChecklist] = useState(null);
  const [checkedItemIds, setCheckedItemIds] = useState(["eq_carrier", "eq_boots", "eq_water"]);
  const [savingChecklist, setSavingChecklist] = useState(false);

  // Emergency State
  const [emergencyInfo, setEmergencyInfo] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedDestination) {
      fetchDestinationData(selectedDestination);
    }
  }, [selectedDestination]);

  async function fetchInitialData() {
    try {
      const [destRes, emgRes] = await Promise.all([
        api.get("/destinations").catch(() => ({ data: [] })),
        api.get("/ai/safety/emergency").catch(() => null),
      ]);

      const rawList = destRes.data?.destinations || destRes.data || [];
      const formattedList = Array.isArray(rawList) && rawList.length > 0 
        ? rawList.map((d) => ({
            id: d.id || d.slug || `dest_${d.name?.toLowerCase().replace(/\s+/g, "")}`,
            name: d.name || "Destinasi Pendakian",
            province: d.province || d.region || "Indonesia",
            elevation: d.elevation || "MDPL",
            slug: d.slug || d.id,
          }))
        : [
            { id: "dest_prau", name: "Gunung Prau", province: "Jawa Tengah", elevation: "2.565 MDPL", slug: "dest_prau" },
            { id: "dest_gede", name: "Gunung Gede Pangrango", province: "Jawa Barat", elevation: "2.958 MDPL", slug: "dest_gede" },
            { id: "dest_bromo", name: "Gunung Bromo", province: "Jawa Timur", elevation: "2.329 MDPL", slug: "dest_bromo" },
            { id: "dest_rinjani", name: "Gunung Rinjani", province: "Nusa Tenggara Barat", elevation: "3.726 MDPL", slug: "dest_rinjani" },
            { id: "dest_semeru", name: "Gunung Semeru", province: "Jawa Timur", elevation: "3.676 MDPL", slug: "dest_semeru" },
            { id: "dest_merbabu", name: "Gunung Merbabu", province: "Jawa Tengah", elevation: "3.145 MDPL", slug: "dest_merbabu" },
          ];

      setDestinations(formattedList);
      if (formattedList.length > 0 && !selectedDestination) {
        setSelectedDestination(formattedList[0].id);
      }

      if (emgRes?.data?.emergency) {
        setEmergencyInfo(emgRes.data.emergency);
      }
    } catch (err) {
      console.error("Gagal memuat data awal keselamatan:", err);
    }
  }

  async function fetchDestinationData(destId) {
    if (!destId) return;
    setLoadingWeather(true);
    try {
      const [intelRes, weatherRes, checklistRes] = await Promise.all([
        api.get(`/ai/safety/destination/${destId}`).catch(() => null),
        api.get(`/ai/safety/weather?destination=${destId}`).catch(() => null),
        api.post("/ai/safety/checklist", { destinationId: destId, durationDays, tripType }).catch(() => null),
      ]);

      if (intelRes?.data?.intelligence) {
        setDestIntel(intelRes.data.intelligence);
      }
      if (weatherRes?.data?.weather) {
        setWeather(weatherRes.data.weather);
      }
      if (checklistRes?.data?.checklist) {
        setChecklist(checklistRes.data.checklist);
      }
      toast.success("Data gunung & cuaca berhasil disinkronkan!");
    } catch (err) {
      toast.error("Gagal memperbarui data destinasi & cuaca");
    } finally {
      setLoadingWeather(false);
    }
  }

  async function handleEvaluateReadiness() {
    setLoadingReadiness(true);
    try {
      const { data } = await api.post("/ai/safety/readiness", {
        destinationId: selectedDestination,
        tripDate,
        durationDays,
        equipmentIds: selectedEquipmentIds,
        tripType,
        userExperience,
      });

      if (data.readiness) {
        setReadinessResult(data.readiness);
        toast.success("Analisis Kesiapan Trip berhasil diperbarui!");
      }
    } catch (err) {
      toast.error("Gagal mengevaluasi kesiapan trip");
    } finally {
      setLoadingReadiness(false);
    }
  }

  function toggleEquipmentSelection(itemId) {
    setSelectedEquipmentIds((prev) =>
      prev.includes(itemId) ? prev.filter((i) => i !== itemId) : [...prev, itemId]
    );
  }

  function toggleChecklistItem(itemId) {
    setCheckedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((i) => i !== itemId) : [...prev, itemId]
    );
  }

  async function handleSaveChecklist() {
    setSavingChecklist(true);
    try {
      await api.post("/ai/safety/checklist/save", {
        trip_id: selectedDestination,
        prepared_item_ids: checkedItemIds,
      });
      toast.success("Daftar perlengkapan berhasil disimpan!");
    } catch (err) {
      toast.error("Gagal menyimpan daftar perlengkapan");
    } finally {
      setSavingChecklist(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 py-8 px-4 sm:px-6 lg:px-8">
      <SEO
        title="Pusat Keselamatan & AI Adventure Intelligence — TREXIO"
        description="Informasi cuaca langsung, status resmi jalur pendakian, analisis kesiapan trip, packing checklist pintar, dan kontak darurat BASARNAS terverifikasi."
      />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Title */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-neutral-900 to-neutral-900 border border-emerald-500/30 p-8 rounded-3xl shadow-2xl">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck size={16} weight="fill" />
              <span>Trexio Adventure Intelligence</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Pusat Keselamatan & Adventure Intelligence
            </h1>
            <p className="text-sm text-neutral-300 max-w-3xl leading-relaxed">
              Sistem pendukung keputusan keselamatan pendakian terpadu. Data cuaca BMKG/Open-Meteo real-time, status resmi jalur Balai Taman Nasional, analisis kesiapan trip, dan kontak darurat BASARNAS 115.
            </p>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
            <ShieldCheck size={280} weight="fill" className="text-emerald-400" />
          </div>
        </div>

        {/* Global Destination Selector */}
        <div className="bg-neutral-900/80 border border-neutral-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MapPin size={22} className="text-emerald-400" weight="fill" />
            <div>
              <p className="text-xs text-neutral-400 font-medium">Pilih Destinasi Pendakian:</p>
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="bg-neutral-950 border border-neutral-700 text-white text-sm font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
              >
                {destinations.map((d) => (
                  <option key={d.id || d.slug} value={d.id || d.slug}>
                    {d.name} ({d.elevation || "Gunung"}) — {d.province || "Indonesia"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchDestinationData(selectedDestination)}
              disabled={loadingWeather}
              className="inline-flex items-center gap-2 text-xs font-bold text-neutral-300 hover:text-white bg-neutral-800 px-3 py-2 rounded-lg border border-neutral-700 transition"
            >
              <ArrowClockwise size={16} className={loadingWeather ? "animate-spin" : ""} />
              <span>SINKRONKAN DATA SEKARANG</span>
            </button>
          </div>
        </div>

        {/* Official Safety Banner Alerts if Any */}
        {destIntel?.official_alerts?.length > 0 && (
          <div className="space-y-3">
            {destIntel.official_alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                  alert.severity === "CRITICAL"
                    ? "bg-rose-950/60 border-rose-500/50 text-rose-200"
                    : alert.severity === "WARNING"
                    ? "bg-amber-950/60 border-amber-500/50 text-amber-200"
                    : "bg-emerald-950/60 border-emerald-500/50 text-emerald-200"
                }`}
              >
                <WarningOctagon size={24} weight="fill" className="shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold">{alert.title}</h4>
                  <p className="text-xs leading-relaxed opacity-90">{alert.message}</p>
                  <p className="text-[10px] font-semibold opacity-75">Sumber Resmi: {alert.source}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("readiness")}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === "readiness"
                ? "bg-emerald-500 text-neutral-950 shadow-lg shadow-emerald-500/20"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <ShieldCheck size={18} weight="bold" />
            <span>ANALISIS KESIAPAN TRIP</span>
          </button>

          <button
            onClick={() => setActiveTab("weather")}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === "weather"
                ? "bg-emerald-500 text-neutral-950 shadow-lg shadow-emerald-500/20"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <CloudSun size={18} weight="bold" />
            <span>CUACA & STATUS JALUR</span>
          </button>

          <button
            onClick={() => setActiveTab("packing")}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === "packing"
                ? "bg-emerald-500 text-neutral-950 shadow-lg shadow-emerald-500/20"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <CheckSquare size={18} weight="bold" />
            <span>SMART PACKING CHECKLIST</span>
          </button>

          <button
            onClick={() => setActiveTab("emergency")}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === "emergency"
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            <PhoneCall size={18} weight="bold" />
            <span>KONTAK & SOP DARURAT</span>
          </button>
        </div>

        {/* TAB 1: READINESS EVALUATOR */}
        {activeTab === "readiness" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-neutral-900/90 border border-neutral-800 p-6 rounded-2xl space-y-5">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Compass size={20} className="text-emerald-400" />
                  <span>Input Parameter Pendakian</span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Sistem AI akan menganalisis kesiapan berdasarkan cuaca langsung, persyaratan jalur, dan kelengkapan peralatan Anda.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-neutral-400 mb-1 font-semibold">Rencana Tanggal Pendakian:</label>
                  <input
                    type="date"
                    value={tripDate}
                    onChange={(e) => setTripDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 text-white rounded-xl p-2.5 focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1 font-semibold">Durasi Trip (Hari):</label>
                    <input
                      type="number"
                      min="1"
                      max="7"
                      value={durationDays}
                      onChange={(e) => setDurationDays(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-700 text-white rounded-xl p-2.5 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-400 mb-1 font-semibold">Pengalaman Pendaki:</label>
                    <select
                      value={userExperience}
                      onChange={(e) => setUserExperience(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 text-white rounded-xl p-2.5 focus:border-emerald-500"
                    >
                      <option value="Pemula">Pemula (&lt; 2x Mendaki)</option>
                      <option value="Sedang">Sedang (3-5x Mendaki)</option>
                      <option value="Berpengalaman">Berpengalaman (&gt; 5x)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-2 font-semibold">Centang Alat Yang Sudah Anda Siapkan:</label>
                  <div className="space-y-2 bg-neutral-950 p-3 rounded-xl border border-neutral-800 max-h-48 overflow-y-auto">
                    {[
                      { id: "eq_carrier", name: "Tas Carrier (50L-70L)" },
                      { id: "eq_boots", name: "Sepatu Trekking (Anti-selip)" },
                      { id: "eq_raincoat", name: "Jas Hujan / Raincoat Stelan" },
                      { id: "eq_jacket", name: "Jaket Warm Layer / Windproof" },
                      { id: "eq_tent", name: "Tenda Dome Double Layer" },
                      { id: "eq_sleeping_bag", name: "Sleeping Bag Thermal" },
                      { id: "eq_water", name: "Air Minum Minimal 3L" },
                      { id: "eq_first_aid", name: "Kotak P3K & Obat Pribadi" },
                    ].map((item) => (
                      <label key={item.id} className="flex items-center gap-2 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={selectedEquipmentIds.includes(item.id)}
                          onChange={() => toggleEquipmentSelection(item.id)}
                          className="accent-emerald-500 w-4 h-4 rounded"
                        />
                        <span>{item.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleEvaluateReadiness}
                  disabled={loadingReadiness}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                >
                  <Sparkle size={18} weight="fill" />
                  <span>{loadingReadiness ? "MENGANALISIS KESIAPAN..." : "EVALUASI KESIAPAN TRIP SEKARANG"}</span>
                </button>
              </div>
            </div>

            {/* Readiness Output Card */}
            <div className="lg:col-span-7 space-y-6">
              {readinessResult ? (
                <div className="bg-neutral-900 border border-emerald-500/30 p-6 rounded-2xl space-y-6 shadow-xl">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                        Hasil Evaluasi Kesiapan AI
                      </span>
                      <h3 className="text-xl font-black text-white mt-1">{readinessResult.destination_name}</h3>
                    </div>
                    <p className="text-xs text-neutral-400">Tanggal Trip: {readinessResult.trip_date}</p>
                  </div>

                  {/* Readiness Dimension Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 text-center space-y-1">
                      <p className="text-[10px] text-neutral-400 font-semibold uppercase">Perlengkapan</p>
                      <p className="text-base font-black text-emerald-400">{readinessResult.readiness_dimensions.equipment.score_percent}%</p>
                      <p className="text-[10px] text-neutral-400">{readinessResult.readiness_dimensions.equipment.label}</p>
                    </div>

                    <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 text-center space-y-1">
                      <p className="text-[10px] text-neutral-400 font-semibold uppercase">Kondisi Cuaca</p>
                      <p className="text-sm font-bold text-amber-300">{readinessResult.readiness_dimensions.weather.status}</p>
                    </div>

                    <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 text-center space-y-1">
                      <p className="text-[10px] text-neutral-400 font-semibold uppercase">Status Jalur</p>
                      <p className="text-sm font-bold text-emerald-400">{readinessResult.readiness_dimensions.route.status}</p>
                    </div>

                    <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 text-center space-y-1">
                      <p className="text-[10px] text-neutral-400 font-semibold uppercase">Logistik</p>
                      <p className="text-sm font-bold text-blue-400">{readinessResult.readiness_dimensions.logistics.status}</p>
                    </div>
                  </div>

                  {/* Missing Essential Gear Warnings */}
                  {readinessResult.missing_essential_items?.length > 0 && (
                    <div className="bg-amber-950/40 border border-amber-500/30 p-4 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <WarningOctagon size={16} weight="fill" />
                        <span>Perlengkapan Vital Yang Belum Dicenang:</span>
                      </h4>
                      <ul className="text-xs space-y-1 text-neutral-300 list-disc list-inside">
                        {readinessResult.missing_essential_items.map((item) => (
                          <li key={item.id}>
                            <span className="font-semibold text-white">{item.name}</span> — Dapat disewa di Trexio Rental
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actionable Guidance Tips */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Langkah Rekomendasi AI:</h4>
                    <ul className="text-xs space-y-2">
                      {readinessResult.guidance_tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-neutral-300">
                          <CheckSquare size={16} className="text-emerald-400 shrink-0 mt-0.5" weight="bold" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-[10px] italic text-neutral-500 border-t border-neutral-800 pt-3">
                    {readinessResult.disclaimer}
                  </p>
                </div>
              ) : (
                <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl text-center space-y-3">
                  <ShieldCheck size={48} className="mx-auto text-neutral-600" />
                  <h4 className="text-base font-bold text-white">Belum Ada Evaluasi Kesiapan</h4>
                  <p className="text-xs text-neutral-400 max-w-md mx-auto">
                    Isi parameter di sebelah kiri dan klik "Evaluasi Kesiapan Trip Sekarang" untuk mendapatkan analisis terpadu.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: WEATHER & TRAIL STATUS */}
        {activeTab === "weather" && (
          <div className="space-y-6">
            {/* Live Weather Overview Card */}
            {weather ? (
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CloudSun size={14} weight="fill" />
                      <span>Data Cuaca Langsung Terverifikasi</span>
                    </div>
                    <h3 className="text-2xl font-black text-white mt-1">
                      {weather.destination_name} ({weather.elevation})
                    </h3>
                    <p className="text-xs text-neutral-400">{weather.province}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-neutral-400">Sumber Model Data:</p>
                    <p className="text-xs font-bold text-neutral-200">{weather.source}</p>
                    <p className="text-[10px] text-neutral-500">
                      Diperbarui: {new Date(weather.retrieved_at).toLocaleTimeString("id-ID")} WIB
                    </p>
                  </div>
                </div>

                {/* Weather Metrics */}
                {weather.is_available && weather.current ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex items-center gap-3">
                      <span className="text-3xl">{weather.current.icon}</span>
                      <div>
                        <p className="text-[10px] text-neutral-400 font-semibold uppercase">Kondisi</p>
                        <p className="text-sm font-black text-white">{weather.current.condition}</p>
                      </div>
                    </div>

                    <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex items-center gap-3">
                      <Thermometer size={28} className="text-rose-400" />
                      <div>
                        <p className="text-[10px] text-neutral-400 font-semibold uppercase">Suhu</p>
                        <p className="text-sm font-black text-white">{weather.current.temperature_celsius}°C</p>
                      </div>
                    </div>

                    <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex items-center gap-3">
                      <Wind size={28} className="text-sky-400" />
                      <div>
                        <p className="text-[10px] text-neutral-400 font-semibold uppercase">Angin</p>
                        <p className="text-sm font-black text-white">{weather.current.wind_speed_kmh} km/h</p>
                      </div>
                    </div>

                    <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex items-center gap-3">
                      <Drop size={28} className="text-blue-400" />
                      <div>
                        <p className="text-[10px] text-neutral-400 font-semibold uppercase">Curah Hujan</p>
                        <p className="text-sm font-black text-white">{weather.current.precipitation_mm} mm</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-950/40 border border-amber-500/30 p-4 rounded-xl text-amber-200 text-xs">
                    Layanan cuaca langsung saat ini tidak tersedia. Harap hubungi pos Basecamp resmi untuk informasi visual cuaca terkini.
                  </div>
                )}
              </div>
            ) : null}

            {/* Trail Statuses Cards */}
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Broadcast size={20} className="text-emerald-400" />
                <span>Status Resmi Jalur Pendakian</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {destIntel?.trail_statuses?.map((trail) => (
                  <div key={trail.id} className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">{trail.trail_name}</h4>
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md border ${
                          trail.status === "OPEN"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : trail.status === "CLOSED"
                            ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                            : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {trail.status}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-300 leading-relaxed">{trail.condition_notes}</p>

                    <div className="text-[10px] text-neutral-500 border-t border-neutral-900 pt-2 flex items-center justify-between">
                      <span>Sumber: {trail.source}</span>
                      <span>{trail.source_reference}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SMART PACKING CHECKLIST */}
        {activeTab === "packing" && (
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <CheckSquare size={22} className="text-emerald-400" />
                  <span>Smart Packing Checklist Assistant</span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Daftar rekomendasi perlengkapan otomatis disesuaikan dengan destinasi, durasi trip, dan perkiraan cuaca.
                </p>
              </div>

              <button
                onClick={handleSaveChecklist}
                disabled={savingChecklist}
                className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                {savingChecklist ? "MENYIMPAN..." : "SIMPAN PROGRES PACKING"}
              </button>
            </div>

            {checklist?.categories ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {checklist.categories.map((cat, idx) => (
                  <div key={idx} className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 space-y-3">
                    <h4 className="text-sm font-bold text-emerald-400 border-b border-neutral-800 pb-2">
                      {cat.category_name}
                    </h4>

                    <div className="space-y-2">
                      {cat.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-900/60 transition"
                        >
                          <label className="flex items-center gap-3 cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={checkedItemIds.includes(item.id)}
                              onChange={() => toggleChecklistItem(item.id)}
                              className="accent-emerald-500 w-4 h-4 rounded"
                            />
                            <span className={checkedItemIds.includes(item.id) ? "line-through text-neutral-500" : "text-neutral-200"}>
                              {item.name}
                            </span>
                          </label>

                          {item.recommended_category && (
                            <a
                              href="/rental"
                              className="text-[10px] font-semibold text-emerald-400 hover:underline flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
                            >
                              <ShoppingBag size={12} />
                              <span>Sewa di Trexio</span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 4: EMERGENCY ASSISTANCE */}
        {activeTab === "emergency" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-5">
              <h3 className="text-lg font-black text-rose-400 flex items-center gap-2">
                <PhoneCall size={22} weight="fill" />
                <span>Hotline Kontak Darurat Resmi</span>
              </h3>

              <div className="space-y-3">
                {emergencyInfo?.emergency_contacts?.map((contact, idx) => (
                  <div
                    key={idx}
                    className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{contact.name}</h4>
                      <p className="text-[10px] text-neutral-400">{contact.region || "Layanan Darurat Nasional"}</p>
                    </div>

                    <a
                      href={`tel:${contact.phone}`}
                      className="inline-flex items-center gap-1.5 text-xs font-black bg-rose-600 hover:bg-rose-500 text-white px-3 py-2 rounded-lg transition"
                    >
                      <PhoneCall size={14} weight="fill" />
                      <span>{contact.phone}</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-5">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <FirstAid size={22} className="text-emerald-400" />
                <span>SOP Penanganan Pertolongan Pertama</span>
              </h3>

              <div className="space-y-4">
                {emergencyInfo?.emergency_protocols?.map((proto, idx) => (
                  <div key={idx} className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
                    <h4 className="text-xs font-bold text-amber-300">{proto.condition}</h4>
                    <ul className="text-xs space-y-1 text-neutral-300 list-disc list-inside">
                      {proto.steps.map((step, sIdx) => (
                        <li key={sIdx}>{step}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
