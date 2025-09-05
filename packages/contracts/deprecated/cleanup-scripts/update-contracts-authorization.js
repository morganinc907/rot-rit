const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("🎨 Updating contracts authorization via old V4...");
  console.log("New MawSacrifice Proxy:", addresses.baseSepolia.MawSacrifice);
  console.log("Cosmetics Contract:", addresses.baseSepolia.Cosmetics);
  console.log("");

  // Connect to old V4 contract that we own
  const oldV4Address = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
  const oldV4 = await hre.ethers.getContractAt(
    "MawSacrificeV4Upgradeable", 
    oldV4Address
  );

  try {
    console.log("🔍 Current status:");
    console.log("Old V4 owner:", await oldV4.owner());
    
    // Check current cosmetics auth
    const cosmetics = await hre.ethers.getContractAt(
      "CosmeticsV2", 
      addresses.baseSepolia.Cosmetics
    );
    
    console.log("Cosmetics owner:", await cosmetics.owner());
    console.log("Current mawSacrifice auth:", await cosmetics.mawSacrifice());
    console.log("");

    // First, let's check what the current contracts are set to on the old V4
    console.log("Current contract addresses on old V4:");
    console.log("- relics():", await oldV4.relics());
    console.log("- cosmetics():", await oldV4.cosmetics());
    console.log("- demons():", await oldV4.demons());
    console.log("- cultists():", await oldV4.cultists());
    console.log("");

    // Use updateContracts on old V4 
    console.log("🔄 Calling updateContracts on old V4 contract...");
    console.log("This should make the old V4 contract call setContracts on cosmetics");
    
    const tx = await oldV4.updateContracts(
      addresses.baseSepolia.Relics,      // Keep existing relics
      addresses.baseSepolia.Cosmetics,   // Keep existing cosmetics  
      addresses.baseSepolia.Demons,      // Keep existing demons
      addresses.baseSepolia.Cultists     // Keep existing cultists
    );
    
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    
    console.log("");
    console.log("🔍 Checking results...");
    
    // Check what the cosmetics contract now has as mawSacrifice
    const newAuth = await cosmetics.mawSacrifice();
    console.log("New mawSacrifice auth:", newAuth);
    
    // This should still be the old contract address because updateContracts 
    // just updates the old contract's internal references, not the cosmetics authorization
    
    console.log("\n💡 The updateContracts function only updates the old V4's internal references");
    console.log("   We need to transfer ownership of cosmetics to user, then call setContracts");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});