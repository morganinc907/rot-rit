const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🎨 Checking cosmetics availability...");
  console.log("User:", deployer.address);
  
  // Load contract addresses
  const addressesPath = '../../addresses/addresses.json';
  const addresses = require(addressesPath);
  const { baseSepolia: contractAddresses } = addresses;
  
  console.log("\n📍 Contract Addresses:");
  console.log("MawSacrifice:", contractAddresses.MawSacrifice);
  console.log("Cosmetics (new):", contractAddresses.Cosmetics);
  console.log("Cosmetics (old):", contractAddresses.CosmeticsV2_OLD);
  
  // Get MawSacrifice contract
  const MawSacrifice = await hre.ethers.getContractAt(
    "MawSacrificeV4NoTimelock",
    contractAddresses.MawSacrifice
  );
  
  // Check cosmetics contract reference in MawSacrifice
  const mawCosmeticsRef = await MawSacrifice.cosmetics();
  console.log("\n🔗 MawSacrifice → Cosmetics reference:", mawCosmeticsRef);
  
  // Get current cosmetic types from MawSacrifice
  try {
    const availableTypes = await MawSacrifice.getCurrentCosmeticTypes();
    console.log("\n🎨 Available cosmetic types from MawSacrifice:", availableTypes.map(t => Number(t)));
    
    // Try to get cosmetic info from the contract that MawSacrifice references
    if (availableTypes.length > 0) {
      const Cosmetics = await hre.ethers.getContractAt(
        "CosmeticsV2",
        mawCosmeticsRef
      );
      
      console.log("\n🎭 Cosmetic details from referenced contract:");
      for (let i = 0; i < Math.min(availableTypes.length, 5); i++) {
        try {
          const typeId = availableTypes[i];
          const cosmeticInfo = await Cosmetics.getCosmeticInfo(typeId);
          console.log(`  Type ${typeId}: ${cosmeticInfo[0]} (rarity: ${cosmeticInfo[3]})`);
        } catch (err) {
          console.log(`  Type ${availableTypes[i]}: Error -`, err.message);
        }
      }
    }
    
  } catch (err) {
    console.error("❌ Error getting cosmetic types:", err.message);
  }
  
  // Also check the new cosmetics contract directly
  console.log("\n🔍 Checking NEW cosmetics contract directly...");
  try {
    const NewCosmetics = await hre.ethers.getContractAt(
      "CosmeticsV2",
      contractAddresses.Cosmetics
    );
    
    // Try to get some cosmetic info
    for (let typeId = 1; typeId <= 5; typeId++) {
      try {
        const cosmeticInfo = await NewCosmetics.getCosmeticInfo(typeId);
        console.log(`  New contract Type ${typeId}: ${cosmeticInfo[0]} (rarity: ${cosmeticInfo[3]})`);
      } catch (err) {
        console.log(`  New contract Type ${typeId}: Not configured`);
      }
    }
  } catch (err) {
    console.error("❌ Error checking new cosmetics contract:", err.message);
  }
  
  console.log("\n✅ Check complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});