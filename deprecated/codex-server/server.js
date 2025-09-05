// server.js - Codex WebSocket Server
import express from "express";
import { WebSocketServer } from "ws";
import { ethers } from "ethers";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS for development
app.use(cors());
app.use(express.json());

// ----------------------
// Mock Mode Toggle
// ----------------------
const MOCK_MODE = process.env.MOCK_MODE === 'true';

console.log(`🎭 ${MOCK_MODE ? 'MOCK MODE ENABLED - Generating simulated events' : 'LIVE MODE - Connecting to blockchain'}`);

// ----------------------
// Blockchain Setup (only in live mode)
// ----------------------
let provider = null;
if (!MOCK_MODE) {
  const RPC_URL = process.env.RPC_URL || "https://sepolia.base.org";
  provider = new ethers.JsonRpcProvider(RPC_URL);
  console.log(`🔗 Connecting to RPC: ${RPC_URL}`);
}

// Contract addresses
const MAW_MANAGER_ADDRESS = process.env.MAW_MANAGER_ADDRESS;
const COSMETICS_V2_ADDRESS = process.env.COSMETICS_V2_ADDRESS;
const RACCOONS_ADDRESS = process.env.RACCOONS_ADDRESS;

// Load ABIs
let mawAbi, cosmeticsAbi, raccoonsAbi;
try {
  mawAbi = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'abis', 'MawManager.json'), 'utf8'));
  cosmeticsAbi = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'abis', 'CosmeticsV2.json'), 'utf8'));
  raccoonsAbi = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'abis', 'Raccoons.json'), 'utf8'));
} catch (error) {
  console.warn('⚠️  ABI files not found, using minimal ABIs for development');
  
  // Minimal ABIs for development
  mawAbi = [
    "event RaccoonSacrificed(address indexed owner, uint256 indexed raccoonId, bool success, uint256 demonId)",
    "event RelicRewarded(address indexed owner, uint256 relicId, uint256 cosmeticId)",
    "event CosmeticEquipped(address indexed owner, uint256 indexed raccoonId, uint256 cosmeticId, uint8 slot)",
    "event CosmeticUnequipped(address indexed owner, uint256 indexed raccoonId, uint8 slot)"
  ];
  
  cosmeticsAbi = [
    "event CosmeticEquipped(address indexed user, uint256 indexed raccoonId, uint256 cosmeticId, uint8 slot, uint8 rarity)",
    "event CosmeticUnequipped(address indexed user, uint256 indexed raccoonId, uint256 cosmeticId, uint8 slot)",
    "event OutfitBound(address indexed user, uint256 indexed raccoonId, uint256[] cosmeticIds)"
  ];
  
  raccoonsAbi = [
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
  ];
}

// Initialize contracts (only in live mode)
let mawContract, cosmeticsContract, raccoonsContract;

if (!MOCK_MODE) {
  if (MAW_MANAGER_ADDRESS) {
    mawContract = new ethers.Contract(MAW_MANAGER_ADDRESS, mawAbi, provider);
    console.log(`🩸 MawManager connected: ${MAW_MANAGER_ADDRESS}`);
  }

  if (COSMETICS_V2_ADDRESS) {
    cosmeticsContract = new ethers.Contract(COSMETICS_V2_ADDRESS, cosmeticsAbi, provider);
    console.log(`✨ CosmeticsV2 connected: ${COSMETICS_V2_ADDRESS}`);
  }

  if (RACCOONS_ADDRESS) {
    raccoonsContract = new ethers.Contract(RACCOONS_ADDRESS, raccoonsAbi, provider);
    console.log(`🦝 Raccoons connected: ${RACCOONS_ADDRESS}`);
  }
}

// ----------------------
// WebSocket Setup
// ----------------------
const wss = new WebSocketServer({ noServer: true });
let clients = [];

wss.on("connection", (ws, req) => {
  console.log(`🔮 New Codex client connected (${clients.length + 1} total)`);
  clients.push(ws);

  // Send welcome message
  ws.send(JSON.stringify({ 
    type: "connection_success", 
    message: "Connected to Codex live ritual feed",
    timestamp: Date.now()
  }));

  // Send recent events if available
  if (recentEvents.length > 0) {
    ws.send(JSON.stringify({
      type: "history",
      events: recentEvents.slice(0, 10), // Send last 10 events
      timestamp: Date.now()
    }));
  }

  ws.on("close", () => {
    clients = clients.filter((c) => c !== ws);
    console.log(`📜 Codex client disconnected (${clients.length} remaining)`);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === "PING") {
        ws.send(JSON.stringify({ type: "PONG", timestamp: Date.now() }));
      }
    } catch (err) {
      console.error("Failed to parse client message:", err);
    }
  });
});

// Store recent events for new connections
let recentEvents = [];
const MAX_RECENT_EVENTS = 50;

// Broadcast helper with improved error handling
const broadcast = (payload) => {
  try {
    const msg = JSON.stringify(payload);
    
    // Add to recent events
    recentEvents.unshift(payload);
    if (recentEvents.length > MAX_RECENT_EVENTS) {
      recentEvents = recentEvents.slice(0, MAX_RECENT_EVENTS);
    }
    
    // Broadcast to all clients with retry mechanism
    let successCount = 0;
    let failedCount = 0;
    
    clients.forEach((client, index) => {
      try {
        if (client.readyState === 1) {
          client.send(msg);
          successCount++;
        } else {
          failedCount++;
        }
      } catch (error) {
        console.error(`💥 Failed to send to client ${index}:`, error.message);
        failedCount++;
      }
    });
    
    // Clean up dead connections
    clients = clients.filter(client => client.readyState === 1);
    
    const eventType = payload.kind || payload.type;
    console.log(`📡 Broadcasted ${eventType} to ${successCount}/${successCount + failedCount} clients ${failedCount > 0 ? `(${failedCount} failed)` : ''}`);
    
    // Log important events with more detail
    if (['demon_summoned', 'sacrifice', 'relic_reward'].includes(eventType)) {
      console.log(`🔥 HIGH-VALUE EVENT: ${JSON.stringify(payload, null, 2)}`);
    }
    
  } catch (error) {
    console.error('💥 Critical broadcast error:', error);
  }
};

// ----------------------
// Mock Event Generator (for testing without contracts)
// ----------------------
if (MOCK_MODE) {
  console.log('🎭 Starting mock event generator...');
  
  const mockAddresses = [
    "0x1234567890123456789012345678901234567890",
    "0x2345678901234567890123456789012345678901", 
    "0x3456789012345678901234567890123456789012",
    "0x4567890123456789012345678901234567890123",
    "0x5678901234567890123456789012345678901234"
  ];
  
  const randomAddr = () => mockAddresses[Math.floor(Math.random() * mockAddresses.length)];
  const randomTx = () => `0x${Math.random().toString(16).substring(2, 66).padStart(64, '0')}`;
  const randomId = () => Math.floor(Math.random() * 999) + 1;
  const randomRarity = () => Math.floor(Math.random() * 6); // 0-5
  
  const generateMockEvent = () => {
    const eventTypes = [
      'sacrifice', 'demon_summoned', 'relic_reward', 'cosmetic_reward', 
      'equip', 'unequip', 'outfit', 'raccoon_minted', 'raccoon_transferred'
    ];
    const kind = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const owner = randomAddr();
    const time = Date.now();
    const tx = randomTx();
    const blockNumber = Math.floor(Math.random() * 100000) + 18000000;
    
    let payload = { kind, time, tx, owner, blockNumber, data: {} };
    
    switch (kind) {
      case 'sacrifice':
        payload.data = { 
          raccoonId: randomId().toString(),
          success: false,
          tokenCount: Math.floor(Math.random() * 5) + 1
        };
        payload.raccoonId = payload.data.raccoonId;
        break;
        
      case 'demon_summoned':
        payload.data = {
          raccoonId: randomId().toString(),
          demonId: randomId().toString(),
          success: true
        };
        payload.raccoonId = payload.data.raccoonId;
        payload.success = true;
        payload.demonId = payload.data.demonId;
        break;
        
      case 'relic_reward':
        payload.data = {
          relicId: randomId().toString(),
          isCosmetic: false
        };
        payload.relicId = payload.data.relicId;
        break;
        
      case 'cosmetic_reward':
        payload.data = {
          cosmeticId: randomId().toString(),
          rarity: randomRarity(),
          isCosmetic: true
        };
        payload.cosmeticId = payload.data.cosmeticId;
        break;
        
      case 'equip':
        payload.data = {
          raccoonId: randomId().toString(),
          cosmeticId: randomId().toString(),
          slot: Math.floor(Math.random() * 5).toString(),
          rarity: randomRarity()
        };
        break;
        
      case 'unequip':
        payload.data = {
          raccoonId: randomId().toString(),
          cosmeticId: randomId().toString(),
          slot: Math.floor(Math.random() * 5).toString()
        };
        break;
        
      case 'outfit':
        payload.data = {
          raccoonId: randomId().toString(),
          cosmeticIds: Array.from({length: 5}, () => randomId().toString())
        };
        break;
        
      case 'raccoon_minted':
        payload.data = {
          tokenId: randomId().toString(),
          from: "0x0000000000000000000000000000000000000000",
          to: owner,
          isMint: true
        };
        break;
        
      case 'raccoon_transferred':
        payload.data = {
          tokenId: randomId().toString(),
          from: randomAddr(),
          to: owner,
          isMint: false
        };
        break;
    }
    
    console.log(`🎭 Mock event: ${kind} by ${owner.slice(0, 8)}...`);
    broadcast(payload);
  };
  
  // Generate events every 15-30 seconds
  const scheduleNext = () => {
    const delay = Math.random() * 15000 + 15000; // 15-30 seconds
    setTimeout(() => {
      generateMockEvent();
      scheduleNext();
    }, delay);
  };
  
  // Start after 2 seconds
  setTimeout(scheduleNext, 2000);
}

// ----------------------
// Event Listeners (only in live mode)
// ----------------------

// Maw Manager Events
if (mawContract) {
  // 1. Raccoon sacrificed (demon attempts + summoning)
  mawContract.on("RaccoonSacrificed", (owner, raccoonId, success, demonId, event) => {
    const payload = {
      kind: success ? "demon_summoned" : "sacrifice",
      time: Date.now(),
      tx: event.log?.transactionHash || "0x...",
      owner,
      raccoonId: raccoonId.toString(),
      success,
      demonId: success ? demonId.toString() : null,
      blockNumber: event.log?.blockNumber || 0,
      data: {
        demonId: success ? demonId.toString() : null,
        success
      }
    };
    console.log(`🔥 ${success ? 'Demon Summoned' : 'Sacrifice Failed'}:`, payload);
    broadcast(payload);
  });

  // 2. Relic/Cosmetic rewards
  mawContract.on("RelicRewarded", (owner, relicId, cosmeticId, event) => {
    const isCosmetic = cosmeticId.toString() !== "0";
    const payload = {
      kind: isCosmetic ? "cosmetic_reward" : "relic_reward", 
      time: Date.now(),
      tx: event.log?.transactionHash || "0x...",
      owner,
      relicId: relicId.toString(),
      cosmeticId: cosmeticId.toString(),
      blockNumber: event.log?.blockNumber || 0,
      data: {
        relicId: relicId.toString(),
        cosmeticId: isCosmetic ? cosmeticId.toString() : null,
        isCosmetic
      }
    };
    console.log(`🎁 ${isCosmetic ? 'Cosmetic' : 'Relic'} Reward:`, payload);
    broadcast(payload);
  });
}

// Raccoons Contract Events
if (raccoonsContract) {
  // 6. Raccoon transfers (mints and transfers)
  raccoonsContract.on("Transfer", (from, to, tokenId, event) => {
    const isMint = from === "0x0000000000000000000000000000000000000000";
    const payload = {
      kind: isMint ? "raccoon_minted" : "raccoon_transferred",
      time: Date.now(),
      tx: event.log?.transactionHash || "0x...",
      owner: to, // New owner
      blockNumber: event.log?.blockNumber || 0,
      data: {
        from: from,
        to: to,
        tokenId: tokenId.toString(),
        isMint
      }
    };
    console.log(`🦝 ${isMint ? 'Raccoon Minted' : 'Raccoon Transferred'}:`, payload);
    broadcast(payload);
  });
}

// Cosmetics V2 Events
if (cosmeticsContract) {
  // 3. Cosmetic equipped
  cosmeticsContract.on("CosmeticEquipped", (user, raccoonId, cosmeticId, slot, rarity, event) => {
    const payload = {
      kind: "equip",
      time: Date.now(),
      tx: event.log?.transactionHash || "0x...",
      owner: user,
      blockNumber: event.log?.blockNumber || 0,
      data: {
        raccoonId: raccoonId.toString(),
        cosmeticId: cosmeticId.toString(),
        slot: slot.toString(),
        rarity: rarity?.toString() || "0"
      }
    };
    console.log("✨ Cosmetic Equipped:", payload);
    broadcast(payload);
  });

  // 4. Cosmetic unequipped
  cosmeticsContract.on("CosmeticUnequipped", (user, raccoonId, cosmeticId, slot, event) => {
    const payload = {
      kind: "unequip",
      time: Date.now(),
      tx: event.log?.transactionHash || "0x...",
      owner: user,
      blockNumber: event.log?.blockNumber || 0,
      data: {
        raccoonId: raccoonId.toString(),
        cosmeticId: cosmeticId.toString(),
        slot: slot.toString()
      }
    };
    console.log("⚡ Cosmetic Unequipped:", payload);
    broadcast(payload);
  });

  // 5. Outfit bound
  cosmeticsContract.on("OutfitBound", (user, raccoonId, cosmeticIds, event) => {
    const payload = {
      kind: "outfit",
      time: Date.now(),
      tx: event.log?.transactionHash || "0x...",
      owner: user,
      blockNumber: event.log?.blockNumber || 0,
      data: {
        raccoonId: raccoonId.toString(),
        cosmeticIds: cosmeticIds.map(id => id.toString())
      }
    };
    console.log("🎭 Outfit Bound:", payload);
    broadcast(payload);
  });
}

// ----------------------
// REST API Endpoints
// ----------------------

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    clients: clients.length,
    contracts: {
      maw: !!mawContract,
      cosmetics: !!cosmeticsContract,
      raccoons: !!raccoonsContract
    },
    recentEvents: recentEvents.length
  });
});

// Get recent events
app.get('/events', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  res.json({
    events: recentEvents.slice(0, limit),
    total: recentEvents.length
  });
});

// Personal ritual history (stretch goal)
app.get('/subscribe', (req, res) => {
  const owner = req.query.owner;
  if (!owner) {
    return res.status(400).json({ error: 'owner parameter required' });
  }
  
  const limit = parseInt(req.query.limit) || 20;
  const personalEvents = recentEvents.filter(event => 
    event.owner && event.owner.toLowerCase() === owner.toLowerCase()
  ).slice(0, limit);
  
  res.json({
    owner: owner,
    events: personalEvents,
    total: personalEvents.length,
    message: `Personal ritual history for ${owner}`
  });
});

// Manual test event (for development)
app.post('/test-event', (req, res) => {
  const testEvent = {
    kind: "test",
    time: Date.now(),
    tx: "0x1234567890abcdef",
    owner: "0x1234567890123456789012345678901234567890",
    data: { message: "Test event from API" },
    blockNumber: 99999999
  };
  
  broadcast(testEvent);
  res.json({ success: true, event: testEvent });
});

// Demon summoning test event (for testing ritual overlay)
app.post('/test-demon', (req, res) => {
  const testDemon = {
    kind: "demon_summoned",
    time: Date.now(),
    tx: "0xdeadbeef1234567890abcdef",
    owner: req.body.owner || "0x1234567890123456789012345678901234567890",
    raccoonId: req.body.raccoonId || "1",
    success: true,
    demonId: req.body.demonId || "666",
    blockNumber: 99999999,
    data: {
      demonId: req.body.demonId || "666",
      success: true
    }
  };
  
  broadcast(testDemon);
  res.json({ success: true, event: testDemon, message: "Test demon summoning event sent!" });
});

// ----------------------
// Server Startup
// ----------------------
const server = app.listen(PORT, () => {
  console.log(`🌐 Codex WebSocket Server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`🔗 HTTP endpoint: http://localhost:${PORT}`);
  
  if (!MAW_MANAGER_ADDRESS) {
    console.warn('⚠️  MAW_MANAGER_ADDRESS not set - Maw events disabled');
  }
  if (!COSMETICS_V2_ADDRESS) {
    console.warn('⚠️  COSMETICS_V2_ADDRESS not set - Cosmetic events disabled');
  }
});

// Handle WebSocket upgrade
server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Codex server...');
  clients.forEach(client => {
    client.close();
  });
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});