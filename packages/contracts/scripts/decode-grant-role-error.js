const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Investigating Relics contract roles...");
  
  const [signer] = await ethers.getSigners();
  console.log("Signer address:", signer.address);
  
  // Contract addresses
  const MawSacrificeAddress = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
  const RelicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  // Get contracts
  const relicsContract = await ethers.getContractAt("Relics", RelicsAddress);
  
  console.log("Testing different role approaches...");
  
  try {
    // Try to get DEFAULT_ADMIN_ROLE
    const DEFAULT_ADMIN_ROLE = await relicsContract.DEFAULT_ADMIN_ROLE();
    console.log("DEFAULT_ADMIN_ROLE:", DEFAULT_ADMIN_ROLE);
    
    // Check if signer has admin role
    const hasAdminRole = await relicsContract.hasRole(DEFAULT_ADMIN_ROLE, signer.address);
    console.log("We have admin role:", hasAdminRole);
  } catch (e) {
    console.log("DEFAULT_ADMIN_ROLE error:", e.message);
  }
  
  // Try different role names that might exist
  const possibleRoles = [
    'MINTER_ROLE',
    'BURNER_ROLE', 
    'MAW_ROLE',
    'RITUAL_ROLE',
    'KEYSHOP_ROLE',
    'ADMIN_ROLE'
  ];
  
  for (const roleName of possibleRoles) {
    try {
      const roleHash = await relicsContract[roleName]();
      console.log(`${roleName}:`, roleHash);
      
      // Check if MawSacrifice has this role
      const hasRole = await relicsContract.hasRole(roleHash, MawSacrificeAddress);
      console.log(`MawSacrifice has ${roleName}:`, hasRole);
    } catch (e) {
      console.log(`${roleName} error:`, e.message.split('(')[0]);
    }
  }
  
  // Try to check if owner can directly authorize
  try {
    const owner = await relicsContract.owner();
    console.log("Contract owner:", owner);
    console.log("Are we owner?", owner.toLowerCase() === signer.address.toLowerCase());
  } catch (e) {
    console.log("Owner check error:", e.message);
  }
  
  // Try to call a test burn to see exact error
  console.log("\n🧪 Testing burn call...");
  try {
    await relicsContract.burn.staticCall(signer.address, 1, 1);
    console.log("✅ We can burn");
  } catch (e) {
    console.log("❌ Burn test error:", e.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });