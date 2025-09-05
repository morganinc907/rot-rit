const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🎨 Creating missing cosmetic types...");
  console.log("User:", deployer.address);
  
  // Load contract addresses
  const addressesPath = '../../addresses/addresses.json';
  const addresses = require(addressesPath);
  const { baseSepolia: contractAddresses } = addresses;
  
  const Cosmetics = await hre.ethers.getContractAt(
    "CosmeticsV2",
    contractAddresses.Cosmetics
  );
  
  // Define the missing cosmetics (types 2-5)
  const cosmeticsToCreate = [
    {
      name: "strainer",
      imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/strainer_layer.png",
      previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/strainer_layer.png",
      rarity: 1,
      slot: 2, // BODY
      maxSupply: 1000
    },
    {
      name: "pink",
      imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/pink_layer.png",
      previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/pink_layer.png",
      rarity: 3,
      slot: 2, // BODY
      maxSupply: 1000
    },
    {
      name: "orange",
      imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/orange_layer.png",
      previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/orange_layer.png",
      rarity: 4,
      slot: 4, // BACKGROUND
      maxSupply: 1000
    },
    {
      name: "underpants",
      imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/underpants_layer.png",
      previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/underpants_layer.png",
      rarity: 2,
      slot: 2, // BODY
      maxSupply: 1000
    }
  ];
  
  console.log(`\n🔧 Creating ${cosmeticsToCreate.length} missing cosmetic types...`);
  
  // Create each cosmetic type with higher gas price
  for (let i = 0; i < cosmeticsToCreate.length; i++) {
    const cosmetic = cosmeticsToCreate[i];
    const expectedTypeId = i + 2; // Types 2, 3, 4, 5
    
    try {
      console.log(`\n⚙️ Creating cosmetic ${expectedTypeId}: ${cosmetic.name}...`);
      console.log(`   Rarity: ${cosmetic.rarity}, Slot: ${cosmetic.slot}, Max Supply: ${cosmetic.maxSupply}`);
      
      const tx = await Cosmetics.createCosmeticType(
        cosmetic.name,
        cosmetic.imageURI,
        cosmetic.previewLayerURI,
        cosmetic.rarity,
        cosmetic.slot,
        1, // monthlySetId
        cosmetic.maxSupply,
        {
          gasPrice: hre.ethers.parseUnits('2', 'gwei'), // Higher gas price
          gasLimit: 500000
        }
      );
      
      console.log(`📤 Transaction: ${tx.hash}`);
      console.log(`⏳ Waiting for confirmation...`);
      
      const receipt = await tx.wait();
      console.log(`✅ Created! Gas used: ${receipt.gasUsed}`);
      
      // Parse events to get the type ID
      for (const log of receipt.logs) {
        try {
          const parsed = Cosmetics.interface.parseLog(log);
          if (parsed && parsed.name === 'CosmeticTypeCreated') {
            console.log(`🆔 Created with Type ID: ${parsed.args.typeId}`);
          }
        } catch {
          // Skip non-cosmetics events
        }
      }
      
    } catch (error) {
      console.error(`❌ Error creating ${cosmetic.name}:`, error.message);
      
      if (error.message.includes('Type exists')) {
        console.log(`   ✅ Type ${expectedTypeId} already exists, continuing...`);
      } else if (error.message.includes('replacement transaction underpriced')) {
        console.log(`   ⏳ Waiting 10 seconds and trying again...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        try {
          // Retry with even higher gas price
          const retryTx = await Cosmetics.createCosmeticType(
            cosmetic.name,
            cosmetic.imageURI,
            cosmetic.previewLayerURI,
            cosmetic.rarity,
            cosmetic.slot,
            1, // monthlySetId
            cosmetic.maxSupply,
            {
              gasPrice: hre.ethers.parseUnits('3', 'gwei'), // Even higher
              gasLimit: 500000
            }
          );
          
          console.log(`📤 Retry transaction: ${retryTx.hash}`);
          const retryReceipt = await retryTx.wait();
          console.log(`✅ Retry successful! Gas used: ${retryReceipt.gasUsed}`);
          
        } catch (retryError) {
          console.error(`❌ Retry failed:`, retryError.message);
        }
      }
    }
  }
  
  // Verify all types now exist
  console.log("\n🔍 Verifying all cosmetic types:");
  for (let typeId = 1; typeId <= 5; typeId++) {
    try {
      const cosmeticInfo = await Cosmetics.getCosmeticInfo(typeId);
      console.log(`  Type ${typeId}: ${cosmeticInfo[0]} (slot: ${cosmeticInfo[4]}, rarity: ${cosmeticInfo[3]}, active: ${cosmeticInfo[6]})`);
    } catch (err) {
      console.log(`  Type ${typeId}: ❌ Does not exist`);
    }
  }
  
  console.log("\n✅ Missing cosmetics creation complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});