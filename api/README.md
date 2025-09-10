# Raccoon Metadata API

This API service generates dynamic NFT metadata for Rot Ritual Raccoons with equipped cosmetics.

## How it works

1. **Raccoons contract** detects equipped cosmetics and generates dynamic metadata URLs
2. **This API** receives requests with raccoon ID and cosmetics contract address  
3. **RaccoonRenderer contract** (on-chain) generates the actual metadata with SVG images
4. **API returns** the formatted JSON metadata to wallets and marketplaces

## Endpoints

### `GET /health`
Health check endpoint

### `GET /raccoon/:tokenId?cosmetics=0x...&chain=84532`
Dynamic metadata for raccoons with equipped cosmetics

**Example:**
```
GET /raccoon/4?cosmetics=0x530c1843d3edf5bde4952b8a1b5ae948c3dc8b0b&chain=84532
```

Returns JSON metadata with:
- Name and description
- Dynamic SVG image with cosmetics layers
- Attributes for each equipped cosmetic
- Trait for "Cosmetics Applied" count

### `GET /static/:tokenId` 
Fallback for raccoons without cosmetics (redirects to IPFS)

## Setup

```bash
npm install
npm run dev  # Development with nodemon
npm start    # Production
```

## Environment Variables

- `PORT` - API port (default: 3001)

## Contract Addresses (Base Sepolia)

- **RaccoonRenderer**: `0x5c83B09AAb6ac95F1DFc9B6CEE66418D1D94d0fF`
- **New Raccoons**: `0xE2DA9cC68789A52c4594FB4276823165734f0F28` 
- **Cosmetics**: `0x530c1843D3eDF5BDE4952b8a1B5Ae948c3dc8B0B`

## Flow

```
Raccoon #4 has head cosmetic equipped
     ↓
Raccoons.tokenURI(4) returns:
"https://your-api.com/raccoon/4?cosmetics=0x530...&chain=84532"
     ↓  
API calls RaccoonRenderer.tokenURI(4) on-chain
     ↓
Returns JSON metadata with SVG image showing raccoon + cosmetics
```