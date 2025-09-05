const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🧪 Testing direct cosmetic minting...");
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
  console.log("MawSacrifice Contract:", contractAddresses.MawSacrifice);
  
  // Check what happens when MawSacrifice tries to mint each type
  console.log("\n🧪 Testing if MawSacrifice can mint each cosmetic type:");
  
  for (let typeId = 1; typeId <= 6; typeId++) {
    try {
      // First check if the type exists
      const cosmeticInfo = await Cosmetics.getCosmeticInfo(typeId);
      console.log(`\nType ${typeId}: ${cosmeticInfo[0]}`);
      console.log(`  Active: ${cosmeticInfo[6]}`);
      console.log(`  Rarity: ${cosmeticInfo[3]}, Slot: ${cosmeticInfo[4]}`);
      
      // Try to simulate MawSacrifice minting this type
      console.log(`  Testing mintTo for type ${typeId}...`);
      
      // We can't actually call this as MawSacrifice, but we can check the type exists
      if (cosmeticInfo[6]) { // if active
        console.log(`  ✅ Type ${typeId} is active and should be mintable`);
      } else {
        console.log(`  ❌ Type ${typeId} is inactive`);
      }
      
    } catch (error) {
      console.log(`\nType ${typeId}: ❌ Does not exist`);
      console.log(`  This would cause InvalidCosmeticType error`);
    }
  }
  
  // Check what the MawSacrifice getCurrentCosmeticTypes returns
  const MawSacrifice = await hre.ethers.getContractAt(
    "MawSacrificeV4NoTimelock",
    contractAddresses.MawSacrifice
  );
  
  console.log("\n🔍 MawSacrifice configuration:");
  const currentTypes = await MawSacrifice.getCurrentCosmeticTypes();
  console.log("getCurrentCosmeticTypes returns:", currentTypes.map(t => Number(t)));
  
  // Check if any of these types don't actually exist
  console.log("\n❌ Problem Analysis:");
  for (const typeId of currentTypes) {
    try {
      await Cosmetics.getCosmeticInfo(Number(typeId));
      console.log(`  Type ${typeId}: ✅ Exists in cosmetics contract`);
    } catch {
      console.log(`  Type ${typeId}: ❌ DOES NOT EXIST - This causes InvalidCosmeticType!`);
    }
  }
  
  console.log("\n✅ Test complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});