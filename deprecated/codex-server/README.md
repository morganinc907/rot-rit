# 🔮 Codex WebSocket Server

Real-time event streaming server for the Rot Ritual Codex. Listens to blockchain events and broadcasts them to connected clients via WebSocket.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   cd codex-server
   npm install
   ```

2. **Configure environment:**
   ```bash
   # Copy and edit .env file
   cp .env.example .env
   
   # Add your deployed contract addresses:
   MAW_MANAGER_ADDRESS=0xYourDeployedMawAddress
   COSMETICS_V2_ADDRESS=0xYourDeployedCosmeticsAddress
   RACCOONS_ADDRESS=0xYourDeployedRaccoonsAddress
   ```

3. **Add contract ABIs:**
   ```bash
   # Copy ABI files to abis/ directory
   cp ../artifacts/contracts/MawManager.sol/MawManager.json abis/
   cp ../artifacts/contracts/CosmeticsV2.sol/CosmeticsV2.json abis/
   cp ../artifacts/contracts/Raccoons.sol/Raccoons.json abis/
   ```

4. **Start the server:**
   ```bash
   npm start
   # or for development:
   npm run dev
   ```

## 📡 WebSocket Events

The server broadcasts these event types to connected clients:

### Sacrifice Events
```json
{
  "kind": "sacrifice",
  "time": 1699123456789,
  "tx": "0x...",
  "owner": "0x...",
  "raccoonId": "123",
  "success": false,
  "data": { "success": false }
}
```

### Demon Summoning
```json
{
  "kind": "demon_summoned", 
  "time": 1699123456789,
  "tx": "0x...",
  "owner": "0x...",
  "raccoonId": "123",
  "success": true,
  "demonId": "5",
  "data": { "demonId": "5", "success": true }
}
```

### Cosmetic Events
```json
{
  "kind": "equip",
  "time": 1699123456789,
  "tx": "0x...", 
  "owner": "0x...",
  "data": {
    "raccoonId": "123",
    "cosmeticId": "45",
    "slot": "1",
    "rarity": "3"
  }
}
```

### Outfit Binding
```json
{
  "kind": "outfit",
  "time": 1699123456789,
  "tx": "0x...",
  "owner": "0x...",
  "data": {
    "raccoonId": "123",
    "cosmeticIds": ["12", "8", "21", "5", "18"]
  }
}
```

## 🔧 API Endpoints

- `GET /health` - Server health status
- `GET /events?limit=20` - Get recent events
- `POST /test-event` - Send test event (development)

## 🎯 Frontend Integration

The Codex frontend connects via the `useCodexEvents` hook:

```javascript
import { useCodexEvents } from '../hooks/useCodexEvents';

const { events, connected } = useCodexEvents({
  wsUrl: 'ws://localhost:8080'
});
```

## 🛠 Development

- `npm run dev` - Start with nodemon for auto-reload
- `npm test` - Run test event generator
- Check `http://localhost:8080/health` for status

## 🔮 Event Mapping

Frontend `CodexEvent.jsx` handles these event types:

- `sacrifice` → 🩸 Red blood effects
- `demon_summoned` → 🔥 Fiery demon animation  
- `equip` → ✨ Sparkle cosmetic effects
- `unequip` → ⚡ Subtle removal effects
- `outfit` → 🎭 Mask outfit binding
- `relic_reward` → 🪙 Treasure effects
- `cosmetic_reward` → ✨ Special reward sparkles

## ⚠️ Notes

- Server includes fallback minimal ABIs if files not found
- Graceful WebSocket reconnection built-in
- Event history stored for new connections
- CORS enabled for development