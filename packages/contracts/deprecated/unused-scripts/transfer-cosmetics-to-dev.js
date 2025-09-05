const { ethers } = require("hardhat");

async function main() {
  console.log("🔗 Transferring cosmetics ownership to dev contract...");

  const [signer] = await ethers.getSigners();
  
  // Contract addresses
  const devMawAddress = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
  const oldMawAddress = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
  const cosmeticsAddress = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  
  console.log(`Dev Contract: ${devMawAddress}`);
  console.log(`Old MawSacrifice: ${oldMawAddress}`);
  console.log(`Cosmetics: ${cosmeticsAddress}`);
  
  // Get contracts
  const oldMaw = await ethers.getContractAt("MawSacrificeV4Upgradeable", oldMawAddress);
  const cosmetics = await ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
  
  // Check current cosmetics owner
  const currentOwner = await cosmetics.owner();
  console.log(`Current cosmetics owner: ${currentOwner}`);
  
  if (currentOwner.toLowerCase() !== devMawAddress.toLowerCase()) {
    console.log("📞 Using old MawSacrifice to transfer cosmetics ownership...");
    
    // The old MawSacrifice contract should have a function to transfer cosmetics ownership
    // Let's check what functions are available
    try {
      // Try to call transferOwnership through the old contract
      const tx = await oldMaw.transferCosmeticsOwnership(devMawAddress);
      console.log(`Transaction: ${tx.hash}`);
      await tx.wait();
      console.log("✅ Cosmetics ownership transferred!");
    } catch (error) {
      console.log("❌ transferCosmeticsOwnership not found, trying direct method...");
      
      // Alternative: if the old contract can directly call the cosmetics contract
      try {
        // This won't work directly, but let's see what happens
        console.log("Trying to transfer ownership to dev contract...");
        // We need to find the right method
      } catch (error2) {
        console.error("Could not transfer ownership:", error2.message);
      }
    }
  } else {
    console.log("✅ Dev contract already owns cosmetics");
  }
  
  // Verify
  const newOwner = await cosmetics.owner();
  console.log(`New cosmetics owner: ${newOwner}`);
  console.log(`Match: ${newOwner.toLowerCase() === devMawAddress.toLowerCase()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });