const { ethers } = require("hardhat");

async function main() {
  console.log("🎨 Setting dev contract as authorized for cosmetics...");

  const [signer] = await ethers.getSigners();
  
  // Contract addresses
  const devMawAddress = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
  const cosmeticsAddress = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  
  console.log(`Dev Contract: ${devMawAddress}`);
  console.log(`Cosmetics Contract: ${cosmeticsAddress}`);
  
  // Get cosmetics contract
  const cosmetics = await ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
  
  // Check current authorized contract
  try {
    const currentMaw = await cosmetics.mawSacrifice();
    console.log(`Current authorized MawSacrifice: ${currentMaw}`);
    
    if (currentMaw.toLowerCase() !== devMawAddress.toLowerCase()) {
      console.log("📞 Setting new MawSacrifice authorization...");
      const tx = await cosmetics.setMawSacrifice(devMawAddress);
      console.log(`Transaction: ${tx.hash}`);
      await tx.wait();
      console.log("✅ Cosmetics authorization updated!");
    } else {
      console.log("✅ Dev contract already authorized for cosmetics");
    }
    
    // Verify
    const newMaw = await cosmetics.mawSacrifice();
    console.log(`New authorized MawSacrifice: ${newMaw}`);
    console.log(`Match: ${newMaw.toLowerCase() === devMawAddress.toLowerCase()}`);
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });