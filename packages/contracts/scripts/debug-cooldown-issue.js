const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Debugging why sacrificeKeys still fails...");
  
  const [signer] = await ethers.getSigners();
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const RELICS_ADDRESS = addresses.baseSepolia.Relics;
  
  try {
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
    const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
    
    // Check current state
    const keyBalance = await relics.balanceOf(signer.address, 1);
    const currentBlock = await ethers.provider.getBlockNumber();
    const lastSacrificeBlock = await maw.lastSacrificeBlock(signer.address);
    const minBlocks = await maw.minBlocksBetweenSacrifices();
    
    console.log("User:", signer.address);
    console.log("Rusted caps balance:", keyBalance.toString());
    console.log("Current block:", currentBlock);
    console.log("Last sacrifice block:", lastSacrificeBlock.toString());
    console.log("Min blocks between sacrifices:", minBlocks.toString());
    
    const blocksSinceLastSacrifice = currentBlock - Number(lastSacrificeBlock);
    console.log("Blocks since last sacrifice:", blocksSinceLastSacrifice);
    
    // Check if cooldown would block
    const wouldBlock = currentBlock <= Number(lastSacrificeBlock) + Number(minBlocks);
    console.log("Cooldown would block:", wouldBlock);
    
    // Try a simulation
    console.log("\nTrying simulation...");
    try {
      await maw.sacrificeKeys.staticCall(1);
      console.log("✅ Simulation successful");
    } catch (e) {
      console.log("❌ Simulation failed:", e.message);
      if (e.data) {
        console.log("Error data:", e.data);
      }
    }
    
    // Try actual transaction
    if (keyBalance > 0) {
      console.log("\nAttempting actual transaction...");
      try {
        const tx = await maw.sacrificeKeys(1);
        await tx.wait();
        console.log("✅ SUCCESS:", tx.hash);
      } catch (e) {
        console.log("❌ FAILED:", e.message);
      }
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
