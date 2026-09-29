import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { Plus, X } from "@phosphor-icons/react";

export default function SuperTenants() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ slug: "", name: "", plan: "free", active: true });
  const [submitting, setSubmitting] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const { data } = await api.get("/super/tenants");
      setTenants(data);
    } catch (e) {
      toast.error(formatApiError(e?.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/super/tenants", form);
      toast.success("Tenant dibuat");
      setShowCreate(false);
      setForm({ slug: "", name: "", plan: "free", active: true });
      refresh();
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail));
    } finally {
      setSubmitting(false);
    }
  }

  async function del(t) {
    if (!confirm(`Hapus tenant "${t.name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await api.delete(`/super/tenants/${t.id}`);
      toast.success("Tenant dihapus");
      refresh();
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail));
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-amber-400">Tenant Management</div>
          <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tighter">Semua Tenant</h1>
          <p className="mt-2 text-neutral-400 text-sm">Provision tenant baru, atur plan, dan kelola domain.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          data-testid="super-create-tenant-btn"
          className="inline-flex items-center gap-2 rounded-md bg-amber-400 text-black px-4 py-2 text-sm font-bold hover:bg-amber-300"
        >
          <Plus size={16} weight="bold" /> Tenant Baru
        </button>
      </div>

      <div className="mt-8 rounded-md border border-white/5 bg-white/5 overflow-x-auto w-full">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-white/5 text-neutral-400 uppercase text-[10px] tracking-widest">
            <tr>
              <th className="text-left px-4 py-3">Nama</th>
              <th className="text-left px-4 py-3">Slug</th>
              <th className="text-left px-4 py-3">Plan</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Dibuat</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="text-center py-8 text-neutral-500">Memuat...</td></tr>
            )}
            {!loading && tenants.map((t) => (
              <tr key={t.id} className="border-t border-white/5">
                <td className="px-4 py-3 font-semibold">{t.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-400">{t.slug}</td>
                <td className="px-4 py-3 capitalize text-neutral-300">{t.plan}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.active ? "bg-emerald-400/20 text-emerald-300" : "bg-neutral-700 text-neutral-400"}`}>
                    {t.active ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-neutral-400">
                  {t.created_at ? new Date(t.created_at).toLocaleDateString("id-ID") : "—"}
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  <Link
                    to={`/super/tenants/${t.id}`}
                    data-testid={`super-manage-${t.slug}`}
                    className="text-amber-400 hover:underline text-xs font-semibold"
                  >
                    Kelola
                  </Link>
                  {t.slug !== "default" && (
                    <button
                      onClick={() => del(t)}
                      data-testid={`super-delete-${t.slug}`}
                      className="text-rose-400 hover:underline text-xs font-semibold"
                    >
                      Hapus
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && tenants.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-neutral-500">Belum ada tenant.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-2 sm:p-4 overflow-y-auto" data-testid="super-create-modal">
          <div className="relative bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md my-auto max-h-[90vh] flex flex-col">
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="font-bold text-base sm:text-lg text-white">Tenant baru</h3>
              <button onClick={() => setShowCreate(false)} aria-label="Tutup" className="text-neutral-400 hover:text-white p-1" data-testid="super-close-create">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submit} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest text-neutral-500">Nama Brand</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-testid="super-create-name"
                  className="mt-2 w-full min-w-0 rounded-md bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  placeholder="Petualang Nusantara"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-neutral-500">Slug (subdomain)</label>
                <input
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  data-testid="super-create-slug"
                  className="mt-2 w-full min-w-0 rounded-md bg-black/40 border border-white/10 px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                  placeholder="petualang-nusantara"
                />
                <p className="mt-1 text-[11px] text-neutral-500">
                  URL: <span className="font-mono">{form.slug || "slug"}.trexio.id</span>
                </p>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-neutral-500">Plan</label>
                <select
                  value={form.plan}
                  onChange={(e) => setForm({ ...form, plan: e.target.value })}
                  data-testid="super-create-plan"
                  className="mt-2 w-full min-w-0 rounded-md bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-neutral-300">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  data-testid="super-create-active"
                />
                Aktif
              </label>
              <div className="shrink-0 flex justify-end gap-2 pt-3 border-t border-white/10 mt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-neutral-400 hover:text-white">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  data-testid="super-create-submit"
                  className="rounded-md bg-amber-400 text-black px-4 py-2 text-sm font-bold hover:bg-amber-300 disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Buat Tenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
