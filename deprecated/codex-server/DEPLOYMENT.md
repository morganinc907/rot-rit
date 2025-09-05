# Codex WebSocket Server - Production Deployment Guide

## Quick Start

### 1. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```

**For Testing (Mock Mode)** - Use this before contracts are deployed:
```env
MOCK_MODE=true
PORT=8080
NODE_ENV=development
```

**For Production (Live Mode)** - Use this after contracts are deployed:
```env
MOCK_MODE=false
RPC_URL=https://sepolia.base.org
MAW_MANAGER_ADDRESS=0x1234567890123456789012345678901234567890
COSMETICS_V2_ADDRESS=0x1234567890123456789012345678901234567890
RACCOONS_ADDRESS=0x1234567890123456789012345678901234567890
PORT=8080
NODE_ENV=production
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Server
```bash
# Mock Mode (generates fake events)
npm run mock

# Development (with live contracts)
npm run dev

# Production (with live contracts)
npm run prod

# With PM2 (recommended for production)
npm install -g pm2
npm run pm2:start
```

## Features Implemented

✅ **Raccoon Transfer Events** - Tracks NFT mints and transfers  
✅ **Event Shape Consistency** - All events follow the same `{kind, time, tx, owner, data, blockNumber}` structure  
✅ **Production Logging** - Enhanced error handling and detailed logging  
✅ **Personal History API** - `/subscribe?owner=0x...` endpoint for user-specific events  
✅ **PM2 Integration** - Production process management with auto-restart  
✅ **Testing Endpoints** - `/test-event` and `/test-demon` for development  
✅ **Mock Mode** - Generate realistic fake events for testing without deployed contracts

## Event Types Supported

| Event Type | Source Contract | Description |
|------------|----------------|-------------|
| `demon_summoned` | MawManager | Successful demon summoning |
| `sacrifice` | MawManager | Failed sacrifice attempt |
| `relic_reward` | MawManager | Relic discovered |
| `cosmetic_reward` | MawManager | Cosmetic granted |
| `equip` | CosmeticsV2 | Cosmetic equipped |
| `unequip` | CosmeticsV2 | Cosmetic unequipped |
| `outfit` | CosmeticsV2 | Complete outfit bound |
| `raccoon_minted` | Raccoons | New raccoon NFT minted |
| `raccoon_transferred` | Raccoons | Raccoon NFT transferred |

## API Endpoints

### Health Check
```bash
GET /health
```
Returns server status, client count, and contract connection status.

### Recent Events
```bash
GET /events?limit=20
```
Returns the last N events (default 20).

### Personal History
```bash
GET /subscribe?owner=0x1234...&limit=10
```
Returns events for a specific wallet address.

### Testing
```bash
# Test general event
POST /test-event

# Test demon summoning (triggers ritual overlay)
POST /test-demon
curl -X POST http://localhost:8080/test-demon \
  -H 'Content-Type: application/json' \
  -d '{"owner":"0x1234...","demonId":"666"}'
```

## Frontend Integration

The Codex frontend automatically connects to `ws://localhost:8080` and:
- Displays all events in the live feed (`/codex-live`)
- Shows toast notifications for high-value events
- Triggers full-screen ritual overlays for demon summons
- Handles reconnection automatically

## Production Commands

```bash
# Start with PM2
npm run pm2:start

# View logs
npm run pm2:logs

# Restart server
npm run pm2:restart

# Stop server
npm run pm2:stop

# Health check
npm run health
```

## Monitoring

The server provides comprehensive logging:
- 📡 Broadcast events with success/failure counts
- 🔥 High-value events (demon summons, sacrifices, relics)
- 💥 Error handling for failed WebSocket sends
- 🔮 Client connection/disconnection tracking

## Testing the Complete System

### Mock Mode Testing (Before Contract Deployment)

1. **Start the server in mock mode:**
   ```bash
   cd codex-server
   npm run mock
   ```

2. **Start the frontend:**
   ```bash
   npm start
   ```

3. **Navigate to `/codex-live`** in your browser

4. **Watch automatic events:**
   - Server generates realistic fake events every 5-10 seconds
   - All event types are covered: sacrifices, demon summons, cosmetics, etc.
   - Toast notifications appear for high-value events
   - Ritual overlays trigger for demon summons

### Live Mode Testing (After Contract Deployment)

1. **Update `.env` with real contract addresses:**
   ```env
   MOCK_MODE=false
   MAW_MANAGER_ADDRESS=0x...
   COSMETICS_V2_ADDRESS=0x...
   RACCOONS_ADDRESS=0x...
   ```

2. **Start the server:**
   ```bash
   npm run dev
   ```

3. **Test with real transactions on Base Sepolia**

## Contract Deployment

Make sure your contracts are deployed and the addresses are correctly set in `.env`. The server will warn if contract addresses are missing but will still run with minimal ABIs for development.

## Performance

- Handles 50+ concurrent WebSocket connections
- Stores last 50 events in memory for new connections
- Auto-cleanup of dead WebSocket connections
- Exponential backoff for failed broadcasts
- Memory limit: 500MB (configurable in `ecosystem.config.js`)

---

🔮 **Your Codex WebSocket Server is now production-ready!**