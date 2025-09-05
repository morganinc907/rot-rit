const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Fixing Cosmetics → MawSacrifice reference...");
  
  const COSMETICS_ADDRESS = "0xf77AC9cd10FCeF959cF86BA489D916B0716fA279";
  const CORRECT_MAW = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
  
  const [signer] = await ethers.getSigners();
  console.log(`👤 Using account: ${signer.address}`);
  
  const cosmetics = await ethers.getContractAt("CosmeticsV2", COSMETICS_ADDRESS);
  
  // Check current maw address
  try {
    const currentMaw = await cosmetics.mawSacrifice();
    console.log(`📍 Current Maw: ${currentMaw}`);
    console.log(`📍 Should be: ${CORRECT_MAW}`);
    
    if (currentMaw.toLowerCase() === CORRECT_MAW.toLowerCase()) {
      console.log("✅ Already correct!");
      return;
    }
  } catch (e) {
    console.log(`❓ Could not get current maw: ${e.message}`);
  }
  
  // Try different methods to set the authorization
  console.log("🔧 Attempting to set MawSacrifice authorization...");
  
  try {
    console.log("Trying setMawSacrifice method...");
    const tx1 = await cosmetics.setMawSacrifice(CORRECT_MAW);
    const receipt1 = await tx1.wait();
    console.log(`✅ setMawSacrifice successful! Transaction: ${receipt1.hash}`);
  } catch (e1) {
    console.log(`❌ setMawSacrifice failed: ${e1.message}`);
    
    try {
      console.log("Trying setContracts method...");
      const KEYSHOP_ADDRESS = "0x9Bd1651f1f8aB416A72f094fB60BbC1737B67DB6";
      const tx2 = await cosmetics.setContracts(
        CORRECT_MAW,      // mawSacrifice
        KEYSHOP_ADDRESS,  // keyShop
        CORRECT_MAW       // ritual (same as maw)
      );
      const receipt2 = await tx2.wait();
      console.log(`✅ setContracts successful! Transaction: ${receipt2.hash}`);
    } catch (e2) {
      console.log(`❌ setContracts failed: ${e2.message}`);
      
      try {
        console.log("Trying authorize method...");
        const tx3 = await cosmetics.authorize(CORRECT_MAW);
        const receipt3 = await tx3.wait();
        console.log(`✅ authorize successful! Transaction: ${receipt3.hash}`);
      } catch (e3) {
        console.log(`❌ authorize failed: ${e3.message}`);
        console.log("❌ All methods failed - check contract interface");
        return;
      }
    }
  }
  
  // Verify the update
  try {
    const newMaw = await cosmetics.mawSacrifice();
    console.log(`✅ Verified new Maw: ${newMaw}`);
    console.log(`✅ Match: ${newMaw.toLowerCase() === CORRECT_MAW.toLowerCase()}`);
  } catch (e) {
    console.log(`❓ Could not verify update: ${e.message}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});