const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Setting up proper authorization for new contracts...\n");
  
  const NEW_MAW = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
  const NEW_COSMETICS = "0xf77AC9cd10FCeF959cF86BA489D916B0716fA279";
  
  const [signer] = await ethers.getSigners();
  console.log(`👤 Using account: ${signer.address}`);
  console.log(`🎯 New MawSacrifice: ${NEW_MAW}`);
  console.log(`✨ New Cosmetics: ${NEW_COSMETICS}\n`);
  
  // Connect to contracts
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", NEW_MAW);
  const cosmetics = await ethers.getContractAt("CosmeticsV2", NEW_COSMETICS);
  
  console.log("=== 1. CHECK OWNERSHIP ===");
  const mawOwner = await maw.owner();
  const cosmeticsOwner = await cosmetics.owner();
  
  console.log(`👑 MawSacrifice owner: ${mawOwner}`);
  console.log(`👑 Cosmetics owner: ${cosmeticsOwner}`);
  console.log(`🔐 Signer owns Maw: ${mawOwner.toLowerCase() === signer.address.toLowerCase()}`);
  console.log(`🔐 Signer owns Cosmetics: ${cosmeticsOwner.toLowerCase() === signer.address.toLowerCase()}`);
  
  // Step 1: Authorize new Maw in new Cosmetics (try different methods)
  console.log("\n=== 2. AUTHORIZE NEW MAW IN NEW COSMETICS ===");
  
  if (cosmeticsOwner.toLowerCase() !== signer.address.toLowerCase()) {
    console.log("❌ Cannot authorize - not cosmetics owner");
    return;
  }
  
  try {
    // Get current authorization
    const currentMaw = await cosmetics.mawSacrifice();
    console.log(`📍 Current authorized Maw: ${currentMaw}`);
    
    if (currentMaw.toLowerCase() === NEW_MAW.toLowerCase()) {
      console.log("✅ New Maw already authorized in Cosmetics");
    } else {
      console.log("🔧 Need to authorize new Maw...");
      
      // Try transferring ownership to new Maw temporarily
      console.log("Attempting to transfer cosmetics ownership to new Maw...");
      const tx = await cosmetics.transferOwnership(NEW_MAW);
      const receipt = await tx.wait();
      console.log(`✅ Transferred ownership! Transaction: ${receipt.hash}`);
      
      // Verify
      const newOwner = await cosmetics.owner();
      console.log(`✅ New cosmetics owner: ${newOwner}`);
    }
    
  } catch (error) {
    console.log(`❌ Failed to authorize new Maw: ${error.message}`);
  }
  
  // Step 2: Set new Cosmetics in new Maw
  console.log("\n=== 3. SET NEW COSMETICS IN NEW MAW ===");
  
  try {
    const currentCosmetics = await maw.cosmetics();
    console.log(`📍 Current Maw → Cosmetics: ${currentCosmetics}`);
    
    if (currentCosmetics.toLowerCase() === NEW_COSMETICS.toLowerCase()) {
      console.log("✅ Maw already points to new Cosmetics");
    } else {
      console.log("🔧 Updating Maw to point to new Cosmetics...");
      
      const tx = await maw.setContracts(
        "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b", // Relics
        NEW_COSMETICS,                                   // New Cosmetics
        "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF", // Demons
        "0x2D7cD25A014429282062298d2F712FA7983154B9"  // Cultists
      );
      const receipt = await tx.wait();
      console.log(`✅ Updated Maw contracts! Transaction: ${receipt.hash}`);
    }
    
  } catch (error) {
    console.log(`❌ Failed to update Maw: ${error.message}`);
  }
  
  // Step 3: Verify final setup
  console.log("\n=== 4. FINAL VERIFICATION ===");
  
  try {
    const mawCosmetics = await maw.cosmetics();
    const cosmeticsNewOwner = await cosmetics.owner();
    
    console.log(`✅ MawSacrifice → Cosmetics: ${mawCosmetics}`);
    console.log(`✅ Cosmetics owner: ${cosmeticsNewOwner}`);
    console.log(`✅ Expected Cosmetics: ${NEW_COSMETICS}`);
    console.log(`✅ Expected Maw: ${NEW_MAW}`);
    
    const addressMatch = mawCosmetics.toLowerCase() === NEW_COSMETICS.toLowerCase();
    const ownerMatch = cosmeticsNewOwner.toLowerCase() === NEW_MAW.toLowerCase();
    
    if (addressMatch && ownerMatch) {
      console.log("🎉 SUCCESS! Both contracts properly configured!");
      console.log("🎉 New MawSacrifice owns new Cosmetics and points to it");
    } else {
      console.log("⚠️  Setup incomplete - some references still wrong");
    }
    
  } catch (error) {
    console.log(`❌ Verification failed: ${error.message}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});