const { ethers } = require("hardhat");

async function main() {
  const PROXY_ADDRESS = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
  
  try {
    // Try different contract interfaces to see which one works
    console.log("🔍 Testing different contract interfaces...");
    
    // Try V4NoTimelock
    try {
      const mawV4 = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
      const hasConvert = mawV4.interface.hasFunction("convertShardsToRustedCaps");
      console.log("✅ MawSacrificeV4NoTimelock interface loaded");
      console.log("- Has convertShardsToRustedCaps:", hasConvert);
      
      if (hasConvert) {
        const isPaused = await mawV4.paused();
        console.log("- paused():", isPaused);
      }
    } catch (e) {
      console.log("❌ MawSacrificeV4NoTimelock failed:", e.message);
    }
    
    // Try V3
    try {
      const mawV3 = await ethers.getContractAt("MawSacrificeV3Upgradeable", PROXY_ADDRESS);
      console.log("✅ MawSacrificeV3Upgradeable interface loaded");
      
      const isPaused = await mawV3.paused();
      console.log("- paused():", isPaused);
      
    } catch (e) {
      console.log("❌ MawSacrificeV3Upgradeable failed:", e.message);
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
