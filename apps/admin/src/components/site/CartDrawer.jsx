import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/api";
import {
  getStoredCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} from "@/lib/cartStorage";
import {
  ShoppingCart,
  Trash,
  Plus,
  Minus,
  ArrowRight,
  Compass,
  Tent,
  CalendarBlank,
  ShieldCheck,
} from "@phosphor-icons/react";
import { toast } from "sonner";

export default function CartDrawer({ open, onOpenChange }) {
  const navigate = useNavigate();
  const [items, setItems] = useState(() => getStoredCart());

  useEffect(() => {
    const handleCartUpdated = (e) => {
      const updated = e.detail || getStoredCart();
      if (Array.isArray(updated)) {
        setItems(updated);
      }
    };

    window.addEventListener("cart-updated", handleCartUpdated);
    return () => window.removeEventListener("cart-updated", handleCartUpdated);
  }, []);

  useEffect(() => {
    if (open) {
      setItems(getStoredCart());
    }
  }, [open]);

  const handleQtyChange = async (cartId, newQty) => {
    if (newQty < 1) return;
    try {
      const updated = await updateCartItemQuantity(cartId, newQty);
      setItems(updated);
    } catch (err) {
      toast.error("Gagal memperbarui jumlah");
    }
  };

  const handleRemove = async (cartId, title) => {
    try {
      const updated = await removeCartItem(cartId);
      setItems(updated);
      toast.success(`"${title || 'Item'}" dihapus dari keranjang`);
    } catch (err) {
      toast.error("Gagal menghapus item");
    }
  };

  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  const handleGoToCart = () => {
    onOpenChange(false);
    navigate("/cart");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col justify-between border-l border-border bg-background shadow-2xl transition-transform duration-300 ease-out"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-border/80 bg-card/50 flex items-center justify-between shrink-0">
          <SheetHeader className="text-left space-y-0.5">
            <SheetTitle className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
              <ShoppingCart size={22} className="text-emerald-600" />
              Keranjang Pendaki
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              {items.length} item tersimpan dalam sesi Anda
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* Drawer Body - Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-3 border border-emerald-500/20">
                <ShoppingCart size={32} weight="duotone" />
              </div>
              <h3 className="font-bold text-base text-foreground">Keranjang Kosong</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                Belum ada ekspedisi atau alat gunung yang kamu pilih. Ayo jelajahi pilihan pendakian terbaik!
              </p>
              <div className="mt-6 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/explore");
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-1.5"
                >
                  <Compass size={16} /> Explore Trip
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/rental");
                  }}
                  className="border-emerald-600/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-xl gap-1.5"
                >
                  <Tent size={16} /> Sewa Alat
                </Button>
              </div>
            </div>
          ) : (
            items.map((item) => {
              const isTrip = item.item_type === "trip" || item.item_type === "open_trip";
              return (
                <div
                  key={item.id}
                  className="group relative bg-card border border-border/80 rounded-2xl p-3.5 flex gap-3.5 items-center transition-all hover:border-emerald-500/40 hover:shadow-sm"
                >
                  {/* Thumbnail Image */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0 border border-border/40 relative">
                    <img
                      src={item.cover_image || "/logo.png"}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span
                      className={`absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                        isTrip ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
                      }`}
                    >
                      {isTrip ? "Trip" : "Rental"}
                    </span>
                  </div>

                  {/* Title & Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-1 leading-snug">
                      {item.title}
                    </h4>

                    {item.departure_date && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <CalendarBlank size={12} className="text-emerald-600" />
                        <span>
                          {new Date(item.departure_date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    )}

                    <div className="font-black text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm">
                      {formatRupiah(item.price * item.quantity)}
                    </div>
                  </div>

                  {/* Quantity & Delete Actions */}
                  <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                    <button
                      type="button"
                      aria-label={`Hapus ${item.title}`}
                      onClick={() => handleRemove(item.id, item.title)}
                      className="text-muted-foreground hover:text-rose-600 p-1 rounded-md transition-colors"
                    >
                      <Trash size={15} />
                    </button>

                    <div className="flex items-center border border-border rounded-lg bg-background p-0.5 shadow-2xs">
                      <button
                        type="button"
                        aria-label="Kurangi"
                        onClick={() => handleQtyChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 rounded transition-colors"
                      >
                        <Minus size={11} weight="bold" />
                      </button>
                      <span className="w-5 text-center text-[11px] font-bold text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Tambah"
                        onClick={() => handleQtyChange(item.id, item.quantity + 1)}
                        className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground rounded transition-colors"
                      >
                        <Plus size={11} weight="bold" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer / Checkout CTA */}
        {items.length > 0 && (
          <div className="p-5 border-t border-border/80 bg-card/60 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Subtotal ({items.length} item)
              </span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {formatRupiah(subtotal)}
              </span>
            </div>

            <Button
              onClick={handleGoToCart}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs gap-2 shadow-md shadow-emerald-600/20 trx-btn-press"
            >
              Lihat Keranjang & Checkout <ArrowRight size={16} weight="bold" />
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground font-medium">
              <ShieldCheck size={14} className="text-emerald-600" />
              Aman & Bebas Biaya Penanganan Tambahan
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
