const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🔧 Fixing KeyShop authorization...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Load contract addresses
  const addresses = JSON.parse(fs.readFileSync('./src/contracts-base-sepolia.json', 'utf8'));
  
  console.log("KeyShop:", addresses.keyShop);
  console.log("Relics:", addresses.relics);

  // Connect to contracts
  const relics = await ethers.getContractAt("Relics", addresses.relics);
  const keyShop = await ethers.getContractAt("KeyShop", addresses.keyShop);

  // Check current authorizations
  console.log("\n🔍 Checking current state...");
  try {
    const isKeyShopAuthorized = await relics.isKeyShop(addresses.keyShop);
    console.log("KeyShop authorized in Relics:", isKeyShopAuthorized);
    
    const keyShopRelicsAddress = await keyShop.relics();
    console.log("KeyShop pointing to Relics:", keyShopRelicsAddress);
    console.log("Addresses match:", keyShopRelicsAddress.toLowerCase() === addresses.relics.toLowerCase());
  } catch (error) {
    console.log("Error checking state:", error.message);
  }

  // Fix authorization
  console.log("\n⚙️ Authorizing KeyShop in Relics contract...");
  try {
    const tx = await relics.setKeyShop(addresses.keyShop);
    await tx.wait();
    console.log("✅ KeyShop authorized!");
  } catch (error) {
    console.log("❌ Failed to authorize KeyShop:", error.message);
    
    // Try alternative: update KeyShop to point to correct Relics
    console.log("\n⚙️ Trying to update KeyShop relics address...");
    try {
      const tx2 = await keyShop.setRelics(addresses.relics);
      await tx2.wait();
      console.log("✅ KeyShop updated to point to correct Relics!");
    } catch (error2) {
      console.log("❌ Also failed:", error2.message);
      console.log("\n🚨 Manual intervention needed!");
    }
  }

  console.log("\n🧪 Test buying keys now!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });