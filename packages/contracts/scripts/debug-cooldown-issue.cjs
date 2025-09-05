const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Debugging cooldown and sacrifice state...");
  
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", addresses.baseSepolia.MawSacrifice);
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  
  console.log("User:", USER_ADDRESS);
  console.log("MAW address:", addresses.baseSepolia.MawSacrifice);
  
  // Check current balance
  const caps = await relics.balanceOf(USER_ADDRESS, 0);
  console.log(`\nUser Rusted Caps: ${caps}`);
  
  // Check sacrifice nonce to see recent activity
  const nonce = await maw.sacrificeNonce();
  console.log(`Current sacrifice nonce: ${nonce}`);
  
  // Check if there's a cooldown mechanism
  try {
    // Check user's last sacrifice time if it exists
    const lastSacrificeBlock = await maw.lastSacrificeBlock(USER_ADDRESS);
    console.log(`Last sacrifice block: ${lastSacrificeBlock}`);
    
    const currentBlock = await ethers.provider.getBlockNumber();
    console.log(`Current block: ${currentBlock}`);
    console.log(`Blocks since last sacrifice: ${currentBlock - lastSacrificeBlock}`);
    
    // Check if there's a minimum blocks requirement
    try {
      const minBlocks = await maw.minBlocksBetweenSacrifices();
      console.log(`Min blocks between sacrifices: ${minBlocks}`);
      
      if (currentBlock - lastSacrificeBlock < minBlocks) {
        console.log("🚨 COOLDOWN ACTIVE! Must wait more blocks.");
        console.log(`Need to wait: ${minBlocks - (currentBlock - lastSacrificeBlock)} more blocks`);
      } else {
        console.log("✅ No cooldown issues");
      }
    } catch (e) {
      console.log("No minBlocksBetweenSacrifices function");
    }
    
  } catch (error) {
    console.log("No lastSacrificeBlock function or other error:", error.message);
  }
  
  // Check pause states
  const sacrificesPaused = await maw.sacrificesPaused();
  const contractPaused = await maw.paused();
  console.log(`\nSacrifices paused: ${sacrificesPaused}`);
  console.log(`Contract paused: ${contractPaused}`);
  
  // Try static call again to see current state
  console.log("\n🧪 Testing static call now...");
  try {
    await maw.sacrificeKeys.staticCall(1, { from: USER_ADDRESS });
    console.log("✅ Static call succeeds - should work");
  } catch (error) {
    console.log("❌ Static call fails:", error.message);
    console.log("This explains why the real transaction fails");
  }
  
  // Check gas estimation
  console.log("\n⛽ Testing gas estimation...");
  try {
    const gasEstimate = await maw.sacrificeKeys.estimateGas(1);
    console.log(`Gas estimate: ${gasEstimate.toString()}`);
  } catch (error) {
    console.log("❌ Gas estimation fails:", error.message);
  }
}

main().catch(console.error);