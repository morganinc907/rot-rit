const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 Updating Maw address on Relics contract...");
  
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);
  
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const NEW_MAW_ADDRESS = "0xA61e36FEdf83EFA9A1F0996063fA633FC30D15ed";
  
  // Relics ABI with address update function
  const RELICS_ABI = [
    "function setMawSacrifice(address newMawSacrifice) external",
    "function mawSacrifice() view returns (address)",
    "function owner() view returns (address)"
  ];
  
  const relics = new ethers.Contract(RELICS_ADDRESS, RELICS_ABI, signer);
  
  try {
    // Check current owner
    const owner = await relics.owner();
    console.log("Relics contract owner:", owner);
    console.log("Current signer:", signer.address);
    
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log("❌ Not the owner of Relics contract");
      return;
    }
    
    // Check current Maw address
    const currentMaw = await relics.mawSacrifice();
    console.log("Current Maw address:", currentMaw);
    console.log("New Maw address:", NEW_MAW_ADDRESS);
    
    if (currentMaw.toLowerCase() === NEW_MAW_ADDRESS.toLowerCase()) {
      console.log("✅ Maw address is already correct!");
      return;
    }
    
    // Update Maw address
    console.log("📝 Updating Maw address on Relics...");
    const tx = await relics.setMawSacrifice(NEW_MAW_ADDRESS);
    console.log("Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Success! Maw address updated in block:", receipt.blockNumber);
    
    // Verify it worked
    const updatedMaw = await relics.mawSacrifice();
    console.log("✅ Verification: New Maw address:", updatedMaw);
    
  } catch (error) {
    console.error("❌ Failed to update Maw address:", error);
    
    if (error.message.includes("Ownable")) {
      console.log("💡 You need to be the owner of the Relics contract to update addresses");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });