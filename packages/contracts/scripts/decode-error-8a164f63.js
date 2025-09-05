const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Decoding error 0x8a164f63...");
  
  const errorData = "0x8a164f63";
  
  try {
    // This might be a custom error selector
    console.log("Error data:", errorData);
    console.log("Length:", errorData.length, "chars");
    
    // Let's see if this matches any known error selectors
    const knownErrors = [
      "InsufficientBalance()",
      "NotAuthorized()",
      "Paused()",
      "InvalidAmount()",
      "ConversionDisabled()",
      "MinimumNotMet()",
      "MaximumExceeded()"
    ];
    
    console.log("\n🔍 Checking against known error patterns...");
    
    for (const errorSig of knownErrors) {
      const hash = ethers.keccak256(ethers.toUtf8Bytes(errorSig));
      const selector = hash.slice(0, 10);
      console.log(`${errorSig}: ${selector}`);
      
      if (selector === errorData) {
        console.log(`✅ MATCH: ${errorSig}`);
        break;
      }
    }
    
    // Let's also check if it could be a function selector instead of an error
    const possibleFunctions = [
      "convertShardsToRustedCaps(uint256)",
      "convertShards(uint256)",
      "convert(uint256)",
      "burnShards(uint256)"
    ];
    
    console.log("\n🔍 Checking if it's a function selector...");
    
    for (const funcSig of possibleFunctions) {
      const hash = ethers.keccak256(ethers.toUtf8Bytes(funcSig));
      const selector = hash.slice(0, 10);
      console.log(`${funcSig}: ${selector}`);
      
      if (selector === errorData) {
        console.log(`✅ FUNCTION MATCH: ${funcSig}`);
        break;
      }
    }
    
    // Let's try a more comprehensive check by testing the actual call
    console.log("\n🧪 Testing the actual function call with better error handling...");
    
    const PROXY_ADDRESS = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
    
    try {
      // Try with error decoding
      const tx = await maw.convertShardsToRustedCaps.staticCall(5);
      console.log("✅ Call succeeded:", tx);
    } catch (error) {
      console.log("❌ Call failed with error:");
      console.log("- Message:", error.message);
      console.log("- Data:", error.data);
      console.log("- Code:", error.code);
      
      if (error.data && error.data !== errorData) {
        console.log("🔍 Different error data in catch:", error.data);
      }
    }
    
  } catch (error) {
    console.error("❌ Decoding failed:", error.message);
  }
}

main().catch(console.error);
