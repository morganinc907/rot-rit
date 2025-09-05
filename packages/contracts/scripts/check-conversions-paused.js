const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Checking conversion pause status...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  
  try {
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
    
    console.log("📊 Pause status:");
    
    // Check all pause states
    const globalPaused = await maw.paused();
    const conversionsPaused = await maw.conversionsPaused();
    
    console.log("- Global paused:", globalPaused);
    console.log("- Conversions paused:", conversionsPaused);
    
    // Use the combined getter if it exists
    try {
      const [global, sacrifices, conversions] = await maw.getPauseStatus();
      console.log("- Combined status:", { global, sacrifices, conversions });
    } catch (e) {
      console.log("- getPauseStatus() not available");
    }
    
    if (conversionsPaused) {
      console.log("\n🚨 CONVERSIONS ARE PAUSED!");
      console.log("This explains the revert. Need to unpause conversions.");
      
      // Check if we're the owner and can unpause
      const owner = await maw.owner();
      console.log("Contract owner:", owner);
      
      const [signer] = await ethers.getSigners();
      console.log("Our address:", signer.address);
      console.log("Are we owner?", owner.toLowerCase() === signer.address.toLowerCase());
      
    } else {
      console.log("\n✅ Conversions are not paused - there might be another issue");
    }
    
  } catch (error) {
    console.error("❌ Check failed:", error.message);
  }
}

main().catch(console.error);
