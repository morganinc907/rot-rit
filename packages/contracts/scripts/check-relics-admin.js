const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking Relics contract admin status...");
  
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const [signer] = await ethers.getSigners();
  
  console.log("Our address:", signer.address);
  console.log("Relics address:", RELICS_ADDRESS);
  
  const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
  
  try {
    // Check owner
    const owner = await relics.owner();
    console.log("Relics owner:", owner);
    console.log("We are owner:", owner.toLowerCase() === signer.address.toLowerCase());
    
    // Check DEFAULT_ADMIN_ROLE
    const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000"; // bytes32(0)
    const hasAdminRole = await relics.hasRole(DEFAULT_ADMIN_ROLE, signer.address);
    console.log("We have DEFAULT_ADMIN_ROLE:", hasAdminRole);
    
    // Check who has DEFAULT_ADMIN_ROLE
    console.log("\nChecking for DEFAULT_ADMIN_ROLE holders...");
    const filter = relics.filters.RoleGranted(DEFAULT_ADMIN_ROLE);
    const events = await relics.queryFilter(filter, 0, "latest");
    
    console.log("DEFAULT_ADMIN_ROLE granted to:");
    for (const event of events) {
      console.log(`- ${event.args.account} at block ${event.blockNumber}`);
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
