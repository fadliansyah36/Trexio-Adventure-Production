/**
 * Trexio Marketplace & Discovery route boundary.
 *
 * Phase 5C extracts public discovery/marketplace route registration from the
 * monolithic API runtime. Business state and services remain injected from the
 * API composition root; this module owns HTTP route wiring only.
 */
function registerMarketplaceDiscoveryRoutes(api, deps) {
  const {
    homepageConfig,
    aiSeoService,
    trips,
    rentals,
    enrichTripWithVendor,
    enrichRentalWithVendor,
    handleGetPublicStorefront,
    vendors,
    buildPublicVendorDTO,
    handleGetPublicReviews,
    advertising_packages,
    syncAdCampaignsStatus,
    advertising_campaigns,
  } = deps;

  api.get('/homepage-config', (req, res) => {
    res.json(homepageConfig);
  })

  api.get('/explore/articles', (req, res) => {
    try {
      const { category, status, q, limit, offset } = req.query;
      const result = aiSeoService.getArticles({
        category,
        status: req.user?.role === 'super_admin' ? status : 'published',
        q,
        limit: limit ? Number(limit) : 20,
        offset: offset ? Number(offset) : 0,
      });
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan internal. Silakan coba lagi nanti.' });
    }
  })

  api.get('/explore/articles/:slug', (req, res) => {
    try {
      const article = aiSeoService.getArticleBySlug(req.params.slug);
      if (!article) return res.status(404).json({ ok: false, detail: 'Artikel tidak ditemukan' });
  
      // Find related marketplace products (trips & rentals matching article destination)
      let relatedProducts = [];
      if (article.related_destination) {
        const destLower = article.related_destination.toLowerCase();
        const matchingTrips = trips.filter(t => t.published !== false && (
          (t.destination && t.destination.toLowerCase().includes(destLower)) ||
          (t.title && t.title.toLowerCase().includes(destLower))
        )).slice(0, 3).map(enrichTripWithVendor);
  
        const matchingRentals = (rentals || []).filter(r => r.available !== false && (
          (r.location && r.location.toLowerCase().includes(destLower)) ||
          (r.name && r.name.toLowerCase().includes(destLower))
        )).slice(0, 2);
  
        relatedProducts = [...matchingTrips, ...matchingRentals];
      }
  
      const metadata = aiSeoService.generateMetadata({ pageType: 'article', entity: article, req });
  
      res.json({ ok: true, article, related_products: relatedProducts, metadata });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan internal. Silakan coba lagi nanti.' });
    }
  })

  api.get('/explore/sources', (req, res) => {
    try {
      res.json({ ok: true, sources: aiSeoService.sources });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan internal. Silakan coba lagi nanti.' });
    }
  })

  api.get('/rentals', (req, res) => {
    let result = [...rentals];
    const { category, location } = req.query;
    if (category) result = result.filter(r => r.category === category);
    if (location) result = result.filter(r => r.pickup_locations && r.pickup_locations.includes(location));
    res.json(result);
  })

  api.get('/rentals/:rid', (req, res) => {
    const rental = rentals.find(r => r.id === req.params.rid || r.slug === req.params.rid);
    if (!rental) return res.status(404).json({ detail: 'Alat outdoor tidak ditemukan' });
    res.json(enrichRentalWithVendor(rental));
  })

  api.get('/storefront/:slug', handleGetPublicStorefront)

  api.get('/public/vendors/:identifier', handleGetPublicStorefront)

  api.get('/public/vendors/:identifier/products', (req, res) => {
    const identifier = (req.params.identifier || '').toLowerCase().replace(/^@/, '');
    const v = vendors.find(item => item.slug?.toLowerCase() === identifier || item.id === identifier);
    if (!v || v.status === 'rejected' || v.status === 'suspended') {
      return res.status(404).json({ detail: 'Vendor tidak ditemukan' });
    }
  
    const dto = buildPublicVendorDTO(v);
    let products = dto.products || [];
  
    const { q, category, type, sort } = req.query;
  
    if (q) {
      const qLower = q.toLowerCase();
      products = products.filter(p => 
        (p.title || '').toLowerCase().includes(qLower) ||
        (p.destination || '').toLowerCase().includes(qLower) ||
        (p.category || '').toLowerCase().includes(qLower)
      );
    }
  
    if (category && category !== 'all' && category !== 'Semua') {
      products = products.filter(p => (p.category || '').toLowerCase() === category.toLowerCase());
    }
  
    if (type && type !== 'all') {
      products = products.filter(p => p.product_type === type);
    }
  
    if (sort === 'price_low') {
      products.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sort === 'price_high') {
      products.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sort === 'rating') {
      products.sort((a, b) => (Number(b.rating) || 5) - (Number(a.rating) || 5));
    } else if (sort === 'newest') {
      products.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }
  
    res.json({
      total: products.length,
      products
    });
  })

  api.get('/public/vendors/:identifier/reviews', handleGetPublicReviews)

  api.get('/ads/packages', (req, res) => {
    res.json(advertising_packages.filter(p => p.is_active));
  })

  api.get('/ads/active-placements', (req, res) => {
    syncAdCampaignsStatus();
    const { placement } = req.query;
  
    const activeCamps = advertising_campaigns.filter(c => {
      if (c.campaign_status !== 'active') return false;
      if (placement && c.placement !== placement) return false;
      const now = new Date();
      if (c.start_date && new Date(c.start_date) > now) return false;
      if (c.end_date && new Date(c.end_date) < now) return false;
      return true;
    });
  
    const promotedItems = activeCamps.map(c => {
      let prod = null;
      if (c.product_type === 'trip') {
        prod = trips.find(t => t.id === c.product_id);
      } else {
        prod = rentals.find(r => r.id === c.product_id);
      }
      return {
        campaign_id: c.id,
        placement: c.placement,
        package_name: c.package_name,
        vendor_id: c.vendor_id,
        vendor_name: c.vendor_name,
        is_sponsored: true,
        product: prod || {
          id: c.product_id,
          title: c.product_title,
          cover_image: c.product_image,
          price: 0
        }
      };
    }).filter(item => item.product);
  
    res.json(promotedItems);
  })

  api.get('/ad-campaigns/active', (req, res) => {
    syncAdCampaignsStatus();
    const { placement } = req.query;
    const activeCamps = advertising_campaigns.filter(c => {
      if (c.campaign_status !== 'active') return false;
      if (placement && c.placement !== placement) return false;
      const now = new Date();
      if (c.start_date && new Date(c.start_date) > now) return false;
      if (c.end_date && new Date(c.end_date) < now) return false;
      return true;
    });
    res.json(activeCamps);
  })
}

module.exports = { registerMarketplaceDiscoveryRoutes };
