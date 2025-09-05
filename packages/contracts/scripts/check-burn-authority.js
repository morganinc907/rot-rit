const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking burn authority...");
  
  const [signer] = await ethers.getSigners();
  console.log("Signer address:", signer.address);
  
  // Contract addresses
  const MawSacrificeAddress = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
  const RelicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  // Get contracts
  const relicsContract = await ethers.getContractAt("Relics", RelicsAddress);
  
  console.log("MawSacrifice address:", MawSacrificeAddress);
  console.log("Relics address:", RelicsAddress);
  
  // Check if MawSacrifice has burn role
  try {
    // Try different role checking methods
    
    // Method 1: Check if it has a BURNER_ROLE
    try {
      const BURNER_ROLE = await relicsContract.BURNER_ROLE();
      const hasBurnerRole = await relicsContract.hasRole(BURNER_ROLE, MawSacrificeAddress);
      console.log("BURNER_ROLE:", BURNER_ROLE);
      console.log("MawSacrifice has BURNER_ROLE:", hasBurnerRole);
    } catch (e) {
      console.log("BURNER_ROLE check failed:", e.message);
    }
    
    // Method 2: Check if it has a general burn permission
    try {
      const canBurn = await relicsContract.canBurn(MawSacrificeAddress);
      console.log("MawSacrifice can burn:", canBurn);
    } catch (e) {
      console.log("canBurn check failed:", e.message);
    }
    
    // Method 3: Check if it's in a burners mapping
    try {
      const isBurner = await relicsContract.burners(MawSacrificeAddress);
      console.log("MawSacrifice is burner:", isBurner);
    } catch (e) {
      console.log("burners check failed:", e.message);
    }
    
    // Method 4: Check owner to see who can grant permissions
    try {
      const owner = await relicsContract.owner();
      console.log("Relics contract owner:", owner);
      console.log("Are we the owner?", owner.toLowerCase() === signer.address.toLowerCase());
    } catch (e) {
      console.log("owner check failed:", e.message);
    }
    
    // Method 5: Check DEFAULT_ADMIN_ROLE
    try {
      const DEFAULT_ADMIN_ROLE = await relicsContract.DEFAULT_ADMIN_ROLE();
      const hasAdminRole = await relicsContract.hasRole(DEFAULT_ADMIN_ROLE, signer.address);
      console.log("DEFAULT_ADMIN_ROLE:", DEFAULT_ADMIN_ROLE);
      console.log("We have admin role:", hasAdminRole);
    } catch (e) {
      console.log("admin role check failed:", e.message);
    }
    
  } catch (error) {
    console.error("Error checking burn authority:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });