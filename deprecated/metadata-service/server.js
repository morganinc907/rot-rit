const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// Contract addresses and ABIs
const CONTRACTS = {
  84532: { // Base Sepolia
    raccoons: "0x94A3b9aF19728B8ed34ff7435b4dFe9279909EF7",
    cosmetics: "0x0De59eF75dDf2D7c6310f5F8c84bb52e6E0873B3"
  }
};

const COSMETICS_ABI = [
  "function getEquippedCosmetics(uint256 raccoonId) external view returns (uint256 headTypeId, uint256 faceTypeId, uint256 bodyTypeId, uint256 furTypeId, uint256 backgroundTypeId)",
  "function getCosmeticInfo(uint256 typeId) external view returns (string memory name, string memory imageURI, string memory previewLayerURI, uint8 rarity, uint8 slot, uint256 monthlySetId, bool active)"
];

// IPFS configuration
const STATIC_IPFS_CID = "bafybeidx3e4ps4zydxigku7v3dlnwzerexwcbleze5e7q3bms6h5exfxd4";
const IMAGES_CID = "bafybeiaxmevcthi76k45i6buodpefmoavhdxdnsxrmliedytkzk4n2zt24";
const TRAIT_IPFS_CID = "bafybeihf3n2no5ol3hspz3ur6nncwlfmej6crnxc54wqnxiu4syi4nlbfe";

// Provider setup
const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");

const SLOT_NAMES = {
  0: "head",
  1: "face", 
  2: "body",
  3: "fur",
  4: "background"
};

const SLOT_Z_INDEX = {
  "background": 5,
  "fur": 10, 
  "body": 30,
  "face": 40,
  "head": 50
};

// Fetch IPFS content
async function fetchIPFS(cid) {
  const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
  if (!response.ok) {
    throw new Error(`IPFS fetch failed: ${response.statusText}`);
  }
  return response.json();
}

// Generate dynamic metadata for a raccoon with cosmetics
app.get('/raccoon/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { cosmetics: cosmeticsAddress, chain } = req.query;
    
    const chainId = parseInt(chain) || 84532;
    const contracts = CONTRACTS[chainId];
    
    if (!contracts) {
      return res.status(400).json({ error: 'Unsupported chain' });
    }
    
    console.log(`🎭 Generating dynamic metadata for raccoon #${tokenId}`);
    
    // 1. Fetch original raccoon metadata from IPFS
    const originalMetadata = await fetchIPFS(`${STATIC_IPFS_CID}/${tokenId}.json`);
    console.log(`📄 Fetched original metadata:`, originalMetadata.name);
    
    // 2. Query equipped cosmetics from on-chain
    const cosmeticsContractAddress = ethers.getAddress(cosmeticsAddress || contracts.cosmetics);
    const cosmeticsContract = new ethers.Contract(cosmeticsContractAddress, COSMETICS_ABI, provider);
    const [headId, faceId, bodyId, furId, bgId] = await cosmeticsContract.getEquippedCosmetics(tokenId);
    
    console.log(`🎨 Equipped cosmetics: head=${headId}, face=${faceId}, body=${bodyId}, fur=${furId}, bg=${bgId}`);
    
    // 3. Fetch cosmetic details for equipped items
    const equippedCosmetics = [];
    const cosmeticIds = [
      { id: headId, slot: 0 },
      { id: faceId, slot: 1 },
      { id: bodyId, slot: 2 },
      { id: furId, slot: 3 },
      { id: bgId, slot: 4 }
    ];
    
    for (const { id, slot } of cosmeticIds) {
      if (id > 0) {
        try {
          const [name, imageURI, previewLayerURI, rarity, slotNum, monthlySetId, active] = 
            await cosmeticsContract.getCosmeticInfo(id);
          
          equippedCosmetics.push({
            slot: SLOT_NAMES[slot],
            cosmetic_id: id.toString(),
            name,
            rarity: parseInt(rarity),
            image: previewLayerURI || imageURI,
            monthly_set: monthlySetId.toString(),
            active
          });
        } catch (error) {
          console.error(`Failed to fetch cosmetic info for ID ${id}:`, error.message);
        }
      }
    }
    
    // 4. Generate dynamic metadata
    const hasCosmetics = equippedCosmetics.length > 0;
    const dynamicMetadata = {
      name: originalMetadata.name,
      description: hasCosmetics 
        ? `${originalMetadata.description} Equipped with ${equippedCosmetics.length} cosmetic${equippedCosmetics.length > 1 ? 's' : ''}.`
        : originalMetadata.description,
      
      // Dynamic composite image URL
      image: hasCosmetics 
        ? `${req.protocol}://${req.get('host')}/render/${tokenId}?cosmetics=${cosmeticsAddress}&chain=${chainId}`
        : `https://ipfs.io/ipfs/${IMAGES_CID}/${tokenId}.png`,
      
      // Preserve original traits for rarity calculations
      original_traits: originalMetadata.attributes?.map(attr => ({
        ...attr,
        is_original: true
      })) || [],
      
      // Show equipped cosmetics
      equipped_cosmetics: equippedCosmetics,
      
      // Combined attributes view (what marketplaces will see)
      attributes: [
        ...(originalMetadata.attributes?.map(trait => ({
          ...trait,
          is_original: true
        })) || []),
        ...equippedCosmetics.map(cosmetic => ({
          trait_type: `equipped_${cosmetic.slot}`,
          value: cosmetic.name,
          is_cosmetic: true,
          rarity: cosmetic.rarity
        }))
      ],
      
      // Metadata about the dynamic system
      dynamic_metadata: {
        generated_at: Date.now(),
        cosmetics_contract: cosmeticsAddress,
        chain_id: chainId,
        has_cosmetics: hasCosmetics,
        cosmetics_count: equippedCosmetics.length
      }
    };
    
    console.log(`✅ Generated dynamic metadata with ${equippedCosmetics.length} cosmetics`);
    res.json(dynamicMetadata);
    
  } catch (error) {
    console.error('Error generating dynamic metadata:', error);
    res.status(500).json({ 
      error: 'Failed to generate dynamic metadata',
      details: error.message 
    });
  }
});

// Generate composite image (placeholder for now)
app.get('/render/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { cosmetics: cosmeticsAddress, chain } = req.query;
    
    // For now, redirect to original image
    // TODO: Implement actual image composition using individual trait layers
    const imageUrl = `https://ipfs.io/ipfs/${IMAGES_CID}/${tokenId}.png`;
    
    console.log(`🖼️ Rendering composite image for raccoon #${tokenId} (placeholder)`);
    res.redirect(imageUrl);
    
  } catch (error) {
    console.error('Error rendering composite image:', error);
    res.status(500).json({ 
      error: 'Failed to render composite image',
      details: error.message 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: Date.now(),
    contracts: CONTRACTS
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Dynamic metadata service running on port ${PORT}`);
  console.log(`📋 Supported chains: ${Object.keys(CONTRACTS).join(', ')}`);
});