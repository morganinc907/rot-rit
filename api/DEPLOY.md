# 🚀 Deploy Raccoon Metadata API to Vercel

## ⚡ Quick Deploy (2 minutes)

### Step 1: Deploy to Vercel
```bash
cd /Users/seanmorgan/Desktop/rot-ritual-organized/api

# Login to Vercel (opens browser)
npx vercel login

# Deploy to production
npx vercel --prod --yes
```

### Step 2: Get Your URL
Vercel will give you a URL like: `https://raccoon-api-abc123.vercel.app`

### Step 3: Update Contract
```bash
cd ../packages/contracts

# Edit the script to use your real Vercel URL:
# Change line 11 in scripts/update-api-endpoint.cjs:
# const PRODUCTION_API_URL = "https://YOUR-VERCEL-URL.vercel.app";

# Run the update
PRIVATE_KEY=your_key npx hardhat run scripts/update-api-endpoint.cjs --network baseSepolia
```

### Step 4: Test It Works
```bash
# Test your deployed API
curl "https://YOUR-VERCEL-URL.vercel.app/health"

# Test raccoon metadata  
curl "https://YOUR-VERCEL-URL.vercel.app/raccoon/4?cosmetics=0x530c1843d3edf5bde4952b8a1b5ae948c3dc8b0b&chain=84532"
```

## 🎯 Expected Result

After deployment, when someone views Raccoon #4 in MetaMask or OpenSea:

1. **Wallet calls**: `raccoons.tokenURI(4)`
2. **Contract returns**: `"https://YOUR-VERCEL-URL.vercel.app/raccoon/4?cosmetics=0x530...&chain=84532"`
3. **Your API returns**: JSON with raccoon + equipped cosmetics metadata
4. **Wallet displays**: Dynamic NFT image with head cosmetic equipped! 🎩

## 🚨 Alternative: Manual Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Connect your GitHub account
3. Import the `/api` folder as new project
4. Deploy automatically!

## 🎨 Files Ready for Deployment

- ✅ `server.js` - Main API service
- ✅ `package.json` - Dependencies 
- ✅ `vercel.json` - Vercel configuration
- ✅ `README.md` - Documentation

Everything is ready to deploy! Just need the login step. 🚀