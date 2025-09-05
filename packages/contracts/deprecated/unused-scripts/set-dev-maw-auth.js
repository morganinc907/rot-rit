const { ethers } = require("hardhat");

async function main() {
  console.log("🔗 Setting dev contract as authorized MawSacrifice...");

  const [signer] = await ethers.getSigners();
  
  // Contract addresses
  const devMawAddress = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
  const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  console.log(`Dev Contract: ${devMawAddress}`);
  console.log(`Relics Contract: ${relicsAddress}`);
  
  // Get relics contract
  const relics = await ethers.getContractAt("Relics", relicsAddress);
  
  // Check current authorized contract
  const currentMaw = await relics.mawSacrifice();
  console.log(`Current authorized MawSacrifice: ${currentMaw}`);
  
  if (currentMaw.toLowerCase() !== devMawAddress.toLowerCase()) {
    console.log("📞 Setting new MawSacrifice authorization...");
    const tx = await relics.setMawSacrifice(devMawAddress);
    console.log(`Transaction: ${tx.hash}`);
    await tx.wait();
    console.log("✅ Authorization updated!");
  } else {
    console.log("✅ Dev contract already authorized");
  }
  
  // Verify
  const newMaw = await relics.mawSacrifice();
  console.log(`New authorized MawSacrifice: ${newMaw}`);
  console.log(`Match: ${newMaw.toLowerCase() === devMawAddress.toLowerCase()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });