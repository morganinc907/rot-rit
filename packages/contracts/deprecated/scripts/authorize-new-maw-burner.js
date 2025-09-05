const { ethers } = require("hardhat");

async function main() {
  console.log("🔥 Authorizing new Maw contract as burner...");
  
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);
  
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const NEW_MAW_ADDRESS = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
  
  // Relics ABI with burner management functions
  const RELICS_ABI = [
    "function addBurner(address burner) external",
    "function removeBurner(address burner) external", 
    "function isBurner(address account) view returns (bool)",
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
    
    // Check if new Maw is already a burner
    try {
      const isAlreadyBurner = await relics.isBurner(NEW_MAW_ADDRESS);
      console.log("Is new Maw already a burner?", isAlreadyBurner);
      
      if (isAlreadyBurner) {
        console.log("✅ New Maw is already authorized as burner!");
        return;
      }
    } catch (error) {
      console.log("Could not check burner status, proceeding with authorization...");
    }
    
    // Add new Maw as burner
    console.log("📝 Adding new Maw as authorized burner...");
    const tx = await relics.addBurner(NEW_MAW_ADDRESS);
    console.log("Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Success! New Maw authorized in block:", receipt.blockNumber);
    
    // Verify it worked
    try {
      const isNowBurner = await relics.isBurner(NEW_MAW_ADDRESS);
      console.log("✅ Verification: New Maw is now burner:", isNowBurner);
    } catch (error) {
      console.log("Could not verify, but transaction succeeded");
    }
    
  } catch (error) {
    console.error("❌ Failed to authorize burner:", error);
    
    if (error.message.includes("Ownable")) {
      console.log("💡 You need to be the owner of the Relics contract to add burners");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });