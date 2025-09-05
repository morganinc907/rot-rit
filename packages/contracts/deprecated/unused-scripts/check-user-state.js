const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking user state for new contract...\n");
  
  const NEW_MAW_ADDRESS = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A"; // Your wallet
  
  const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
  const maw = await ethers.getContractAt("MawSacrificeV4Upgradeable", NEW_MAW_ADDRESS);
  
  console.log("User:", USER_ADDRESS);
  console.log("New MawSacrifice:", NEW_MAW_ADDRESS);
  
  try {
    // Check balances
    const keyBalance = await relics.balanceOf(USER_ADDRESS, 1); // Rusted Keys
    const fragmentBalance = await relics.balanceOf(USER_ADDRESS, 2); // Lantern Fragments
    const maskBalance = await relics.balanceOf(USER_ADDRESS, 3); // Worm-Eaten Masks
    
    console.log("📋 User Balances:");
    console.log("   Rusted Keys:", keyBalance.toString());
    console.log("   Lantern Fragments:", fragmentBalance.toString());
    console.log("   Worm-Eaten Masks:", maskBalance.toString());
    
    // Check approval
    const isApproved = await relics.isApprovedForAll(USER_ADDRESS, NEW_MAW_ADDRESS);
    console.log("   Approved for new contract:", isApproved);
    
    // Check contract state
    const isPaused = await maw.paused();
    const sacrificesPaused = await maw.sacrificesPaused();
    const lastBlock = await maw.lastSacrificeBlock(USER_ADDRESS);
    const minBlocks = await maw.minBlocksBetweenSacrifices();
    const currentBlock = await ethers.provider.getBlockNumber();
    
    console.log("📋 Contract State:");
    console.log("   Contract paused:", isPaused);
    console.log("   Sacrifices paused:", sacrificesPaused);
    console.log("   Last sacrifice block:", lastBlock.toString());
    console.log("   Min blocks between:", minBlocks.toString());
    console.log("   Current block:", currentBlock);
    console.log("   Blocks since last:", currentBlock - lastBlock.toString());
    console.log("   Can sacrifice:", (currentBlock - lastBlock.toString()) >= minBlocks.toString());
    
    // Test specific calls
    console.log("\n🧪 Testing function calls:");
    
    if (keyBalance > 0) {
      try {
        await maw.sacrificeKeys.staticCall(1);
        console.log("✅ sacrificeKeys(1) should work");
      } catch (error) {
        console.log("❌ sacrificeKeys(1) would fail:", error.message);
      }
    } else {
      console.log("⚠️  No keys to test sacrificeKeys");
    }
    
    if (fragmentBalance > 0) {
      try {
        await maw.sacrificeForCosmetic.staticCall(1, 0);
        console.log("✅ sacrificeForCosmetic(1,0) should work");
      } catch (error) {
        console.log("❌ sacrificeForCosmetic(1,0) would fail:", error.message);
      }
    } else {
      console.log("⚠️  No fragments to test sacrificeForCosmetic");
    }
    
  } catch (error) {
    console.error("Error during checks:", error.message);
  }
}

main().catch(console.error);