# 🚀 Ready to Deploy

## Quick Steps

### 1. Deploy to Render.com

**Upload these files to your Render.com service (`rotrit5`):**

```
render-deploy/
├── server.js          ← Main API server
├── package.json       ← Dependencies (updated)
├── renderer.js        ← Image rendering
├── r2-storage.js      ← R2 storage
├── render-queue.js    ← Queue management
└── .env              ← Environment variables
```

**OR** if using GitHub auto-deploy:
```bash
git add render-deploy/
git commit -m "Update metadata API for equipped cosmetics"
git push
```

### 2. Test the Deployment

```bash
# Should return equipped cosmetics for token 1
curl https://rotrit5.onrender.com/metadata/1
```

### 3. Update Contract to Production URL

```bash
cd /Users/seanmorgan/Desktop/rot-ritual-organized/packages/contracts

PRIVATE_KEY=b861c6884ab3a602c54896010176bc4f89c563daba457b00a7838f5eb135cd45 \
npx hardhat run scripts/update-production-metadata-uri.cjs --network baseSepolia
```

## What's Fixed

✅ `/metadata/:id` endpoint reads equipped cosmetics from blockchain
✅ `/raccoon` redirects to `/metadata` (contract compatibility)
✅ Fixed p-limit CommonJS compatibility
✅ Production-ready with caching and error handling

## Endpoints After Deployment

- `GET /health` - Health check
- `GET /metadata/1` - Metadata with equipped cosmetics
- `GET /raccoon/1?cosmetics=0x...` - Legacy endpoint

## Current State

- Contract address: `0xE2DA9cC68789A52c4594FB4276823165734f0F28`
- Current dynamicMetadataURI: `http://localhost:3001` (needs update)
- Target URL: `https://rotrit5.onrender.com`

See `RENDER_DEPLOY_GUIDE.md` for detailed instructions.
