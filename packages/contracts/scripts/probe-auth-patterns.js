const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Probing Relics contract interface...");
  
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
  
  try {
    // Test supportsInterface for AccessControl
    console.log("Testing AccessControl interface support:");
    try {
      const supportsAccessControl = await relics.supportsInterface("0x7965db0b"); // AccessControl interface ID
      console.log("Supports AccessControl (0x7965db0b):", supportsAccessControl);
    } catch (e) {
      console.log("AccessControl interface check failed:", e.message);
    }
    
    // Test other interfaces
    console.log("\nTesting other interfaces:");
    try {
      const supportsERC1155 = await relics.supportsInterface("0xd9b67a26");
      console.log("Supports ERC1155 (0xd9b67a26):", supportsERC1155);
    } catch (e) {
      console.log("ERC1155 check failed");
    }
    
    // Test authorization patterns
    console.log("\nTesting authorization patterns:");
    
    // Pattern 1: Simple mawSacrifice address check
    const mawSacrificeAddr = await relics.mawSacrifice();
    console.log("mawSacrifice address:", mawSacrificeAddr);
    
    // Pattern 2: Try common allowlist patterns
    const proxyAddr = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
    
    try {
      const result = await ethers.provider.call({
        to: RELICS_ADDRESS,
        data: "0x" + ethers.keccak256(ethers.toUtf8Bytes("authorized(address)")).slice(2, 10) + 
              ethers.zeroPadValue(proxyAddr, 32).slice(2)
      });
      console.log("authorized(address) result:", result);
    } catch (e) {
      console.log("authorized(address) pattern not found");
    }
    
    try {
      const result = await ethers.provider.call({
        to: RELICS_ADDRESS,  
        data: "0x" + ethers.keccak256(ethers.toUtf8Bytes("isAuthorized(address)")).slice(2, 10) + 
              ethers.zeroPadValue(proxyAddr, 32).slice(2)
      });
      console.log("isAuthorized(address) result:", result);
    } catch (e) {
      console.log("isAuthorized(address) pattern not found");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
