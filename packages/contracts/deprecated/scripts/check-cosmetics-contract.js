const { ethers } = require("hardhat");

async function main() {
  console.log("🎨 Checking Cosmetics contract...\n");
  
  const COSMETICS_ADDRESS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  const [signer] = await ethers.getSigners();
  
  const cosmetics = await ethers.getContractAt("CosmeticsV2", COSMETICS_ADDRESS);
  
  console.log("Testing with user:", signer.address);
  console.log("Cosmetics contract:", COSMETICS_ADDRESS);
  
  try {
    // Test the required functions exist
    console.log("\n=== TESTING REQUIRED FUNCTIONS ===");
    
    // 1. Test getCosmeticRarity function
    console.log("Testing getCosmeticRarity...");
    try {
      for (let typeId = 1; typeId <= 10; typeId++) {
        const rarity = await cosmetics.getCosmeticRarity(typeId);
        console.log(`Type ${typeId} rarity: ${rarity}`);
      }
    } catch (error) {
      console.log("❌ getCosmeticRarity failed:", error.message);
    }
    
    // 2. Test mint function
    console.log("\nTesting mint function signature...");
    try {
      const fragment = cosmetics.interface.getFunction("mint");
      console.log("✅ mint function:", fragment.format());
    } catch (error) {
      console.log("❌ mint function not found:", error.message);
    }
    
    // 3. Check what functions are available
    console.log("\nAvailable functions:");
    const functions = cosmetics.interface.fragments.filter(f => f.type === 'function');
    functions.forEach(f => {
      console.log(`- ${f.format()}`);
    });
    
  } catch (error) {
    console.error("Error during checks:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});