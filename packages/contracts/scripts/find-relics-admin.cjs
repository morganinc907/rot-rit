const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Finding Relics contract admin...");
  
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  const [signer] = await ethers.getSigners();
  
  console.log("Current signer:", signer.address);
  console.log("Relics contract:", addresses.baseSepolia.Relics);
  
  const defaultAdminRole = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const mawRole = ethers.keccak256(ethers.toUtf8Bytes("MAW_ROLE"));
  
  console.log("\n📋 Checking role structure:");
  console.log("DEFAULT_ADMIN_ROLE:", defaultAdminRole);
  console.log("MAW_ROLE:", mawRole);
  
  try {
    // Check who has DEFAULT_ADMIN_ROLE
    console.log("\n🔍 Finding DEFAULT_ADMIN_ROLE holders...");
    
    // Check if current signer has admin role
    const signerHasAdmin = await relics.hasRole(defaultAdminRole, signer.address);
    console.log(`Current signer has DEFAULT_ADMIN_ROLE: ${signerHasAdmin}`);
    
    // Check who admin of MAW_ROLE is
    const mawRoleAdmin = await relics.getRoleAdmin(mawRole);
    console.log(`MAW_ROLE admin is: ${mawRoleAdmin}`);
    
    // Check if MAW_ROLE admin is DEFAULT_ADMIN_ROLE
    if (mawRoleAdmin === defaultAdminRole) {
      console.log("✅ MAW_ROLE is administered by DEFAULT_ADMIN_ROLE");
      
      if (signerHasAdmin) {
        console.log("🎯 Current signer CAN grant MAW_ROLE");
      } else {
        console.log("❌ Current signer CANNOT grant MAW_ROLE - need DEFAULT_ADMIN");
      }
    } else {
      console.log(`⚠️ MAW_ROLE has custom admin: ${mawRoleAdmin}`);
      
      // Check if current signer has the custom admin role
      const hasCustomAdmin = await relics.hasRole(mawRoleAdmin, signer.address);
      console.log(`Current signer has MAW_ROLE admin role: ${hasCustomAdmin}`);
    }
    
    // Get contract owner if it exists
    try {
      const owner = await relics.owner();
      console.log(`Contract owner: ${owner}`);
      
      const ownerHasAdmin = await relics.hasRole(defaultAdminRole, owner);
      console.log(`Owner has DEFAULT_ADMIN_ROLE: ${ownerHasAdmin}`);
    } catch (ownerError) {
      console.log("Contract doesn't have owner() function");
    }
    
  } catch (error) {
    console.log("❌ Error checking roles:", error.message);
  }
  
  // Check deployment history to see who originally deployed
  console.log("\n📜 Contract deployment info:");
  try {
    const deploymentBlock = 26137090; // approximate, you might need to adjust
    const events = await relics.queryFilter(relics.filters.RoleGranted(), deploymentBlock, deploymentBlock + 1000);
    
    console.log(`Found ${events.length} RoleGranted events near deployment:`);
    for (const event of events.slice(0, 5)) {
      console.log(`  Block ${event.blockNumber}: Role ${event.args.role} granted to ${event.args.account} by ${event.args.sender}`);
    }
  } catch (eventError) {
    console.log("Could not fetch deployment events");
  }
}

main().catch(console.error);