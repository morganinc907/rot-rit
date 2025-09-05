const { ethers } = require("hardhat");

async function main() {
  console.log("🎨 Setting up cosmetic types for sacrificeForCosmetic...\n");
  
  const proxyAddress = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  const [signer] = await ethers.getSigners();
  
  const proxy = await ethers.getContractAt("MawSacrificeV4Upgradeable", proxyAddress);
  
  console.log("Setting cosmetic types with:", signer.address);
  
  // Set some cosmetic type IDs (these should be the actual cosmetic types from your Cosmetics contract)
  // For now, let's use some example IDs - you may need to adjust these
  const cosmeticTypeIds = [
    1, // Example: Common Cosmetic Type 1
    2, // Example: Uncommon Cosmetic Type 2  
    3, // Example: Rare Cosmetic Type 3
    4, // Example: Common Cosmetic Type 4
    5  // Example: Uncommon Cosmetic Type 5
  ];
  
  console.log("Setting cosmetic types:", cosmeticTypeIds);
  
  try {
    const tx = await proxy.setMonthlyCosmeticTypes(cosmeticTypeIds);
    console.log("Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    
    // Verify the cosmetic types were set
    const currentTypes = await proxy.getCurrentCosmeticTypes();
    console.log("✅ Current cosmetic types:", currentTypes.map(t => t.toString()));
    
    console.log("\n🎉 Cosmetic types set successfully!");
    console.log("sacrificeForCosmetic should now work!");
    
  } catch (error) {
    console.error("❌ Failed to set cosmetic types:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});