import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
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
import { toast } from "sonner";
import { Plus, PencilSimple, Trash } from "@phosphor-icons/react";
import ProductImageUploader from "@/components/vendor/ProductImageUploader";

const EMPTY = {
  name: "",
  slug: "",
  region: "",
  cover_image: "",
  description: "",
  tags: [],
};

export default function AdminCommunities() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);

  async function load() {
    const { data } = await api.get("/communities");
    setItems(data);
  }
  useEffect(() => {
    load();
  }, []);

  async function save() {
    const body = { ...editing };
    body.tags = Array.isArray(body.tags)
      ? body.tags
      : String(body.tags || "").split(",").map((s) => s.trim()).filter(Boolean);
    delete body.id;
    delete body._new;
    try {
      if (editing._new) await api.post("/admin/communities", body);
      else await api.put(`/admin/communities/${editing.id}`, body);
      toast.success("Tersimpan");
      setEditing(null);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  }

  async function remove(c) {
    if (!window.confirm(`Hapus komunitas "${c.name}"?`)) return;
    await api.delete(`/admin/communities/${c.id}`);
    toast.success("Terhapus");
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="trx-overline text-muted-foreground">Komunitas</div>
          <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tighter">Manajemen Komunitas</h1>
        </div>
        <Button
          data-testid="admin-new-community"
          onClick={() => setEditing({ ...EMPTY, _new: true })}
          className="bg-[hsl(var(--primary))] text-white"
        >
          <Plus size={16} className="mr-1" /> Komunitas Baru
        </Button>
      </div>
      <div className="mt-8 bg-white border border-border rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[hsl(var(--muted))]">
            <tr>
              <th className="text-left px-4 py-3">Nama</th>
              <th className="text-left px-4 py-3">Region</th>
              <th className="text-right px-4 py-3">Anggota</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={c.cover_image} className="h-10 w-14 object-cover rounded-sm" alt="" />
                    <div className="font-medium">{c.name}</div>
                  </div>
                </td>
                <td className="px-4 py-3">{c.region}</td>
                <td className="px-4 py-3 text-right font-bold">{c.member_count}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => setEditing({ ...c })}>
                      <PencilSimple size={14} />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => remove(c)}>
                      <Trash size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing?._new ? "Komunitas Baru" : "Edit Komunitas"}</DialogTitle>
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
                <Label>Region</Label>
                <Input value={editing.region} onChange={(e) => setEditing({ ...editing, region: e.target.value })} />
              </div>
              <div className="col-span-2 p-3 bg-neutral-50 rounded-xl border border-border">
                <ProductImageUploader
                  images={editing.cover_image ? [editing.cover_image] : []}
                  coverImage={editing.cover_image}
                  onChange={(imagesList, coverUrl) => {
                    setEditing({
                      ...editing,
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
                <Label>Tags (pisah koma)</Label>
                <Input
                  value={Array.isArray(editing.tags) ? editing.tags.join(", ") : editing.tags}
                  onChange={(e) => setEditing({ ...editing, tags: e.target.value })}
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
