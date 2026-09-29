import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, formatRupiah } from "@/lib/api";
import SEO from "@/components/site/SEO";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Package, MapPin } from "@phosphor-icons/react";

const CATEGORIES = ["Tenda", "Carrier", "Sleeping Bag", "Cooking", "Lighting", "Aksesoris", "Pakaian"];
const LOCATIONS = ["Jakarta", "Bandung", "Malang", "Yogyakarta"];

export default function Rentals() {
  const [items, setItems] = useState([]);
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "";
  const location = params.get("location") || "";

  useEffect(() => {
    const q = {};
    if (category) q.category = category;
    if (location) q.location = location;
    api.get("/rentals", { params: q }).then((r) => setItems(Array.isArray(r.data) ? r.data : []));
  }, [category, location]);

  function set(k, v) {
    const p = new URLSearchParams(params);
    if (!v || v === "all") p.delete(k);
    else p.set(k, v);
    setParams(p);
  }

  return (
    <div className="pb-20">
      <SEO
        title="Sewa Peralatan Camping & Outdoor Gear"
        description="Sewa tenda, carrier, sleeping bag, kompor, dan perlengkapan mendaki gunung terlengkap dari vendor terpercaya di berbagai kota."
        keywords="sewa alat camping, rental tenda, rental outdoor, sewa carrier, sewa perlengkapan naik gunung, trexio"
      />
      <div className="trx-container pt-10">
        <div className="trx-overline text-muted-foreground">Rental Gear</div>
        <h1 className="mt-2 text-3xl md:text-5xl font-black tracking-tighter">
          Sewa alat petualangan
        </h1>
        <p className="mt-3 text-muted-foreground max-w-xl">
          Tenda, carrier, sleeping bag, sampai headlamp. Ambil di kota terdekat.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Select value={category || "all"} onValueChange={(v) => set("category", v)}>
            <SelectTrigger data-testid="rental-category" className="w-[180px]">
              <SelectValue placeholder="Semua kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua kategori</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={location || "all"} onValueChange={(v) => set("location", v)}>
            <SelectTrigger data-testid="rental-location" className="w-[180px]">
              <SelectValue placeholder="Semua kota" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua kota</SelectItem>
              {LOCATIONS.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
          {(Array.isArray(items) ? items : []).map((r) => (
            <Link
              key={r.id}
              to={`/rental/${r.id}`}
              data-testid={`rental-${r.slug}`}
              className="group block bg-card border border-border/80 rounded-2xl overflow-hidden hover:border-emerald-500/60 hover:shadow-lg transition-all flex flex-col justify-between h-full"
            >
              <div>
                <div className="aspect-square overflow-hidden bg-muted relative">
                  <img
                    src={r.cover_image}
                    alt={r.name}
                    loading="lazy"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-2 left-2 bg-emerald-700/90 backdrop-blur text-white px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                    {r.category}
                  </span>
                </div>
                <div className="p-2.5 sm:p-4">
                  <div className="font-extrabold text-xs sm:text-sm text-foreground line-clamp-2 leading-tight group-hover:text-emerald-600 transition-colors">
                    {r.name}
                  </div>
                </div>
              </div>
              <div className="p-2.5 sm:p-4 pt-0 border-t border-border/50 pt-2 flex items-end justify-between">
                <div>
                  <div className="text-xs sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(r.price_per_day)}
                  </div>
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                    per hari
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs text-muted-foreground font-semibold bg-muted px-2 py-0.5 rounded-md">
                  Stok: {r.stock}
                </span>
              </div>
            </Link>
          ))}
        </div>
        {items.length === 0 && (
          <div className="mt-10 border border-dashed border-border rounded-md p-12 text-center text-muted-foreground">
            Tidak ada alat sesuai filter.
          </div>
        )}
      </div>
    </div>
  );
}
