const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Reverse engineering the error...");
  
  const errorSelector = "0x8a164f63";
  console.log(`🎯 Target: ${errorSelector}`);
  
  // Let's try to brute force some possibilities
  // The error might be from older contract versions or different naming
  
  const possibleErrors = [
    // Potential variations
    "InsufficientKeys()",
    "InsufficientTokens()",
    "InsufficientFunds()",
    "NotEnoughKeys()",
    "NotEnoughBalance()", 
    "BalanceTooLow()",
    "KeysRequired()",
    
    // Timing related
    "TooEarly()",
    "TooLate()",
    "TimeLocked()",
    "CooldownNotPassed()",
    
    // Authorization
    "NotApproved()",
    "NotAllowed()",
    "Forbidden()",
    "AccessDenied()",
    
    // Generic
    "Failed()",
    "Error()",
    "Revert()",
    "Exception()",
    
    // Contract state
    "ContractPaused()",
    "ServicePaused()",
    "Disabled()",
    "Locked()",
    
    // ERC1155 variations
    "ERC1155_INSUFFICIENT_BALANCE()",
    "INSUFFICIENT_BALANCE()",
    "BALANCE_TOO_LOW()",
    
    // Numbers
    "InvalidAmount0()",
    "InvalidAmount1()", 
    "InvalidAmount2()",
    
    // Maybe it's a function selector being misinterpreted?
    "pause()",
    "unpause()",
    "burn(address,uint256,uint256)"
  ];
  
  console.log("🧪 Testing possibilities:");
  for (let i = 0; i < possibleErrors.length; i++) {
    const error = possibleErrors[i];
    const selector = ethers.id(error).slice(0, 10);
    
    if (selector === errorSelector) {
      console.log(`✅ FOUND IT! Error: ${error} -> ${selector}`);
      return;
    }
    
    // Show progress
    if (i % 10 === 0) {
      console.log(`⏳ Checked ${i}/${possibleErrors.length}...`);
    }
  }
  
  console.log("❌ Still not found");
  
  // Let's also check if it could be a different type of revert
  console.log("\n🔍 Checking if it's a different error format...");
  console.log(`Raw bytes: ${errorSelector}`);
  
  // Convert to decimal
  const decimal = parseInt(errorSelector, 16);
  console.log(`Decimal: ${decimal}`);
  
  // Check if it could be a panic code
  if (errorSelector.startsWith("0x4e487b71")) {
    console.log("🚨 This looks like a Panic error!");
  }
  
  console.log("\n💡 This error might be:");
  console.log("1. From a different contract interface than expected");
  console.log("2. From an older version of the contract");
  console.log("3. A low-level revert without a proper error message");
  console.log("4. An ABI encoding/decoding issue");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});