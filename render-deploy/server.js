require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const { LRUCache } = require('lru-cache');
const compression = require('compression');
const r2 = require('./r2-storage');
const { renderQueue } = require('./render-queue');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS and compression
app.use(cors());
app.use(express.json());
app.use(compression());

// Simple in-memory cache for metadata
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Image cache (legacy, kept for old /render endpoint fallback)
const resultCache = new LRUCache({ max: 500, ttl: 1000 * 60 * 10 }); // 10 minutes
const inflight = new Map();

// Request queue to prevent overwhelming the RPC
const requestQueue = new Map();
const MAX_CONCURRENT = 3; // Only 3 concurrent blockchain calls
let activeRequests = 0;

// R2 CDN URLs for traits/cosmetics
const COSMETICS_CDN = process.env.COSMETICS_CDN || 'https://rotandritual.work';
const BASE_TRAITS_PATH = 'traits';
const COSMETICS_PATH = 'current-cosmetics-r2';

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
    },
    r2: {
      enabled: !!process.env.R2_ACCOUNT_ID,
      bucket: process.env.R2_BUCKET_NAME,
      publicUrl: process.env.R2_PUBLIC_URL
    },
    queue: renderQueue.getStats()
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

// Map cosmetic ID ranges to slot names
function getSlotName(cosmeticId) {
  if (cosmeticId >= 1000 && cosmeticId < 2000) return 'head';
  if (cosmeticId >= 2000 && cosmeticId < 3000) return 'face';
  if (cosmeticId >= 3000 && cosmeticId < 4000) return 'body';
  if (cosmeticId >= 4000 && cosmeticId < 5000) return 'fur';
  if (cosmeticId >= 5000 && cosmeticId < 6000) return 'background';
  return null;
}

// Get raccoon's base traits from IPFS metadata
async function getBaseTraits(tokenId) {
  const metadataUrl = `https://bafybeihn54iawusfxzqzkxzdcidkgejom22uhwpquqrdl5frmnwhilqi4m.ipfs.dweb.link/${tokenId}.json`;
  const response = await fetch(metadataUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch metadata for token ${tokenId}`);
  }
  const metadata = await response.json();

  // Extract trait values from attributes
  // Metadata uses: bg, fur, body, face, head
  const traits = {};
  for (const attr of metadata.attributes || []) {
    const traitType = attr.trait_type.toLowerCase();
    if (traitType === 'bg') {
      traits.background = attr.value;
    } else {
      traits[traitType] = attr.value;
    }
  }

  return traits;
}

// Build list of layer URLs (back to front)
async function layerUrls({ tokenId, head = 0, face = 0, body = 0, fur = 0, background = 0 }) {
  const layers = [];

  // If any slot is 0, we need the base traits
  const needsBaseTraits = head === 0 || face === 0 || body === 0 || fur === 0 || background === 0;
  let baseTraits = {};

  if (needsBaseTraits) {
    baseTraits = await getBaseTraits(tokenId);
  }

  // Background (5bg)
  if (background === 0) {
    const traitValue = baseTraits.background || '0';
    layers.push(`${COSMETICS_CDN}/${BASE_TRAITS_PATH}/5bg/${traitValue}.png`);
  } else {
    layers.push(`${COSMETICS_CDN}/${COSMETICS_PATH}/background/${background}.png`);
  }

  // Fur (4fur)
  if (fur === 0) {
    const traitValue = baseTraits.fur || '0';
    layers.push(`${COSMETICS_CDN}/${BASE_TRAITS_PATH}/4fur/${traitValue}.png`);
  } else {
    layers.push(`${COSMETICS_CDN}/${COSMETICS_PATH}/fur/${fur}.png`);
  }

  // Body (3body)
  if (body === 0) {
    const traitValue = baseTraits.body || '0';
    layers.push(`${COSMETICS_CDN}/${BASE_TRAITS_PATH}/3body/${traitValue}.png`);
  } else {
    layers.push(`${COSMETICS_CDN}/${COSMETICS_PATH}/body/${body}.png`);
  }

  // Face (2face)
  if (face === 0) {
    const traitValue = baseTraits.face || '0';
    layers.push(`${COSMETICS_CDN}/${BASE_TRAITS_PATH}/2face/${traitValue}.png`);
  } else {
    layers.push(`${COSMETICS_CDN}/${COSMETICS_PATH}/face/${face}.png`);
  }

  // Head (1head)
  if (head === 0) {
    const traitValue = baseTraits.head || '0';
    layers.push(`${COSMETICS_CDN}/${BASE_TRAITS_PATH}/1head/${traitValue}.png`);
  } else {
    layers.push(`${COSMETICS_CDN}/${COSMETICS_PATH}/head/${head}.png`);
  }

  return layers;
}

// Fetch image from URL with retry logic (tries .png, then .gif)
async function fetchImage(url, retries = 3) {
  // Try PNG first
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          // Try .gif extension instead
          const gifUrl = url.replace(/\.png$/, '.gif');
          if (gifUrl !== url) {
            console.log(`   🔄 PNG not found, trying GIF: ${gifUrl}`);
            const gifResponse = await fetch(gifUrl);
            if (!gifResponse.ok) {
              throw new Error(`Failed to fetch ${url} or ${gifUrl}: 404 Not Found`);
            }
            return Buffer.from(await gifResponse.arrayBuffer());
          }
        }
        if (i < retries - 1 && (response.status === 502 || response.status === 503)) {
          // Retry on server errors
          console.log(`   ⚠️  Retry ${i + 1}/${retries} for ${url} (${response.status})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
          continue;
        }
        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      }
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      if (i < retries - 1) {
        console.log(`   ⚠️  Retry ${i + 1}/${retries} for ${url} (${error.message})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
}

// Composite PNG layers with sharp (from URLs)
async function renderPNG({ urls, size = 1000 }) {
  // Fetch all layers concurrently
  const buffers = await Promise.all(urls.map(url => fetchImage(url)));

  // Resize all layers to the same size
  const inputs = await Promise.all(buffers.map(buf =>
    sharp(buf).resize(size, size, {
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

// Image rendering endpoint - PRSS pattern (Pre-Render → Store → Serve)
app.get('/render/:id', async (req, res) => {
  try {
    const tokenId = Number(req.params.id);
    const head = Number(req.query.head ?? 0);
    const face = Number(req.query.face ?? 0);
    const body = Number(req.query.body ?? 0);
    const fur = Number(req.query.fur ?? 0);
    const background = Number(req.query.background ?? 0);

    console.log(`🖼️ Render request for token ${tokenId}: head=${head}, face=${face}, body=${body}, fur=${fur}, bg=${background}`);

    // FAST PATH: If no cosmetics equipped, redirect to static IPFS base image
    const noneEquipped = head === 0 && face === 0 && body === 0 && fur === 0 && background === 0;
    if (noneEquipped) {
      const baseImageUrl = `https://ipfs.io/ipfs/bafybeiaxmevcthi76k45i6buodpefmoavhdxdnsxrmliedytkzk4n2zt24/${tokenId}.png`;
      console.log(`   ⚡ Fast path: No cosmetics, redirecting to base image`);
      return res.redirect(302, baseImageUrl);
    }

    // Generate version hash for this appearance
    const equipped = [head, face, body, fur, background];
    const version = r2.versionHash({ tokenId, equipped });

    console.log(`   🔑 Version hash: ${version}`);

    // Check R2 for existing render (HEAD request)
    const existsInR2 = await r2.exists({ tokenId, version, ext: 'png' });

    if (existsInR2) {
      // HIT: Redirect to CDN URL (immutable, cached)
      const publicUrl = r2.buildPublicUrl({ tokenId, version, ext: 'png' });
      console.log(`   ✅ R2 HIT: Redirecting to ${publicUrl}`);

      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.redirect(302, publicUrl);
    }

    // Check if client wants synchronous rendering (backwards compatible mode)
    const waitForRender = req.query.wait === 'true';

    // MISS: Check if already rendering
    const isRendering = renderQueue.isInProgress({ tokenId, version });

    if (isRendering && !waitForRender) {
      // Already rendering, return 202 Accepted (unless wait=true)
      console.log(`   ⏳ Already rendering, returning 202 Accepted`);
      res.setHeader('Retry-After', '2');
      return res.status(202).json({
        status: 'rendering',
        message: 'Render in progress, retry in 2 seconds',
        tokenId,
        version,
        retryAfter: 2
      });
    }

    // MISS + Not rendering: Enqueue render job
    console.log(`   🎨 Enqueueing render job for ${tokenId}/${version} (wait=${waitForRender})`);

    const renderPromise = renderQueue.enqueue({
      tokenId,
      version,
      renderFn: async () => {
        // Render the image (fetch layers from R2 CDN)
        const urls = await layerUrls({ tokenId, head, face, body, fur, background });
        console.log(`   📦 Fetching layers:`, urls);
        const png = await renderPNG({ urls, size: 1000 });

        // Upload to R2 with immutable cache headers
        await r2.upload({ tokenId, version, buffer: png, ext: 'png' });

        return png;
      }
    });

    // BACKWARDS COMPATIBLE MODE: Wait for render to complete
    if (waitForRender) {
      try {
        console.log(`   ⏳ Waiting for render to complete (backwards compatible mode)...`);
        const png = await renderPromise;

        console.log(`   ✅ Render complete, serving image directly (${png.length} bytes)`);
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=86400');
        return res.send(png);
      } catch (err) {
        console.error(`   ❌ Render failed:`, err);
        return res.status(500).json({
          error: 'Render failed',
          message: err.message
        });
      }
    }

    // DEFAULT MODE: Return 202 Accepted immediately (don't block)
    renderPromise.catch(err => {
      console.error(`   ❌ Render job failed for ${tokenId}/${version}:`, err);
    });

    res.setHeader('Retry-After', '2');
    res.status(202).json({
      status: 'rendering',
      message: 'Render job queued, retry in 2 seconds',
      tokenId,
      version,
      retryAfter: 2
    });

  } catch (err) {
    console.error('❌ Render error:', err);
    res.status(500).json({
      error: 'Render failed',
      message: err.message
    });
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