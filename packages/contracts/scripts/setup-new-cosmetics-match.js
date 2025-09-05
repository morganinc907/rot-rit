const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🎨 Setting up NEW cosmetics contract to match OLD one...");
  console.log("User:", deployer.address);
  
  // Load contract addresses
  const addressesPath = '../../addresses/addresses.json';
  const addresses = require(addressesPath);
  const { baseSepolia: contractAddresses } = addresses;
  
  console.log("\n📍 Contract Addresses:");
  console.log("Old Cosmetics (working):", contractAddresses.Cosmetics);
  console.log("New Cosmetics (target):", contractAddresses.CosmeticsV2_NEW);
  
  // Get both contracts
  const OldCosmetics = await hre.ethers.getContractAt(
    "CosmeticsV2",
    contractAddresses.Cosmetics
  );
  
  const NewCosmetics = await hre.ethers.getContractAt(
    "CosmeticsV2", 
    contractAddresses.CosmeticsV2_NEW
  );
  
  // First, get the cosmetics from the old contract
  console.log("\n🔍 Reading cosmetics from OLD contract:");
  const cosmeticsToSetup = [];
  
  for (let typeId = 1; typeId <= 5; typeId++) {
    try {
      const cosmeticInfo = await OldCosmetics.getCosmeticInfo(typeId);
      const cosmetic = {
        typeId,
        name: cosmeticInfo[0],
        description: cosmeticInfo[1], 
        imageURI: cosmeticInfo[2],
        slot: cosmeticInfo[3],
        rarity: cosmeticInfo[4],
        supply: cosmeticInfo[5],
        unlimited: cosmeticInfo[6]
      };
      cosmeticsToSetup.push(cosmetic);
      
      console.log(`  Type ${typeId}: ${cosmetic.name} (slot: ${cosmetic.slot}, rarity: ${cosmetic.rarity})`);
      console.log(`    Image: ${cosmetic.imageURI}`);
    } catch (err) {
      console.log(`  Type ${typeId}: Not configured in old contract`);
    }
  }
  
  console.log(`\n📝 Found ${cosmeticsToSetup.length} cosmetics to configure in NEW contract`);
  
  // Now configure them in the new contract
  console.log("\n🔧 Setting up cosmetics in NEW contract...");
  
  for (const cosmetic of cosmeticsToSetup) {
    try {
      console.log(`\n⚙️ Setting up Type ${cosmetic.typeId}: ${cosmetic.name}...`);
      
      // Fix invalid rarity (contract requires >= 1)
      const rarity = cosmetic.rarity === 0 ? 1 : cosmetic.rarity;
      
      const tx = await NewCosmetics.createCosmeticType(
        cosmetic.name,
        cosmetic.imageURI,
        cosmetic.description, // previewLayerURI
        rarity,
        cosmetic.slot,
        1, // monthlySetId
        cosmetic.supply || 1000 // maxSupply
      );
      
      console.log(`📤 Transaction: ${tx.hash}`);
      console.log(`⏳ Waiting for confirmation...`);
      
      const receipt = await tx.wait();
      console.log(`✅ Configured! Gas used: ${receipt.gasUsed}`);
      
    } catch (error) {
      console.error(`❌ Error configuring Type ${cosmetic.typeId}:`, error.message);
    }
  }
  
  // Verify the setup
  console.log("\n🔍 Verifying NEW contract configuration:");
  for (let typeId = 1; typeId <= 5; typeId++) {
    try {
      const cosmeticInfo = await NewCosmetics.getCosmeticInfo(typeId);
      console.log(`  Type ${typeId}: ${cosmeticInfo[0]} (slot: ${cosmeticInfo[3]}, rarity: ${cosmeticInfo[4]})`);
    } catch (err) {
      console.log(`  Type ${typeId}: Not configured`);
    }
  }
  
  console.log("\n✅ NEW cosmetics contract setup complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});