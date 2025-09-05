const hre = require("hardhat");

async function main() {
  console.log('🎨 Recreating your 5 cosmetics in new contract...');
  
  const [signer] = await hre.ethers.getSigners();
  const newCosmeticsAddress = "0x13290aCbf346B17E82C8be01178A7b74F20F748d";
  
  console.log('Deployer:', signer.address);
  console.log('New Cosmetics contract:', newCosmeticsAddress);
  
  try {
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", newCosmeticsAddress);
    
    // Define your 5 cosmetics from the old contract
    const cosmeticsToCreate = [
      {
        name: "glasses",
        imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/glasses_layer.png",
        previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/glasses_layer.png",
        rarity: 1,
        slot: 1, // HEAD
        monthlySetId: 1,
        maxSupply: 1000
      },
      {
        name: "strainer",
        imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/strainer_layer.png",
        previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/strainer_layer.png",
        rarity: 1,
        slot: 2, // FACE
        monthlySetId: 1,
        maxSupply: 1000
      },
      {
        name: "pink",
        imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/pink_layer.png",
        previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/pink_layer.png",
        rarity: 3,
        slot: 2, // FACE
        monthlySetId: 1,
        maxSupply: 500
      },
      {
        name: "orange",
        imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/orange_layer.png",
        previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/orange_layer.png",
        rarity: 4,
        slot: 4, // FUR
        monthlySetId: 1,
        maxSupply: 250
      },
      {
        name: "underpants",
        imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/underpants_layer.png",
        previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/underpants_layer.png",
        rarity: 2,
        slot: 2, // FACE
        monthlySetId: 1,
        maxSupply: 750
      }
    ];
    
    console.log('\n🎨 Creating cosmetics...');
    
    const createdIds = [];
    
    for (let i = 0; i < cosmeticsToCreate.length; i++) {
      const cosmetic = cosmeticsToCreate[i];
      
      console.log(`\n${i + 1}. Creating "${cosmetic.name}"...`);
      
      try {
        const tx = await cosmetics.createCosmeticType(
          cosmetic.name,
          cosmetic.imageURI,
          cosmetic.previewLayerURI,
          cosmetic.rarity,
          cosmetic.slot,
          cosmetic.monthlySetId,
          cosmetic.maxSupply
        );
        
        console.log('   Transaction sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('   ✅ Created in block:', receipt.blockNumber);
        
        // The ID will be i+1 since _nextTypeId starts at 1
        const expectedId = i + 1;
        createdIds.push(expectedId);
        
        // Verify it was created
        const exists = await cosmetics.typeExists(expectedId);
        if (exists) {
          const info = await cosmetics.getCosmeticInfo(expectedId);
          console.log(`   ID ${expectedId}: ${info.name} (Slot: ${info.slot}, Rarity: ${info.rarity})`);
        }
        
      } catch (error) {
        console.log(`   ❌ Failed to create ${cosmetic.name}:`, error.message);
      }
    }
    
    console.log('\n🎯 Summary:');
    console.log('Created cosmetic IDs:', createdIds);
    
    if (createdIds.length === 5) {
      console.log('\n✅ All 5 cosmetics created successfully!');
      
      console.log('\n🏪 Next: Set up seasonal system');
      console.log(`setCurrentCosmeticTypes([${createdIds.join(', ')}])`);
      
      console.log('\n🎲 Next: Set up sacrifice pool');
      console.log(`setCosmeticPool([1, ${createdIds.join(', ')}], [100, 100, 100, 100, 100, 100])`);
      
      return createdIds;
    } else {
      console.log(`❌ Only created ${createdIds.length}/5 cosmetics`);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Script failed:', error);
    process.exitCode = 1;
  });
}

module.exports = { main };