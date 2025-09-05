const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Granting MAW_ROLE to BOTH MawSacrifice addresses...");
  
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const NEW_MAW = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
  const OLD_MAW = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  
  const [signer] = await ethers.getSigners();
  const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
  
  console.log("Signer:", signer.address);
  console.log("New MawSacrifice:", NEW_MAW);
  console.log("Old MawSacrifice:", OLD_MAW);
  
  try {
    console.log("Setting new address...");
    const tx1 = await relics.setMawSacrifice(NEW_MAW);
    await tx1.wait();
    console.log("✅ Set new MawSacrifice:", tx1.hash);
    
    console.log("Also setting old address...");  
    const tx2 = await relics.setMawSacrifice(OLD_MAW);
    await tx2.wait();
    console.log("✅ Set old MawSacrifice:", tx2.hash);
    
    console.log("\nNow both addresses should have MAW_ROLE");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);
