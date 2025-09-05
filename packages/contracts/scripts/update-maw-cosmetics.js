const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Updating MawSacrifice → Cosmetics reference...");
  
  const MAW_ADDRESS = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
  const CORRECT_COSMETICS = "0xf77AC9cd10FCeF959cF86BA489D916B0716fA279";
  
  const [signer] = await ethers.getSigners();
  console.log(`👤 Using account: ${signer.address}`);
  
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", MAW_ADDRESS);
  
  // Check current cosmetics address
  const currentCosmetics = await maw.cosmetics();
  console.log(`📍 Current cosmetics: ${currentCosmetics}`);
  console.log(`📍 Should be: ${CORRECT_COSMETICS}`);
  
  if (currentCosmetics.toLowerCase() === CORRECT_COSMETICS.toLowerCase()) {
    console.log("✅ Already correct!");
    return;
  }
  
  console.log("🔧 Updating contract addresses...");
  
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const DEMONS_ADDRESS = "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF";
  const CULTISTS_ADDRESS = "0x2D7cD25A014429282062298d2F712FA7983154B9";
  
  const tx = await maw.setContracts(
    RELICS_ADDRESS,
    CORRECT_COSMETICS,
    DEMONS_ADDRESS, 
    CULTISTS_ADDRESS
  );
  const receipt = await tx.wait();
  
  console.log(`✅ Updated! Transaction: ${receipt.hash}`);
  
  // Verify
  const newCosmetics = await maw.cosmetics();
  console.log(`✅ Verified: ${newCosmetics}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});