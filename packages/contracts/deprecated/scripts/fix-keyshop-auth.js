const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🔧 Fixing KeyShop authorization specifically...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Account:", deployer.address);

  // Load addresses
  const addresses = JSON.parse(fs.readFileSync('./src/contracts-base-sepolia.json', 'utf8'));
  
  console.log("KeyShop:", addresses.keyShop);
  console.log("Relics:", addresses.relics);
  
  // Connect to contracts
  const relics = await ethers.getContractAt("Relics", addresses.relics);
  const keyShop = await ethers.getContractAt("KeyShop", addresses.keyShop);

  // Get current nonce and wait a bit to avoid nonce conflicts
  const nonce = await deployer.provider.getTransactionCount(deployer.address, "pending");
  console.log("Current nonce:", nonce);

  console.log("\n🔍 Testing KeyShop first...");
  try {
    const keyPrice = await keyShop.keyPrice();
    console.log("Key price:", ethers.formatEther(keyPrice), "ETH");
    
    // Try static call first
    await keyShop.buyKeys.staticCall(1, { value: keyPrice });
    console.log("✅ KeyShop static call works - contract is functional");
    return;
    
  } catch (error) {
    console.log("❌ KeyShop failed:", error.message.substring(0, 100));
    
    // Check specific authorization
    console.log("\n🔧 Re-authorizing KeyShop in Relics...");
    try {
      const tx = await relics.setKeyShop(addresses.keyShop, {
        gasPrice: ethers.parseUnits("4", "gwei"),
        nonce: nonce,
      });
      console.log("Authorization tx:", tx.hash);
      await tx.wait();
      console.log("✅ KeyShop re-authorized");
      
      // Test again
      await keyShop.buyKeys.staticCall(1, { value: await keyShop.keyPrice() });
      console.log("✅ KeyShop now works!");
      
    } catch (authError) {
      console.log("❌ Authorization failed:", authError.message.substring(0, 100));
      
      // Check if KeyShop points to right Relics
      console.log("\n🔍 Checking KeyShop configuration...");
      const keyShopRelics = await keyShop.relics();
      console.log("KeyShop points to Relics:", keyShopRelics);
      console.log("Should point to:", addresses.relics);
      
      if (keyShopRelics.toLowerCase() !== addresses.relics.toLowerCase()) {
        console.log("❌ KeyShop pointing to wrong Relics contract!");
        console.log("You may need to redeploy KeyShop or update its Relics address");
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });