const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🔍 Debugging sacrifice revert...\n");

  const [deployer] = await ethers.getSigners();
  const addresses = JSON.parse(fs.readFileSync('./src/contracts-base-sepolia.json', 'utf8'));
  
  const maw = await ethers.getContractAt("MawSacrifice", addresses.mawSacrifice);
  const relics = await ethers.getContractAt("Relics", addresses.relics);
  
  console.log("Your address:", deployer.address);
  console.log("MawSacrifice:", addresses.mawSacrifice);
  
  // Check all the possible revert conditions
  console.log("\n📋 Checking revert conditions:");
  
  // 1. Check if contract is paused
  try {
    const isPaused = await maw.paused();
    console.log("Contract paused:", isPaused);
  } catch (e) {
    console.log("Error checking paused:", e.message);
  }
  
  // 2. Check key balance
  const keyBalance = await relics.balanceOf(deployer.address, 1);
  console.log("Key balance:", keyBalance.toString());
  
  // 3. Check anti-bot (block timing)
  const currentBlock = await deployer.provider.getBlockNumber();
  const lastSacrificeBlock = await maw.lastSacrificeBlock(deployer.address);
  const minBlocks = await maw.minBlocksBetweenSacrifices();
  
  console.log("Current block:", currentBlock);
  console.log("Last sacrifice block:", lastSacrificeBlock.toString());
  console.log("Min blocks between:", minBlocks.toString());
  console.log("Blocks since last sacrifice:", currentBlock - Number(lastSacrificeBlock));
  console.log("Can sacrifice:", currentBlock >= Number(lastSacrificeBlock) + Number(minBlocks));
  
  // 4. Check approval
  const isApproved = await relics.isApprovedForAll(deployer.address, addresses.mawSacrifice);
  console.log("MawSacrifice approved:", isApproved);
  
  // 5. Try static call to see exact error
  console.log("\n🧪 Testing static call:");
  try {
    await maw.sacrificeKeys.staticCall(1);
    console.log("✅ Static call succeeded - should work");
  } catch (error) {
    console.log("❌ Static call failed:", error.message);
    if (error.data) {
      console.log("Error data:", error.data);
    }
  }
}

main().catch(console.error);