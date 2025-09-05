const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking current contract state...");
  
  // Use the newly deployed contract addresses
  const RACCOONS_ADDRESS = "0x7071269faa1FA8D24A5b8b03C745552B25021D90";
  const MAW_SACRIFICE_ADDRESS = "0xf65B16c49E505F5BC5c941081c2FA213f8D15D2f";
  const COSMETICS_ADDRESS = "0xa45358561Fc7D9C258F831a4Bf5958fe7982EF61";
  
  try {
    // Check Raccoons contract
    console.log("\n📊 RACCOONS CONTRACT");
    const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);
    const totalMinted = await raccoons.totalMinted();
    const maxSupply = await raccoons.MAX_SUPPLY();
    console.log(`Total minted: ${totalMinted} / ${maxSupply}`);
    
    // Check MawSacrificeV2 contract  
    console.log("\n🩸 MAW SACRIFICE CONTRACT");
    const maw = await hre.ethers.getContractAt("MawSacrificeV2", MAW_SACRIFICE_ADDRESS);
    
    try {
      const setId = await maw.currentMonthlySetId();
      console.log("Monthly set ID:", setId.toString());
      
      console.log("Current cosmetic IDs:");
      for (let i = 0; i < 5; i++) {
        try {
          const cosmeticId = await maw.currentCosmeticIds(i);
          console.log(`  [${i}]:`, cosmeticId.toString());
        } catch (e) {
          console.log(`  [${i}]: (empty)`);
          break;
        }
      }
    } catch (e) {
      console.log("❌ Error reading maw state:", e.message);
    }
    
    // Check CosmeticsV2 contract
    console.log("\n💄 COSMETICS CONTRACT");
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", COSMETICS_ADDRESS);
    
    try {
      const nextTokenId = await cosmetics.nextTokenId();
      console.log("Next cosmetic token ID:", nextTokenId.toString());
      
      // Check if there are any existing cosmetics
      if (nextTokenId > 1) {
        console.log("Existing cosmetics found. Checking first few...");
        for (let i = 1; i < Math.min(nextTokenId, 6); i++) {
          try {
            const uri = await cosmetics.tokenURI(i);
            console.log(`  Cosmetic #${i}: ${uri}`);
          } catch (e) {
            console.log(`  Cosmetic #${i}: Error reading URI`);
          }
        }
      } else {
        console.log("No cosmetics minted yet.");
      }
    } catch (e) {
      console.log("❌ Error reading cosmetics state:", e.message);
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });