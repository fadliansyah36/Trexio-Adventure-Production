/**
 * Trexio Marketplace & Discovery route module.
 *
 * Mission 09C Phase 5C:
 * - owns public marketplace/catalog/discovery HTTP routes
 * - receives runtime state/services from the API composition root
 * - does not own persistence or database access
 * - preserves existing endpoint contracts and compatibility aliases
 */
function registerMarketplaceRoutes({
  api,
  app,
  trips,
  rentals,
  vendors,
  reviews,
  bookings,
  wishlists,
  destinations,
  category_items,
  enrichTripWithVendor,
  findProduct,
  aiSmartSearchService,
  authLimiter,
  marketplaceService,
}) {
api.get('/categories/:slug', (req, res) => {
  const slug = req.params.slug.toLowerCase();
  const baseItems = category_items[slug] || [];

  const matchedTrips = trips.filter(t => (t.category || 'open-trip').toLowerCase() === slug).map(t => {
    const enriched = enrichTripWithVendor(t);
    const specsList = Array.isArray(enriched.specs) && enriched.specs.length > 0
      ? enriched.specs
      : (Array.isArray(enriched.included) && enriched.included.length > 0 ? enriched.included.slice(0, 3) : []);

    return {
      id: enriched.id,
      title: enriched.title,
      category: enriched.category,
      provider: enriched.vendor_name,
      vendor_verified: enriched.vendor_verified,
      location: enriched.destination || enriched.mountain || 'Indonesia',
      price: enriched.price,
      price_unit: enriched.price_unit || (
        slug === 'rental-gear' ? 'hari' :
        slug === 'guide' || slug === 'porter' ? 'hari' :
        slug === 'homestay' || slug === 'camping-ground' || slug === 'basecamp' ? 'malam' :
        slug === 'shuttle' || slug === 'transportasi' ? 'trip' :
        slug === 'wisata-alam' || slug === 'event' ? 'tiket' : 'orang'
      ),
      rating: enriched.rating || 5.0,
      reviews_count: enriched.reviews_count || 12,
      badge: enriched.badge || (enriched.vendor_verified ? 'Partner Verifikasi' : 'Mitra Trexio'),
      image: enriched.cover_image || enriched.images?.[0] || 'https://images.unsplash.com/photo-1551632811-561732d1e306',
      description: enriched.description,
      specs: specsList,
      trip_id: enriched.id,
      vendor_id: enriched.vendor_id,
      unit_stock: enriched.unit_stock,
      condition: enriched.condition,
      pickup_point: enriched.pickup_point,
      vehicle_type: enriched.vehicle_type,
      license: enriched.license,
      available_dates: (enriched.available_dates && enriched.available_dates.length > 0) ? enriched.available_dates : (enriched.departure_dates || []),
      departure_dates: enriched.departure_dates || []
    };
  });

  const combined = [...matchedTrips, ...baseItems];
  res.json({
    slug,
    count: combined.length,
    items: combined
  });
});
api.get('/destinations', (req, res) => {
  res.json(destinations);
});

  api.get('/trips', async (req, res) => {
    try {
      const { q, category, region, difficulty, min_price, max_price, sort, limit, page, smart } = req.query;

      if (q || smart === 'true') {
        const dbStores = { trips, rentals, vendors, reviews, bookings, wishlists };
        const searchRes = await aiSmartSearchService.search({
          query: q || '',
          category,
          region,
          difficulty,
          min_price,
          max_price,
          sort,
          limit: limit ? Number(limit) : 50,
          page: page ? Number(page) : 1,
          user: req.user || null,
          dbStores,
        });
        return res.json(searchRes.results.map(enrichTripWithVendor));
      }

      const result = await marketplaceService.listTrips({
        q,
        category,
        region,
        difficulty,
        min_price,
        max_price,
        sort,
        limit,
        page,
      });

      const items = await Promise.all(result.items.map((trip) => marketplaceService.enrichTripWithVendor(trip)));
      res.json({ ...result, items });
    } catch (err) {
      console.error('[API /trips Error]', err.message);
      res.status(503).json({ success: false, error: 'Marketplace data service unavailable' });
    }
  });

  api.get('/trips/featured', async (req, res) => {
    try {
      const featured = await marketplaceService.listFeatured(6);
      const items = await Promise.all(featured.map((trip) => marketplaceService.enrichTripWithVendor(trip)));
      res.json(items);
    } catch (err) {
      console.error('[API /trips/featured Error]', err.message);
      res.status(503).json({ success: false, error: 'Marketplace data service unavailable' });
    }
  });

  api.get('/search/suggestions', async (req, res) => {
    try {
      const q = (req.query.q || '').trim();
      const suggestions = await aiSmartSearchService.searchMultiCategory({
        query: q,
        dbStores: { trips, rentals, vendors },
      });
      res.json(suggestions);
    } catch (err) {
      console.error('[API /search/suggestions Error]', err.message);
      res.json({
        query: req.query.q || '',
        trips: [],
        rentals: [],
        vendors: [],
        destinations: [],
        popular: ['Gunung Rinjani', 'Mt. Prau Dieng', 'Sailing Komodo', 'Sewa Tenda Dome'],
      });
    }
  });

  const handleSmartSearchPost = async (req, res) => {
    try {
      const dbStores = { trips, rentals, vendors, reviews, bookings, wishlists };
      const searchRes = await aiSmartSearchService.search({
        ...req.body,
        user: req.user || null,
        dbStores,
      });
      res.json(searchRes);
    } catch (err) {
      console.error('[API /search/smart Error]', err.message);
      res.status(500).json({ success: false, error: 'Terjadi kesalahan internal. Silakan coba lagi nanti.' });
    }
  };

  const handleSmartSearchGet = async (req, res) => {
    try {
      const dbStores = { trips, rentals, vendors, reviews, bookings, wishlists };
      const { q, category, region, difficulty, min_price, max_price, sort, limit, page } = req.query;
      const searchRes = await aiSmartSearchService.search({
        query: q || '',
        category,
        region,
        difficulty,
        min_price,
        max_price,
        sort,
        limit: limit ? Number(limit) : 50,
        page: page ? Number(page) : 1,
        user: req.user || null,
        dbStores,
      });
      res.json(searchRes);
    } catch (err) {
      console.error('[API GET /search/smart Error]', err.message);
      res.status(500).json({ success: false, error: 'Terjadi kesalahan internal. Silakan coba lagi nanti.' });
    }
  };

  const handleSearchDiscoveryPost = async (req, res) => {
    try {
      const rawQuery = req.body?.query || req.body?.prompt || req.body?.q;
      if (!rawQuery || typeof rawQuery !== 'string' || !rawQuery.trim()) {
        return res.status(400).json({ ok: false, error: 'Kueri pencarian AI Discovery wajib diisi.' });
      }

      const cleanQuery = rawQuery.trim().replace(/[\<\>]/g, '').slice(0, 500);
      if (cleanQuery.length < 2) {
        return res.status(400).json({ ok: false, error: 'Kueri pencarian minimal 2 karakter.' });
      }

      const dbStores = { trips, rentals, vendors, reviews, bookings, wishlists };
      const discoveryRes = await aiSmartSearchService.discoverTrips({
        userQuery: cleanQuery,
        user: req.user || null,
        dbStores,
      });
      res.json(discoveryRes);
    } catch (err) {
      console.error('[API /search/discovery Error]', err.message);
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan sistem saat memproses AI Trip Discovery.' });
    }
  };

  api.post('/search/smart', handleSmartSearchPost);
  api.get('/search/smart', handleSmartSearchGet);
  api.post('/search/discovery', authLimiter, handleSearchDiscoveryPost);

  // Compatibility aliases retained for existing direct /api callers.
  app.post('/api/search/smart', handleSmartSearchPost);
  app.get('/api/search/smart', handleSmartSearchGet);
  app.post('/api/search/discovery', authLimiter, handleSearchDiscoveryPost);
  app.post('/search/discovery', authLimiter, handleSearchDiscoveryPost);

  api.get('/trips/:trip_id', (req, res) => {
    const p = findProduct(req.params.trip_id);
    if (!p) return res.status(404).json({ detail: 'Trip atau Produk tidak ditemukan' });
    res.json(p);
  });
}

module.exports = registerMarketplaceRoutes;
