import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Database,
  Users,
  ShieldCheck,
  Storefront,
  Buildings,
  SquaresFour,
  MapPin,
  Package,
  Headset,
  MagnifyingGlass,
  Plus,
  Pencil,
  Trash,
  CheckCircle,
  XCircle,
  Funnel,
  ArrowClockwise,
  Eye,
  Crown,
  Tag,
  Warning,
  Sliders,
  Check,
  X,
  CaretRight,
  HouseLine,
  Compass,
  Backpack,
  Tent,
  Campfire,
  Bed,
  AirplaneInFlight
} from "@phosphor-icons/react";

export default function SuperMasterData() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  // Stats & Master Data States
  const [overviewStats, setOverviewStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [rolesData, setRolesData] = useState({ roles: [], modules: [], matrix: {} });
  const [vendorsList, setVendorsList] = useState([]);
  const [tenantsList, setTenantsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [locationsData, setLocationsData] = useState({ provinces: [], cities: [], destinations: [], mountains: [], trails: [], basecamps: [] });
  const [productsList, setProductsList] = useState([]);
  const [auditLogsList, setAuditLogsList] = useState([]);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Modal States
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ name: "", email: "", phone: "", password: "", role: "user", status: "active", verification_status: "verified" });

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState({ name: "", type: "trip", icon: "SquaresFour", description: "", order: 1 });

  const [locModalOpen, setLocModalOpen] = useState(false);
  const [locType, setLocType] = useState("destinations");
  const [locForm, setLocForm] = useState({ name: "", province_id: "", city_id: "", description: "", image: "" });

  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [vendorForm, setVendorForm] = useState({ brand_name: "", category: "Open Trip Organizer", owner_name: "", owner_email: "", owner_phone: "", city: "", province: "" });

  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);

  // Fetch Master Data
  const fetchOverview = async () => {
    try {
      const res = await api.get("/super/master/overview");
      if (res.data?.ok) setOverviewStats(res.data.stats);
    } catch (e) {
      console.error("Failed loading master overview:", e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/super/master/users", { params: { role: filterRole, status: filterStatus, q: searchQuery } });
      if (res.data?.ok) setUsersList(res.data.users || []);
    } catch (e) {
      toast.error("Gagal memuat Master Users");
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get("/super/master/roles");
      if (res.data?.ok) {
        setRolesData({
          roles: res.data.roles || [],
          modules: res.data.modules || [],
          matrix: res.data.matrix || {}
        });
      }
    } catch (e) {
      toast.error("Gagal memuat Master Roles");
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await api.get("/super/master/vendors", { params: { status: filterStatus, category: filterCategory, q: searchQuery } });
      if (res.data?.ok) setVendorsList(res.data.vendors || []);
    } catch (e) {
      toast.error("Gagal memuat Master Vendors");
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await api.get("/super/master/tenants");
      if (res.data?.ok) setTenantsList(res.data.tenants || []);
    } catch (e) {
      toast.error("Gagal memuat Master Tenants");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/super/master/categories");
      if (res.data?.ok) setCategoriesList(res.data.categories || []);
    } catch (e) {
      toast.error("Gagal memuat Master Categories");
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await api.get("/super/master/locations");
      if (res.data?.ok) setLocationsData(res.data.locations || {});
    } catch (e) {
      toast.error("Gagal memuat Master Locations");
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get("/super/master/products", { params: { category: filterCategory, q: searchQuery } });
      if (res.data?.ok) setProductsList(res.data.products || []);
    } catch (e) {
      toast.error("Gagal memuat Master Products");
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get("/super/security/audit-logs");
      if (Array.isArray(res.data)) setAuditLogsList(res.data);
    } catch (e) {
      toast.error("Gagal memuat Audit Logs");
    }
  };

  const reloadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchOverview(),
      fetchUsers(),
      fetchRoles(),
      fetchVendors(),
      fetchTenants(),
      fetchCategories(),
      fetchLocations(),
      fetchProducts(),
      fetchAuditLogs()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    reloadAllData();
  }, []);

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "vendors") fetchVendors();
    if (activeTab === "products") fetchProducts();
  }, [searchQuery, filterRole, filterStatus, filterCategory, activeTab]);

  // Handle User Submit
  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const res = await api.put(`/super/master/users/${editingUser.id}`, userForm);
        if (res.data?.ok) {
          toast.success(res.data.message || "User berhasil diperbarui");
          setUserModalOpen(false);
          fetchUsers();
          fetchOverview();
        }
      } else {
        const res = await api.post("/super/master/users", userForm);
        if (res.data?.ok) {
          toast.success(res.data.message || "User berhasil dibuat");
          setUserModalOpen(false);
          fetchUsers();
          fetchOverview();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal menyimpan user");
    }
  };

  // Handle User Status
  const handleToggleUserStatus = async (user, newStatus) => {
    try {
      const res = await api.post(`/super/master/users/${user.id}/status`, { status: newStatus });
      if (res.data?.ok) {
        toast.success(res.data.message);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal mengubah status user");
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus user ini dari Master Data?")) return;
    try {
      const res = await api.delete(`/super/master/users/${userId}`);
      if (res.data?.ok) {
        toast.success(res.data.message);
        fetchUsers();
        fetchOverview();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal menghapus user");
    }
  };

  // Handle RBAC Matrix Update
  const handleTogglePermission = async (roleKey, moduleKey, permKey, currentValue) => {
    const nextValue = !currentValue;
    try {
      const newPerms = {
        ...(rolesData.matrix[roleKey]?.[moduleKey] || {}),
        [permKey]: nextValue
      };

      const res = await api.put("/super/master/roles/matrix", {
        role: roleKey,
        module: moduleKey,
        permissions: newPerms
      });

      if (res.data?.ok) {
        toast.success(`Izin ${permKey.toUpperCase()} updated untuk ${roleKey}`);
        setRolesData((prev) => ({
          ...prev,
          matrix: {
            ...prev.matrix,
            [roleKey]: {
              ...(prev.matrix[roleKey] || {}),
              [moduleKey]: newPerms
            }
          }
        }));
      }
    } catch (err) {
      toast.error("Gagal memperbarui hak akses RBAC");
    }
  };

  // Handle Category Submit
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCat) {
        const res = await api.put(`/super/master/categories/${editingCat.id}`, catForm);
        if (res.data?.ok) {
          toast.success("Kategori berhasil diperbarui");
          setCatModalOpen(false);
          fetchCategories();
        }
      } else {
        const res = await api.post("/super/master/categories", catForm);
        if (res.data?.ok) {
          toast.success("Kategori baru berhasil ditambahkan");
          setCatModalOpen(false);
          fetchCategories();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal menyimpan kategori");
    }
  };

  // Handle Location Submit
  const handleSaveLocation = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/super/master/locations/${locType}`, locForm);
      if (res.data?.ok) {
        toast.success("Lokasi berhasil ditambahkan");
        setLocModalOpen(false);
        fetchLocations();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal menambahkan lokasi");
    }
  };

  // Handle Vendor Submit
  const handleSaveVendor = async (e) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        const res = await api.put(`/super/master/vendors/${editingVendor.id}`, vendorForm);
        if (res.data?.ok) {
          toast.success("Data vendor berhasil diperbarui");
          setVendorModalOpen(false);
          fetchVendors();
        }
      } else {
        const res = await api.post("/super/master/vendors", vendorForm);
        if (res.data?.ok) {
          toast.success("Vendor baru berhasil ditambahkan");
          setVendorModalOpen(false);
          fetchVendors();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal menyimpan vendor");
    }
  };

  // Handle Toggle Product Status
  const handleToggleProductStatus = async (productId, currentStatus) => {
    const nextStatus = currentStatus === "published" ? "draft" : "published";
    try {
      const res = await api.post(`/super/master/products/${productId}/status`, { status: nextStatus });
      if (res.data?.ok) {
        toast.success(res.data.message);
        fetchProducts();
      }
    } catch (err) {
      toast.error("Gagal mengubah status produk");
    }
  };

  const navTabs = [
    { id: "overview", label: "Master Overview", icon: Database },
    { id: "users", label: "Master Users", icon: Users, badge: usersList.length },
    { id: "rbac", label: "Roles & RBAC", icon: ShieldCheck },
    { id: "vendors", label: "Vendors & Partners", icon: Storefront, badge: vendorsList.length },
    { id: "tenants", label: "Tenants & Storefronts", icon: Buildings, badge: tenantsList.length },
    { id: "marketplace", label: "Marketplace Categories", icon: SquaresFour, badge: categoriesList.length },
    { id: "locations", label: "Geographical Locations", icon: MapPin },
    { id: "products", label: "Products Catalog", icon: Package, badge: productsList.length },
    { id: "audit_logs", label: "System Audit Logs", icon: Headset, badge: auditLogsList.length }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-black p-6 rounded-2xl border border-emerald-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
              <Database weight="bold" className="size-3" /> Central Source of Truth
            </span>
            <span className="text-xs text-slate-400 font-mono">MDM Engine v3.0</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Master Data Management System
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Pusat administrasi tunggal data inti TREXIO: Pengelolaan terpusat Users, RBAC, Vendors, Tenants, Kategori Marketplace, Lokasi Geografis, Produk, dan Audit Trail terintegrasi.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={reloadAllData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <ArrowClockwise weight="bold" className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10 no-scrollbar">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 font-black"
                  : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-white/5"
              }`}
            >
              <Icon weight={isActive ? "fill" : "bold"} className="size-4" />
              {tab.label}
              {tab.badge !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                  isActive ? "bg-slate-950/20 text-slate-950" : "bg-white/10 text-slate-300"
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Total Registered Users</span>
                <Users weight="duotone" className="size-6 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-white mt-2 font-mono">
                {overviewStats ? overviewStats.users_count.toLocaleString() : "..."}
              </div>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                <span className="text-emerald-400 font-bold">{overviewStats?.active_users} Aktif</span> · <span className="text-amber-400">0 Suspended</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Verified Vendors & Partners</span>
                <Storefront weight="duotone" className="size-6 text-blue-400" />
              </div>
              <div className="text-3xl font-black text-white mt-2 font-mono">
                {overviewStats ? overviewStats.vendors_count.toLocaleString() : "..."}
              </div>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                <span className="text-blue-400 font-bold">{overviewStats?.verified_vendors} Terverifikasi</span> · Open Trip, Guide, Rental
              </div>
            </div>

            <div className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Active Tenant Storefronts</span>
                <Buildings weight="duotone" className="size-6 text-purple-400" />
              </div>
              <div className="text-3xl font-black text-white mt-2 font-mono">
                {overviewStats ? overviewStats.tenants_count.toLocaleString() : "..."}
              </div>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                <span className="text-purple-400 font-bold">{overviewStats?.active_tenants} Subskripsi Aktif</span> · Domain Kustom
              </div>
            </div>

            <div className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Marketplace Products & Trips</span>
                <Package weight="duotone" className="size-6 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-white mt-2 font-mono">
                {overviewStats ? (overviewStats.trips_count + overviewStats.rentals_count).toLocaleString() : "..."}
              </div>
              <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                <span className="text-amber-400 font-bold">{overviewStats?.trips_count} Trip</span> · {overviewStats?.rentals_count} Rental Gear
              </div>
            </div>
          </div>

          {/* Architecture Concept Mapping Card */}
          <div className="bg-slate-900/90 border border-white/10 p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Database weight="fill" className="text-emerald-400 size-4" /> Relasi Master Data Ecosystem TREXIO
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center">
              <div className="bg-slate-950 p-4 rounded-xl border border-white/10 space-y-1">
                <div className="text-xs font-bold text-emerald-400">1. SUPER ADMIN</div>
                <div className="text-[10px] text-slate-400">Source of Truth & RBAC Control</div>
              </div>
              <div className="hidden md:flex items-center justify-center text-slate-500">→</div>
              <div className="bg-slate-950 p-4 rounded-xl border border-white/10 space-y-1">
                <div className="text-xs font-bold text-blue-400">2. MASTER DATA</div>
                <div className="text-[10px] text-slate-400">Users · Roles · Vendors · Categories · Locations</div>
              </div>
              <div className="hidden md:flex items-center justify-center text-slate-500">→</div>
              <div className="bg-slate-950 p-4 rounded-xl border border-white/10 space-y-1">
                <div className="text-xs font-bold text-purple-400">3. API & SERVICES</div>
                <div className="text-[10px] text-slate-400">Express REST Endpoints + Audit Logger</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER USERS */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                <input
                  type="text"
                  placeholder="Cari user, email, HP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Semua Role</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Tenant Admin</option>
                <option value="partner">Vendor / Partner</option>
                <option value="user">User Traveler</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Semua Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <button
              onClick={() => {
                setEditingUser(null);
                setUserForm({ name: "", email: "", phone: "", password: "", role: "user", status: "active", verification_status: "verified" });
                setUserModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all shrink-0"
            >
              <Plus weight="bold" className="size-4" />
              Tambah Master User
            </button>
          </div>

          <div className="bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3.5">User Profile</th>
                    <th className="px-4 py-3.5">Role System</th>
                    <th className="px-4 py-3.5">Status Account</th>
                    <th className="px-4 py-3.5">Aktivitas Bookings</th>
                    <th className="px-4 py-3.5 text-right">Aksi Management</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5 transition-all">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white text-sm">{u.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                        {u.phone && <div className="text-[10px] text-slate-500 font-mono">{u.phone}</div>}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border ${
                          u.role === "super_admin"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : u.role === "partner" || u.role === "vendor"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                            : u.role === "admin"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                            : "bg-slate-800 text-slate-300 border-white/10"
                        }`}>
                          {u.role === "super_admin" && <Crown weight="fill" className="size-3" />}
                          {u.role}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === "suspended"
                            ? "bg-red-500/10 text-red-400 border border-red-500/30"
                            : u.status === "inactive"
                            ? "bg-slate-800 text-slate-400 border border-white/10"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        }`}>
                          <span className={`size-1.5 rounded-full ${u.status === "suspended" ? "bg-red-400" : "bg-emerald-400"}`} />
                          {u.status || "active"}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono">
                        <div className="text-white font-bold">{u.bookings_count || 0} Trips</div>
                        <div className="text-[10px] text-slate-400">
                          Rp {(u.total_spent || 0).toLocaleString("id-ID")}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setUserForm({
                              name: u.name,
                              email: u.email,
                              phone: u.phone || "",
                              password: "",
                              role: u.role || "user",
                              status: u.status || "active",
                              verification_status: u.verification_status || "verified"
                            });
                            setUserModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-white/10"
                        >
                          Edit
                        </button>

                        {u.status === "suspended" ? (
                          <button
                            onClick={() => handleToggleUserStatus(u, "active")}
                            className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/30"
                          >
                            Aktifkan
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleUserStatus(u, "suspended")}
                            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-lg border border-amber-500/30"
                          >
                            Suspend
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg border border-red-500/30"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ROLES & RBAC MATRIX */}
      {activeTab === "rbac" && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 p-5 rounded-2xl border border-white/10 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck weight="fill" className="text-emerald-400 size-4" /> Authorization & RBAC Permission Matrix
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Konfigurasi hak akses berbasis peran (Role-Based Access Control) untuk modul sistem Trexio. Perubahan langsung tersimpan di Master Data Engine.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3.5">Modul Sistem</th>
                    <th className="px-4 py-3.5">Super Admin</th>
                    <th className="px-4 py-3.5">Tenant Admin</th>
                    <th className="px-4 py-3.5">Vendor / Partner</th>
                    <th className="px-4 py-3.5">User Traveler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {rolesData.modules.map((mod) => (
                    <tr key={mod.key} className="hover:bg-white/5 transition-all">
                      <td className="px-4 py-3.5 font-bold text-white">
                        {mod.label}
                        <div className="text-[10px] font-mono text-slate-500">{mod.key}</div>
                      </td>

                      {["SUPER_ADMIN", "TENANT", "VENDOR_PARTNER", "USER_TRAVELER"].map((roleKey) => {
                        const perms = rolesData.matrix[roleKey]?.[mod.key] || {};
                        return (
                          <td key={roleKey} className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1.5">
                              {["create", "read", "update", "delete", "approve"].map((permKey) => {
                                const hasPerm = Boolean(perms[permKey]);
                                return (
                                  <button
                                    key={permKey}
                                    onClick={() => handleTogglePermission(roleKey, mod.key, permKey, hasPerm)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-all ${
                                      hasPerm
                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                        : "bg-slate-950 text-slate-600 border border-white/5 hover:text-slate-400"
                                    }`}
                                  >
                                    {permKey.slice(0, 3)}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VENDORS MASTER */}
      {activeTab === "vendors" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                <input
                  type="text"
                  placeholder="Cari brand vendor, owner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setEditingVendor(null);
                setVendorForm({ brand_name: "", category: "Open Trip Organizer", owner_name: "", owner_email: "", owner_phone: "", city: "", province: "" });
                setVendorModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all shrink-0"
            >
              <Plus weight="bold" className="size-4" />
              Tambah Vendor Master
            </button>
          </div>

          <div className="bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3.5">Vendor Brand</th>
                    <th className="px-4 py-3.5">Kategori Jasa</th>
                    <th className="px-4 py-3.5">Kontak & Lokasi</th>
                    <th className="px-4 py-3.5">Katalog Produk</th>
                    <th className="px-4 py-3.5">Status KYC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {vendorsList.map((v) => (
                    <tr key={v.id} className="hover:bg-white/5 transition-all">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white text-sm">{v.brand_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">@{v.slug}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg text-[10px] font-bold">
                          {v.category}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="text-white">{v.contact?.email || "-"}</div>
                        <div className="text-[11px] text-slate-400">{v.legal?.city}, {v.legal?.province}</div>
                      </td>

                      <td className="px-4 py-3.5 font-mono">
                        <div className="text-white font-bold">{v.products_count || 0} Layanan</div>
                        <div className="text-[10px] text-slate-400">{v.bookings_count || 0} Terjual</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle weight="fill" className="size-3" /> VERIFIED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TENANTS MASTER */}
      {activeTab === "tenants" && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3.5">Tenant Name</th>
                    <th className="px-4 py-3.5">Subdomain / Domain</th>
                    <th className="px-4 py-3.5">SaaS Plan</th>
                    <th className="px-4 py-3.5">Users Count</th>
                    <th className="px-4 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {tenantsList.map((t) => (
                    <tr key={t.id} className="hover:bg-white/5 transition-all">
                      <td className="px-4 py-3.5 font-bold text-white text-sm">{t.name}</td>
                      <td className="px-4 py-3.5 font-mono text-emerald-400">{t.domain || `${t.subdomain}.trexio.id`}</td>
                      <td className="px-4 py-3.5 font-mono uppercase text-amber-400 font-bold">{t.subscription_plan}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-300">{t.users_count || 1} Admin</td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: MARKETPLACE CATEGORIES */}
      {activeTab === "marketplace" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/80 p-4 rounded-2xl border border-white/10">
            <div>
              <h3 className="text-sm font-bold text-white">12 Kategori Marketplace Layanan Trexio</h3>
              <p className="text-xs text-slate-400">Pengaturan taksonomi kategori trip, guide, porter, basecamp, & rental.</p>
            </div>
            <button
              onClick={() => {
                setEditingCat(null);
                setCatForm({ name: "", type: "trip", icon: "SquaresFour", description: "", order: categoriesList.length + 1 });
                setCatModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all shrink-0"
            >
              <Plus weight="bold" className="size-4" />
              Tambah Kategori
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoriesList.map((cat) => (
              <div key={cat.id} className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl space-y-3 hover:border-emerald-500/40 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <SquaresFour weight="duotone" className="size-5" />
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-sm">{cat.name}</h4>
                      <div className="text-[10px] font-mono text-slate-400">slug: {cat.slug}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    ORDER #{cat.order || 1}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{cat.description || "Tidak ada deskripsi."}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: GEOGRAPHICAL LOCATIONS */}
      {activeTab === "locations" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/80 p-4 rounded-2xl border border-white/10">
            <div>
              <h3 className="text-sm font-bold text-white">Hirarki Lokasi Geografis & Gunung</h3>
              <p className="text-xs text-slate-400">Master Provinsi → Kota/Kab → Destinasi → Gunung → Jalur → Basecamp SIMAKSI.</p>
            </div>
            <button
              onClick={() => {
                setLocForm({ name: "", province_id: "", city_id: "", description: "", image: "" });
                setLocModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all shrink-0"
            >
              <Plus weight="bold" className="size-4" />
              Tambah Data Lokasi
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locationsData.destinations?.map((dest) => (
              <div key={dest.id} className="bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden space-y-3">
                {dest.image && (
                  <img src={dest.image} alt={dest.name} className="w-full h-32 object-cover" />
                )}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm">{dest.name}</h4>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {dest.region}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{dest.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: PRODUCTS CATALOG */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3.5">Nama Produk / Trip</th>
                    <th className="px-4 py-3.5">Vendor Pemilik</th>
                    <th className="px-4 py-3.5">Destinasi</th>
                    <th className="px-4 py-3.5">Harga Produk</th>
                    <th className="px-4 py-3.5">Status Publikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {productsList.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5 transition-all">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-white text-sm">{p.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Tipe: {p.type.toUpperCase()}</div>
                      </td>

                      <td className="px-4 py-3.5 font-semibold text-blue-400">{p.vendor_name}</td>
                      <td className="px-4 py-3.5 text-slate-300">{p.destination || "-"}</td>
                      <td className="px-4 py-3.5 font-mono text-emerald-400 font-bold">
                        Rp {(p.price || 0).toLocaleString("id-ID")}
                      </td>

                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => handleToggleProductStatus(p.id, p.status)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            p.status === "published"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-slate-800 text-slate-400 border-white/10 hover:text-white"
                          }`}
                        >
                          {p.status === "published" ? "PUBLISHED" : "DRAFT"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: AUDIT LOGS */}
      {activeTab === "audit_logs" && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3.5">Timestamp</th>
                    <th className="px-4 py-3.5">Actor Super Admin</th>
                    <th className="px-4 py-3.5">Action Event</th>
                    <th className="px-4 py-3.5">Target Resource</th>
                    <th className="px-4 py-3.5">IP & Client</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                  {auditLogsList.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-all">
                      <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString("id-ID") : "-"}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-emerald-400">{log.actor_email || log.user}</td>
                      <td className="px-4 py-3.5 font-bold text-amber-400">{log.action}</td>
                      <td className="px-4 py-3.5 text-slate-200">{log.resource}</td>
                      <td className="px-4 py-3.5 text-slate-500">{log.actor_ip || "127.0.0.1"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT MASTER USER */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-sm">
                {editingUser ? "Edit Master User" : "Tambah User Master Baru"}
              </h3>
              <button onClick={() => setUserModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Alamat Email</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Nomor Telepon / WhatsApp</label>
                <input
                  type="text"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">
                  Password {editingUser && <span className="text-[10px] text-slate-500">(Kosongkan jika tidak diubah)</span>}
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder={editingUser ? "••••••••" : "Min. 6 Karakter"}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">Role Akses Sistem</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="user">User Traveler / Pendaki</option>
                  <option value="partner">Vendor / Partner</option>
                  <option value="admin">Tenant Administrator</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20"
                >
                  Simpan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
