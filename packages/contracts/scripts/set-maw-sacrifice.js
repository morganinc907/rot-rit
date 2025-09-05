const { ethers } = require("hardhat");

async function main() {
  console.log("🔑 Setting new MawSacrifice address in Relics contract...\n");
  
  const NEW_MAW = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
  const RELICS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  const [signer] = await ethers.getSigners();
  console.log(`👤 Using account: ${signer.address}`);
  
  // Connect to Relics contract
  const relics = await ethers.getContractAt("Relics", RELICS);
  
  try {
    console.log("=== CURRENT STATUS ===");
    
    // Check current MawSacrifice address
    const currentMaw = await relics.mawSacrifice();
    console.log(`🎯 Current MawSacrifice address: ${currentMaw}`);
    
    // Check role status
    const MAW_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MAW_ROLE"));
    const oldHasRole = await relics.hasRole(MAW_ROLE, currentMaw);
    const newHasRole = await relics.hasRole(MAW_ROLE, NEW_MAW);
    
    console.log(`🔍 Old contract (${currentMaw}) has MAW_ROLE: ${oldHasRole}`);
    console.log(`🔍 New contract (${NEW_MAW}) has MAW_ROLE: ${newHasRole}`);
    
    console.log("\n=== SETTING NEW MAW SACRIFICE ===");
    
    // Use the proper setter function
    console.log(`Setting MawSacrifice to: ${NEW_MAW}`);
    const setMawTx = await relics.setMawSacrifice(NEW_MAW, {
      gasLimit: 300000
    });
    
    console.log(`📤 Transaction sent: ${setMawTx.hash}`);
    const receipt = await setMawTx.wait();
    console.log(`✅ MawSacrifice updated! Block: ${receipt.blockNumber}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed}`);
    
    console.log("\n=== VERIFICATION ===");
    
    // Verify the changes
    const newMawAddress = await relics.mawSacrifice();
    const finalOldRole = await relics.hasRole(MAW_ROLE, currentMaw);
    const finalNewRole = await relics.hasRole(MAW_ROLE, NEW_MAW);
    
    console.log(`🎯 New MawSacrifice address: ${newMawAddress}`);
    console.log(`🔍 Old contract now has MAW_ROLE: ${finalOldRole}`);
    console.log(`🔍 New contract now has MAW_ROLE: ${finalNewRole}`);
    
    const success = (
      newMawAddress.toLowerCase() === NEW_MAW.toLowerCase() &&
      !finalOldRole &&
      finalNewRole
    );
    
    if (success) {
      console.log("\n🎉 SUCCESS! MawSacrifice role transferred successfully!");
      console.log("✅ New contract is authorized to burn fragments");
      console.log("✅ Old contract role revoked");
      console.log("🎯 Ready to test fragment sacrifices!");
    } else {
      console.log("\n⚠️ Role transfer incomplete:");
      console.log(`   Expected address: ${NEW_MAW}`);
      console.log(`   Actual address: ${newMawAddress}`);
      console.log(`   Expected old role: false, actual: ${finalOldRole}`);
      console.log(`   Expected new role: true, actual: ${finalNewRole}`);
    }
    
  } catch (error) {
    console.log(`❌ Failed to set MawSacrifice: ${error.message}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});