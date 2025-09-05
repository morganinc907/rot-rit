const hre = require("hardhat");

async function main() {
  console.log("🎨 Setting up cosmetics on existing MawSacrifice...");
  
  const MAW_SACRIFICE_ADDRESS = "0x701b7ece2c33e71853a927a6e055d4c6b5a23664";
  
  // Get the deployed contract
  const MawSacrifice = await hre.ethers.getContractAt("MawSacrifice", MAW_SACRIFICE_ADDRESS);
  
  // Set up test cosmetics - using mock IDs 1, 2, 3, 4, 5
  const testCosmeticIds = [1, 2, 3, 4, 5];
  const monthlySetId = 1;
  
  console.log(`Setting monthly cosmetics for set ${monthlySetId}:`, testCosmeticIds);
  
  try {
    const tx = await MawSacrifice.setMonthlyCosmetics(monthlySetId, testCosmeticIds);
    console.log("Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    
    // Verify it worked
    const currentLength = await MawSacrifice.currentCosmeticIds(0); // Get first one to test
    console.log("✅ Cosmetics configured! First cosmetic ID:", currentLength.toString());
    
    console.log("\n🎉 Success! You can now test cosmetic sacrifices!");
    
  } catch (error) {
    console.error("❌ Error setting cosmetics:", error.message);
    if (error.message.includes("OwnableUnauthorizedAccount")) {
      console.log("\n💡 Make sure you're using the owner account in your .env file");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });