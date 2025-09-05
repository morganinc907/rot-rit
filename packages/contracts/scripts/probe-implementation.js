const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Probing implementation contract directly...");
  
  const IMPLEMENTATION_ADDRESS = "0xEf87A965151Dd1065cfb248501BA38029e0F31b9";
  
  try {
    // Try to call the implementation directly
    console.log("Implementation address:", IMPLEMENTATION_ADDRESS);
    
    // Get contract code
    const code = await ethers.provider.getCode(IMPLEMENTATION_ADDRESS);
    console.log("Has code:", code !== "0x");
    console.log("Code length:", code.length);
    
    // Try different interfaces on the implementation
    console.log("\n🧪 Testing implementation with different interfaces...");
    
    // Test V4NoTimelock
    try {
      const implV4 = await ethers.getContractAt("MawSacrificeV4NoTimelock", IMPLEMENTATION_ADDRESS);
      
      // Try to call the function directly on implementation
      console.log("🔍 Testing convertShardsToRustedCaps selector...");
      
      const iface = new ethers.Interface([
        "function convertShardsToRustedCaps(uint256 shardAmount)"
      ]);
      const fragment = iface.getFunction("convertShardsToRustedCaps");
      const selector = iface.getSelector(fragment);
      console.log("Expected selector:", selector);
      console.log("Error selector:", "0x8a164f63");
      console.log("Match:", selector === "0x8a164f63");
      
      // Check if the actual deployed bytecode contains this selector
      const selectorBytes = selector.slice(2); // Remove 0x
      const hasSelector = code.toLowerCase().includes(selectorBytes.toLowerCase());
      console.log("Bytecode contains selector:", hasSelector);
      
      if (hasSelector) {
        console.log("✅ Function selector found in bytecode");
        
        // Try to call paused() to see if we can call anything
        try {
          const isPaused = await implV4.paused();
          console.log("✅ paused() call worked:", isPaused);
          
          // The issue might be that we can't call the implementation directly
          // because it's not initialized
          console.log("⚠️  Implementation might not be initialized for direct calls");
          
        } catch (e) {
          console.log("❌ Even paused() failed on implementation:", e.message);
        }
      } else {
        console.log("❌ Function selector NOT found in bytecode");
        console.log("This means the deployed contract doesn't have this function");
      }
      
    } catch (e) {
      console.log("❌ V4NoTimelock interface failed:", e.message);
    }
    
  } catch (error) {
    console.error("❌ Probe failed:", error.message);
  }
}

main().catch(console.error);