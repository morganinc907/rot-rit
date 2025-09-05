const hre = require("hardhat");

async function main() {
  console.log('🎨 Finishing cosmetics creation (IDs 3-5)...');
  
  const [signer] = await hre.ethers.getSigners();
  const newCosmeticsAddress = "0x13290aCbf346B17E82C8be01178A7b74F20F748d";
  
  try {
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", newCosmeticsAddress);
    
    // Check what we have
    console.log('\n📋 Current status:');
    for (let id = 1; id <= 5; id++) {
      try {
        const exists = await cosmetics.typeExists(id);
        if (exists) {
          const info = await cosmetics.getCosmeticInfo(id);
          console.log(`   ✅ ID ${id}: ${info.name}`);
        } else {
          console.log(`   ❌ ID ${id}: Does not exist`);
        }
      } catch (e) {
        console.log(`   ❌ ID ${id}: Does not exist`);
      }
    }
    
    // Create remaining cosmetics (3-5)
    const remainingCosmetics = [
      {
        name: "pink",
        imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/pink_layer.png",
        previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/pink_layer.png",
        rarity: 3,
        slot: 2,
        monthlySetId: 1,
        maxSupply: 500
      },
      {
        name: "orange",
        imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/orange_layer.png",
        previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/orange_layer.png",
        rarity: 4,
        slot: 4,
        monthlySetId: 1,
        maxSupply: 250
      },
      {
        name: "underpants",
        imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/underpants_layer.png",
        previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/underpants_layer.png",
        rarity: 2,
        slot: 2,
        monthlySetId: 1,
        maxSupply: 750
      }
    ];
    
    console.log('\n🎨 Creating remaining cosmetics...');
    
    for (let i = 0; i < remainingCosmetics.length; i++) {
      const cosmetic = remainingCosmetics[i];
      
      console.log(`\n${i + 3}. Creating "${cosmetic.name}"...`);
      
      try {
        // Add gas price to avoid underpriced issues
        const tx = await cosmetics.createCosmeticType(
          cosmetic.name,
          cosmetic.imageURI,
          cosmetic.previewLayerURI,
          cosmetic.rarity,
          cosmetic.slot,
          cosmetic.monthlySetId,
          cosmetic.maxSupply,
          {
            gasLimit: 500000,
            gasPrice: hre.ethers.parseUnits('1', 'gwei')
          }
        );
        
        console.log('   Transaction sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('   ✅ Created in block:', receipt.blockNumber);
        
        // Wait a bit before next transaction
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`   ❌ Failed to create ${cosmetic.name}:`, error.message);
      }
    }
    
    // Final verification
    console.log('\n📋 Final status:');
    const allIds = [];
    
    for (let id = 1; id <= 5; id++) {
      try {
        const exists = await cosmetics.typeExists(id);
        if (exists) {
          const info = await cosmetics.getCosmeticInfo(id);
          console.log(`   ✅ ID ${id}: ${info.name} (Slot: ${info.slot}, Rarity: ${info.rarity})`);
          allIds.push(id);
        }
      } catch (e) {
        console.log(`   ❌ ID ${id}: Does not exist`);
      }
    }
    
    if (allIds.length === 5) {
      console.log('\n🎉 All cosmetics created! Ready for seasonal setup.');
      console.log(`Active IDs: [${allIds.join(', ')}]`);
    } else {
      console.log(`\n⚠️ Have ${allIds.length}/5 cosmetics`);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});