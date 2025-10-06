const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const LRU = require('lru-cache');
const pLimit = require('p-limit');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS and compression
app.use(cors());
app.use(express.json());
app.use(compression());

// Simple in-memory cache for metadata
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Image cache and rendering queue
const resultCache = new LRU({ max: 500, ttl: 1000 * 60 * 10 }); // 10 minutes
const inflight = new Map();
const limit = pLimit(4); // max 4 renders at once

// Request queue to prevent overwhelming the RPC
const requestQueue = new Map();
const MAX_CONCURRENT = 3; // Only 3 concurrent blockchain calls
let activeRequests = 0;

// Traits directory (adjust path for your deployment)
const TRAITS_DIR = path.resolve(__dirname, '../apps/web/public/traits');

// Base Sepolia RPC
const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');

// Contract addresses
const RACCOON_RENDERER = "0x5c83B09AAb6ac95F1DFc9B6CEE66418D1D94d0fF";

// RaccoonRenderer ABI (just the tokenURI function)
const RENDERER_ABI = [
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  }
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    contracts: {
      renderer: RACCOON_RENDERER
    }
  });
});

// Helper function to wait in queue
async function waitForSlot(key) {
  while (activeRequests >= MAX_CONCURRENT) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  activeRequests++;
  console.log(`⚡ Active requests: ${activeRequests}/${MAX_CONCURRENT}`);
}

function releaseSlot() {
  activeRequests--;
  console.log(`⚡ Active requests: ${activeRequests}/${MAX_CONCURRENT}`);
}

// Main metadata endpoint
app.get('/raccoon/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { cosmetics, chain } = req.query;

    console.log(`📍 Request for raccoon ${tokenId} with cosmetics=${cosmetics}, chain=${chain}`);

    // Validate inputs
    if (!tokenId || isNaN(tokenId)) {
      return res.status(400).json({ error: 'Invalid token ID' });
    }

    if (!cosmetics || !ethers.isAddress(cosmetics)) {
      return res.status(400).json({ error: 'Invalid cosmetics address' });
    }

    if (chain && chain !== '84532') {
      return res.status(400).json({ error: 'Only Base Sepolia (84532) supported' });
    }

    // Create cache key
    const cacheKey = `${tokenId}-${cosmetics}-${chain || '84532'}`;

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log(`💾 Cache hit for ${cacheKey}`);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached.data);
    }

    // Wait for an available slot
    await waitForSlot(cacheKey);

    try {
      // Call the RaccoonRenderer contract
      const renderer = new ethers.Contract(RACCOON_RENDERER, RENDERER_ABI, provider);

      console.log(`🔍 Calling renderer.tokenURI(${tokenId})`);
      const startTime = Date.now();

      const tokenURI = await renderer.tokenURI(tokenId);
      const duration = Date.now() - startTime;
      console.log(`✅ Got tokenURI in ${duration}ms:`, tokenURI.substring(0, 100) + '...');

      // If it's a data URI, parse and return the JSON directly
      if (tokenURI.startsWith('data:application/json;base64,')) {
        const base64Data = tokenURI.split(',')[1];
        const jsonData = Buffer.from(base64Data, 'base64').toString();
        const metadata = JSON.parse(jsonData);

        // Add some API metadata
        metadata._generated = {
          timestamp: new Date().toISOString(),
          renderer: RACCOON_RENDERER,
          tokenId: tokenId,
          cosmetics: cosmetics,
          chain: chain || '84532'
        };

        // Cache the result
        cache.set(cacheKey, { data: metadata, timestamp: Date.now() });
        console.log(`💾 Cached ${cacheKey}`);

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, max-age=300');
        res.setHeader('X-Cache', 'MISS');
        return res.json(metadata);
      }

      // If it's a regular URL, proxy it
      res.redirect(tokenURI);

    } finally {
      releaseSlot();
    }

  } catch (error) {
    console.error('❌ Error generating metadata:', error);
    releaseSlot();

    // Return error response
    res.status(500).json({
      error: 'Failed to generate metadata',
      message: error.message,
      tokenId: req.params.tokenId,
      timestamp: new Date().toISOString()
    });
  }
});

// Utility: stable version hash for caching
function versionFor({ id, head = 0, face = 0, body = 0, fur = 0, background = 0 }) {
  const payload = `${id}|h=${head}|f=${face}|b=${body}|u=${fur}|bg=${background}`;
  return crypto.createHash('sha1').update(payload).digest('hex');
}

// Build list of layer files (back to front)
function layerFiles({ head = 0, face = 0, body = 0, fur = 0, background = 0 }) {
  return [
    path.join(TRAITS_DIR, 'background', `${background}.png`),
    path.join(TRAITS_DIR, 'fur', `${fur}.png`),
    path.join(TRAITS_DIR, 'body', `${body}.png`),
    path.join(TRAITS_DIR, 'face', `${face}.png`),
    path.join(TRAITS_DIR, 'head', `${head}.png`),
  ];
}

// Composite PNG layers with sharp
async function renderPNG({ files, size = 1000 }) {
  const inputs = await Promise.all(files.map(async (f) =>
    sharp(f).resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }).toBuffer()
  ));

  const img = sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  });

  return img
    .composite(inputs.map(buf => ({ input: buf, left: 0, top: 0 })))
    .png({ compressionLevel: 9, effort: 7, adaptiveFiltering: true })
    .toBuffer();
}

// Single-flight wrapper to coalesce concurrent requests
async function singleFlight(key, fn) {
  if (resultCache.has(key)) return resultCache.get(key);
  if (inflight.has(key)) return inflight.get(key);

  const p = limit(async () => {
    try {
      const val = await fn();
      resultCache.set(key, val);
      return val;
    } finally {
      inflight.delete(key);
    }
  });
  inflight.set(key, p);
  return p;
}

// Image rendering endpoint - composites layers from query params
app.get('/render/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const head = Number(req.query.head ?? 0);
    const face = Number(req.query.face ?? 0);
    const body = Number(req.query.body ?? 0);
    const fur = Number(req.query.fur ?? 0);
    const background = Number(req.query.background ?? 0);

    console.log(`🖼️ Render request for token ${id}: head=${head}, face=${face}, body=${body}, fur=${fur}, bg=${background}`);

    // Stable version for caching
    const v = versionFor({ id, head, face, body, fur, background });
    const cacheKey = `png:${id}:${v}`;

    // Conditional GET: 304 if unchanged
    if (req.headers['if-none-match'] === v && resultCache.has(cacheKey)) {
      console.log(`💾 304 Not Modified for ${cacheKey}`);
      res.status(304).end();
      return;
    }

    // Prepare layer file paths
    const files = layerFiles({ head, face, body, fur, background });

    // Coalesce concurrent requests for same version
    const png = await singleFlight(cacheKey, async () => {
      console.log(`🎨 Rendering ${cacheKey}...`);
      return renderPNG({ files, size: 1000 });
    });

    console.log(`✅ Rendered ${cacheKey} (${png.length} bytes)`);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('ETag', v);
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=86400, stale-while-revalidate=60');
    res.send(png);
  } catch (err) {
    console.error('❌ Render error:', err);
    // Return tiny transparent PNG on error
    const empty = await sharp({
      create: { width: 1, height: 1, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    }).png().toBuffer();
    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(empty);
  }
});

// Fallback for static raccoon metadata (no cosmetics)
app.get('/static/:tokenId', (req, res) => {
  const { tokenId } = req.params;

  // Redirect to IPFS for static metadata
  const ipfsUrl = `https://bafybeihn54iawusfxzqzkxzdcidkgejom22uhwpquqrdl5frmnwhilqi4m.ipfs.dweb.link/${tokenId}.json`;
  res.redirect(ipfsUrl);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Raccoon Metadata API running on port ${PORT}`);
  console.log(`📍 Renderer contract: ${RACCOON_RENDERER}`);
  console.log(`🔗 Base Sepolia RPC: https://sepolia.base.org`);
  console.log(`\n📋 Endpoints:`);
  console.log(`   GET /health - Health check`);
  console.log(`   GET /raccoon/:tokenId?cosmetics=0x...&chain=84532 - Dynamic metadata`);
  console.log(`   GET /static/:tokenId - Static IPFS metadata`);
});

module.exports = app;