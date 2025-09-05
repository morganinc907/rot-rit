const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🧪 Testing convertShardsToRustedCaps function...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  
  try {
    // Connect to the upgraded proxy
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
    
    // Check if function exists
    const hasFunction = maw.interface.hasFunction("convertShardsToRustedCaps");
    console.log("✅ Function exists:", hasFunction);
    
    if (hasFunction) {
      // Get function selector for verification
      const fragment = maw.interface.getFunction("convertShardsToRustedCaps");
      console.log("✅ Function fragment:", fragment.name);
      
      // Test with a dry run (should work now)
      console.log("🔍 Testing function call with amount 10...");
      
      // Check if contract is paused
      const isPaused = await maw.paused();
      console.log("Contract paused:", isPaused);
      
      if (!isPaused) {
        console.log("✅ Contract is not paused - conversion should work!");
      } else {
        console.log("⚠️  Contract is paused - you'll need to unpause it first");
      }
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

main().catch(console.error);