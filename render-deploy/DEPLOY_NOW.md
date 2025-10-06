# 🚀 DEPLOY NOW - 3 Easy Options

## Option 1: Vercel Web Interface (Easiest)

### Step 1: Go to vercel.com
1. Visit [vercel.com](https://vercel.com)
2. Sign up/login with GitHub, Google, or email
3. Click "Add New Project"

### Step 2: Import This Project  
1. Click "Import Git Repository" 
2. Or drag and drop the `/api` folder
3. Vercel will auto-detect it's a Node.js project

### Step 3: Configure
```
Project Name: raccoon-metadata-api
Framework Preset: Other
Root Directory: (leave default)
Build Command: (leave empty - not needed)
Output Directory: (leave empty)
Install Command: npm install
```

### Step 4: Deploy!
Click "Deploy" - takes ~30 seconds

---

## Option 2: Manual Upload

If Git isn't connected, just zip the `/api` folder and upload to any hosting service:

### Ready Files:
```
api/
├── server.js ✅
├── package.json ✅  
├── vercel.json ✅
└── README.md ✅
```

---

## Option 3: Command Line (If You Want to Try)

```bash
cd /Users/seanmorgan/Desktop/rot-ritual-organized/api

# Try manual token approach
npx vercel login
# Follow browser prompts

# Then deploy
npx vercel --prod --yes
```

---

## 🎯 After Deployment

You'll get a URL like: `https://raccoon-metadata-api-xyz.vercel.app`

### Update the Contract:
```bash
cd ../packages/contracts

# Edit this line in scripts/update-api-endpoint.cjs:
const PRODUCTION_API_URL = "https://YOUR-ACTUAL-VERCEL-URL.vercel.app";

# Run the update:
PRIVATE_KEY=b861c6884ab3a602c54896010176bc4f89c563daba457b00a7838f5eb135cd45 npx hardhat run scripts/update-api-endpoint.cjs --network baseSepolia
```

### Test It Works:
```bash
curl "https://YOUR-URL.vercel.app/health"
curl "https://YOUR-URL.vercel.app/raccoon/4?cosmetics=0x530c1843d3edf5bde4952b8a1b5ae948c3dc8b0b&chain=84532"
```

## 🎉 Result

Your NFTs will show equipped cosmetics in MetaMask, OpenSea, and all wallets! 

**The hard part (contracts) is done - this is just the final hosting step!** 🚀