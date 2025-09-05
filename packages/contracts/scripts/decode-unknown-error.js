const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Trying to decode unknown error 0x8a164f63...");
  
  // The error could be from different sources:
  // 1. ERC1155 errors (from Relics contract)
  // 2. AccessControl errors (from role-based permissions)
  // 3. Generic contract errors
  
  const errorData = "0x8a164f63";
  console.log(`🎯 Error data: ${errorData}`);
  
  // Try common ERC1155 errors
  const erc1155Errors = [
    "ERC1155InsufficientBalance(address,uint256,uint256)",
    "ERC1155InvalidSender(address)",
    "ERC1155InvalidReceiver(address)",
    "ERC1155MissingApprovalForAll(address,address)",
    "ERC1155InvalidApprover(address)",
    "ERC1155InvalidOperator(address)"
  ];
  
  console.log("🧪 Checking ERC1155 errors:");
  for (const error of erc1155Errors) {
    const selector = ethers.id(error).slice(0, 10);
    console.log(`${error.padEnd(45)} -> ${selector}`);
    if (selector === errorData) {
      console.log(`✅ MATCH! Error is: ${error}`);
      return;
    }
  }
  
  // Try AccessControl errors
  const accessErrors = [
    "AccessControlUnauthorizedAccount(address,bytes32)",
    "AccessControlBadConfirmation()"
  ];
  
  console.log("\n🔐 Checking AccessControl errors:");
  for (const error of accessErrors) {
    const selector = ethers.id(error).slice(0, 10);
    console.log(`${error.padEnd(45)} -> ${selector}`);
    if (selector === errorData) {
      console.log(`✅ MATCH! Error is: ${error}`);
      return;
    }
  }
  
  // Try some other common errors
  const commonErrors = [
    "Unauthorized()",
    "TransferFailed()",
    "CallFailed()",
    "InvalidLength()",
    "ArrayLengthMismatch()",
    "ZeroAmount()",
    "ZeroAddress()",
    "InvalidInput()"
  ];
  
  console.log("\n🔧 Checking common errors:");
  for (const error of commonErrors) {
    const selector = ethers.id(error).slice(0, 10);
    console.log(`${error.padEnd(25)} -> ${selector}`);
    if (selector === errorData) {
      console.log(`✅ MATCH! Error is: ${error}`);
      return;
    }
  }
  
  console.log("\n❌ Error selector not found in common patterns");
  console.log("💡 This might be a custom error or interface mismatch");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});