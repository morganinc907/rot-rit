const { ethers } = require("hardhat");

async function main() {
  console.log("🔥 Granting burn authority directly to new MawSacrifice...\n");
  
  const NEW_MAW = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
  const RELICS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  const [signer] = await ethers.getSigners();
  console.log(`👤 Using account: ${signer.address}`);
  
  // Connect to Relics contract
  const relics = await ethers.getContractAt("Relics", RELICS);
  
  try {
    console.log("=== CURRENT BURN AUTHORITY STATUS ===");
    
    // Check if the new contract can burn
    console.log("Checking if new MawSacrifice can burn tokens...");
    
    // Try different role approaches
    const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BURNER_ROLE"));
    const MAW_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MAW_ROLE"));
    
    console.log(`🎯 BURNER_ROLE: ${BURNER_ROLE}`);
    console.log(`🎯 MAW_ROLE: ${MAW_ROLE}`);
    
    // Check current roles
    try {
      const hasBurnerRole = await relics.hasRole(BURNER_ROLE, NEW_MAW);
      console.log(`   Has BURNER_ROLE: ${hasBurnerRole}`);
    } catch (e) {
      console.log("   BURNER_ROLE check failed");
    }
    
    try {
      const hasMawRole = await relics.hasRole(MAW_ROLE, NEW_MAW);
      console.log(`   Has MAW_ROLE: ${hasMawRole}`);
    } catch (e) {
      console.log("   MAW_ROLE check failed");
    }
    
    console.log("\n=== GRANTING ROLES ===");
    
    // Try to grant BURNER_ROLE first
    try {
      console.log("Attempting to grant BURNER_ROLE...");
      const grantBurnerTx = await relics.grantRole(BURNER_ROLE, NEW_MAW, {
        gasLimit: 200000
      });
      await grantBurnerTx.wait();
      console.log(`✅ BURNER_ROLE granted! Transaction: ${grantBurnerTx.hash}`);
    } catch (error) {
      console.log(`⚠️ Failed to grant BURNER_ROLE: ${error.message}`);
    }
    
    // Try to grant MAW_ROLE
    try {
      console.log("Attempting to grant MAW_ROLE...");
      const grantMawTx = await relics.grantRole(MAW_ROLE, NEW_MAW, {
        gasLimit: 200000
      });
      await grantMawTx.wait();
      console.log(`✅ MAW_ROLE granted! Transaction: ${grantMawTx.hash}`);
    } catch (error) {
      console.log(`⚠️ Failed to grant MAW_ROLE: ${error.message}`);
    }
    
    console.log("\n=== FINAL VERIFICATION ===");
    
    try {
      const finalBurnerRole = await relics.hasRole(BURNER_ROLE, NEW_MAW);
      const finalMawRole = await relics.hasRole(MAW_ROLE, NEW_MAW);
      console.log(`🎯 Final BURNER_ROLE status: ${finalBurnerRole}`);
      console.log(`🎯 Final MAW_ROLE status: ${finalMawRole}`);
      
      if (finalBurnerRole || finalMawRole) {
        console.log("\n🎉 SUCCESS! New contract has burn authority!");
      } else {
        console.log("\n⚠️ No burn authority granted");
      }
    } catch (error) {
      console.log(`❌ Verification failed: ${error.message}`);
    }
    
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});