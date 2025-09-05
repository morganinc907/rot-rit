const { ethers } = require("hardhat");

async function main() {
  console.log("🎨 Checking cosmetic info structure...\n");
  
  const COSMETICS_ADDRESS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  const cosmetics = await ethers.getContractAt("CosmeticsV2", COSMETICS_ADDRESS);
  
  console.log("Testing getCosmeticInfo function...");
  
  try {
    // Check if any cosmetic types exist
    for (let typeId = 1; typeId <= 10; typeId++) {
      try {
        const exists = await cosmetics.typeExists(typeId);
        if (exists) {
          console.log(`✅ Type ${typeId} exists`);
          const info = await cosmetics.getCosmeticInfo(typeId);
          console.log(`   Info: ${info.toString()}`);
          
          // Parse the info structure
          console.log(`   Name: ${info[0]}`);
          console.log(`   Description: ${info[1]}`); 
          console.log(`   ImageURI: ${info[2]}`);
          console.log(`   Slot: ${info[3]}`);
          console.log(`   Rarity: ${info[4]}`);
          console.log(`   Supply: ${info[5]}`);
          console.log(`   MaxSupply: ${info[6]}`);
          console.log("");
        } else {
          console.log(`❌ Type ${typeId} does not exist`);
        }
      } catch (error) {
        console.log(`❌ Error checking type ${typeId}:`, error.message);
      }
    }
    
    // Also check the mintTo function signature
    console.log("=== CHECKING MINT FUNCTION ===");
    const fragment = cosmetics.interface.getFunction("mintTo");
    console.log("mintTo function:", fragment.format());
    
  } catch (error) {
    console.error("Error during checks:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});