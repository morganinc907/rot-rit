const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging frontend transaction failure...\n");
  
  const NEW_MAW = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
  const RELICS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const NEW_COSMETICS = "0x32640D260CeCD52581280e23B9DCc6F49D04Bdcb";
  
  const [signer] = await ethers.getSigners();
  console.log(`👤 Using account: ${signer.address}`);
  
  // Connect to contracts
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", NEW_MAW);
  const relics = await ethers.getContractAt("Relics", RELICS);
  
  try {
    console.log("=== PAUSE STATUS CHECK ===");
    
    // Check pause states
    const pauseStatus = await maw.getPauseStatus();
    console.log(`🔍 Global paused: ${pauseStatus.globalPaused}`);
    console.log(`🔍 Sacrifices paused: ${pauseStatus.sacrificesPaused_}`);
    console.log(`🔍 Conversions paused: ${pauseStatus.conversionsPaused_}`);
    
    console.log("\n=== COOLDOWN CHECK ===");
    
    // Check if there's any cooldown
    try {
      const lastSacrificeBlock = await maw.lastSacrificeBlock(signer.address);
      const currentBlock = await ethers.provider.getBlockNumber();
      console.log(`🔍 Last sacrifice block: ${lastSacrificeBlock}`);
      console.log(`🔍 Current block: ${currentBlock}`);
      console.log(`🔍 Blocks since last sacrifice: ${currentBlock - Number(lastSacrificeBlock)}`);
    } catch (e) {
      console.log("🔍 Cooldown check failed (might not exist)");
    }
    
    console.log("\n=== CONTRACT STATE CHECK ===");
    
    // Check contract configuration
    const mawRelics = await maw.relics();
    const mawCosmetics = await maw.cosmetics();
    console.log(`🎯 MawSacrifice → Relics: ${mawRelics}`);
    console.log(`🎯 MawSacrifice → Cosmetics: ${mawCosmetics}`);
    console.log(`✅ Relics match: ${mawRelics.toLowerCase() === RELICS.toLowerCase()}`);
    console.log(`✅ Cosmetics match: ${mawCosmetics.toLowerCase() === NEW_COSMETICS.toLowerCase()}`);
    
    console.log("\n=== USER STATE CHECK ===");
    
    // Check user balances and approvals
    const fragmentBalance = await relics.balanceOf(signer.address, 1); // LANTERN_FRAGMENT
    const isApproved = await relics.isApprovedForAll(signer.address, NEW_MAW);
    console.log(`🧩 Fragment balance: ${fragmentBalance}`);
    console.log(`🔑 Is approved: ${isApproved}`);
    
    console.log("\n=== SIMULATION TEST ===");
    
    // Try to simulate the exact same call as frontend
    console.log("Simulating sacrificeForCosmetic(1, 0) call...");
    
    try {
      // First try a static call to see what the error is
      await maw.sacrificeForCosmetic.staticCall(1, 0);
      console.log("✅ Static call succeeded - transaction should work");
      
      // If static call works, try the actual transaction
      const tx = await maw.sacrificeForCosmetic(1, 0, {
        gasLimit: 200000
      });
      console.log(`📤 Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`✅ Transaction successful! Gas used: ${receipt.gasUsed}`);
      
    } catch (simulationError) {
      console.log(`❌ Simulation failed: ${simulationError.message}`);
      
      // Decode the error if possible
      if (simulationError.data) {
        console.log(`🔍 Error data: ${simulationError.data}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Debug failed: ${error.message}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});