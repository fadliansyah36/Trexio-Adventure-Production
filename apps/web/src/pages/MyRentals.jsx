import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatRupiah } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Package } from "@phosphor-icons/react";
import EmptyState from "@/components/EmptyState";
import { PackageX } from "lucide-react";

const STATUS = {
  pending: "Menunggu Pickup",
  confirmed: "Terkonfirmasi",
  picked_up: "Sudah Diambil",
  returned: "Dikembalikan",
  cancelled: "Dibatalkan",
};

export default function MyRentals() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get("/rentals/orders/mine").then((r) => setItems(Array.isArray(r.data) ? r.data : []));
  }, []);
  return (
    <div className="pb-20">
      <div className="trx-container pt-10">
        <div className="trx-overline text-muted-foreground">Akun Saya</div>
        <h1 className="mt-2 text-3xl md:text-5xl font-black tracking-tighter">
          Rental Saya
        </h1>
        {items.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="Belum Ada Pesanan Rental"
              description="Sewa alat outdoor berkualitas untuk petualangan Anda berikutnya."
              icon={PackageX}
              actionLabel="Jelajah Rental"
              actionLink="/rental"
            />
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {items.map((o) => (
              <div key={o.id} className="bg-white border border-border rounded-md p-5 md:p-6">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div>
                    <div className="trx-overline text-muted-foreground">{o.order_code}</div>
                    <div className="font-bold mt-1">
                      {(Array.isArray(o.items) ? o.items : []).map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(o.pickup_date).toLocaleDateString("id-ID")} →{" "}
                      {new Date(o.return_date).toLocaleDateString("id-ID")} ({o.days} hari)
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Pickup: {o.pickup_location}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-[hsl(var(--secondary))]">
                      {STATUS[o.status] || o.status}
                    </div>
                    <div className="mt-1 text-lg font-black">{formatRupiah(o.total_amount)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
