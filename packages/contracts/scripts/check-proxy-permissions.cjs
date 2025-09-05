const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Checking if proxy has MAW_ROLE...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const RELICS_ADDRESS = addresses.baseSepolia.Relics;
  
  const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
  
  try {
    // Calculate MAW_ROLE hash manually since the contract call is failing
    const mawRoleHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MAW_ROLE"));
    console.log("MAW_ROLE hash:", mawRoleHash);
    
    // Check if proxy has the role
    const hasRole = await relics.hasRole(mawRoleHash, PROXY_ADDRESS);
    console.log("Proxy has MAW_ROLE:", hasRole);
    
    if (!hasRole) {
      console.log("❌ Proxy doesn't have MAW_ROLE!");
      console.log("This explains why canMintCaps returns false");
    } else {
      console.log("✅ Proxy has MAW_ROLE - the issue is elsewhere");
    }
    
    // Also check the current mawSacrifice address in Relics
    const currentMawAddress = await relics.mawSacrifice();
    console.log("Current mawSacrifice address:", currentMawAddress);
    console.log("Expected proxy address:", PROXY_ADDRESS);
    console.log("Addresses match:", currentMawAddress.toLowerCase() === PROXY_ADDRESS.toLowerCase());
    
  } catch (error) {
    console.log("❌ Error checking permissions:", error.message);
  }
}

main().catch(console.error);