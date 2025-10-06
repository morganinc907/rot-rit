const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Request queue to prevent overwhelming the RPC
const requestQueue = new Map();
const MAX_CONCURRENT = 3; // Only 3 concurrent blockchain calls
let activeRequests = 0;

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