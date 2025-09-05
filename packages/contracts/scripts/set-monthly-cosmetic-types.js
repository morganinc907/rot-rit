const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🎨 Setting monthly cosmetic types in MawSacrifice...");
  console.log("User:", deployer.address);
  
  // Load contract addresses
  const addressesPath = '../../addresses/addresses.json';
  const addresses = require(addressesPath);
  const { baseSepolia: contractAddresses } = addresses;
  
  const MawSacrifice = await hre.ethers.getContractAt(
    "MawSacrificeV4NoTimelock",
    contractAddresses.MawSacrifice
  );
  
  // Check current cosmetic types
  console.log("\n🔍 Current state:");
  try {
    const currentTypes = await MawSacrifice.getCurrentCosmeticTypes();
    console.log("Current cosmetic types:", currentTypes.map(t => Number(t)));
    
    // Check the currentCosmeticTypes array length
    try {
      const arrayLength = await MawSacrifice.currentCosmeticTypes.length;
      console.log("currentCosmeticTypes array length:", arrayLength.toString());
      
      // Get each element
      if (arrayLength > 0) {
        console.log("Array contents:");
        for (let i = 0; i < arrayLength; i++) {
          const typeId = await MawSacrifice.currentCosmeticTypes(i);
          console.log(`  [${i}]: ${typeId}`);
        }
      } else {
        console.log("❌ currentCosmeticTypes array is empty! This is the root cause.");
      }
    } catch (err) {
      console.log("Error checking array:", err.message);
    }
    
  } catch (error) {
    console.error("Error getting current types:", error.message);
  }
  
  // Set the monthly cosmetic types to [1,2,3,4,5]
  const typeIds = [1, 2, 3, 4, 5];
  console.log(`\n🔧 Setting monthly cosmetic types to: [${typeIds.join(', ')}]`);
  
  try {
    const tx = await MawSacrifice.setMonthlyCosmeticTypes(typeIds);
    
    console.log("📤 Transaction:", tx.hash);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log("⛽ Gas used:", receipt.gasUsed.toString());
    
    // Parse events
    for (const log of receipt.logs) {
      try {
        const parsed = MawSacrifice.interface.parseLog(log);
        if (parsed && parsed.name === 'MonthlyCosmeticsSet') {
          console.log("📋 Event: MonthlyCosmeticsSet");
          console.log("  Set ID:", parsed.args[0].toString());
          console.log("  Type IDs:", parsed.args[1].map(id => Number(id)));
        }
      } catch {
        // Not a MawSacrifice event
      }
    }
    
  } catch (error) {
    console.error("❌ Error setting monthly cosmetic types:", error.message);
    return;
  }
  
  // Verify the update
  console.log("\n🔍 Verifying update:");
  try {
    const newTypes = await MawSacrifice.getCurrentCosmeticTypes();
    console.log("New cosmetic types:", newTypes.map(t => Number(t)));
    
    const newArrayLength = await MawSacrifice.currentCosmeticTypes.length;
    console.log("New array length:", newArrayLength.toString());
    
    if (newArrayLength > 0) {
      console.log("New array contents:");
      for (let i = 0; i < newArrayLength; i++) {
        const typeId = await MawSacrifice.currentCosmeticTypes(i);
        console.log(`  [${i}]: ${typeId}`);
      }
      console.log("✅ Monthly cosmetic types successfully set!");
    }
    
  } catch (error) {
    console.error("Error verifying update:", error.message);
  }
  
  console.log("\n✅ Monthly cosmetic types setup complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});