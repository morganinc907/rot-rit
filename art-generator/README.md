# Rot & Ritual NFT Art Generator

Generate trait-based NFT art and metadata for **Main Raccoons** and **Demons** with customizable rarity distributions.

## 📁 Project Structure

```
art-generator/
├── config/
│   ├── raccoon-traits.json    # Raccoon trait configuration & rarities
│   └── demon-traits.json      # Demon trait configuration & rarities
├── layers/
│   ├── raccoons/               # Raccoon art layers
│   │   ├── backgrounds/
│   │   ├── bodies/
│   │   ├── eyes/
│   │   ├── mouths/
│   │   ├── accessories/
│   │   ├── hats/
│   │   └── special/            # Special edition art
│   └── demons/                 # Demon art layers
│       ├── backgrounds/
│       ├── forms/
│       ├── heads/
│       ├── faces/
│       ├── auras/
│       └── mythic/             # 1/1 Mythic demon art
├── output/
│   ├── raccoons/
│   │   ├── images/             # Generated raccoon PNGs
│   │   └── metadata/           # Generated raccoon metadata
│   └── demons/
│       ├── images/
│       │   ├── rare/           # Generated rare demon PNGs
│       │   └── mythic/         # Mythic demon PNGs (1/1s)
│       └── metadata/
│           ├── rare/           # Rare demon metadata
│           └── mythic/         # Mythic demon metadata
└── scripts/
    ├── generate-raccoons.js    # Main raccoon generator
    ├── generate-demons.js      # Demon generator
    └── setup-contract-traits.js # Contract trait setup helper
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd art-generator
npm install
```

### 2. Add Your Art Layers
Place your PNG art files in the appropriate layer folders:

**For Raccoons:**
- `layers/raccoons/backgrounds/` - Background images
- `layers/raccoons/bodies/` - Body variations  
- `layers/raccoons/eyes/` - Eye styles
- `layers/raccoons/mouths/` - Mouth expressions
- `layers/raccoons/accessories/` - Accessories (optional layer)
- `layers/raccoons/hats/` - Headwear (optional layer)
- `layers/raccoons/special/` - Special edition 1/1 art

**For Demons:**
- `layers/demons/backgrounds/` - Demon backgrounds
- `layers/demons/forms/` - Body forms
- `layers/demons/heads/` - Head variations
- `layers/demons/faces/` - Facial features
- `layers/demons/auras/` - Aura effects
- `layers/demons/mythic/` - 1/1 Mythic demon art

### 3. Generate Art
```bash
# Generate raccoons only
npm run generate:raccoons

# Generate demons only  
npm run generate:demons

# Generate everything
npm run generate:all

# Clean output folders
npm run clean
```

## 🎨 Customizing Traits & Rarities

### Editing Raccoon Traits

Edit `config/raccoon-traits.json`:

```json
{
  \"layers\": [
    {
      \"name\": \"backgrounds\",
      \"displayName\": \"Background\", 
      \"traits\": [
        {
          \"name\": \"Dark Forest\",
          \"weight\": 20,           // Higher = more common
          \"filename\": \"dark_forest.png\"
        },
        {
          \"name\": \"Blood Moon\",
          \"weight\": 5,            // Lower = more rare
          \"filename\": \"blood_moon.png\"
        }
      ]
    }
  ]
}
```

**Weight System:** 
- Higher weight = More common (appears more often)
- Lower weight = More rare (appears less often)
- Total weights don't need to add to 100

**Optional Layers:**
- Set `\"optional\": true` for layers that can be \"None\"
- \"None\" traits won't appear in metadata

### Editing Demon Traits

Edit `config/demon-traits.json`:

**Rare Demons (trait-based):**
```json
{
  \"rareLayers\": [
    {
      \"name\": \"forms\",
      \"displayName\": \"Form\",
      \"traits\": [
        {
          \"name\": \"Humanoid\",
          \"weight\": 30,
          \"filename\": \"humanoid.png\"
        }
      ]
    }
  ]
}
```

**Mythic Demons (1/1 art):**
```json
{
  \"mythicEditions\": [
    {
      \"id\": 10001,
      \"name\": \"Baal, Lord of Destruction\",
      \"description\": \"Ancient demon lord of unfathomable power\",
      \"filename\": \"baal.png\",
      \"attributes\": [
        { \"trait_type\": \"Power Level\", \"value\": \"Omega\" }
      ]
    }
  ]
}
```

## 📋 Step-by-Step Art Creation Process

### For Raccoons:

1. **Create Base Layers**
   - All images should be 1000x1000 pixels
   - Use PNG format with transparency (except backgrounds)
   - Name files exactly as specified in `filename` field

2. **Layer Order (bottom to top):**
   - `backgrounds/` - Solid background
   - `bodies/` - Raccoon body 
   - `eyes/` - Eye details
   - `mouths/` - Mouth/expression
   - `accessories/` - Items, clothing  
   - `hats/` - Headwear

3. **Special Editions:**
   - Create unique 1/1 art in `special/` folder
   - These override the layer system entirely

### For Demons:

1. **Rare Demon Layers (trait-based)**
   - All images should be 1000x1000 pixels
   - Layer order: backgrounds → forms → heads → faces → auras

2. **Mythic Demons (1/1)**  
   - Create unique artwork in `mythic/` folder
   - Each mythic has custom metadata attributes
   - No trait system - pure custom art

## ⚙️ Configuration Options

### Collection Settings
```json
{
  \"collection\": {
    \"name\": \"Your Collection Name\",
    \"description\": \"Collection description\",
    \"baseUri\": \"ipfs://YOUR_IPFS_HASH/\",
    \"totalSupply\": 1000
  }
}
```

### Rarity Calculation
The generator calculates rarity scores based on trait weights:
- Higher weight traits = lower rarity score
- Lower weight traits = higher rarity score
- Score added to metadata as \"Rarity Score\" attribute

## 🔗 Contract Integration

### Setting Up Demon Traits in Contract

1. **Generate trait setup script:**
```bash
npm run setup:traits
```

2. **Run the generated script:**
```bash
cd ../packages/contracts
npx hardhat run scripts/setup-demon-traits.js --network baseSepolia
```

This configures the Demons contract with your trait data for on-chain metadata generation.

### Metadata Compatibility

Generated metadata is fully compatible with your contracts:

**Raccoons:** Standard ERC721 metadata with trait attributes

**Demons:** 
- **Rare:** Matches contract's trait-based system
- **Mythic:** Simple metadata for 1/1 art pieces

## 🖼️ Image Requirements

### File Naming
- Must match exactly what's in config `\"filename\"` fields
- Use lowercase, underscores for spaces
- Examples: `dark_forest.png`, `burning_eyes.png`

### Dimensions
- **All images:** 1000x1000 pixels recommended
- **Backgrounds:** Opaque (no transparency)
- **Other layers:** Transparent PNG for proper layering

### Quality
- High resolution for NFT standards
- PNG format for transparency support
- Consistent art style across traits

## 🔍 Output Structure

After generation, you'll have:

```
output/
├── raccoons/
│   ├── images/1.png, 2.png, ...
│   └── metadata/1.json, 2.json, ..., _collection.json
└── demons/
    ├── images/
    │   ├── rare/1.png, 2.png, ...      
    │   └── mythic/10001.png, 10002.png, ...
    └── metadata/
        ├── rare/1.json, 2.json, ..., _collection.json
        └── mythic/10001.json, 10002.json, ..., _collection.json
```

## ❓ Troubleshooting

### Missing Art Files
- Generator creates placeholder images for missing files
- Replace placeholders with real art before final generation

### Duplicate Combinations  
- Generator automatically retries if duplicate trait combinations occur
- Increase trait variety if too many duplicates

### Contract Mismatch
- Ensure trait names in config match what contract expects
- Run `setup:traits` to sync contract with your configuration

## 📝 Notes

- **Cultist Raccoons:** Don't need generation - they're single static images
- **Mythic Demons:** Are 1/1 custom art pieces, not generated
- **Rarity weights:** Can be any positive number, don't need to sum to 100
- **Token IDs:** Raccoons start at 1, Rare demons start at 1, Mythic demons start at 10001

Happy generating! 🎨✨