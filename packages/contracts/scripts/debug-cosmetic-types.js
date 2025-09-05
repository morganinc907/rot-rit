const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🔍 Debugging cosmetic typeExists mapping...");
  console.log("User:", deployer.address);
  
  // Load contract addresses
  const addressesPath = '../../addresses/addresses.json';
  const addresses = require(addressesPath);
  const { baseSepolia: contractAddresses } = addresses;
  
  const Cosmetics = await hre.ethers.getContractAt(
    "CosmeticsV2",
    contractAddresses.Cosmetics
  );
  
  console.log("\n📍 Cosmetics Contract:", contractAddresses.Cosmetics);
  
  // Check typeExists mapping for each type
  console.log("\n🔍 Checking typeExists mapping:");
  for (let typeId = 1; typeId <= 6; typeId++) {
    try {
      const exists = await Cosmetics.typeExists(typeId);
      console.log(`  Type ${typeId}: typeExists = ${exists}`);
      
      if (exists) {
        try {
          const info = await Cosmetics.getCosmeticInfo(typeId);
          console.log(`    Name: ${info[0]}, Active: ${info[6]}`);
        } catch (err) {
          console.log(`    Error getting info: ${err.message}`);
        }
      }
    } catch (error) {
      console.log(`  Type ${typeId}: Error checking typeExists - ${error.message}`);
    }
  }
  
  // Try to get the cosmetic type info directly from the mapping
  console.log("\n🔍 Checking cosmeticTypes mapping directly:");
  for (let typeId = 1; typeId <= 6; typeId++) {
    try {
      const cosmeticType = await Cosmetics.cosmeticTypes(typeId);
      console.log(`  Type ${typeId}:`);
      console.log(`    Name: ${cosmeticType[0]}`);
      console.log(`    Active: ${cosmeticType[8]}`);
      console.log(`    Current Supply: ${cosmeticType[7]}`);
      console.log(`    Max Supply: ${cosmeticType[6]}`);
    } catch (error) {
      console.log(`  Type ${typeId}: Error - ${error.message}`);
    }
  }
  
  console.log("\n✅ Debug complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});