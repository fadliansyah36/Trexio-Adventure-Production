import { api } from "@/lib/api";

function listPayload(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.items) ? data.items : [];
}

export const marketplaceService = {
  async listTrips(params = {}) {
    const res = await api.get("/trips", { params });
    return listPayload(res.data);
  },
  async createTrip(payload) {
    const res = await api.post("/admin/trips", payload);
    return res.data;
  },
  async updateTrip(id, payload) {
    const res = await api.put(`/admin/trips/${encodeURIComponent(id)}`, payload);
    return res.data;
  },
  async deleteTrip(id) {
    const res = await api.delete(`/admin/trips/${encodeURIComponent(id)}`);
    return res.data;
  },
};

export default marketplaceService;