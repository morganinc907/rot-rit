const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Simple conversion state check...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const [signer] = await ethers.getSigners();
  
  try {
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
    
    console.log("📋 Contract state:");
    console.log("Contract address:", PROXY_ADDRESS);
    console.log("Signer address:", signer.address);
    
    console.log("\n🔐 Checking pause states:");
    
    // Check general pause
    try {
      const isPaused = await maw.paused();
      console.log(`- Contract paused: ${isPaused}`);
      
      if (isPaused) {
        console.log("🚨 CONTRACT IS PAUSED - This will cause all functions to revert!");
      }
    } catch (e) {
      console.log("- Cannot check pause state:", e.message);
    }
    
    // Check conversions pause
    try {
      const conversionsStatus = await maw.conversionsPaused();
      console.log(`- Conversions paused: ${conversionsStatus}`);
      
      if (conversionsStatus) {
        console.log("🚨 CONVERSIONS ARE PAUSED - convertShardsToRustedCaps will fail!");
      }
    } catch (e) {
      console.log("- Cannot check conversions pause:", e.message);
    }
    
    // Check sacrifices pause
    try {
      const sacrificesStatus = await maw.sacrificesPaused();
      console.log(`- Sacrifices paused: ${sacrificesStatus}`);
    } catch (e) {
      console.log("- Cannot check sacrifices pause:", e.message);
    }
    
    console.log("\n✅ If both are false, the conversion should work (assuming user has enough shards and approval)");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);