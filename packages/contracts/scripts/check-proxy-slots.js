const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking EIP-1967 proxy slots...");
  
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  // EIP-1967 slots
  const IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
  const ADMIN_SLOT = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";
  const BEACON_SLOT = "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50";
  
  try {
    console.log("Contract:", RELICS_ADDRESS);
    
    const implSlot = await ethers.provider.getStorage(RELICS_ADDRESS, IMPLEMENTATION_SLOT);
    const adminSlot = await ethers.provider.getStorage(RELICS_ADDRESS, ADMIN_SLOT);
    const beaconSlot = await ethers.provider.getStorage(RELICS_ADDRESS, BEACON_SLOT);
    
    console.log("Implementation slot:", implSlot);
    console.log("Admin slot:", adminSlot);
    console.log("Beacon slot:", beaconSlot);
    
    // Extract addresses if nonzero
    const implAddress = implSlot !== "0x0000000000000000000000000000000000000000000000000000000000000000" 
      ? "0x" + implSlot.slice(-40) 
      : "0x0000000000000000000000000000000000000000";
      
    console.log("Implementation address:", implAddress);
    
    if (implAddress !== "0x0000000000000000000000000000000000000000") {
      console.log("🎯 This IS a proxy! Implementation at:", implAddress);
      console.log("We should inspect the implementation contract for the real ABI");
    } else {
      console.log("📍 This is NOT a proxy (direct deployment)");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
