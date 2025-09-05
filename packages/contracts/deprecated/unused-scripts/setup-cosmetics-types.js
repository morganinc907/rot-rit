const { ethers } = require("hardhat");
const { baseSepolia } = require("../../addresses/addresses.json");

async function main() {
  console.log("🎨 Setting up cosmetic types for new MawSacrifice...\n");
  
  const [signer] = await ethers.getSigners();
  console.log("Account:", signer.address);
  
  const NEW_MAW_ADDRESS = baseSepolia.MawSacrifice;
  const maw = await ethers.getContractAt("MawSacrificeV4Upgradeable", NEW_MAW_ADDRESS);
  
  console.log("MawSacrifice:", NEW_MAW_ADDRESS);
  
  // Available cosmetic types from the cosmetics contract
  const cosmeticTypes = [1, 2, 3, 4, 5]; // glasses, strainer, pink, orange, underpants
  
  console.log("Setting cosmetic types:", cosmeticTypes);
  
  try {
    // Check current cosmetic types
    console.log("\n📋 Current state:");
    const currentTypes = await maw.getCurrentCosmeticTypes();
    console.log("   Current types:", currentTypes.map(t => t.toString()));
    
    if (currentTypes.length === cosmeticTypes.length && 
        currentTypes.every((t, i) => t.toString() === cosmeticTypes[i].toString())) {
      console.log("   ✅ Cosmetic types already set correctly");
      return;
    }
    
    // Set the cosmetic types
    console.log("\n🔧 Setting monthly cosmetic types...");
    const tx = await maw.setMonthlyCosmeticTypes(cosmeticTypes);
    console.log("   Transaction hash:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("   ✅ Cosmetics set! Gas used:", receipt.gasUsed.toString());
    
    // Verify the update
    const newTypes = await maw.getCurrentCosmeticTypes();
    console.log("   New types:", newTypes.map(t => t.toString()));
    
    console.log("\n🎉 KeyShop should now display cosmetics with rarity glows!");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main().catch(console.error);