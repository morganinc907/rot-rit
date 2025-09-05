const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Checking MAW authorization systematically...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const RELICS_ADDRESS = addresses.baseSepolia.Relics;
  
  const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
  
  console.log("Proxy address:", PROXY_ADDRESS);
  console.log("Relics address:", RELICS_ADDRESS);
  
  try {
    // Check MAW role
    const mawRoleHash = ethers.utils.id("MAW_ROLE");
    console.log("\nMAW_ROLE hash (calculated):", mawRoleHash);
    
    // Check if proxy has MAW role
    const hasMawRole = await relics.hasRole(mawRoleHash, PROXY_ADDRESS);
    console.log("Proxy has MAW_ROLE:", hasMawRole);
    
    // Check DEFAULT_ADMIN_ROLE
    const defaultAdminRole = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const hasAdminRole = await relics.hasRole(defaultAdminRole, PROXY_ADDRESS);
    console.log("Proxy has DEFAULT_ADMIN_ROLE:", hasAdminRole);
    
    if (!hasMawRole && !hasAdminRole) {
      console.log("\n❌ Proxy has no mint permissions!");
      console.log("Need to run setMawSacrifice to grant permissions");
      
      // Check who is the owner of Relics
      const owner = await relics.owner();
      console.log("Relics owner:", owner);
      
      const [signer] = await ethers.getSigners();
      if (signer.address.toLowerCase() === owner.toLowerCase()) {
        console.log("✅ Current signer is the owner - can fix permissions");
        
        // Fix permissions
        console.log("\n🔧 Setting MAW sacrifice permissions...");
        const tx = await relics.setMawSacrifice(PROXY_ADDRESS);
        console.log("Transaction hash:", tx.hash);
        await tx.wait();
        console.log("✅ Permissions granted!");
        
        // Verify
        const nowHasMawRole = await relics.hasRole(mawRoleHash, PROXY_ADDRESS);
        console.log("Proxy now has MAW_ROLE:", nowHasMawRole);
        
      } else {
        console.log("❌ Current signer is not the owner - cannot fix permissions");
      }
    } else {
      console.log("✅ Proxy has necessary permissions");
    }
    
  } catch (error) {
    console.error("❌ Error checking authorization:", error.message);
  }
}

main().catch(console.error);