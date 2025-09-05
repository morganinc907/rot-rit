const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking authorization for CORRECT contract...");
  
  const correctMawAddress = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
  const wrongMawAddress = "0x15243987458f1ed05b02e6213b532bb060027f4c"; 
  const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  const relicsContract = await ethers.getContractAt("Relics", relicsAddress);
  
  // Check MAW_ROLE for both addresses (not BURN_AUTH_ROLE)
  const MAW_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MAW_ROLE"));
  
  const correctHasMawRole = await relicsContract.hasRole(MAW_ROLE, correctMawAddress);
  const wrongHasMawRole = await relicsContract.hasRole(MAW_ROLE, wrongMawAddress);
  
  console.log(`✅ Correct Maw (${correctMawAddress}) has MAW_ROLE: ${correctHasMawRole}`);
  console.log(`❌ Wrong Maw (${wrongMawAddress}) has MAW_ROLE: ${wrongHasMawRole}`);
  
  if (!correctHasMawRole) {
    console.log("\n🔧 ISSUE: Correct Maw contract needs MAW_ROLE");
    
    // Check if we can grant it
    const [deployer] = await ethers.getSigners();
    const DEFAULT_ADMIN_ROLE = "0x" + "00".repeat(32);
    const isAdmin = await relicsContract.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
    console.log(`👑 User is admin: ${isAdmin}`);
    
    if (isAdmin) {
      console.log("🔨 Granting MAW_ROLE to correct Maw contract...");
      const tx = await relicsContract.grantRole(MAW_ROLE, correctMawAddress);
      const receipt = await tx.wait();
      console.log(`✅ Granted! Transaction: ${receipt.hash}`);
      
      // Verify
      const newAuth = await relicsContract.hasRole(MAW_ROLE, correctMawAddress);
      console.log(`✅ Verification: ${newAuth}`);
    } else {
      console.log("❌ Cannot grant role - user is not admin");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});