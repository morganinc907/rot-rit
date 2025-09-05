const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔧 Fixing MAW authorization after upgrade...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const [signer] = await ethers.getSigners();
  
  console.log("Deployer address:", signer.address);
  console.log("MAW proxy address:", PROXY_ADDRESS);
  
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  const mawRole = ethers.keccak256(ethers.toUtf8Bytes("MAW_ROLE"));
  
  console.log(`MAW_ROLE hash: ${mawRole}`);
  
  // Check current authorization status
  try {
    const hasRole = await relics.hasRole(mawRole, PROXY_ADDRESS);
    console.log(`Current MAW authorization: ${hasRole}`);
    
    if (hasRole) {
      console.log("✅ MAW already has authorization - something else is wrong");
      return;
    }
  } catch (error) {
    console.log("Could not check current role - proceeding with grant");
  }
  
  // Grant the MAW role
  console.log("🚀 Granting MAW_ROLE to proxy...");
  try {
    const tx = await relics.grantRole(mawRole, PROXY_ADDRESS);
    console.log("Grant transaction:", tx.hash);
    
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      console.log("✅ MAW_ROLE granted successfully!");
      
      // Verify the grant worked
      try {
        const nowHasRole = await relics.hasRole(mawRole, PROXY_ADDRESS);
        console.log(`Verification - MAW now has role: ${nowHasRole}`);
        
        if (nowHasRole) {
          console.log("🎉 FIXED! Now test sacrificeKeys again!");
        }
      } catch (verifyError) {
        console.log("Could not verify role grant, but transaction succeeded");
      }
      
    } else {
      console.log("❌ Grant transaction failed");
    }
  } catch (error) {
    console.log("❌ Failed to grant role:", error.message);
    
    // Check if we don't have permission
    if (error.message.includes("AccessControl")) {
      console.log("💡 The deployer might not have admin rights to grant this role");
      
      // Check what roles the deployer has
      try {
        const defaultAdminRole = "0x0000000000000000000000000000000000000000000000000000000000000000";
        const hasAdminRole = await relics.hasRole(defaultAdminRole, signer.address);
        console.log(`Deployer has DEFAULT_ADMIN_ROLE: ${hasAdminRole}`);
        
        const mawRoleAdmin = await relics.getRoleAdmin(mawRole);
        console.log(`MAW_ROLE admin is: ${mawRoleAdmin}`);
      } catch (adminError) {
        console.log("Could not check admin roles");
      }
    }
  }
}

main().catch(console.error);