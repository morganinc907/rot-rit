const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Checking current proxy implementation...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const EXPECTED_IMPL = "0xEf87A965151Dd1065cfb248501BA38029e0F31b9";
  
  try {
    // Use the proxy admin storage slot to get implementation
    // EIP-1967: keccak256("eip1967.proxy.implementation") - 1
    const IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    
    const implAddressHex = await ethers.provider.getStorage(PROXY_ADDRESS, IMPLEMENTATION_SLOT);
    const implAddress = "0x" + implAddressHex.slice(-40);
    
    console.log("Proxy address:", PROXY_ADDRESS);
    console.log("Current implementation:", implAddress);
    console.log("Expected implementation:", EXPECTED_IMPL);
    console.log("Match:", implAddress.toLowerCase() === EXPECTED_IMPL.toLowerCase());
    
    // Try to interact with both implementations
    console.log("\n🧪 Testing V4NoTimelock interface on proxy...");
    try {
      const mawV4 = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
      const hasConvert = mawV4.interface.hasFunction("convertShardsToRustedCaps");
      console.log("Interface has convertShardsToRustedCaps:", hasConvert);
      
      // Try to call a simple function that should exist
      const isPaused = await mawV4.paused();
      console.log("paused() call successful:", isPaused);
      
    } catch (e) {
      console.log("❌ V4NoTimelock interface failed:", e.message);
    }
    
    console.log("\n🧪 Testing V3 interface on proxy...");
    try {
      const mawV3 = await ethers.getContractAt("MawSacrificeV3Upgradeable", PROXY_ADDRESS);
      const isPaused = await mawV3.paused();
      console.log("V3 paused() call successful:", isPaused);
      
    } catch (e) {
      console.log("❌ V3 interface failed:", e.message);
    }
    
  } catch (error) {
    console.error("❌ Check failed:", error.message);
  }
}

main().catch(console.error);