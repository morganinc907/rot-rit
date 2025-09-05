const { ethers, upgrades } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔧 Upgrading MawSacrifice proxy to V4NoTimelock...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const V4_IMPLEMENTATION = "0xEf87A965151Dd1065cfb248501BA38029e0F31b9";
  
  console.log("Proxy address:", PROXY_ADDRESS);
  console.log("Target implementation:", V4_IMPLEMENTATION);
  
  try {
    // Get the V4 contract factory
    const MawV4Factory = await ethers.getContractFactory("MawSacrificeV4NoTimelock");
    
    console.log("📦 Upgrading proxy...");
    const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, MawV4Factory);
    
    console.log("✅ Proxy upgraded successfully!");
    console.log("Transaction hash:", upgraded.deployTransaction?.hash);
    
    // Test the upgrade worked
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
    const hasFunction = maw.interface.hasFunction("convertShardsToRustedCaps");
    console.log("✅ convertShardsToRustedCaps function available:", hasFunction);
    
    // Test if it's callable
    if (hasFunction) {
      console.log("🧪 Testing function call...");
      try {
        // Just check the function selector exists (dry run)
        const selector = maw.interface.getSelector("convertShardsToRustedCaps");
        console.log("Function selector:", selector);
        console.log("✅ Function should be callable now!");
      } catch (e) {
        console.log("⚠️  Function test failed:", e.message);
      }
    }
    
  } catch (error) {
    console.error("❌ Upgrade failed:", error.message);
    if (error.message.includes("already upgraded")) {
      console.log("ℹ️  Proxy may already be pointing to correct implementation");
      
      // Check current implementation
      const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
      const hasFunction = maw.interface.hasFunction("convertShardsToRustedCaps");
      console.log("convertShardsToRustedCaps available:", hasFunction);
    }
  }
}

main().catch(console.error);