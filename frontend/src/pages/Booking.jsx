import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, formatRupiah } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  CalendarBlank,
  MapPin,
  User,
  Users,
  Ticket,
} from "@phosphor-icons/react";

export default function Booking() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [trip, setTrip] = useState(null);
  const [step, setStep] = useState(1); // 1: date+qty, 2: data, 3: review
  const [selectedDate, setSelectedDate] = useState("");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [qty, setQty] = useState(1);
  const [contact, setContact] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [participants, setParticipants] = useState([
    { name: "", gender: "male", age: 25 },
  ]);
  const [notes, setNotes] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    api.get(`/trips/${id}`).then((r) => {
      setTrip(r.data);
      const rawDates = (Array.isArray(r.data.available_dates) && r.data.available_dates.length > 0)
        ? r.data.available_dates
        : (Array.isArray(r.data.departure_dates)
        ? r.data.departure_dates
        : typeof r.data.departure_dates === "string"
        ? r.data.departure_dates.split(",").map((s) => s.trim()).filter(Boolean)
        : []);
      const firstDateObj = rawDates[0];
      const firstDateStr = typeof firstDateObj === "object" ? (firstDateObj?.date || "") : String(firstDateObj || "");
      setSelectedDate(firstDateStr);
      const rawPoints = Array.isArray(r.data.meeting_points)
        ? r.data.meeting_points
        : typeof r.data.meeting_points === "string"
        ? r.data.meeting_points.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const points = rawPoints.length > 0 ? rawPoints : ["Pos / Basecamp Resmi", "Hotel / Stasiun / Bandara (Pick-up Kustom)"];
      setMeetingPoint(points[0] || "Pos / Basecamp Resmi");
    }).catch(() => {
      // Fallback check if id belongs to outdoor rental gear
      api.get(`/rentals/${id}`).then(() => {
        nav(`/rental/${id}`, { replace: true });
      }).catch(() => {
        toast.error("Paket atau peralatan outdoor tidak ditemukan.");
        nav("/explore");
      });
    });
  }, [id]);

  useEffect(() => {
    setParticipants((prev) => {
      const next = [...prev];
      while (next.length < qty)
        next.push({ name: "", gender: "male", age: 25 });
      while (next.length > qty) next.pop();
      return next;
    });
  }, [qty]);

  if (!trip) return <div className="trx-container py-20">Memuat...</div>;

  const maxCap = trip.max_participants || trip.stock || 20;
  const booked = trip.booked_seats || 0;
  const remaining = Math.max(1, maxCap - booked);
  const subtotal = trip.price * qty;

  function updateParticipant(i, field, value) {
    setParticipants((p) =>
      p.map((x, idx) => (idx === i ? { ...x, [field]: value } : x)),
    );
  }

  function nextStep() {
    if (step === 1) {
      if (!selectedDate) return toast.error("Pilih tanggal keberangkatan");
      if (!meetingPoint) return toast.error("Pilih meeting point");
      if (qty < 1 || qty > remaining)
        return toast.error(`Jumlah peserta 1-${remaining}`);
    }
    if (step === 2) {
      if (!contact.name || !contact.email || !contact.phone)
        return toast.error("Lengkapi data pemesan");
      for (let i = 0; i < participants.length; i++) {
        if (!participants[i].name || !participants[i].age)
          return toast.error(`Lengkapi data peserta ${i + 1}`);
      }
    }
    setStep(step + 1);
  }

  function goCheckout() {
    setShowConfirmModal(true);
  }

  function confirmAndGoCheckout() {
    const payload = {
      trip_id: trip.id,
      category: trip.category || "private-trip",
      price_unit: trip.price_unit || "orang",
      price: trip.price || 0,
      quantity: qty,
      departure_date: selectedDate,
      meeting_point: meetingPoint,
      participants: participants.map((p) => ({
        name: p.name,
        gender: p.gender,
        age: Number(p.age),
      })),
      contact_name: contact.name,
      contact_email: contact.email,
      contact_phone: contact.phone,
      special_notes: notes,
    };
    sessionStorage.setItem("trexio_pending_booking", JSON.stringify(payload));
    sessionStorage.setItem("trexio_pending_trip", JSON.stringify(trip));
    setShowConfirmModal(false);
    nav("/checkout");
  }

  const steps = [
    { n: 1, label: "Tanggal & Peserta" },
    { n: 2, label: "Data Pemesan" },
    { n: 3, label: "Review" },
  ];

  return (
    <div className="pb-20">
      <div className="trx-container pt-8">
        <Link
          to={`/trip/${trip.id}`}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ArrowLeft size={14} /> Kembali ke detail
        </Link>
        <h1 className="mt-4 text-3xl md:text-4xl font-black tracking-tighter">
          Pesan trip
        </h1>
        <p className="mt-1 text-muted-foreground">{trip.title}</p>

        {/* Stepper */}
        <div className="mt-8 flex items-center gap-3">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center gap-3">
              <div
                className={`grid place-items-center h-8 w-8 rounded-full text-xs font-bold ${
                  step >= s.n
                    ? "bg-[hsl(var(--secondary))] text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s.n}
              </div>
              <span
                className={`text-sm font-medium ${step >= s.n ? "text-foreground" : "text-muted-foreground"}`}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className="h-px w-8 bg-border" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
          <div className="space-y-6">
            {step === 1 && (
              <div className="bg-white border border-border rounded-md p-6 md:p-8 space-y-6">
                <div>
                  <Label className="trx-overline text-muted-foreground">
                    Pilih Slot / Batch Tanggal Keberangkatan
                  </Label>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {(Array.isArray(trip.available_dates) && trip.available_dates.length > 0
                      ? trip.available_dates
                      : Array.isArray(trip.departure_dates)
                      ? trip.departure_dates
                      : typeof trip.departure_dates === "string"
                      ? trip.departure_dates.split(",").map((s) => s.trim()).filter(Boolean)
                      : []
                    ).map((d, idx) => {
                      const dateVal = typeof d === "object" ? (d.date || "") : String(d);
                      const label = typeof d === "object" && d.label ? d.label : `Batch ${idx + 1}`;
                      const isFull = typeof d === "object" && d.status === "full";
                      const seats = typeof d === "object" && d.seats_left !== undefined ? d.seats_left : null;
                      const isSelected = selectedDate === dateVal;

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isFull}
                          data-testid={`date-${dateVal}`}
                          onClick={() => setSelectedDate(dateVal)}
                          className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs"
                              : isFull
                              ? "bg-slate-100 dark:bg-slate-900 border-border text-muted-foreground opacity-50 cursor-not-allowed"
                              : "border-border bg-card hover:border-emerald-500 hover:bg-emerald-500/5 text-foreground"
                          }`}
                        >
                          <div className="font-extrabold text-xs truncate">
                            {label}
                          </div>
                          <div className="text-[11px] opacity-90 mt-1 flex items-center justify-between">
                            <span>📅 {dateVal}</span>
                            {isFull ? (
                              <span className="text-red-500 font-extrabold text-[10px]">FULL</span>
                            ) : seats !== null ? (
                              <span className="font-semibold text-[10px]">{seats} seat</span>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label className="trx-overline text-muted-foreground">
                    Meeting Point
                  </Label>
                  <Select value={meetingPoint} onValueChange={setMeetingPoint}>
                    <SelectTrigger
                      data-testid="meeting-select"
                      className="mt-2"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(trip.meeting_points) && trip.meeting_points.length > 0
                        ? trip.meeting_points
                        : typeof trip.meeting_points === "string" && trip.meeting_points.trim().length > 0
                        ? trip.meeting_points.split(",").map((s) => s.trim()).filter(Boolean)
                        : ["Pos / Basecamp Resmi", "Hotel / Stasiun / Bandara (Pick-up Kustom)"]
                      ).map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="trx-overline text-muted-foreground">
                    Jumlah Peserta
                  </Label>
                  <div className="mt-2 inline-flex items-center gap-3 border border-border rounded-md p-1">
                    <button
                      data-testid="qty-minus"
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="grid place-items-center h-9 w-9 hover:bg-muted rounded-sm"
                    >
                      <Minus size={16} />
                    </button>
                    <span
                      data-testid="qty-value"
                      className="w-8 text-center font-bold"
                    >
                      {qty}
                    </span>
                    <button
                      data-testid="qty-plus"
                      onClick={() => setQty(Math.min(remaining, qty + 1))}
                      className="grid place-items-center h-9 w-9 hover:bg-muted rounded-sm"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Sisa {remaining} seat
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="bg-white border border-border rounded-md p-6 md:p-8">
                  <h3 className="font-bold">Data Pemesan</h3>
                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nama lengkap</Label>
                      <Input
                        data-testid="contact-name"
                        value={contact.name}
                        onChange={(e) =>
                          setContact({ ...contact, name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        data-testid="contact-email"
                        type="email"
                        value={contact.email}
                        onChange={(e) =>
                          setContact({ ...contact, email: e.target.value })
                        }
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Nomor HP / WhatsApp</Label>
                      <Input
                        data-testid="contact-phone"
                        value={contact.phone}
                        onChange={(e) =>
                          setContact({ ...contact, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {participants.map((p, i) => (
                  <div
                    key={i}
                    className="bg-white border border-border rounded-md p-6 md:p-8"
                  >
                    <h3 className="font-bold">Peserta {i + 1}</h3>
                    <div className="mt-4 grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Nama Lengkap Peserta</Label>
                        <Input
                          data-testid={`p-${i}-name`}
                          value={p.name}
                          onChange={(e) =>
                            updateParticipant(i, "name", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Jenis kelamin</Label>
                        <Select
                          value={p.gender}
                          onValueChange={(v) =>
                            updateParticipant(i, "gender", v)
                          }
                        >
                          <SelectTrigger data-testid={`p-${i}-gender`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Laki-laki</SelectItem>
                            <SelectItem value="female">Perempuan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Usia (Tahun)</Label>
                        <Input
                          data-testid={`p-${i}-age`}
                          type="number"
                          value={p.age}
                          onChange={(e) =>
                            updateParticipant(i, "age", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="bg-white border border-border rounded-md p-6 md:p-8">
                  <Label>Catatan khusus (opsional)</Label>
                  <Textarea
                    data-testid="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-2"
                    rows={3}
                    placeholder="Alergi makanan, kebutuhan khusus, dsb."
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white border border-border rounded-md p-6 md:p-8 space-y-4">
                <h3 className="font-bold text-lg">Review pesanan</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="trx-overline text-muted-foreground">
                      Trip
                    </div>
                    <div>{trip.title}</div>
                  </div>
                  <div>
                    <div className="trx-overline text-muted-foreground">
                      Tanggal
                    </div>
                    <div>
                      {new Date(selectedDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="trx-overline text-muted-foreground">
                      Meeting Point
                    </div>
                    <div>{meetingPoint}</div>
                  </div>
                  <div>
                    <div className="trx-overline text-muted-foreground">
                      Peserta
                    </div>
                    <div>{qty} orang</div>
                  </div>
                  <div>
                    <div className="trx-overline text-muted-foreground">
                      Pemesan
                    </div>
                    <div>
                      {contact.name} — {contact.email}
                    </div>
                  </div>
                </div>
                <div className="border-t border-border pt-4 text-sm">
                  <div className="trx-overline text-muted-foreground mb-1">
                    Peserta terdaftar
                  </div>
                  <ol className="list-decimal pl-5 space-y-1">
                    {participants.map((p, i) => (
                      <li key={i}>
                        {p.name} — {p.gender === "male" ? "L" : "P"},{" "}
                        {p.age} th
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                data-testid="prev-step"
                className="rounded-md"
              >
                <ArrowLeft size={14} className="mr-1" /> Sebelumnya
              </Button>
              {step < 3 ? (
                <Button
                  data-testid="next-step"
                  onClick={nextStep}
                  className="rounded-md bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/90 text-white"
                >
                  Lanjut <ArrowRight size={14} className="ml-1" />
                </Button>
              ) : (
                <Button
                  data-testid="go-checkout"
                  onClick={goCheckout}
                  className="rounded-md bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white"
                >
                  Lanjut ke Checkout <ArrowRight size={14} className="ml-1" />
                </Button>
              )}
            </div>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white border border-border rounded-md p-6">
              <div className="flex gap-3">
                <img
                  src={trip.cover_image}
                  className="h-16 w-20 object-cover rounded-sm"
                  alt={trip.title || "Foto Trip"}
                />
                <div className="text-sm">
                  <div className="font-bold line-clamp-2">{trip.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {trip.destination}
                  </div>
                </div>
              </div>
              <div className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Harga/orang</span>
                  <span>{formatRupiah(trip.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Peserta</span>
                  <span>{qty}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-bold">
                  <span>Subtotal</span>
                  <span
                    data-testid="booking-subtotal"
                    className="text-[hsl(var(--secondary))]"
                  >
                    {formatRupiah(subtotal)}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-6 bg-card border-border rounded-2xl shadow-xl">
          <DialogHeader className="space-y-1.5 text-left pb-3 border-b border-border">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold w-fit border border-emerald-500/20">
              <ShieldCheck size={16} weight="fill" /> Konfirmasi Detail Pemesanan
            </div>
            <DialogTitle className="text-xl font-black text-foreground">
              Tinjau Kembali Order Anda
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Pastikan seluruh jadwal, kontak pemesan, dan data peserta sudah benar sebelum berpindah ke halaman checkout & pembayaran.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Trip Card */}
            <div className="bg-muted/50 border border-border rounded-xl p-3.5 flex gap-3 items-center">
              <img
                src={trip.cover_image}
                alt={trip.title}
                className="w-16 h-16 object-cover rounded-lg shrink-0 border border-border"
              />
              <div className="space-y-1 min-w-0">
                <h4 className="font-bold text-sm text-foreground line-clamp-1">{trip.title}</h4>
                <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                  <MapPin size={14} className="text-emerald-500 shrink-0" />
                  <span className="truncate">{trip.destination} ({meetingPoint})</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
                  <CalendarBlank size={14} className="text-blue-500 shrink-0" />
                  <span>
                    {new Date(selectedDate).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Pemesan & Peserta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-background border border-border rounded-xl p-3 space-y-1.5">
                <div className="font-bold text-foreground flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <User size={15} weight="bold" /> Kontak Utama Pemesan
                </div>
                <div className="font-semibold text-foreground">{contact.name}</div>
                <div className="text-[11px] text-muted-foreground">{contact.email}</div>
                <div className="text-[11px] text-muted-foreground font-mono">{contact.phone}</div>
              </div>

              <div className="bg-background border border-border rounded-xl p-3 space-y-1.5">
                <div className="font-bold text-foreground flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <Users size={15} weight="bold" /> Peserta Terdaftar
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-[10px] font-bold">
                    {qty} Orang
                  </span>
                </div>
                <ul className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {participants.map((p, idx) => (
                    <li key={idx} className="text-[11px] text-muted-foreground flex items-center justify-between">
                      <span className="font-medium text-foreground truncate">{idx + 1}. {p.name || `Peserta ${idx + 1}`}</span>
                      <span className="shrink-0 text-[10px] font-mono">({p.gender === "male" ? "L" : "P"}, {p.age} th)</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Subtotal */}
            <div className="bg-background border border-border rounded-xl p-3.5 space-y-2">
              <div className="font-bold text-xs text-foreground pb-1.5 border-b border-border flex items-center justify-between">
                <span>Rincian Biaya</span>
                <Ticket size={16} className="text-amber-500" />
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Harga Paket ({qty} peserta × {formatRupiah(trip.price)})</span>
                <span className="font-bold text-foreground">{formatRupiah(subtotal)}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              className="w-full sm:w-auto text-xs font-semibold rounded-xl"
            >
              Ubah Data Form
            </Button>
            <Button
              type="button"
              data-testid="confirm-go-checkout-btn"
              onClick={confirmAndGoCheckout}
              className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
            >
              Lanjut ke Checkout & Pembayaran <ArrowRight size={16} weight="bold" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
