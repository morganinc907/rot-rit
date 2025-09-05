const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking function selector manually...");
  
  const IMPLEMENTATION_ADDRESS = "0xEf87A965151Dd1065cfb248501BA38029e0F31b9";
  
  try {
    // Calculate function selector manually
    const funcSig = "convertShardsToRustedCaps(uint256)";
    const hash = ethers.keccak256(ethers.toUtf8Bytes(funcSig));
    const selector = hash.slice(0, 10); // First 4 bytes (8 hex chars + 0x)
    
    console.log("Function signature:", funcSig);
    console.log("Keccak256 hash:", hash);
    console.log("Calculated selector:", selector);
    console.log("Error we got:", "0x8a164f63");
    console.log("Match:", selector === "0x8a164f63");
    
    if (selector === "0x8a164f63") {
      console.log("\n🚨 CONFIRMED: The error IS the function selector!");
      console.log("This means the function doesn't exist on the deployed contract");
      
      // Get bytecode and check if selector is there
      const code = await ethers.provider.getCode(IMPLEMENTATION_ADDRESS);
      const selectorHex = selector.slice(2); // Remove 0x
      const hasSelector = code.toLowerCase().includes(selectorHex.toLowerCase());
      
      console.log("Implementation bytecode length:", code.length);
      console.log("Bytecode contains selector:", hasSelector);
      
      if (!hasSelector) {
        console.log("❌ The deployed implementation does NOT contain this function");
        console.log("The contract at this address is not MawSacrificeV4NoTimelock");
        console.log("We need to deploy the correct implementation first");
      }
    }
    
    // Also check what contract is actually deployed there
    console.log("\n🔍 Testing what functions ARE available...");
    try {
      const contract = await ethers.getContractAt("MawSacrificeV4NoTimelock", IMPLEMENTATION_ADDRESS);
      const isPaused = await contract.paused();
      console.log("paused() works:", isPaused);
    } catch (e) {
      console.log("Can't call paused():", e.message);
    }
    
  } catch (error) {
    console.error("❌ Check failed:", error.message);
  }
}

main().catch(console.error);