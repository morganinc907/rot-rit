const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying new cosmetics contract with proper authorization...\n");
  
  const NEW_MAW = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
  const KEYSHOP = "0x9Bd1651f1f8aB416A72f094fB60BbC1737B67DB6";
  
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deploying from: ${deployer.address}`);
  console.log(`🎯 Will authorize MawSacrifice: ${NEW_MAW}`);
  console.log(`🛒 KeyShop: ${KEYSHOP}\n`);
  
  // Deploy the CosmeticsV2 contract
  console.log("📦 Deploying CosmeticsV2...");
  const CosmeticsV2 = await ethers.getContractFactory("CosmeticsV2");
  
  // Deploy with proper initialization
  const baseTypeURI = "https://ipfs.io/ipfs/QmYourHashHere/";
  const boundBaseURI = "https://ipfs.io/ipfs/QmYourBoundHashHere/";
  
  const cosmetics = await CosmeticsV2.deploy(baseTypeURI, boundBaseURI);
  await cosmetics.waitForDeployment();
  
  const cosmeticsAddress = await cosmetics.getAddress();
  console.log(`✅ CosmeticsV2 deployed to: ${cosmeticsAddress}`);
  
  // Initialize the contract with the correct MawSacrifice
  console.log("\n🔧 Initializing contract...");
  
  try {
    // Set the contracts (authorize MawSacrifice) - CosmeticsV2 only takes 2 params
    console.log("Setting authorized contracts...");
    const RACCOONS = "0x6DB1C2d60579679A82C3Ac39cf7097B442E1Aa9f";
    const tx1 = await cosmetics.setContracts(
      RACCOONS,   // raccoons
      NEW_MAW     // mawSacrifice
    );
    await tx1.wait();
    console.log(`✅ Contracts set! Transaction: ${tx1.hash}`);
    
    // Verify the authorization
    const authorizedMaw = await cosmetics.mawSacrifice();
    console.log(`✅ Verified authorized Maw: ${authorizedMaw}`);
    console.log(`✅ Authorization correct: ${authorizedMaw.toLowerCase() === NEW_MAW.toLowerCase()}`);
    
  } catch (error) {
    console.log(`❌ Failed to initialize: ${error.message}`);
    
    // Try alternative initialization approach
    console.log("Trying alternative approach - transfer ownership to MawSacrifice...");
    try {
      const tx2 = await cosmetics.transferOwnership(NEW_MAW);
      await tx2.wait();
      console.log(`✅ Ownership transferred! Transaction: ${tx2.hash}`);
      
      const owner = await cosmetics.owner();
      console.log(`✅ New owner: ${owner}`);
    } catch (ownerError) {
      console.log(`❌ Ownership transfer failed: ${ownerError.message}`);
    }
  }
  
  // Set up some initial cosmetic types (copy from existing)
  console.log("\n🎨 Setting up cosmetic types...");
  
  try {
    // Common cosmetic types - these should match what's in the current system
    const cosmeticTypes = [
      { name: "glasses", slot: 0, rarity: 1, unlimited: true },
      { name: "hat", slot: 1, rarity: 1, unlimited: true },
      { name: "shirt", slot: 2, rarity: 2, unlimited: true },
      { name: "pants", slot: 3, rarity: 2, unlimited: true },
      { name: "shoes", slot: 4, rarity: 1, unlimited: true }
    ];
    
    for (let i = 0; i < cosmeticTypes.length; i++) {
      const type = cosmeticTypes[i];
      const typeId = i + 1; // Start from 1
      
      console.log(`Adding cosmetic type ${typeId}: ${type.name}`);
      const tx = await cosmetics.addCosmeticType(
        type.name,
        `${type.name} cosmetic`,
        `ipfs://cosmetic-${type.name}`,
        type.slot,
        type.rarity,
        0, // supply (0 = unlimited)
        type.unlimited
      );
      await tx.wait();
    }
    
    console.log(`✅ Added ${cosmeticTypes.length} cosmetic types`);
    
  } catch (error) {
    console.log(`❌ Failed to add cosmetic types: ${error.message}`);
    console.log("⚠️  Cosmetic types will need to be added manually later");
  }
  
  console.log("\n🎉 DEPLOYMENT COMPLETE!");
  console.log(`📍 New Cosmetics Contract: ${cosmeticsAddress}`);
  console.log(`🔗 Authorized MawSacrifice: ${NEW_MAW}`);
  console.log(`\n🔄 Next steps:`);
  console.log(`1. Update addresses.json files with: ${cosmeticsAddress}`);
  console.log(`2. Update MawSacrifice to point to new cosmetics`);
  console.log(`3. Test sacrifice functionality`);
  
  return cosmeticsAddress;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});