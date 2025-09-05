const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking custom error selectors...");
  
  const errorData = "0x8a164f63";
  console.log("Target error:", errorData);
  
  const customErrors = [
    "InvalidAmount()",
    "InsufficientBalance()",
    "SacrificesPaused()",
    "ConversionsPaused()",
    "NotAuthorized()",
    "CooldownActive()"
  ];
  
  console.log("\n📋 Custom error selectors:");
  
  for (const errorSig of customErrors) {
    const hash = ethers.keccak256(ethers.toUtf8Bytes(errorSig));
    const selector = hash.slice(0, 10);
    console.log(`${errorSig}: ${selector}`);
    
    if (selector === errorData) {
      console.log(`🎯 MATCH FOUND: ${errorSig}`);
      return;
    }
  }
  
  console.log("\n❌ No match found in custom errors");
  console.log("Let me try some other possibilities...");
  
  // Check some other common error patterns
  const otherErrors = [
    "ERC1155: burn amount exceeds balance",
    "ERC1155: caller is not token owner or approved",
    "Address: low-level call failed",
    "ReentrancyGuard: reentrant call"
  ];
  
  // These won't match exactly but let's see what we get
  console.log("\n🔍 Other possible errors (signatures might not match exactly):");
  
  for (const errorMsg of otherErrors) {
    const hash = ethers.keccak256(ethers.toUtf8Bytes(errorMsg));
    const selector = hash.slice(0, 10);
    console.log(`"${errorMsg}": ${selector}`);
  }
}

main().catch(console.error);
