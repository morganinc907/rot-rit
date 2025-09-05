const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Granting MAW_ROLE to both MawSacrifice contracts...");
  
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const NEW_MAW = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
  const OLD_MAW = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  
  const [signer] = await ethers.getSigners();
  const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
  const MAW_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MAW_ROLE"));
  
  console.log("Granting MAW_ROLE to both addresses:");
  console.log("- New:", NEW_MAW);
  console.log("- Old:", OLD_MAW);
  
  try {
    // Grant to new address
    console.log("Granting to new address...");
    const tx1 = await relics.grantRole(MAW_ROLE, NEW_MAW);
    await tx1.wait();
    console.log("✅ Granted to new:", tx1.hash);
    
    // Grant to old address  
    console.log("Granting to old address...");
    const tx2 = await relics.grantRole(MAW_ROLE, OLD_MAW);
    await tx2.wait();
    console.log("✅ Granted to old:", tx2.hash);
    
    console.log("\n🎉 Both addresses now have MAW_ROLE!");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
