import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api, formatApiError, safeArray } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Heart, Plus, MapPin, CalendarBlank, Check } from "@phosphor-icons/react";

export default function CommunityDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [community, setCommunity] = useState(null);
  const [joined, setJoined] = useState(false);
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [postText, setPostText] = useState("");
  const [postImage, setPostImage] = useState("");
  const [showPost, setShowPost] = useState(false);
  const [showEvent, setShowEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    cover_image: "",
  });

  const load = useCallback(async () => {
    const c = await api.get(`/communities/${id}`);
    setCommunity(c.data);
    const p = await api.get(`/communities/${id}/posts`);
    setPosts(Array.isArray(p.data) ? p.data : []);
    const e = await api.get(`/communities/${id}/events`);
    setEvents(Array.isArray(e.data) ? e.data : []);
    if (user) {
      try {
        const m = await api.get(`/communities/${id}/membership`);
        setJoined(m.data.joined);
      } catch {}
    }
  }, [id, user]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleJoin() {
    if (!user) return nav(`/login?next=/community/${id}`);
    try {
      if (joined) {
        await api.delete(`/communities/${id}/leave`);
        toast.info("Kamu meninggalkan komunitas");
      } else {
        await api.post(`/communities/${id}/join`);
        toast.success("Selamat datang di komunitas!");
      }
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  }

  async function submitPost() {
    if (!postText.trim()) return toast.error("Post tidak boleh kosong");
    try {
      await api.post(`/communities/${id}/posts`, {
        content: postText,
        image: postImage,
      });
      toast.success("Post terkirim");
      setPostText("");
      setPostImage("");
      setShowPost(false);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  }

  async function likePost(pid) {
    if (!user) return nav(`/login?next=/community/${id}`);
    try {
      await api.post(`/community-posts/${pid}/like`);
      load();
    } catch {}
  }

  async function submitEvent() {
    if (!newEvent.title || !newEvent.date || !newEvent.location)
      return toast.error("Lengkapi data event");
    try {
      await api.post(`/communities/${id}/events`, newEvent);
      toast.success("Event dibuat");
      setNewEvent({ title: "", description: "", date: "", location: "", cover_image: "" });
      setShowEvent(false);
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  }

  async function rsvp(eid) {
    if (!user) return nav(`/login?next=/community/${id}`);
    try {
      const r = await api.post(`/community-events/${eid}/rsvp`);
      toast.success(r.data.attending ? "Kamu ikut event ini" : "RSVP dibatalkan");
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail));
    }
  }

  if (!community) return <div className="trx-container py-20">Memuat...</div>;

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="relative">
        <div className="h-64 md:h-80 overflow-hidden">
          <img src={community.cover_image} loading="lazy" className="h-full w-full object-cover" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        </div>
        <div className="trx-container -mt-24 relative">
          <div className="bg-white border border-border rounded-md p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
              <div>
                <div className="trx-overline text-muted-foreground">
                  <MapPin size={12} className="inline" /> {community.region}
                </div>
                <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tighter">
                  {community.name}
                </h1>
                <p className="mt-2 text-muted-foreground max-w-2xl">{community.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {safeArray(community.tags).map((t) => (
                    <span
                      key={t}
                      className="rounded-sm bg-[hsl(var(--muted))] text-[hsl(var(--secondary))] px-2 py-1 text-[10px] font-bold tracking-wide"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
                <div className="mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <Users size={14} /> {community.member_count?.toLocaleString("id-ID")} anggota
                </div>
              </div>
              <Button
                data-testid="community-join-btn"
                onClick={toggleJoin}
                className={
                  joined
                    ? "bg-white text-[hsl(var(--secondary))] border border-[hsl(var(--secondary))] hover:bg-muted"
                    : "bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white"
                }
              >
                {joined ? <><Check size={16} className="mr-1" /> Sudah Gabung</> : "Gabung Komunitas"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="trx-container mt-10">
        <Tabs defaultValue="feed">
          <TabsList className="bg-transparent border border-border rounded-md p-1">
            <TabsTrigger value="feed" data-testid="tab-feed">Feed ({posts.length})</TabsTrigger>
            <TabsTrigger value="events" data-testid="tab-events">Event ({events.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-6">
            {joined && (
              <div className="mb-6">
                <Dialog open={showPost} onOpenChange={setShowPost}>
                  <DialogTrigger asChild>
                    <Button data-testid="new-post-btn" className="bg-[hsl(var(--secondary))] text-white">
                      <Plus size={16} className="mr-1" /> Post Baru
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Buat post</DialogTitle>
                    </DialogHeader>
                    <Textarea
                      data-testid="post-content"
                      rows={4}
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      placeholder="Ceritakan pengalamanmu..."
                    />
                    <Input
                      data-testid="post-image"
                      value={postImage}
                      onChange={(e) => setPostImage(e.target.value)}
                      placeholder="URL gambar (opsional)"
                    />
                    <DialogFooter>
                      <Button data-testid="post-submit" onClick={submitPost} className="bg-[hsl(var(--primary))] text-white">
                        Publish
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {posts.length === 0 ? (
              <div className="border border-dashed border-border rounded-md p-10 text-center text-muted-foreground">
                Belum ada post. {joined ? "Jadilah yang pertama!" : "Gabung untuk mulai posting."}
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((p) => (
                  <div key={p.id} className="bg-white border border-border rounded-md p-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[hsl(var(--secondary))] text-white grid place-items-center font-bold">
                        {p.user_name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{p.user_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(p.created_at).toLocaleString("id-ID")}
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-sm whitespace-pre-wrap">{p.content}</p>
                    {p.image && (
                      <img src={p.image} loading="lazy" className="mt-3 rounded-md w-full max-h-96 object-cover" alt="" />
                    )}
                    <button
                      onClick={() => likePost(p.id)}
                      className={`mt-3 inline-flex items-center gap-1 text-sm ${
                        p.likes?.includes(user?.id)
                          ? "text-[hsl(var(--primary))]"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      data-testid={`like-${p.id}`}
                    >
                      <Heart size={16} weight={p.likes?.includes(user?.id) ? "fill" : "regular"} />
                      {p.likes?.length || 0}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            {joined && (
              <div className="mb-6">
                <Dialog open={showEvent} onOpenChange={setShowEvent}>
                  <DialogTrigger asChild>
                    <Button data-testid="new-event-btn" className="bg-[hsl(var(--secondary))] text-white">
                      <Plus size={16} className="mr-1" /> Event Baru
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Buat event</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label>Judul</Label>
                        <Input
                          data-testid="event-title"
                          value={newEvent.title}
                          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Deskripsi</Label>
                        <Textarea
                          rows={3}
                          value={newEvent.description}
                          onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Tanggal</Label>
                          <Input
                            data-testid="event-date"
                            type="date"
                            value={newEvent.date}
                            onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Lokasi</Label>
                          <Input
                            data-testid="event-location"
                            value={newEvent.location}
                            onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Cover Image URL (opsional)</Label>
                        <Input
                          value={newEvent.cover_image}
                          onChange={(e) => setNewEvent({ ...newEvent, cover_image: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button data-testid="event-submit" onClick={submitEvent} className="bg-[hsl(var(--primary))] text-white">
                        Buat Event
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {events.length === 0 ? (
              <div className="border border-dashed border-border rounded-md p-10 text-center text-muted-foreground">
                Belum ada event.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {events.map((e) => {
                  const attending = e.rsvps?.some((r) => r.user_id === user?.id);
                  return (
                    <div key={e.id} className="bg-white border border-border rounded-md overflow-hidden">
                      {e.cover_image && (
                        <img src={e.cover_image} loading="lazy" className="w-full h-40 object-cover" alt="" />
                      )}
                      <div className="p-5">
                        <div className="trx-overline text-muted-foreground inline-flex items-center gap-1">
                          <CalendarBlank size={12} />{" "}
                          {new Date(e.date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </div>
                        <div className="mt-1 font-bold">{e.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                          <MapPin size={12} /> {e.location}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                          {e.description}
                        </p>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            {e.rsvps?.length || 0} orang ikut
                          </div>
                          <Button
                            size="sm"
                            onClick={() => rsvp(e.id)}
                            data-testid={`rsvp-${e.id}`}
                            className={
                              attending
                                ? "bg-white border border-[hsl(var(--secondary))] text-[hsl(var(--secondary))]"
                                : "bg-[hsl(var(--primary))] text-white"
                            }
                          >
                            {attending ? "Batal RSVP" : "Ikut Event"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
