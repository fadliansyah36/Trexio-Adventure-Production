/**
 * Backpacker route module.
 * Uses the runtime's trip read model and authorization middleware.
 */
function registerBackpackerRoutes({ api, requireAuth, trips }) {
  api.get(['/backpacker/routes', '/backpacker/routes/search'], requireAuth, (req, res) => {
    const routes = trips.filter(t => t.category === 'open-trip' || t.category === 'private-trip' || t.category === 'hiking').map(t => ({
      id: t.id,
      title: t.title,
      destination: t.destination || t.location,
      difficulty: t.difficulty || 'Medium',
      duration: t.duration || '2D1N',
      price: t.price || 0,
      cover_image: t.cover_image
    }));
    res.json(routes);
  });
}

module.exports = { registerBackpackerRoutes };
