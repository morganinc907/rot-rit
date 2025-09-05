const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🔧 Fixing all contract authorizations...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Account:", deployer.address);
  console.log("Balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Load contract addresses
  const addresses = JSON.parse(fs.readFileSync('./src/contracts-base-sepolia.json', 'utf8'));
  
  console.log("\n📋 Current Addresses:");
  Object.entries(addresses).forEach(([name, addr]) => {
    if (name !== 'chainId' && name !== 'blockNumber' && name !== 'keyPrice' && name !== 'raccoonPrice') {
      console.log(`${name}: ${addr}`);
    }
  });

  // Connect to contracts
  const relics = await ethers.getContractAt("Relics", addresses.relics);
  const keyShop = await ethers.getContractAt("KeyShop", addresses.keyShop);

  console.log("\n🔍 Checking KeyShop authorization...");
  try {
    // Test if KeyShop can mint
    const testAmount = 1;
    await keyShop.buyKeys.staticCall(testAmount, { 
      value: await keyShop.keyPrice() 
    });
    console.log("✅ KeyShop works fine");
    
  } catch (error) {
    console.log("❌ KeyShop failed:", error.message);
    
    // Try to fix KeyShop authorization
    console.log("🔧 Attempting to fix KeyShop authorization...");
    try {
      const tx = await relics.setKeyShop(addresses.keyShop);
      await tx.wait();
      console.log("✅ KeyShop re-authorized in Relics");
    } catch (authError) {
      console.log("❌ Failed to authorize KeyShop:", authError.message);
    }

    // Try the test again
    try {
      await keyShop.buyKeys.staticCall(1, { 
        value: await keyShop.keyPrice() 
      });
      console.log("✅ KeyShop now works!");
    } catch (stillError) {
      console.log("❌ KeyShop still failing:", stillError.message);
      
      // Check if KeyShop is pointing to the right Relics
      const keyShopRelics = await keyShop.relics();
      console.log("KeyShop points to:", keyShopRelics);
      console.log("Should point to:", addresses.relics);
      
      if (keyShopRelics.toLowerCase() !== addresses.relics.toLowerCase()) {
        console.log("🔧 Updating KeyShop to point to correct Relics...");
        try {
          const updateTx = await keyShop.setRelics(addresses.relics);
          await updateTx.wait();
          console.log("✅ KeyShop updated");
        } catch (updateError) {
          console.log("❌ Failed to update KeyShop:", updateError.message);
        }
      }
    }
  }

  console.log("\n✅ Authorization check complete!");
  console.log("Try buying keys from the frontend now.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });