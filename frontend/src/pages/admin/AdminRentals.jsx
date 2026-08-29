import { useEffect, useState } from "react";
import { api, formatRupiah, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, PencilSimple, Trash } from "@phosphor-icons/react";
import ProductImageUploader from "@/components/vendor/ProductImageUploader";
import { MARKETPLACE_12_CATEGORIES } from "@/pages/vendor/VendorProducts";

const EMPTY = {
  name: "",
  slug: "",
  category: "Tenda",
  price_per_day: 0,
  description: "",
  cover_image: "",
  gallery: [],
  pickup_locations: [],
  stock: 10,
  features: [],
};

const STATUS = ["pending", "confirmed", "picked_up", "returned", "cancelled"];

export default function AdminRentals() {
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("catalog");
  const [editing, setEditing] = useState(null);

  async function load() {
    const [a, b] = await Promise.all([
      api.get("/rentals"),
      api.get("/admin/rental-orders"),
    ]);
    setItems(a.data);
    setOrders(b.data);
  }
  useEffect(() => {
    load();
  }, []);

  async function save() {
    const body = { ...editing };
    ["gallery", "pickup_locations", "features"].forEach((k) => {
      body[k] = Array.isArray(body[k])
        ? body[k]
        : String(body[k] || "").split(",").map((s) => s.trim()).filter(Boolean);
    });
    body.price_per_day = Number(body.price_per_day);
    body.stock = Number(body.stock);
    delete body.id;
    delete body._new;
    try {
      if (editing._new) await api.post("/admin/rentals", body);
      else await api.put(`/admin/rentals/${editing.id}`, body);
      toast.success("Tersimpan");
      setEditing(null);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  }

  async function remove(r) {
    if (!window.confirm(`Hapus "${r.name}"?`)) return;
    await api.delete(`/admin/rentals/${r.id}`);
    load();
  }

  async function updateOrderStatus(oid, status) {
    await api.post(`/admin/rental-orders/${oid}/status`, { status });
    toast.success("Status diperbarui");
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="trx-overline text-muted-foreground">Rental Gear</div>
          <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tighter">
            Manajemen Rental
          </h1>
        </div>
        {tab === "catalog" && (
          <Button
            data-testid="admin-new-rental"
            onClick={() => setEditing({ ...EMPTY, _new: true })}
            className="bg-[hsl(var(--primary))] text-white"
          >
            <Plus size={16} className="mr-1" /> Alat Baru
          </Button>
        )}
      </div>

      <div className="mt-6 flex gap-2 border-b border-border">
        <button
          className={`px-4 py-2 text-sm font-semibold ${
            tab === "catalog" ? "border-b-2 border-[hsl(var(--secondary))]" : "text-muted-foreground"
          }`}
          onClick={() => setTab("catalog")}
        >
          Katalog ({items.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-semibold ${
            tab === "orders" ? "border-b-2 border-[hsl(var(--secondary))]" : "text-muted-foreground"
          }`}
          onClick={() => setTab("orders")}
        >
          Order ({orders.length})
        </button>
      </div>

      {tab === "catalog" && (
        <div className="mt-6 bg-white border border-border rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[hsl(var(--muted))]">
              <tr>
                <th className="text-left px-4 py-3">Alat</th>
                <th className="text-left px-4 py-3">Kategori</th>
                <th className="text-right px-4 py-3">Harga/hari</th>
                <th className="text-right px-4 py-3">Stok</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={r.cover_image} className="h-10 w-14 object-cover rounded-sm" alt="" />
                      <div className="font-medium">{r.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{r.category}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatRupiah(r.price_per_day)}</td>
                  <td className="px-4 py-3 text-right">{r.stock}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setEditing({ ...r })}>
                        <PencilSimple size={14} />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => remove(r)}>
                        <Trash size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "orders" && (
        <div className="mt-6 bg-white border border-border rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[hsl(var(--muted))]">
              <tr>
                <th className="text-left px-4 py-3">Kode</th>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Alat</th>
                <th className="text-left px-4 py-3">Periode</th>
                <th className="text-left px-4 py-3">Lokasi</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-xs">{o.order_code}</td>
                  <td className="px-4 py-3">{o.contact_name}</td>
                  <td className="px-4 py-3 text-xs">
                    {o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {new Date(o.pickup_date).toLocaleDateString("id-ID")} → {new Date(o.return_date).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-4 py-3">{o.pickup_location}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatRupiah(o.total_amount)}</td>
                  <td className="px-4 py-3">
                    <Select value={o.status} onValueChange={(v) => updateOrderStatus(o.id, v)}>
                      <SelectTrigger className="w-[140px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">Belum ada order rental.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?._new ? "Alat Baru" : "Edit Alat"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2">
                <Label>Nama</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
              </div>
              <div>
                <Label>Kategori</Label>
                <select
                  value={editing.category || "rental-gear"}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  className="w-full h-10 px-3 bg-background border border-border rounded-md text-foreground text-xs"
                >
                  {MARKETPLACE_12_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Harga/hari (Rp)</Label>
                <Input type="number" value={editing.price_per_day} onChange={(e) => setEditing({ ...editing, price_per_day: e.target.value })} />
              </div>
              <div>
                <Label>Stok</Label>
                <Input type="number" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: e.target.value })} />
              </div>
              <div className="col-span-2 p-3 bg-neutral-50 rounded-xl border border-border">
                <ProductImageUploader
                  images={Array.isArray(editing.gallery) && editing.gallery.length > 0 ? editing.gallery : (editing.cover_image ? [editing.cover_image] : [])}
                  coverImage={editing.cover_image}
                  onChange={(imagesList, coverUrl) => {
                    setEditing({
                      ...editing,
                      gallery: imagesList,
                      cover_image: coverUrl || imagesList[0] || "",
                    });
                  }}
                  maxPhotos={5}
                />
              </div>
              <div className="col-span-2">
                <Label>Deskripsi</Label>
                <Textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="col-span-2">
                <Label>Pickup Locations (pisah koma)</Label>
                <Input
                  value={Array.isArray(editing.pickup_locations) ? editing.pickup_locations.join(", ") : editing.pickup_locations}
                  onChange={(e) => setEditing({ ...editing, pickup_locations: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label>Features (pisah koma)</Label>
                <Input
                  value={Array.isArray(editing.features) ? editing.features.join(", ") : editing.features}
                  onChange={(e) => setEditing({ ...editing, features: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Batal</Button>
            <Button onClick={save} className="bg-[hsl(var(--secondary))] text-white">Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
