/**
 * Fix Relics Contract MawSacrifice Address
 * The Relics contract is pointing to the old MawSacrifice address.
 * This script updates it to point to the correct V4NoTimelock address.
 */

async function main() {
  console.log("🔧 Fixing Relics contract MawSacrifice address...");
  
  const OLD_MAW = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
  const CORRECT_MAW = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  const [deployer] = await ethers.getSigners();
  console.log("🔑 Using account:", deployer.address);
  
  // Get Relics contract
  const Relics = await ethers.getContractFactory("Relics");
  const relics = Relics.attach(RELICS_ADDRESS);
  
  // Check current mawSacrifice address
  const currentMaw = await relics.mawSacrifice();
  console.log("📋 Current mawSacrifice address:", currentMaw);
  console.log("🎯 Target mawSacrifice address:", CORRECT_MAW);
  
  if (currentMaw.toLowerCase() === CORRECT_MAW.toLowerCase()) {
    console.log("✅ Relics contract already points to correct MawSacrifice address!");
    return;
  }
  
  if (currentMaw.toLowerCase() !== OLD_MAW.toLowerCase()) {
    console.log("⚠️  Warning: Current address doesn't match expected old address");
    console.log("   Current:", currentMaw);
    console.log("   Expected old:", OLD_MAW);
  }
  
  // Check if we're the owner
  const owner = await relics.owner();
  console.log("👤 Relics contract owner:", owner);
  console.log("👤 Our address:", deployer.address);
  
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.error("❌ We are not the owner of the Relics contract!");
    console.error("   Contract owner:", owner);
    console.error("   Our address:", deployer.address);
    process.exit(1);
  }
  
  console.log("🚀 Updating Relics mawSacrifice address...");
  
  try {
    const tx = await relics.setMawSacrifice(CORRECT_MAW);
    console.log("📤 Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    
    // Verify the change
    const newMaw = await relics.mawSacrifice();
    console.log("🔍 New mawSacrifice address:", newMaw);
    
    if (newMaw.toLowerCase() === CORRECT_MAW.toLowerCase()) {
      console.log("🎉 Successfully updated Relics mawSacrifice address!");
    } else {
      console.error("❌ Address update failed - mismatch!");
    }
    
  } catch (error) {
    console.error("❌ Failed to update mawSacrifice address:");
    console.error(error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });