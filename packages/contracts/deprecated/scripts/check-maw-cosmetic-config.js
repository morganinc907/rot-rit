const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking MawSacrifice cosmetic configuration...\n");
  
  const [signer] = await ethers.getSigners();
  console.log("Checking with account:", signer.address);
  
  const proxyAddress = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  
  // Connect to proxy using the generated ABI
  const mawABI = require('../../abis/MawSacrifice.json');
  const proxy = new ethers.Contract(proxyAddress, mawABI, signer);
  
  console.log("📋 MawSacrifice Cosmetic Configuration:");
  
  try {
    // Check current monthly set
    const currentSet = await proxy.currentMonthlySetId();
    console.log("  Current monthly set ID:", currentSet.toString());
    
    // Check cosmetic types array
    const cosmeticTypes = await proxy.getCurrentCosmeticTypes();
    console.log("  Current cosmetic types:", cosmeticTypes.map(t => t.toString()));
    console.log("  Number of types configured:", cosmeticTypes.length);
    
    if (cosmeticTypes.length === 0) {
      console.log("  ❌ NO COSMETIC TYPES CONFIGURED!");
      console.log("  This is why sacrifices are failing.");
      
      console.log("\n🔧 Need to set monthly cosmetics on MawSacrifice contract.");
      console.log("  Run: setMonthlyCosmetics(1, [1, 2, 3, 4, 5])");
      
      console.log("\n🧪 Testing static call first...");
      try {
        await proxy.setMonthlyCosmetics.staticCall(1, [1, 2, 3, 4, 5]);
        console.log("  ✅ Static call would succeed");
      } catch (error) {
        console.log("  ❌ Static call failed:", error.message);
        console.log("  📝 Error data:", error.data);
        return;
      }
      
      console.log("\n🧪 Attempting to set monthly cosmetics...");
      // Set monthly cosmetics for set ID 1 with cosmetic types 1-5
      const tx = await proxy.setMonthlyCosmetics(1, [1, 2, 3, 4, 5]);
      console.log("  Transaction hash:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("  ✅ Set! Gas used:", receipt.gasUsed.toString());
      
      // Verify
      const newTypes = await proxy.getCurrentCosmeticTypes();
      console.log("  New cosmetic types:", newTypes.map(t => t.toString()));
    } else {
      console.log("  ✅ Cosmetic types are configured");
    }
    
  } catch (error) {
    console.log("  ❌ Error checking cosmetic config:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});