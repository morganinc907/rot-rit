const { ethers } = require("hardhat");

async function main() {
  console.log("🔑 Managing MAW_ROLE permissions...\n");
  
  const NEW_MAW = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
  const OLD_MAW = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
  const RELICS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  const [signer] = await ethers.getSigners();
  console.log(`👤 Using account: ${signer.address}`);
  
  // Calculate MAW_ROLE hash
  const MAW_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MAW_ROLE"));
  console.log(`🎯 MAW_ROLE: ${MAW_ROLE}`);
  
  // Connect to Relics contract
  const relics = await ethers.getContractAt("Relics", RELICS);
  
  try {
    // Check current role status
    const oldHasRole = await relics.hasRole(MAW_ROLE, OLD_MAW);
    const newHasRole = await relics.hasRole(MAW_ROLE, NEW_MAW);
    
    console.log(`🔍 Old MAW (${OLD_MAW}) has role: ${oldHasRole}`);
    console.log(`🔍 New MAW (${NEW_MAW}) has role: ${newHasRole}`);
    
    // Revoke from old contract if it has the role
    if (oldHasRole) {
      console.log("\n🚫 Revoking MAW_ROLE from old contract...");
      const revokeTx = await relics.revokeRole(MAW_ROLE, OLD_MAW, {
        gasLimit: 200000
      });
      await revokeTx.wait();
      console.log(`✅ Role revoked from old contract! Transaction: ${revokeTx.hash}`);
    }
    
    // Grant to new contract if it doesn't have the role
    if (!newHasRole) {
      console.log("\n✅ Granting MAW_ROLE to new contract...");
      const grantTx = await relics.grantRole(MAW_ROLE, NEW_MAW, {
        gasLimit: 200000
      });
      await grantTx.wait();
      console.log(`✅ Role granted to new contract! Transaction: ${grantTx.hash}`);
    }
    
    // Final verification
    console.log("\n🔍 Final verification:");
    const finalOldStatus = await relics.hasRole(MAW_ROLE, OLD_MAW);
    const finalNewStatus = await relics.hasRole(MAW_ROLE, NEW_MAW);
    
    console.log(`   Old MAW has role: ${finalOldStatus}`);
    console.log(`   New MAW has role: ${finalNewStatus}`);
    
    if (!finalOldStatus && finalNewStatus) {
      console.log("\n🎉 SUCCESS! MAW_ROLE successfully transferred!");
    } else {
      console.log("\n⚠️  Role transfer incomplete");
    }
    
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});