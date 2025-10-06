const express = require('express');
const cors = require('cors');
const { renderRaccoon, getEquipmentHash } = require('./renderer');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'raccoon-renderer'
  });
});

// Main render endpoint
app.get('/render/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    console.log(`\n🎨 Render request for token ${tokenId}`);

    // Parse equipped cosmetics from query
    // Format: ?head=1001&face=2005&body=3010&fur=4002&bg=5001
    const equipped = [
      Number(req.query.head || 0),
      Number(req.query.face || 0),
      Number(req.query.body || 0),
      Number(req.query.fur || 0),
      Number(req.query.background || req.query.bg || 0)
    ];

    console.log(`   Equipped: [${equipped.join(', ')}]`);

    // Generate cache key
    const equipHash = getEquipmentHash(equipped);
    const etag = `"${tokenId}-${equipHash}"`;

    // Check if client has cached version
    if (req.headers['if-none-match'] === etag) {
      console.log(`   💾 Cache hit - returning 304`);
      return res.status(304).end();
    }

    // Render the raccoon
    const result = await renderRaccoon(tokenId, equipped, { debug: false });

    // Set cache headers
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.setHeader('X-Render-Time', result.renderTime);

    res.send(result.buffer);

  } catch (error) {
    console.error('❌ Render error:', error);
    res.status(500).json({
      error: 'Failed to render raccoon',
      message: error.message,
      tokenId: req.params.tokenId
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Raccoon Renderer running on port ${PORT}`);
  console.log(`\n📋 Endpoints:`);
  console.log(`   GET /health - Health check`);
  console.log(`   GET /render/:tokenId?head=0&face=0&body=0&fur=0&background=0 - Render raccoon`);
});

module.exports = app;
