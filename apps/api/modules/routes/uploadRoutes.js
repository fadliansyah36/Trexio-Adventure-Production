/**
 * Upload route module.
 * Route dependencies are injected by the API runtime to keep this module
 * independent from global server state.
 */
function registerUploadRoutes({ api, requireAuth, upload }) {
  // --- File Upload API Endpoint ---
api.post('/upload', requireAuth, upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ detail: 'File foto tidak ditemukan atau tidak diunggah' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      ok: true,
      url: fileUrl,
      filename: req.file.filename,
      original_name: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  });
  
api.post('/upload/avatar', requireAuth, upload.single('avatar'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ detail: 'File foto profil tidak ditemukan' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      ok: true,
      url: fileUrl,
      filename: req.file.filename,
    });
  });
  
}

module.exports = { registerUploadRoutes };
