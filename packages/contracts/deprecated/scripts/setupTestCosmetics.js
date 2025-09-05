const hre = require("hardhat");

async function main() {
  console.log("🎨 Setting up test cosmetics...");
  
  // Get contract addresses from environment or deployment
  const MAW_SACRIFICE_ADDRESS = process.env.MAW_SACRIFICE_ADDRESS || "0x701b7ece2c33e71853a927a6e055d4c6b5a23664";
  
  // Get the deployed contract
  const MawSacrifice = await hre.ethers.getContractAt("MawSacrifice", MAW_SACRIFICE_ADDRESS);
  
  // Check if we're the owner
  const [signer] = await hre.ethers.getSigners();
  const owner = await MawSacrifice.owner();
  const signerAddress = await signer.getAddress();
  
  console.log("Contract owner:", owner);
  console.log("Signer address:", signerAddress);
  
  if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
    console.log("❌ You are not the contract owner. Current owner needs to call setMonthlyCosmetics()");
    return;
  }
  
  // Set up test cosmetics - using mock IDs 1, 2, 3, 4, 5
  // In a real deployment, these would be actual cosmetic NFT IDs
  const testCosmeticIds = [1, 2, 3, 4, 5];
  const monthlySetId = 1;
  
  console.log(`Setting monthly cosmetics for set ${monthlySetId}:`, testCosmeticIds);
  
  try {
    const tx = await MawSacrifice.setMonthlyCosmetics(monthlySetId, testCosmeticIds);
    console.log("Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    
    // Verify it worked
    const currentCosmeticIds = await MawSacrifice.currentCosmeticIds(0); // Get first one to test
    console.log("✅ Cosmetics configured! First cosmetic ID:", currentCosmeticIds.toString());
    
  } catch (error) {
    console.error("❌ Error setting cosmetics:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });