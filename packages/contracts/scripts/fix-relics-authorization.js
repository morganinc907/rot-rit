const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking Relics contract state and testing burn directly...");
  
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const FRONTEND_MAW_ADDRESS = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
  
  const [signer] = await ethers.getSigners();
  const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
  
  try {
    console.log("Checking contract state...");
    
    // Check if paused
    const isPaused = await relics.paused();
    console.log("Contract paused:", isPaused);
    
    // Check our balance
    const balance = await relics.balanceOf(signer.address, 1);
    console.log("Our rusted caps balance:", balance.toString());
    
    // Try to call burn as the MawSacrifice contract would
    console.log("\nTesting burn authorization...");
    
    // First try direct burn (should fail)
    try {
      await relics.burn.staticCall(signer.address, 1, 1);
      console.log("❌ Direct burn should have failed");
    } catch (e) {
      console.log("✅ Direct burn properly blocked:", e.message.split("(")[0]);
    }
    
    // Check what the mawSacrifice address is set to
    const currentMawSacrifice = await relics.mawSacrifice();
    console.log("\nCurrent mawSacrifice in contract:", currentMawSacrifice);
    console.log("Frontend expects:", FRONTEND_MAW_ADDRESS);
    console.log("Match:", currentMawSacrifice.toLowerCase() === FRONTEND_MAW_ADDRESS.toLowerCase());
    
    // If they dont match, this is the problem!
    if (currentMawSacrifice.toLowerCase() !== FRONTEND_MAW_ADDRESS.toLowerCase()) {
      console.log("\n🚨 FOUND THE PROBLEM! Wrong mawSacrifice address in Relics contract");
      console.log("Fixing with setMawSacrifice...");
      
      const tx = await relics.setMawSacrifice(FRONTEND_MAW_ADDRESS);
      await tx.wait();
      console.log("✅ Fixed! Transaction:", tx.hash);
      
      // Verify
      const newMawSacrifice = await relics.mawSacrifice();
      console.log("New mawSacrifice:", newMawSacrifice);
      console.log("Now matches:", newMawSacrifice.toLowerCase() === FRONTEND_MAW_ADDRESS.toLowerCase());
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
