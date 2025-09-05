const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking MAW_ROLE on both MawSacrifice addresses...");
  
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const NEW_MAW = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625"; // addresses.json MawSacrifice
  const OLD_MAW = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456"; // addresses.json MawSacrificeV3Upgradeable
  
  const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
  const MAW_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MAW_ROLE"));
  
  console.log("MAW_ROLE hash:", MAW_ROLE);
  console.log("New MawSacrifice:", NEW_MAW);
  console.log("Old MawSacrifice:", OLD_MAW);
  
  try {
    // Check both addresses
    const newHasRole = await relics.hasRole(MAW_ROLE, NEW_MAW);
    const oldHasRole = await relics.hasRole(MAW_ROLE, OLD_MAW);
    
    console.log("\nRole Status:");
    console.log("- New MawSacrifice has MAW_ROLE:", newHasRole);
    console.log("- Old MawSacrifice has MAW_ROLE:", oldHasRole);
    
    // Check what address is actually stored
    const storedMaw = await relics.mawSacrifice();
    console.log("\nStored mawSacrifice address:", storedMaw);
    console.log("- Matches new:", storedMaw.toLowerCase() === NEW_MAW.toLowerCase());
    console.log("- Matches old:", storedMaw.toLowerCase() === OLD_MAW.toLowerCase());
    
    // Fix if needed
    if (!newHasRole) {
      console.log("\n🔧 NEW address missing MAW_ROLE, granting it...");
      const tx = await relics.setMawSacrifice(NEW_MAW);
      await tx.wait();
      console.log("✅ Granted MAW_ROLE to new address:", tx.hash);
    }
    
    if (oldHasRole && newHasRole) {
      console.log("\n⚠️  Both addresses have MAW_ROLE - this might cause confusion");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
