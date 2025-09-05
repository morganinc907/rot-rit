const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🔧 Fixing cosmetic types to match what actually exists...");
  console.log("User:", deployer.address);
  
  // Load contract addresses
  const addressesPath = '../../addresses/addresses.json';
  const addresses = require(addressesPath);
  const { baseSepolia: contractAddresses } = addresses;
  
  const MawSacrifice = await hre.ethers.getContractAt(
    "MawSacrificeV4NoTimelock",
    contractAddresses.MawSacrifice
  );
  
  const Cosmetics = await hre.ethers.getContractAt(
    "CosmeticsV2",
    contractAddresses.Cosmetics
  );
  
  console.log("\n🔍 Checking which cosmetic types actually exist:");
  const existingTypes = [];
  
  for (let typeId = 1; typeId <= 10; typeId++) {
    try {
      const cosmeticInfo = await Cosmetics.getCosmeticInfo(typeId);
      console.log(`  Type ${typeId}: ${cosmeticInfo[0]} (active: ${cosmeticInfo[6]})`);
      if (cosmeticInfo[6]) { // if active
        existingTypes.push(typeId);
      }
    } catch (err) {
      // Type doesn't exist, skip
    }
  }
  
  console.log(`\n✅ Found ${existingTypes.length} existing cosmetic types:`, existingTypes);
  
  if (existingTypes.length === 0) {
    console.log("❌ No cosmetic types exist! Need to create some first.");
    return;
  }
  
  // Check if MawSacrifice has setCurrentCosmeticTypes function
  console.log("\n🔧 Checking MawSacrifice functions...");
  try {
    // Try to call setCurrentCosmeticTypes - this might not exist
    await MawSacrifice.setCurrentCosmeticTypes.staticCall(existingTypes);
    console.log("✅ setCurrentCosmeticTypes function exists");
    
    // Actually update the cosmetic types
    console.log(`\n🔧 Setting cosmetic types to: [${existingTypes.join(', ')}]`);
    const tx = await MawSacrifice.setCurrentCosmeticTypes(existingTypes);
    
    console.log("📤 Transaction:", tx.hash);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log("⛽ Gas used:", receipt.gasUsed.toString());
    
  } catch (error) {
    if (error.message.includes('not a function')) {
      console.log("❌ setCurrentCosmeticTypes function doesn't exist on this contract");
      console.log("This contract version might use a different approach for cosmetic types");
    } else {
      console.error("❌ Error setting cosmetic types:", error.message);
    }
  }
  
  // Verify the current state
  console.log("\n🔍 Verifying current configuration:");
  try {
    const availableTypes = await MawSacrifice.getCurrentCosmeticTypes();
    console.log("MawSacrifice available types:", availableTypes.map(t => Number(t)));
  } catch (error) {
    console.error("Error getting available types:", error.message);
  }
  
  console.log("\n✅ Fix attempt complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});