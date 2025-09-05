const hre = require("hardhat");

async function main() {
  console.log("🔍 Debugging cosmetic setup...");
  
  const [signer] = await hre.ethers.getSigners();
  const signerAddress = await signer.getAddress();
  console.log("Using account:", signerAddress);
  
  const MAW_SACRIFICE_ADDRESS = "0x701b7ece2c33e71853a927a6e055d4c6b5a23664";
  const maw = await hre.ethers.getContractAt("MawSacrifice", MAW_SACRIFICE_ADDRESS);
  
  // Check owner
  const owner = await maw.owner();
  console.log("Contract owner:", owner);
  console.log("Are you owner?", signerAddress.toLowerCase() === owner.toLowerCase());
  
  // Check if paused
  const isPaused = await maw.paused();
  console.log("Contract paused?", isPaused);
  
  // Check current cosmetics
  try {
    const currentSetId = await maw.currentMonthlySetId();
    console.log("Current monthly set ID:", currentSetId.toString());
    
    // Try to get first cosmetic ID if any exist
    try {
      const firstCosmetic = await maw.currentCosmeticIds(0);
      console.log("First cosmetic ID:", firstCosmetic.toString());
    } catch (e) {
      console.log("No cosmetics currently set");
    }
  } catch (e) {
    console.log("Error reading current cosmetics:", e.message);
  }
  
  // Try the actual call with more detailed error
  console.log("\n🎨 Attempting to set cosmetics...");
  const testCosmeticIds = [1, 2, 3, 4, 5];
  const monthlySetId = 1;
  
  try {
    // Try to estimate gas first
    const gasEstimate = await maw.setMonthlyCosmetics.estimateGas(monthlySetId, testCosmeticIds);
    console.log("Gas estimate:", gasEstimate.toString());
    
    const tx = await maw.setMonthlyCosmetics(monthlySetId, testCosmeticIds);
    console.log("Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    
  } catch (error) {
    console.log("❌ Full error:", error);
    if (error.data) {
      console.log("Error data:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });