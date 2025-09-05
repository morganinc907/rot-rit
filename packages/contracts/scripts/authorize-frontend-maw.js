const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Authorizing the EXACT frontend MawSacrifice address...");
  
  const FRONTEND_MAW_ADDRESS = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  const [signer] = await ethers.getSigners();
  console.log("Signer:", signer.address);
  console.log("Frontend MawSacrifice:", FRONTEND_MAW_ADDRESS);
  console.log("Relics:", RELICS_ADDRESS);
  
  const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
  
  // Get the exact MAW_ROLE hash from the contract
  try {
    const mawRoleFromContract = await relics.MAW_ROLE();
    console.log("MAW_ROLE from contract:", mawRoleFromContract);
    
    // Grant the role directly
    console.log("Granting MAW_ROLE to frontend address...");
    const tx = await relics.grantRole(mawRoleFromContract, FRONTEND_MAW_ADDRESS);
    await tx.wait();
    console.log("✅ Role granted! Hash:", tx.hash);
    
    // Verify
    const hasRole = await relics.hasRole(mawRoleFromContract, FRONTEND_MAW_ADDRESS);
    console.log("Verification - address has MAW_ROLE:", hasRole);
    
  } catch (error) {
    console.error("Failed:", error.message);
  }
}

main().catch(console.error);
