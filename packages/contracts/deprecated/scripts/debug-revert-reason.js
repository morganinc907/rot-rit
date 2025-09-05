const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging revert reason for sacrificeForCosmetic...\n");
  
  const proxyAddress = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  const [signer] = await ethers.getSigners();
  
  const proxy = await ethers.getContractAt("MawSacrificeV4Upgradeable", proxyAddress);
  
  console.log("Testing with user:", signer.address);
  
  // Check all the possible revert conditions
  console.log("\n=== CHECKING POSSIBLE REVERT CONDITIONS ===");
  
  try {
    // 1. Check if contract is paused
    const isPaused = await proxy.paused();
    console.log("1. Contract paused:", isPaused);
    
    // 2. Check if sacrifices are paused
    const sacrificesPaused = await proxy.sacrificesPaused();
    console.log("2. Sacrifices paused:", sacrificesPaused);
    
    // 3. Check user's fragment balance
    const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
    const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
    const LANTERN_FRAGMENT = 2;
    const fragmentBalance = await relics.balanceOf(signer.address, LANTERN_FRAGMENT);
    console.log("3. User's fragment balance:", fragmentBalance.toString());
    
    // 4. Check if user has approval
    const isApproved = await relics.isApprovedForAll(signer.address, proxyAddress);
    console.log("4. User has approval:", isApproved);
    
    // 5. Check anti-bot timing
    const lastSacrificeBlock = await proxy.lastSacrificeBlock(signer.address);
    const currentBlock = BigInt(await ethers.provider.getBlockNumber());
    const minBlocks = await proxy.minBlocksBetweenSacrifices();
    const blocksRemaining = lastSacrificeBlock + minBlocks - currentBlock;
    console.log("5. Last sacrifice block:", lastSacrificeBlock.toString());
    console.log("   Current block:", currentBlock.toString());
    console.log("   Min blocks between:", minBlocks.toString());
    console.log("   Blocks remaining:", blocksRemaining.toString());
    console.log("   Anti-bot check:", blocksRemaining <= 0n ? "PASS" : "FAIL");
    
    // 6. Check cosmetic types are set
    const cosmeticTypes = await proxy.getCurrentCosmeticTypes();
    console.log("6. Current cosmetic types:", cosmeticTypes.map(t => t.toString()));
    
    // Now try the actual call with detailed error
    console.log("\n=== ATTEMPTING ACTUAL CALL ===");
    try {
      await proxy.sacrificeForCosmetic.staticCall(1, 0);
      console.log("✅ Static call succeeded - transaction should work!");
    } catch (error) {
      console.log("❌ Static call failed:", error.message);
      
      // Try to decode the revert reason
      if (error.data) {
        console.log("Error data:", error.data);
        try {
          const decodedError = proxy.interface.parseError(error.data);
          console.log("Decoded error:", decodedError);
        } catch (e) {
          console.log("Could not decode error data");
        }
      }
    }
    
  } catch (error) {
    console.error("Error during checks:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});