const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging sacrifice keys issue...");
  
  const [signer] = await ethers.getSigners();
  const userAddress = signer.address;
  console.log("User address:", userAddress);
  
  // Contract addresses (from your error)
  const MawSacrificeAddress = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
  const RelicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b"; // From addresses.json
  
  // Get contracts
  const relicsContract = await ethers.getContractAt("Relics", RelicsAddress);
  const mawContract = await ethers.getContractAt("MawSacrificeV4NoTimelock", MawSacrificeAddress);
  
  console.log("\n🔍 Checking user balances...");
  
  // Check key balance (token ID 1)
  const keyBalance = await relicsContract.balanceOf(userAddress, 1);
  console.log("Rusted Caps (Keys) balance:", keyBalance.toString());
  
  // Check approval
  const isApproved = await relicsContract.isApprovedForAll(userAddress, MawSacrificeAddress);
  console.log("Is approved for MawSacrifice:", isApproved);
  
  console.log("\n🔍 Checking contract state...");
  
  // Check if contract is paused
  try {
    const isPaused = await mawContract.paused();
    console.log("Contract paused:", isPaused);
  } catch (e) {
    console.log("Contract pause check failed (might not have this function)");
  }
  
  // Check cooldown
  try {
    const lastBlock = await mawContract.lastSacrificeBlock(userAddress);
    const currentBlock = await ethers.provider.getBlockNumber();
    const minBlocks = await mawContract.minBlocksBetweenSacrifices();
    
    console.log("Last sacrifice block:", lastBlock.toString());
    console.log("Current block:", currentBlock.toString());
    console.log("Min blocks between sacrifices:", minBlocks.toString());
    console.log("Blocks since last sacrifice:", (currentBlock - lastBlock).toString());
    console.log("On cooldown:", (currentBlock - lastBlock) < minBlocks);
  } catch (e) {
    console.log("Cooldown check failed:", e.message);
  }
  
  console.log("\n🔍 Testing sacrifice simulation...");
  
  if (keyBalance > 0) {
    try {
      // Try to simulate the call
      const result = await mawContract.sacrificeKeys.staticCall(1);
      console.log("✅ Simulation successful, should work");
    } catch (error) {
      console.log("❌ Simulation failed:", error.message);
      
      // Try to decode the error
      if (error.data) {
        console.log("Error data:", error.data);
      }
    }
  } else {
    console.log("❌ No rusted caps to sacrifice");
  }
  
  console.log("\n📋 Summary:");
  console.log("- Rusted Caps balance:", keyBalance.toString());
  console.log("- Approved:", isApproved);
  console.log("- User address:", userAddress);
  console.log("- MawSacrifice address:", MawSacrificeAddress);
  console.log("- Relics address:", RelicsAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });