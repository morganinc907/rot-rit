const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking function signature...");
  
  // Get the function signature
  const iface = new ethers.Interface([
    "function convertShardsToRustedCaps(uint256 shardAmount)"
  ]);
  
  const fragment = iface.getFunction("convertShardsToRustedCaps");
  const selector = iface.getSelector("convertShardsToRustedCaps");
  
  console.log("Function selector:", selector);
  console.log("Error we got:", "0x8a164f63");
  console.log("Match:", selector === "0x8a164f63");
  
  // If they match, it means the function exists but is reverting with no reason
  if (selector === "0x8a164f63") {
    console.log("🚨 The error IS the function selector!");
    console.log("This means the function doesnt exist on the deployed contract");
  }
}

main().catch(console.error);
