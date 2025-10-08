# 🚀 Render.com Deployment Guide

## Files Ready for Deployment

The `/render-deploy/` directory is ready to deploy to Render.com.

## Required Files (All Present ✅)
- `server.js` - Main API server with /metadata endpoint
- `package.json` - Dependencies configured for production
- `renderer.js` - Raccoon image rendering logic
- `r2-storage.js` - Cloudflare R2 storage integration
- `render-queue.js` - Request queue management
- `.env` - Environment variables (see below)

## How to Deploy to Render.com

### Option 1: Manual Upload (Easiest)

1. **Go to Render.com Dashboard**
   - Navigate to https://dashboard.render.com
   - Log in to your account

2. **Find Your Existing Service**
   - Look for `rotrit5` (the existing service at `rotrit5.onrender.com`)
   - OR create a new Web Service

3. **Update the Service**
   - Go to the service settings
   - Click "Manual Deploy" > "Clear build cache & deploy"
   - OR use the "Deploy" tab to connect to GitHub

4. **Upload Files** (if manual)
   - Upload the contents of `/render-deploy/` directory
   - Ensure all `.js` files are included

### Option 2: GitHub Auto-Deploy (Recommended)

1. **Push to GitHub**
   ```bash
   cd /Users/seanmorgan/Desktop/rot-ritual-organized
   git add render-deploy/
   git commit -m "Update metadata API with /metadata endpoint"
   git push
   ```

2. **Connect Render.com to GitHub**
   - In Render.com dashboard, edit your service
   - Connect to GitHub repository
   - Set **Root Directory**: `render-deploy`
   - Set **Build Command**: (leave empty)
   - Set **Start Command**: `npm start`

3. **Deploy**
   - Render.com will auto-deploy on every push

## Environment Variables

Make sure these are set in Render.com dashboard under "Environment":

```bash
# Required
RACCOON_RENDERER=0x5c83B09AAb6ac95F1DFc9B6CEE66418D1D94d0fF
COSMETICS_ADDRESS=0x5D4E264c978860F2C73a689F414f302ad23dC5FB

# RPC Provider
RPC_URL=https://base-sepolia.g.alchemy.com/v2/zKNiUSIu9BaCLgkB0f4x6
PORT=3001

# IPFS CIDs
IPFS_BASE_CID=bafybeihn54iawusfxzqzkxzdcidkgejom22uhwpquqrdl5frmnwhilqi4m
IPFS_TRAITS_CID=bafybeiaxmevcthi76k45i6buodpefmoavhdxdnsxrmliedytkzk4n2zt24

# Cloudflare R2 Storage
R2_ACCOUNT_ID=ef8f01117eb1620afff97d07f238f8be
R2_ACCESS_KEY_ID=9da2fc4f3df4cbad599032d7f94fcc96
R2_SECRET_ACCESS_KEY=68e8ca8bb527051ffc376b2a24ae5f8433826495e9c9df2253f55af72da46218
R2_BUCKET_NAME=renderedraccoons
R2_PUBLIC_URL=https://cdn.rotandritual.work
```

## After Deployment

1. **Test the Endpoints**
   ```bash
   # Health check
   curl https://rotrit5.onrender.com/health

   # Metadata with equipped cosmetics
   curl https://rotrit5.onrender.com/metadata/1

   # Legacy endpoint (redirects to /metadata)
   curl -L https://rotrit5.onrender.com/raccoon/1?cosmetics=0x5d4e264c978860f2c73a689f414f302ad23dc5fb&chain=84532
   ```

2. **Update the Contract**
   After deployment succeeds, update the Raccoons contract:
   ```bash
   cd /Users/seanmorgan/Desktop/rot-ritual-organized/packages/contracts

   # Update dynamicMetadataURI to production URL
   PRIVATE_KEY=b861c6884ab3a602c54896010176bc4f89c563daba457b00a7838f5eb135cd45 \
   npx hardhat run scripts/update-production-metadata-uri.cjs --network baseSepolia
   ```

## Key Endpoints

- `GET /health` - Health check with contract addresses
- `GET /metadata/:id` - Dynamic metadata (reads equipped cosmetics from chain)
- `GET /render/:id?head=X&face=X&body=X&fur=X&background=X` - Render raccoon image
- `GET /raccoon/:tokenId` - Legacy endpoint (redirects to /metadata)

## What Changed

✅ `/metadata/:id` endpoint now reads equipped cosmetics directly from CosmeticsV2 contract
✅ `/raccoon` endpoint redirects to `/metadata` (for contract compatibility)
✅ Fixed p-limit dependency for CommonJS compatibility
✅ Production-ready error handling and caching

## Current Status

- ✅ Local testing complete
- ✅ All dependencies configured
- ⏳ Waiting for Render.com deployment
- ⏳ Contract needs production URL update

## Your Current URL

Your existing Render.com service: **https://rotrit5.onrender.com**

This deployment will update that service with the new metadata API that reads equipped cosmetics from the blockchain.
