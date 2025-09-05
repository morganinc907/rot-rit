const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Checking if we are the proxy admin...");
  
  const RELICS_ADDRESS = addresses.baseSepolia.Relics;
  const [signer] = await ethers.getSigners();
  
  console.log("Our address:", signer.address);
  console.log("Relics address:", RELICS_ADDRESS);
  
  try {
    // Check if this is a proxy by reading the EIP-1967 admin slot
    const ADMIN_SLOT = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"; // bytes32(uint256(keccak256("eip1967.proxy.admin")) - 1)
    
    const adminSlotValue = await ethers.provider.getStorage(RELICS_ADDRESS, ADMIN_SLOT);
    const proxyAdmin = ethers.getAddress("0x" + adminSlotValue.slice(-40));
    
    console.log("Proxy admin:", proxyAdmin);
    console.log("Are we the proxy admin?", proxyAdmin.toLowerCase() === signer.address.toLowerCase());
    
    if (proxyAdmin.toLowerCase() === signer.address.toLowerCase()) {
      console.log("\n🚨 FOUND THE PROBLEM!");
      console.log("We are the TransparentUpgradeableProxy admin.");
      console.log("Transparent proxies revert when admin calls implementation functions.");
      console.log("This explains why hasRole() calls fail!");
      
      // Try calling a simple function to confirm the issue
      console.log("\nTesting call from admin (should revert):");
      const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
      try {
        const owner = await relics.owner();
        console.log("Owner call succeeded:", owner);
      } catch (e) {
        console.log("Owner call failed:", e.message);
      }
    }
    
  } catch (error) {
    console.log("Could not check proxy admin:", error.message);
    
    // Alternative: check if it is a proxy by looking for proxy methods
    console.log("\nTrying alternative proxy detection...");
    try {
      const code = await ethers.provider.getCode(RELICS_ADDRESS);
      if (code.length > 100) {
        console.log("Contract has code, checking if proxy...");
        // Look for common proxy signatures in bytecode
        const hasProxySignature = code.includes("1967") || code.includes("360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc");
        console.log("Likely a proxy:", hasProxySignature);
      }
    } catch (e) {
      console.log("Code check failed:", e.message);
    }
  }
}

main().catch(console.error);
