const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging dev contract sacrifice...");

  const [signer] = await ethers.getSigners();
  const userAddress = signer.address;
  
  // Dev contract address  
  const devMawAddress = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
  
  try {
    // Get dev contract
    const maw = await ethers.getContractAt("MawSacrificeV4Dev", devMawAddress);
    
    console.log(`User: ${userAddress}`);
    console.log(`Dev Contract: ${devMawAddress}`);
    
    // Check contract state
    const paused = await maw.paused();
    const sacrificesPaused = await maw.sacrificesPaused();
    const conversionsPaused = await maw.conversionsPaused();
    
    console.log(`Contract paused: ${paused}`);
    console.log(`Sacrifices paused: ${sacrificesPaused}`);  
    console.log(`Conversions paused: ${conversionsPaused}`);
    
    // Check cooldown
    const lastBlock = await maw.lastSacrificeBlock(userAddress);
    const minBlocks = await maw.minBlocksBetweenSacrifices();
    const currentBlock = await ethers.provider.getBlockNumber();
    const blocksSince = Number(currentBlock) - Number(lastBlock);
    
    console.log(`Last sacrifice block: ${lastBlock}`);
    console.log(`Min blocks between: ${minBlocks}`);
    console.log(`Current block: ${currentBlock}`);
    console.log(`Blocks since last: ${blocksSince}`);
    console.log(`Can sacrifice: ${blocksSince >= Number(minBlocks)}`);
    
    // Check if cosmetics contract is set
    const cosmetics = await maw.cosmetics();
    console.log(`Cosmetics contract: ${cosmetics}`);
    
    // Check if relics contract can burn
    const relics = await maw.relics();
    console.log(`Relics contract: ${relics}`);
    
    // Try a static call to see the exact error
    console.log("🧪 Testing static call...");
    try {
      await maw.sacrificeForCosmetic.staticCall(1, 0);
      console.log("✅ Static call succeeded");
    } catch (error) {
      console.log(`❌ Static call failed: ${error.reason || error.message}`);
      
      // Check if it's a specific revert reason
      if (error.data) {
        console.log(`Error data: ${error.data}`);
      }
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });