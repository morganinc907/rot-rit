const { ethers } = require("hardhat");

async function main() {
  const errorData = "0xa8fb6134";
  
  console.log("🔍 Decoding error data:", errorData);
  
  // Common MawSacrifice error signatures
  const errors = [
    "InsufficientBalance()",
    "InvalidAmount()", 
    "TooFast()",
    "SacrificesPaused()",
    "ConversionsPaused()",
    "NoCosmetics()",
    "NoCosmeticsOfRarity()",
    "NotAuthorizedToBurn()",
    "EnforcedPause()"
  ];
  
  for (const error of errors) {
    const signature = ethers.id(error).slice(0, 10);
    console.log(`${error}: ${signature}`);
    if (signature === errorData) {
      console.log(`✅ MATCH: ${error}`);
      return;
    }
  }
  
  console.log("❌ Error not found in common list");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });