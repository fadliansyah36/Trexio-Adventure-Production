import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import {
  ArrowLeft, FloppyDisk, Globe, Plus, Trash, CheckCircle, WarningCircle, Copy, ArrowClockwise,
} from "@phosphor-icons/react";

export default function SuperTenantDetail() {
  const { id } = useParams();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branding, setBranding] = useState({});
  const [meta, setMeta] = useState({ name: "", plan: "free", active: true });
  const [savingBrand, setSavingBrand] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [domain, setDomain] = useState("");
  const [addingDomain, setAddingDomain] = useState(false);
  const [verifying, setVerifying] = useState({});

  async function refresh() {
    setLoading(true);
    try {
      const { data } = await api.get(`/super/tenants/${id}`);
      setTenant(data);
      setBranding(data.branding || {});
      setMeta({ name: data.name || "", plan: data.plan || "free", active: !!data.active });
    } catch (e) {
      toast.error(formatApiError(e?.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [id]);

  async function saveMeta() {
    setSavingMeta(true);
    try {
      await api.patch(`/super/tenants/${id}`, meta);
      toast.success("Info tenant tersimpan");
      refresh();
    } catch (e) {
      toast.error(formatApiError(e?.response?.data?.detail));
    } finally {
      setSavingMeta(false);
    }
  }

  async function saveBranding() {
    setSavingBrand(true);
    try {
      await api.patch(`/super/tenants/${id}/branding`, branding);
      toast.success("Branding tersimpan");
      refresh();
    } catch (e) {
      toast.error(formatApiError(e?.response?.data?.detail));
    } finally {
      setSavingBrand(false);
    }
  }

  async function addDomain(e) {
    e.preventDefault();
    if (!domain) return;
    setAddingDomain(true);
    try {
      await api.post(`/super/tenants/${id}/domains`, { domain });
      toast.success("Domain ditambahkan. Ikuti panduan DNS di bawah.");
      setDomain("");
      refresh();
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail));
    } finally {
      setAddingDomain(false);
    }
  }

  async function verifyDomain(d) {
    setVerifying((v) => ({ ...v, [d.id]: true }));
    try {
      const { data } = await api.post(`/super/tenants/${id}/domains/${d.id}/verify`);
      if (data.verified) {
        toast.success("Domain terverifikasi ✓");
      } else {
        toast.warning(data.message || "Belum terverifikasi", { description: data.dns_error });
      }
      refresh();
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail));
    } finally {
      setVerifying((v) => ({ ...v, [d.id]: false }));
    }
  }

  async function deleteDomain(d) {
    if (!confirm(`Hapus domain ${d.domain}?`)) return;
    try {
      await api.delete(`/super/tenants/${id}/domains/${d.id}`);
      toast.success("Domain dihapus");
      refresh();
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail));
    }
  }

  function copy(text) {
    navigator.clipboard.writeText(text);
    toast.success("Tersalin");
  }

  if (loading || !tenant) {
    return <div className="text-neutral-500">Memuat tenant...</div>;
  }

  return (
    <div>
      <Link
        to="/super/tenants"
        className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white"
        data-testid="super-back"
      >
        <ArrowLeft size={14} /> Kembali ke Tenants
      </Link>
      <div className="mt-3 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-amber-400">Tenant</div>
          <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tighter">{tenant.name}</h1>
          <div className="mt-2 flex items-center gap-3 text-xs text-neutral-400">
            <span className="font-mono">{tenant.slug}.trexio.id</span>
            <span>•</span>
            <span className="capitalize">Plan {tenant.plan}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {["users", "trips", "bookings"].map((k) => (
            <div key={k} className="rounded-md border border-white/5 bg-white/5 px-4 py-3 min-w-[80px]">
              <div className="text-lg font-black">{tenant.counts?.[k] ?? 0}</div>
              <div className="text-[10px] uppercase tracking-widest text-neutral-500">{k}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meta */}
        <section className="rounded-md border border-white/5 bg-white/5 p-6">
          <h2 className="font-bold text-lg">Informasi Dasar</h2>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-neutral-500">Nama</span>
              <input
                value={meta.name}
                onChange={(e) => setMeta({ ...meta, name: e.target.value })}
                data-testid="tenant-name-input"
                className="mt-2 w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-neutral-500">Plan</span>
              <select
                value={meta.plan}
                onChange={(e) => setMeta({ ...meta, plan: e.target.value })}
                data-testid="tenant-plan-input"
                className="mt-2 w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={meta.active}
                onChange={(e) => setMeta({ ...meta, active: e.target.checked })}
                data-testid="tenant-active-input"
              /> Aktif
            </label>
            <button
              onClick={saveMeta}
              disabled={savingMeta}
              data-testid="tenant-save-meta"
              className="mt-2 inline-flex items-center gap-2 rounded-md bg-amber-400 text-black px-4 py-2 text-sm font-bold hover:bg-amber-300 disabled:opacity-50"
            >
              <FloppyDisk size={16} /> {savingMeta ? "Menyimpan..." : "Simpan Info"}
            </button>
          </div>
        </section>

        {/* Branding */}
        <section className="rounded-md border border-white/5 bg-white/5 p-6">
          <h2 className="font-bold text-lg">Branding Editor</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="block col-span-2">
              <span className="text-xs uppercase tracking-widest text-neutral-500">Brand Name</span>
              <input
                value={branding.brand_name || ""}
                onChange={(e) => setBranding({ ...branding, brand_name: e.target.value })}
                data-testid="brand-name-input"
                className="mt-2 w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
              />
            </label>
            <label className="block col-span-2">
              <span className="text-xs uppercase tracking-widest text-neutral-500">Tagline</span>
              <input
                value={branding.tagline || ""}
                onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                data-testid="brand-tagline-input"
                className="mt-2 w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
              />
            </label>
            <label className="block col-span-2">
              <span className="text-xs uppercase tracking-widest text-neutral-500">Logo URL</span>
              <input
                value={branding.logo || ""}
                onChange={(e) => setBranding({ ...branding, logo: e.target.value })}
                data-testid="brand-logo-input"
                className="mt-2 w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono text-xs focus:border-amber-400 focus:outline-none"
                placeholder="https://..."
              />
            </label>
            <label className="block col-span-2">
              <span className="text-xs uppercase tracking-widest text-neutral-500">Favicon URL</span>
              <input
                value={branding.favicon || ""}
                onChange={(e) => setBranding({ ...branding, favicon: e.target.value })}
                data-testid="brand-favicon-input"
                className="mt-2 w-full rounded-md bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono text-xs focus:border-amber-400 focus:outline-none"
                placeholder="https://..."
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-neutral-500">Warna Primer</span>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="color"
                  value={branding.primary_color || "#CC5A3F"}
                  onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                  data-testid="brand-primary-color"
                  className="h-10 w-14 rounded border border-white/10 bg-black/40 cursor-pointer"
                />
                <input
                  value={branding.primary_color || ""}
                  onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                  className="flex-1 rounded-md bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-neutral-500">Warna Sekunder</span>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="color"
                  value={branding.secondary_color || "#1E3F20"}
                  onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                  data-testid="brand-secondary-color"
                  className="h-10 w-14 rounded border border-white/10 bg-black/40 cursor-pointer"
                />
                <input
                  value={branding.secondary_color || ""}
                  onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                  className="flex-1 rounded-md bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>
            </label>
          </div>
          <button
            onClick={saveBranding}
            disabled={savingBrand}
            data-testid="tenant-save-branding"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-amber-400 text-black px-4 py-2 text-sm font-bold hover:bg-amber-300 disabled:opacity-50"
          >
            <FloppyDisk size={16} /> {savingBrand ? "Menyimpan..." : "Simpan Branding"}
          </button>
        </section>
      </div>

      {/* Domain management */}
      <section className="mt-6 rounded-md border border-white/5 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Globe size={18} /> Custom Domains
          </h2>
        </div>

        <form onSubmit={addDomain} className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value.toLowerCase().trim())}
            placeholder="explore.brandmu.com"
            data-testid="domain-input"
            className="flex-1 rounded-md bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono focus:border-amber-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={addingDomain || !domain}
            data-testid="domain-add-btn"
            className="inline-flex items-center gap-2 rounded-md bg-amber-400 text-black px-4 py-2 text-sm font-bold hover:bg-amber-300 disabled:opacity-50"
          >
            <Plus size={16} /> {addingDomain ? "Menambahkan..." : "Tambah Domain"}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          {(tenant.domains || []).length === 0 && (
            <div className="text-center py-8 text-neutral-500 text-sm border border-dashed border-white/10 rounded-md">
              Belum ada custom domain.
            </div>
          )}
          {(tenant.domains || []).map((d) => (
            <div key={d.id} className="rounded-md border border-white/10 bg-black/30 p-4" data-testid={`domain-row-${d.domain}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-mono text-sm font-bold">{d.domain}</div>
                  <div className="mt-1">
                    {d.verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 text-emerald-300 px-2 py-0.5 text-[10px] font-semibold">
                        <CheckCircle size={12} weight="fill" /> Terverifikasi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 text-amber-300 px-2 py-0.5 text-[10px] font-semibold">
                        <WarningCircle size={12} weight="fill" /> Menunggu Verifikasi
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!d.verified && (
                    <button
                      onClick={() => verifyDomain(d)}
                      disabled={verifying[d.id]}
                      data-testid={`domain-verify-${d.domain}`}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-500 text-black px-3 py-1.5 text-xs font-bold hover:bg-emerald-400 disabled:opacity-50"
                    >
                      <ArrowClockwise size={14} /> {verifying[d.id] ? "Cek DNS..." : "Verifikasi"}
                    </button>
                  )}
                  <button
                    onClick={() => deleteDomain(d)}
                    data-testid={`domain-delete-${d.domain}`}
                    className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 text-rose-300 px-3 py-1.5 text-xs font-bold hover:bg-rose-500/10"
                  >
                    <Trash size={14} /> Hapus
                  </button>
                </div>
              </div>

              {!d.verified && (
                <div className="mt-4 rounded border border-white/10 bg-black/40 p-3 text-xs">
                  <div className="text-neutral-400 uppercase tracking-widest text-[10px]">Cara Verifikasi (DNS TXT)</div>
                  <div className="mt-2 text-neutral-300">
                    Tambahkan TXT record berikut pada DNS domain <span className="font-mono">{d.domain}</span>:
                  </div>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-[100px_1fr_auto] gap-2 items-center font-mono text-[11px]">
                    <div className="text-neutral-500">Type</div>
                    <div className="bg-black/50 rounded px-2 py-1">TXT</div>
                    <div></div>
                    <div className="text-neutral-500">Name/Host</div>
                    <div className="bg-black/50 rounded px-2 py-1 break-all">{d.txt_record_name}</div>
                    <button onClick={() => copy(d.txt_record_name)} className="text-amber-400 hover:text-amber-300"><Copy size={14} /></button>
                    <div className="text-neutral-500">Value</div>
                    <div className="bg-black/50 rounded px-2 py-1 break-all">{d.txt_record_value}</div>
                    <button onClick={() => copy(d.txt_record_value)} className="text-amber-400 hover:text-amber-300"><Copy size={14} /></button>
                  </div>
                  <div className="mt-2 text-neutral-500">
                    Setelah DNS propagate (biasanya 5–30 menit), klik <span className="font-semibold text-emerald-300">Verifikasi</span>.
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
