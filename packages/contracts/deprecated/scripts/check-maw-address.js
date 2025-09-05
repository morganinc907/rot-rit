const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🔍 Checking MawSacrifice address in Relics contract...\n");

  const [deployer] = await ethers.getSigners();
  const addresses = JSON.parse(fs.readFileSync('./src/contracts-base-sepolia.json', 'utf8'));
  
  const relics = await ethers.getContractAt("Relics", addresses.relics);
  
  console.log("Expected MawSacrifice:", addresses.mawSacrifice);
  
  // Check what address is stored in Relics contract
  const storedMawAddress = await relics.mawSacrifice();
  console.log("Stored in Relics:     ", storedMawAddress);
  
  console.log("Addresses match:", storedMawAddress.toLowerCase() === addresses.mawSacrifice.toLowerCase());
  
  if (storedMawAddress.toLowerCase() !== addresses.mawSacrifice.toLowerCase()) {
    console.log("\n❌ Address mismatch! Updating Relics contract...");
    
    try {
      const tx = await relics.setMawSacrifice(addresses.mawSacrifice, {
        gasPrice: ethers.parseUnits("4", "gwei"),
      });
      await tx.wait();
      console.log("✅ MawSacrifice address updated in Relics");
      
      // Verify the update
      const newAddress = await relics.mawSacrifice();
      console.log("New stored address:", newAddress);
      console.log("Update successful:", newAddress.toLowerCase() === addresses.mawSacrifice.toLowerCase());
      
    } catch (error) {
      console.log("❌ Update failed:", error.message);
    }
  } else {
    console.log("✅ Addresses match - authorization should work");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });