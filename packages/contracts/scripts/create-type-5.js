const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🎨 Creating cosmetic type 5...");
  console.log("User:", deployer.address);
  
  // Load contract addresses
  const addressesPath = '../../addresses/addresses.json';
  const addresses = require(addressesPath);
  const { baseSepolia: contractAddresses } = addresses;
  
  const Cosmetics = await hre.ethers.getContractAt(
    "CosmeticsV2",
    contractAddresses.Cosmetics
  );
  
  const cosmetic = {
    name: "underpants",
    imageURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/underpants_layer.png",
    previewLayerURI: "ipfs://bafybeidoz73tozgkv5eoqulpw7fepfpr7ds42l2zbkf45gxccpjmvi3n7a/underpants_layer.png",
    rarity: 2,
    slot: 2, // BODY
    maxSupply: 1000
  };
  
  try {
    console.log(`\n⚙️ Creating cosmetic 5: ${cosmetic.name}...`);
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
        gasPrice: hre.ethers.parseUnits('5', 'gwei'), // Very high gas price
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
  }
  
  // Verify type 5 exists
  console.log("\n🔍 Verifying type 5:");
  try {
    const cosmeticInfo = await Cosmetics.getCosmeticInfo(5);
    console.log(`  Type 5: ${cosmeticInfo[0]} (slot: ${cosmeticInfo[4]}, rarity: ${cosmeticInfo[3]}, active: ${cosmeticInfo[6]})`);
  } catch (err) {
    console.log(`  Type 5: ❌ Does not exist - ${err.message}`);
  }
  
  console.log("\n✅ Type 5 creation attempt complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});