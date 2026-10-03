import { api } from "@/lib/api";

function listPayload(data) {
  if (Array.isArray(data)) return { items: data, total: data.length, page: 1, limit: data.length };
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    total: Number.isFinite(Number(data?.total)) ? Number(data.total) : 0,
    page: Number(data?.page || 1),
    limit: Number(data?.limit || 50),
  };
}

export const marketplaceService = {
  async listTrips(params = {}) {
    const res = await api.get("/trips", { params });
    return listPayload(res.data);
  },
  async listFeatured(limit = 6) {
    const res = await api.get("/trips/featured", { params: { limit } });
    return Array.isArray(res.data) ? res.data : Array.isArray(res.data?.items) ? res.data.items : [];
  },
  async getTrip(id) {
    const res = await api.get(`/trips/${encodeURIComponent(id)}`);
    return res.data;
  },
  async listCategory(slug, params = {}) {
    const res = await api.get(`/categories/${encodeURIComponent(slug)}`, { params });
    return { ...res.data, items: Array.isArray(res.data?.items) ? res.data.items : [] };
  },
};

export default marketplaceService;