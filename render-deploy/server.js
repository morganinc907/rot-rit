require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const { LRUCache } = require('lru-cache');
const compression = require('compression');
const GIFEncoder = require('gif-encoder-2');
const r2 = require('./r2-storage');
const { renderQueue } = require('./render-queue');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS and compression
app.use(cors());
app.use(express.json());
app.use(compression());

// Request ID tracking for debugging
app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.id}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Rate limiting to prevent abuse
const metadataLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: {
    error: 'rate_limit_exceeded',
    message: 'Too many requests, please try again later',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const renderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // 20 render requests per minute per IP
  message: {
    error: 'rate_limit_exceeded',
    message: 'Too many render requests, please slow down',
    retryAfter: 60
  }
});

app.use('/metadata', metadataLimiter);
app.use('/render', renderLimiter);

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

// Metrics tracking
const metrics = {
  requests: { total: 0, success: 0, error: 0, by_status: {} },
  cache: { hits: 0, misses: 0 },
  blockchain: { calls: 0, errors: 0 },
  startTime: Date.now()
};

// Metrics middleware
app.use((req, res, next) => {
  metrics.requests.total++;
  const originalSend = res.send;
  res.send = function(data) {
    metrics.requests.by_status[res.statusCode] =
      (metrics.requests.by_status[res.statusCode] || 0) + 1;
    if (res.statusCode >= 200 && res.statusCode < 300) {
      metrics.requests.success++;
    } else if (res.statusCode >= 400) {
      metrics.requests.error++;
    }
    return originalSend.call(this, data);
  };
  next();
});

// R2 CDN URLs for traits/cosmetics
const COSMETICS_CDN = process.env.COSMETICS_CDN || 'https://rotandritual.work';
const BASE_TRAITS_PATH = 'traits';
const COSMETICS_PATH = 'current-cosmetics-r2';

// Base Sepolia RPC
const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');

// Contract addresses
const RACCOON_RENDERER = "0x5c83B09AAb6ac95F1DFc9B6CEE66418D1D94d0fF";
const COSMETICS_ADDRESS = "0x5D4E264c978860F2C73a689F414f302ad23dC5FB";

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

// CosmeticsV2 ABI (just the getEquippedCosmetics function)
const COSMETICS_ABI = [
  {
    name: 'getEquippedCosmetics',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'raccoonId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256[5]' }]
  }
];

// Metrics endpoint
app.get('/metrics', (req, res) => {
  const uptime = Date.now() - metrics.startTime;
  res.json({
    uptime: Math.floor(uptime / 1000), // seconds
    requests: metrics.requests,
    cache: {
      ...metrics.cache,
      hitRate: metrics.cache.hits / (metrics.cache.hits + metrics.cache.misses) || 0
    },
    blockchain: metrics.blockchain,
    queue: renderQueue.getStats(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    contracts: {
      renderer: RACCOON_RENDERER,
      cosmetics: COSMETICS_ADDRESS
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

// NFT Marketplace Metadata endpoint - This is what OpenSea/wallets call
app.get('/metadata/:id', async (req, res) => {
  try {
    const tokenId = req.params.id;

    console.log(`📋 Metadata request for token ${tokenId}`);

    // Validate token ID
    if (!tokenId || isNaN(tokenId)) {
      return res.status(400).json({ error: 'Invalid token ID' });
    }

    // Create cache key
    const cacheKey = `metadata:${tokenId}`;

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log(`💾 Cache hit for ${cacheKey}`);
      metrics.cache.hits++;

      // ETag support even on cached responses
      const etag = cached.version ? `"${cached.version}"` : undefined;
      if (etag && req.headers['if-none-match'] === etag) {
        console.log(`   ✅ ETag match on cache hit, returning 304`);
        res.setHeader('ETag', etag);
        res.setHeader('Cache-Control', 'public, max-age=60');
        res.setHeader('X-Cache', 'HIT');
        return res.status(304).end();
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=60'); // Short cache for metadata (1 min)
      res.setHeader('X-Cache', 'HIT');
      if (etag) res.setHeader('ETag', etag);
      return res.json(cached.data);
    }

    // Cache miss
    metrics.cache.misses++;

    // Wait for available slot
    await waitForSlot(cacheKey);

    try {
      // 1. Read equipped cosmetics from chain
      const cosmetics = new ethers.Contract(COSMETICS_ADDRESS, COSMETICS_ABI, provider);
      console.log(`🔍 Reading equipped cosmetics for token ${tokenId}...`);

      metrics.blockchain.calls++;
      const equipped = await cosmetics.getEquippedCosmetics(tokenId);
      const equippedArray = equipped.map(id => Number(id)); // Convert BigInt to Number
      console.log(`   Equipped: [${equippedArray.join(', ')}]`);

      // 2. Compute version hash
      const version = r2.versionHash({ tokenId: Number(tokenId), equipped: equippedArray });
      console.log(`   Version hash: ${version}`);

      // 3. Get base metadata from IPFS
      const ipfsUrl = `https://bafybeihn54iawusfxzqzkxzdcidkgejom22uhwpquqrdl5frmnwhilqi4m.ipfs.dweb.link/${tokenId}.json`;
      const ipfsResponse = await fetch(ipfsUrl);

      if (!ipfsResponse.ok) {
        throw new Error(`Failed to fetch base metadata from IPFS: ${ipfsResponse.status}`);
      }

      const baseMetadata = await ipfsResponse.json();

      // 4. Determine image extension (check if render exists in R2)
      let ext = 'png';
      if (await r2.exists({ tokenId: Number(tokenId), version, ext: 'gif' })) {
        ext = 'gif';
      } else if (!await r2.exists({ tokenId: Number(tokenId), version, ext: 'png' })) {
        // Image not rendered yet - default to png
        ext = 'png';
      }

      // 5. Build immutable CDN URL
      const imageUrl = r2.buildPublicUrl({ tokenId: Number(tokenId), version, ext });
      console.log(`   📸 Image URL: ${imageUrl}`);

      // 6. Build final metadata with immutable image URL
      const metadata = {
        name: baseMetadata.name || `Trash Raccoon #${tokenId}`,
        description: baseMetadata.description || 'A member of the Rot and Ritual community',
        image: imageUrl,
        external_url: baseMetadata.external_url || `https://rotandritual.work/raccoon/${tokenId}`,
        attributes: baseMetadata.attributes || [],
        // Add cosmetic info to attributes if any equipped
        ...(equippedArray.some(id => id !== 0) && {
          cosmetics_equipped: equippedArray
        })
      };

      // ETag based on version hash (for 304 Not Modified support)
      const etag = `"${version}"`;

      // Check if client has current version cached (ETag/304 support)
      if (req.headers['if-none-match'] === etag) {
        console.log(`   ✅ ETag match, returning 304 Not Modified`);
        res.setHeader('ETag', etag);
        res.setHeader('Cache-Control', 'public, max-age=60');
        return res.status(304).end();
      }

      // Cache the result
      cache.set(cacheKey, { data: metadata, timestamp: Date.now(), version });
      console.log(`💾 Cached ${cacheKey}`);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=60'); // 1 minute cache
      res.setHeader('ETag', etag); // Add ETag for client caching
      res.setHeader('X-Cache', 'MISS');
      return res.json(metadata);

    } finally {
      releaseSlot();
    }

  } catch (error) {
    console.error('❌ Error generating metadata:', error);
    metrics.blockchain.errors++;
    releaseSlot();

    // Return error response
    res.status(500).json({
      error: 'Failed to generate metadata',
      message: error.message,
      tokenId: req.params.id,
      timestamp: new Date().toISOString()
    });
  }
});

// Main metadata endpoint
// Legacy endpoint - redirect to /metadata/:id which reads equipped cosmetics from chain
app.get('/raccoon/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;

    console.log(`📍 Legacy /raccoon/${tokenId} request - redirecting to /metadata/${tokenId}`);

    // Validate token ID
    if (!tokenId || isNaN(tokenId)) {
      return res.status(400).json({ error: 'Invalid token ID' });
    }

    // Redirect to the metadata endpoint which reads equipped cosmetics from chain
    return res.redirect(`/metadata/${tokenId}`);

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

// Check if buffer is a GIF
function isGIF(buffer) {
  return buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46; // 'GIF'
}

// Composite PNG layers with sharp (from URLs)
async function renderPNG({ urls, size = 1000 }) {
  // Fetch all layers concurrently
  const buffers = await Promise.all(urls.map(url => fetchImage(url)));

  // Check if any layer is a GIF
  const hasGIF = buffers.some(buf => isGIF(buf));

  if (hasGIF) {
    console.log(`   🎬 Detected GIF layers, using frame-by-frame compositing`);
    return renderGIF({ buffers, size });
  }

  // Fast path: all PNGs
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

// Frame-accurate GIF compositing
async function renderGIF({ buffers, size = 1000 }) {
  // Extract frames from all layers
  const layers = await Promise.all(buffers.map(async (buf) => {
    if (isGIF(buf)) {
      // Use sharp's GIF animation support
      const image = sharp(buf);
      const metadata = await image.metadata();

      if (metadata.pages > 1) {
        // Extract all frames
        const frames = [];
        for (let i = 0; i < metadata.pages; i++) {
          const frameBuffer = await sharp(buf, { page: i })
            .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

          frames.push({
            data: frameBuffer.data,
            delay: metadata.delay ? metadata.delay[i] || 100 : 100,
            width: frameBuffer.info.width,
            height: frameBuffer.info.height
          });
        }
        return { frames, isAnimated: true };
      }
    }

    // Static PNG or single-frame GIF
    const resized = await sharp(buf)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    return {
      frames: [{
        data: resized.data,
        delay: 100,
        width: resized.info.width,
        height: resized.info.height
      }],
      isAnimated: false
    };
  }));

  // Find max frame count (for looping)
  const maxFrames = Math.max(...layers.map(l => l.frames.length));
  console.log(`   📹 Compositing ${maxFrames} frames across ${layers.length} layers`);

  // Create GIF encoder
  const encoder = new GIFEncoder(size, size, 'octree', true);
  encoder.setQuality(10); // 1-20, lower is better
  encoder.setRepeat(0); // 0 = loop forever
  encoder.start();

  // Composite each frame
  for (let frameIdx = 0; frameIdx < maxFrames; frameIdx++) {
    // Get frame from each layer (loop if layer has fewer frames)
    const frameBuffers = await Promise.all(layers.map(async (layer, layerIdx) => {
      const frame = layer.frames[frameIdx % layer.frames.length];
      return frame.data;
    }));

    // Composite all layers for this frame
    const compositeBuffers = await Promise.all(frameBuffers.map(async (buf, idx) => {
      return sharp(buf, {
        raw: {
          width: size,
          height: size,
          channels: 4
        }
      }).png().toBuffer();
    }));

    const composited = await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    })
      .composite(compositeBuffers.map(buf => ({ input: buf, left: 0, top: 0 })))
      .raw()
      .toBuffer();

    // Get delay for this frame (use longest delay from any layer)
    const delays = layers.map(l => l.frames[frameIdx % l.frames.length].delay);
    const frameDelay = Math.max(...delays);

    encoder.setDelay(frameDelay);
    encoder.addFrame(composited);
  }

  encoder.finish();
  return encoder.out.getData();
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

    // Check R2 for existing render (try both .gif and .png)
    let existingExt = null;
    if (await r2.exists({ tokenId, version, ext: 'gif' })) {
      existingExt = 'gif';
    } else if (await r2.exists({ tokenId, version, ext: 'png' })) {
      existingExt = 'png';
    }

    if (existingExt) {
      // HIT: Redirect to CDN URL (immutable, cached)
      const publicUrl = r2.buildPublicUrl({ tokenId, version, ext: existingExt });
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
        const imageBuffer = await renderPNG({ urls, size: 1000 });

        // Detect if output is GIF or PNG
        const ext = isGIF(imageBuffer) ? 'gif' : 'png';
        console.log(`   💾 Uploading as .${ext}`);

        // Upload to R2 with immutable cache headers
        await r2.upload({ tokenId, version, buffer: imageBuffer, ext });

        return { buffer: imageBuffer, ext };
      }
    });

    // BACKWARDS COMPATIBLE MODE: Wait for render to complete
    if (waitForRender) {
      try {
        console.log(`   ⏳ Waiting for render to complete (backwards compatible mode)...`);
        const result = await renderPromise;

        console.log(`   ✅ Render complete, serving image directly (${result.buffer.length} bytes)`);
        res.setHeader('Content-Type', result.ext === 'gif' ? 'image/gif' : 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=86400');
        return res.send(result.buffer);
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

// Start server with graceful shutdown support
const server = app.listen(PORT, () => {
  console.log(`🚀 Raccoon Metadata API running on port ${PORT}`);
  console.log(`📍 Renderer contract: ${RACCOON_RENDERER}`);
  console.log(`📍 Cosmetics contract: ${COSMETICS_ADDRESS}`);
  console.log(`🔗 Base Sepolia RPC: https://sepolia.base.org`);
  console.log(`\n📋 Endpoints:`);
  console.log(`   GET /health - Health check`);
  console.log(`   GET /metrics - System metrics`);
  console.log(`   GET /metadata/:id - NFT metadata (reads equipped cosmetics from chain)`);
  console.log(`   GET /render/:id?head=X&face=X&body=X&fur=X&background=X - Render image (PRSS pattern)`);
  console.log(`   GET /raccoon/:tokenId?cosmetics=0x...&chain=84532 - Dynamic metadata (legacy)`);
  console.log(`   GET /static/:tokenId - Static IPFS metadata`);
});

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal) {
  console.log(`\n⚠️  ${signal} received, graceful shutdown starting...`);

  // Stop accepting new requests
  server.close(() => {
    console.log('✅ HTTP server closed');
  });

  // Wait for in-flight renders to complete
  const maxWait = 30000; // 30 seconds max
  const startTime = Date.now();

  console.log('⏳ Waiting for in-flight renders to complete...');

  while (renderQueue.getStats().inProgress > 0) {
    const elapsed = Date.now() - startTime;

    if (elapsed > maxWait) {
      console.log('⚠️  Force shutdown after 30s (some renders may be incomplete)');
      break;
    }

    const remaining = renderQueue.getStats().inProgress;
    console.log(`   ${remaining} renders remaining... (${Math.floor(elapsed / 1000)}s elapsed)`);

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('✅ All renders complete');
  console.log('📊 Final metrics:', {
    uptime: Math.floor((Date.now() - metrics.startTime) / 1000),
    requests: metrics.requests.total,
    cacheHitRate: (metrics.cache.hits / (metrics.cache.hits + metrics.cache.misses) || 0).toFixed(2)
  });
  console.log('👋 Goodbye!');
  process.exit(0);
}

module.exports = app;