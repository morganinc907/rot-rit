const sharp = require('sharp');
const axios = require('axios');
const crypto = require('crypto');
const https = require('https');
const { LRUCache } = require('lru-cache');
const { GifReader } = require('omggif');
const { GifCodec, GifFrame } = require('gifenc');

// Configure sharp for optimal performance
sharp.cache({ files: 64, items: 400, memory: 512 });
sharp.concurrency(0); // Auto-detect CPUs

// Asset caches
const assetCache = new LRUCache({ max: 300, ttl: 30 * 60 * 1000 }); // 30 minutes
const normalizedCache = new LRUCache({ max: 400, ttl: 60 * 60 * 1000 }); // 1 hour
const metadataCache = new LRUCache({ max: 200, ttl: 60 * 60 * 1000 }); // 1 hour

// Keep-alive agent for faster HTTP requests
const agent = new https.Agent({ keepAlive: true });

// Constants from environment
const IPFS_BASE_CID = process.env.IPFS_BASE_CID || 'bafybeihn54iawusfxzqzkxzdcidkgejom22uhwpquqrdl5frmnwhilqi4m';
const IPFS_TRAITS_CID = process.env.IPFS_TRAITS_CID || 'bafybeiaxmevcthi76k45i6buodpefmoavhdxdnsxrmliedytkzk4n2zt24';

// IPFS gateway fallback list
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs',
  'https://cloudflare-ipfs.com/ipfs',
  'https://gateway.pinata.cloud/ipfs'
];

// Draw order (back → front) - z-index based rendering
const LAYER_ORDER = ['bg', 'fur', 'body', 'face', 'head'];

// Slot mapping for cosmetics (on-chain slot index -> trait type)
// equipped array format: [headId, faceId, bodyId, furId, bgId]
const SLOT_TO_TRAIT = {
  0: 'head',
  1: 'face',
  2: 'body',
  3: 'fur',
  4: 'bg'
};

// Slot names for R2 cosmetic URLs
const SLOT_NAMES = ['head', 'face', 'body', 'fur', 'background'];

// Trait directory mapping
const TRAIT_DIRS = {
  bg: '5bg',
  fur: '4fur',
  body: '3body',
  face: '2face',
  head: '1head'
};

/**
 * Simple p-limit implementation for bounded concurrency
 */
function pLimit(n) {
  const queue = [];
  let active = 0;

  const run = (fn, resolve, reject) => {
    active++;
    fn()
      .then(resolve, reject)
      .finally(() => {
        active--;
        if (queue.length) {
          const [fn, res, rej] = queue.shift();
          run(fn, res, rej);
        }
      });
  };

  return (fn) => new Promise((resolve, reject) => {
    if (active < n) {
      run(fn, resolve, reject);
    } else {
      queue.push([fn, resolve, reject]);
    }
  });
}

/**
 * Fetch from IPFS with gateway fallback
 */
async function ipfsGet(cid, path, options = {}) {
  const errors = [];

  for (const gateway of IPFS_GATEWAYS) {
    try {
      const url = `${gateway}/${cid}/${path}`;
      console.log(`   📥 Trying ${gateway.split('/')[2]}...`);

      const response = await axios.get(url, {
        responseType: options.json ? 'json' : 'arraybuffer',
        timeout: 8000,
        ...options
      });

      return options.json ? response.data : Buffer.from(response.data);
    } catch (error) {
      errors.push(`${gateway}: ${error.message}`);
    }
  }

  throw new Error(`All IPFS gateways failed for ${cid}/${path}: ${errors.join('; ')}`);
}

/**
 * Fetch base raccoon metadata from IPFS (with cache)
 */
async function fetchBaseMetadata(tokenId) {
  const cached = metadataCache.get(tokenId);
  if (cached) {
    console.log(`📦 Base metadata cached for raccoon #${tokenId}`);
    return cached;
  }

  console.log(`📦 Fetching base metadata for raccoon #${tokenId}...`);
  const metadata = await ipfsGet(IPFS_BASE_CID, `${tokenId}.json`, { json: true });
  metadataCache.set(tokenId, metadata);
  return metadata;
}

/**
 * Fetch cosmetic info - returns candidate URLs (no HEAD request)
 */
async function fetchCosmeticInfo(cosmeticId) {
  const typeId = Number(cosmeticId);

  // Validate range
  if (typeId === 0) return null;
  if (typeId < 1000 || typeId >= 6000) {
    console.warn(`⚠️ Cosmetic ID ${typeId} out of range [1000-6000]`);
    return null;
  }

  // Determine slot based on typeId ranges
  let slot;
  if (typeId >= 1000 && typeId < 2000) slot = 0; // HEAD
  else if (typeId >= 2000 && typeId < 3000) slot = 1; // FACE
  else if (typeId >= 3000 && typeId < 4000) slot = 2; // BODY
  else if (typeId >= 4000 && typeId < 5000) slot = 3; // FUR/COLOR
  else if (typeId >= 5000 && typeId < 6000) slot = 4; // BACKGROUND
  else return null;

  // Return both URLs in priority order (GIF first, then PNG)
  const baseUrl = `https://rotandritual.work/current-cosmetics-r2/${SLOT_NAMES[slot]}/${typeId}`;
  return {
    slot,
    typeId,
    urls: [`${baseUrl}.gif`, `${baseUrl}.png`]
  };
}

/**
 * Download image as buffer with cache
 */
async function downloadImage(url) {
  try {
    // Check cache first
    const cached = assetCache.get(url);
    if (cached) {
      console.log(`   💾 ${url.substring(url.lastIndexOf('/') + 1)}`);
      return cached;
    }

    console.log(`   📥 ${url.substring(url.lastIndexOf('/') + 1)}`);
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
      httpsAgent: agent,
      validateStatus: (s) => (s >= 200 && s < 300) || s === 404
    });

    if (response.status === 404) return null;

    const buffer = Buffer.from(response.data);
    assetCache.set(url, buffer);
    return buffer;
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    return null;
  }
}

/**
 * Check if buffer is a GIF
 */
function isGif(buffer) {
  if (!buffer || buffer.length < 3) return false;
  return buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46; // "GIF"
}

/**
 * Normalize layer to consistent size (1000x1000) with cache
 */
async function normalizeLayer(buffer, cacheKey) {
  // Check normalized cache
  if (cacheKey) {
    const cached = normalizedCache.get(cacheKey);
    if (cached) return cached;
  }

  const normalized = await sharp(buffer)
    .resize(1000, 1000, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();

  if (cacheKey) {
    normalizedCache.set(cacheKey, normalized);
  }

  return normalized;
}

/**
 * Composite PNG layers with optimized settings
 */
async function compositePNG(layers) {
  console.log(`🎨 Compositing ${layers.length} PNG layers...`);

  if (layers.length === 0) {
    throw new Error('No layers to composite');
  }

  // Normalize base layer with cache
  const baseBuffer = await normalizeLayer(layers[0].buffer, `norm:${layers[0].url}`);

  // Normalize and prepare overlays with cache
  const overlays = await Promise.all(
    layers.slice(1).map(async (layer) => ({
      input: await normalizeLayer(layer.buffer, `norm:${layer.url}`),
      left: 0,
      top: 0
    }))
  );

  // Composite with optimized settings
  let composite = sharp(baseBuffer);

  if (overlays.length > 0) {
    composite = composite.composite(overlays);
  }

  return await composite
    .png({
      compressionLevel: 9,
      progressive: false,
      adaptiveFiltering: true,
      effort: 7
    })
    .toBuffer();
}

/**
 * Composite layers with frame-accurate GIF handling
 * Preserves original frame timing and supports multiple GIF layers
 */
async function compositeWithGIF(layers) {
  console.log(`🎨 Compositing ${layers.length} layers (including GIFs)...`);

  // Separate PNG and GIF layers
  const gifLayers = layers.filter(l => l.isGif);

  if (gifLayers.length === 0) {
    // No GIFs, use PNG compositing
    return await compositePNG(layers);
  }

  console.log(`   📹 ${gifLayers.length} GIF layer(s) detected - using frame-accurate compositing`);

  // Use the top-most (highest z-index) GIF as animation source
  const gifLayer = gifLayers.sort((a, b) => b.z - a.z)[0];

  // Separate layers by z-index relative to the GIF
  const layersBelow = layers.filter(l => l.z < gifLayer.z && !l.isGif);
  const layersAbove = layers.filter(l => l.z > gifLayer.z && !l.isGif);

  console.log(`   📊 Layers: ${layersBelow.length} below GIF, GIF at z=${gifLayer.z}, ${layersAbove.length} above`);

  // Pre-composite layers below into a single base PNG
  let basePng;
  if (layersBelow.length > 0) {
    basePng = await compositePNG(layersBelow);
  } else {
    // Create transparent base
    basePng = await sharp({
      create: {
        width: 1000,
        height: 1000,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    }).png().toBuffer();
  }

  // Pre-normalize layers above (with cache)
  const normalizedAbove = await Promise.all(
    layersAbove.map(async (layer) => ({
      buffer: await normalizeLayer(layer.buffer, `norm:${layer.url}`),
      layer
    }))
  );

  // Decode GIF frames
  const reader = new GifReader(gifLayer.buffer);
  const numFrames = reader.numFrames();
  console.log(`   🎞️ Processing ${numFrames} frames...`);

  const frames = [];

  for (let i = 0; i < numFrames; i++) {
    const frameInfo = reader.frameInfo(i);
    const delay = frameInfo.delay || 10; // centiseconds (1/100th of a second)

    // Decode frame to RGBA
    const frameWidth = reader.width;
    const frameHeight = reader.height;
    const frameRGBA = Buffer.alloc(frameWidth * frameHeight * 4);
    reader.decodeAndBlitFrameRGBA(i, frameRGBA);

    // Convert frame to PNG and resize to 1000x1000
    const framePng = await sharp(frameRGBA, {
      raw: { width: frameWidth, height: frameHeight, channels: 4 }
    })
      .resize(1000, 1000, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();

    // Composite: base → gif frame → layers above
    const compositeInputs = [{ input: framePng, left: 0, top: 0 }];

    // Add layers above
    for (const { buffer } of normalizedAbove) {
      compositeInputs.push({ input: buffer, left: 0, top: 0 });
    }

    // Composite this frame
    const compositedFrame = await sharp(basePng)
      .composite(compositeInputs)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Create GIF frame with original timing
    const gifFrame = new GifFrame(1000, 1000, {
      delayCentisecs: Math.max(1, delay),
      disposal: 2, // dispose to background
      transparent: true
    });

    // Copy RGBA data
    gifFrame.data.set(compositedFrame.data);
    frames.push(gifFrame);
  }

  // Encode as GIF
  console.log(`   🎬 Encoding ${frames.length} frames...`);
  const codec = new GifCodec();
  const { buffer: gifBuffer } = codec.encodeGif(frames, { loops: 0 });

  console.log(`   ✅ Composited animated GIF (${gifBuffer.length} bytes)`);
  return Buffer.from(gifBuffer);
}

/**
 * Main rendering function - Clean "equip → replace" logic
 */
async function renderRaccoon(tokenId, equippedCosmetics, options = {}) {
  const startTime = Date.now();
  console.log(`\n🎨 Rendering raccoon #${tokenId}...`);
  console.log(`   Equipped:`, equippedCosmetics);

  // 1. Fetch base metadata to get base trait names
  const baseMetadata = await fetchBaseMetadata(tokenId);
  console.log(`   ✅ Base metadata fetched`);

  // Build base traits object: { bg: 'name', fur: 'name', body: 'name', face: 'name', head: 'name' }
  const baseTraits = {};
  for (const attr of baseMetadata.attributes || []) {
    if (LAYER_ORDER.includes(attr.trait_type)) {
      baseTraits[attr.trait_type] = attr.value;
    }
  }

  // 2. Decide winner per slot: cosmetic if id>0, else base trait
  const chosen = { ...baseTraits }; // Start with base
  for (let slotIndex = 0; slotIndex < 5; slotIndex++) {
    const traitKey = SLOT_TO_TRAIT[slotIndex];  // 'head'|'face'|'body'|'fur'|'bg'
    const cosId = Number(equippedCosmetics[slotIndex]) || 0;
    if (cosId > 0) {
      chosen[traitKey] = cosId;  // Replace base with cosmetic id
      console.log(`   Slot ${slotIndex} (${traitKey}): Cosmetic #${cosId} REPLACES base "${baseTraits[traitKey]}"`);
    } else {
      console.log(`   Slot ${slotIndex} (${traitKey}): Base "${baseTraits[traitKey]}"`);
    }
  }

  // 3. Build layer stack in z-order: bg→fur→body→face→head
  const layerStack = [];
  for (let i = 0; i < LAYER_ORDER.length; i++) {
    const slot = LAYER_ORDER[i];
    const value = chosen[slot];
    const mode = typeof value === 'number' ? 'cosmetic' : 'base';

    if (mode === 'cosmetic') {
      // Cosmetic: numeric id - get candidate URLs
      const cosmeticInfo = await fetchCosmeticInfo(value);
      if (!cosmeticInfo) continue;

      layerStack.push({
        slot,
        mode,
        urls: cosmeticInfo.urls,
        z: i + 1,
        value
      });
    } else {
      // Base trait: name string
      const filename = value.endsWith('.png') ? value : `${value}.png`;
      const url = `https://rotandritual.work/traits/${TRAIT_DIRS[slot]}/${filename}`;

      layerStack.push({
        slot,
        mode,
        urls: [url],
        z: i + 1,
        value
      });
    }
  }

  console.log(`📥 Downloading ${layerStack.length} layers in z-order...`);

  // 4. Download all layers in parallel (bounded concurrency)
  // Try each URL until one succeeds
  const limit = pLimit(6);
  const downloads = layerStack.map(layer =>
    limit(async () => {
      let buffer, url;

      // Try each candidate URL
      for (const candidateUrl of layer.urls) {
        buffer = await downloadImage(candidateUrl);
        if (buffer) {
          url = candidateUrl;
          break;
        }
      }

      if (!buffer) return null;

      return {
        ...layer,
        url,
        buffer,
        isGif: isGif(buffer)
      };
    })
  );

  const results = await Promise.allSettled(downloads);
  const layers = results
    .map(r => (r.status === 'fulfilled' ? r.value : null))
    .filter(Boolean);

  console.log(`   ✅ Downloaded ${layers.length}/${layerStack.length} layers`);

  if (layers.length === 0) {
    throw new Error('No layers could be downloaded');
  }

  // Ensure layers are sorted by z-index
  layers.sort((a, b) => a.z - b.z);

  // 5. Composite layers
  const hasGif = layers.some(l => l.isGif);
  const finalImage = hasGif
    ? await compositeWithGIF(layers)
    : await compositePNG(layers);

  const elapsed = Date.now() - startTime;
  console.log(`✅ Rendered ${hasGif ? 'animated GIF' : 'PNG'} (${finalImage.length} bytes) in ${elapsed}ms`);

  return {
    buffer: finalImage,
    contentType: hasGif ? 'image/gif' : 'image/png',
    layers: options.debug ? layerStack : undefined,
    renderTime: elapsed
  };
}

/**
 * Generate equipment hash for caching
 */
function getEquipmentHash(equipped) {
  return crypto
    .createHash('sha1')
    .update(equipped.join(','))
    .digest('hex')
    .substring(0, 12);
}

module.exports = { renderRaccoon, getEquipmentHash };
