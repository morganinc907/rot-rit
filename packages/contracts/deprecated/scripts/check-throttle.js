const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking Anti-bot Throttle...\n");

  const [deployer] = await hre.ethers.getSigners();
  const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  
  const mawSacrifice = await hre.ethers.getContractAt("MawSacrificeV3Upgradeable", PROXY_ADDRESS);

  try {
    const minBlocks = await mawSacrifice.minBlocksBetweenSacrifices();
    const lastBlock = await mawSacrifice.lastSacrificeBlock(deployer.address);
    const currentBlock = await hre.ethers.provider.getBlockNumber();
    
    console.log("Min blocks between sacrifices:", minBlocks.toString());
    console.log("Last sacrifice block:", lastBlock.toString());
    console.log("Current block:", currentBlock);
    console.log("Blocks since last sacrifice:", currentBlock - parseInt(lastBlock.toString()));
    console.log("Would pass throttle:", currentBlock > parseInt(lastBlock.toString()) + parseInt(minBlocks.toString()));
    
    // Check if convertShardsToRustedCaps has the antiBot modifier
    console.log("\n🔍 Checking function modifiers in source...");
    
    // Check if this function is in the error definitions
    const hasInvalidAmountError = mawSacrifice.interface.hasError('InvalidAmount');
    const hasInsufficientBalanceError = mawSacrifice.interface.hasError('InsufficientBalance'); 
    const hasTooFastError = mawSacrifice.interface.hasError('TooFast');
    
    console.log("Has InvalidAmount error:", hasInvalidAmountError);
    console.log("Has InsufficientBalance error:", hasInsufficientBalanceError);
    console.log("Has TooFast error:", hasTooFastError);
    
    if (hasTooFastError && currentBlock <= parseInt(lastBlock.toString()) + parseInt(minBlocks.toString())) {
      console.log("\n❌ PROBLEM: Throttle is active!");
      console.log("The convertShardsToRustedCaps function likely has the antiBot modifier");
      console.log("You need to wait for the next block or modify the function");
    }
    
  } catch (error) {
    console.error("❌ Throttle check failed:", error.message);
  }
}

main().catch(console.error);