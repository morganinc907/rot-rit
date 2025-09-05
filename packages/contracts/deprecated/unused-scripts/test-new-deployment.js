const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing new deployment...\n");
  
  const NEW_MAW_ADDRESS = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
  const [signer] = await ethers.getSigners();
  
  const maw = await ethers.getContractAt("MawSacrificeV4Upgradeable", NEW_MAW_ADDRESS);
  
  console.log("Testing new contract:", NEW_MAW_ADDRESS);
  console.log("With signer:", signer.address);
  
  try {
    // Check if the contract was deployed correctly
    const version = await maw.version();
    console.log("✅ Contract version:", version);
    
    // Check owner
    const owner = await maw.owner();
    console.log("✅ Contract owner:", owner);
    
    // Check cosmetic types
    const cosmeticTypes = await maw.getCurrentCosmeticTypes();
    console.log("Current cosmetic types:", cosmeticTypes.map(t => t.toString()));
    
    // Try to set cosmetic types if they're empty
    if (cosmeticTypes.length === 0) {
      console.log("\n🎨 Setting cosmetic types...");
      const tx = await maw.setMonthlyCosmeticTypes([1, 2, 3, 4, 5]);
      await tx.wait();
      console.log("✅ Cosmetic types set");
      
      const newTypes = await maw.getCurrentCosmeticTypes();
      console.log("New cosmetic types:", newTypes.map(t => t.toString()));
    }
    
    // Test sacrifice function
    console.log("\n=== TESTING SACRIFICE FUNCTION ===");
    try {
      await maw.sacrificeForCosmetic.staticCall(1, 0);
      console.log("✅ sacrificeForCosmetic static call works!");
    } catch (error) {
      console.log("❌ sacrificeForCosmetic failed:", error.message);
    }
    
  } catch (error) {
    console.error("Error testing deployment:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});