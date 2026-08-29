import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import SEO from "@/components/site/SEO";
import { Users, ArrowRight, MapPin } from "@phosphor-icons/react";

export default function Communities() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get("/communities").then((r) => setItems(Array.isArray(r.data) ? r.data : []));
  }, []);
  return (
    <div className="pb-20">
      <SEO
        title="Komunitas Petualang & Event Outdoor"
        description="Gabung jaringan komunitas pendaki gunung, penggiat outdoor, pengurus basecamp, dan temukan teman trip di Trexio."
        keywords="komunitas pendaki, klub outdoor, teman trip, event naik gunung, trexio"
      />
      <div className="trx-container pt-10">
        <div className="trx-overline text-muted-foreground">Komunitas</div>
        <h1 className="mt-2 text-3xl md:text-5xl font-black tracking-tighter">
          Terhubung dengan sesama petualang
        </h1>
        <p className="mt-3 text-muted-foreground max-w-xl">
          Gabung komunitas, ikut event, dan berbagi cerita perjalananmu.
        </p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(Array.isArray(items) ? items : []).map((c) => (
            <Link
              key={c.id}
              to={`/community/${c.id}`}
              data-testid={`community-${c.slug}`}
              className="group block bg-white border border-border rounded-md overflow-hidden trx-card-hover"
              style={{ transition: "transform 0.25s ease" }}
            >
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={c.cover_image}
                  alt={c.name}
                  loading="lazy"
                  className="h-full w-full object-cover group-hover:scale-105"
                  style={{ transition: "transform 0.5s ease" }}
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 trx-overline text-muted-foreground">
                  <MapPin size={12} /> {c.region}
                </div>
                <div className="mt-2 text-xl font-bold">{c.name}</div>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {c.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Users size={14} /> {c.member_count?.toLocaleString("id-ID")} anggota
                  </div>
                  <div className="text-sm font-semibold text-[hsl(var(--secondary))] group-hover:underline inline-flex items-center gap-1">
                    Lihat <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
