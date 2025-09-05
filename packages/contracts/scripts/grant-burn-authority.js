const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking and granting burn authority...");
  
  const [signer] = await ethers.getSigners();
  console.log("Signer address:", signer.address);
  
  // Contract addresses
  const MawSacrificeAddress = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
  const RelicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  // Get contracts
  const relicsContract = await ethers.getContractAt("Relics", RelicsAddress);
  
  // Get roles
  const MAW_ROLE = await relicsContract.MAW_ROLE();
  const RITUAL_ROLE = await relicsContract.RITUAL_ROLE();
  const DEFAULT_ADMIN_ROLE = await relicsContract.DEFAULT_ADMIN_ROLE();
  
  console.log("MAW_ROLE:", MAW_ROLE);
  console.log("RITUAL_ROLE:", RITUAL_ROLE);
  console.log("DEFAULT_ADMIN_ROLE:", DEFAULT_ADMIN_ROLE);
  
  // Check current roles
  const hasMawRole = await relicsContract.hasRole(MAW_ROLE, MawSacrificeAddress);
  const hasRitualRole = await relicsContract.hasRole(RITUAL_ROLE, MawSacrificeAddress);
  const hasAdminRole = await relicsContract.hasRole(DEFAULT_ADMIN_ROLE, signer.address);
  
  console.log("MawSacrifice has MAW_ROLE:", hasMawRole);
  console.log("MawSacrifice has RITUAL_ROLE:", hasRitualRole);
  console.log("We have admin role:", hasAdminRole);
  
  if (!hasMawRole && !hasRitualRole) {
    console.log("🚨 MawSacrifice needs burn authority! Granting MAW_ROLE...");
    
    if (hasAdminRole) {
      const tx = await relicsContract.grantRole(MAW_ROLE, MawSacrificeAddress);
      await tx.wait();
      console.log("✅ Granted MAW_ROLE to MawSacrifice contract");
      console.log("Transaction hash:", tx.hash);
    } else {
      console.log("❌ Cannot grant role - no admin permissions");
    }
  } else {
    console.log("✅ MawSacrifice already has burn authority");
  }
  
  // Verify the role was granted
  const hasRole = await relicsContract.hasRole(MAW_ROLE, MawSacrificeAddress);
  console.log("Final check - MawSacrifice has MAW_ROLE:", hasRole);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });