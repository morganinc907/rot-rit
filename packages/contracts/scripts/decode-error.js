const { ethers } = require("hardhat");

async function main() {
  const errorData = "0x8a164f63";
  
  console.log("🔍 Decoding error data:", errorData);
  
  // Common custom errors from our contract
  const customErrors = [
    "InvalidAmount()",
    "InsufficientBalance()", 
    "SacrificesPaused()",
    "ConversionsPaused()",
    "NotAuthorized()",
    "CooldownActive()"
  ];
  
  for (const errorSig of customErrors) {
    const hash = ethers.keccak256(ethers.toUtf8Bytes(errorSig));
    const selector = hash.slice(0, 10);
    console.log(`${errorSig}: ${selector}`);
    
    if (selector === errorData) {
      console.log(`✅ MATCH FOUND: ${errorSig}`);
      return;
    }
  }
  
  // Check if it's the CooldownActive error
  const cooldownHash = ethers.keccak256(ethers.toUtf8Bytes("CooldownActive()"));
  const cooldownSelector = cooldownHash.slice(0, 10);
  console.log(`\nCooldownActive() selector: ${cooldownSelector}`);
  
  if (cooldownSelector === errorData) {
    console.log("❌ CONFIRMED: Transaction is failing due to CooldownActive() error");
    console.log("This means the smart contract cooldown is still active despite our checks");
  } else {
    console.log("🤔 Unknown error signature");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});