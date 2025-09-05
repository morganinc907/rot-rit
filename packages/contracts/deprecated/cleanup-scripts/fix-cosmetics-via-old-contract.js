const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("🎨 Fixing cosmetics authorization via old V4 contract...");
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

    // Use setContracts on old V4 to update cosmetics authorization
    console.log("🔄 Calling setContracts on old V4 contract...");
    console.log("This should update the cosmetics authorization to the new proxy");
    
    const tx = await oldV4.setContracts(
      addresses.baseSepolia.Relics,      // Keep existing relics
      addresses.baseSepolia.Cosmetics,   // Keep existing cosmetics  
      addresses.baseSepolia.Demons,      // Keep existing demons
      addresses.baseSepolia.Cultists     // Keep existing cultists
    );
    
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    
    console.log("");
    console.log("🔍 Checking results...");
    console.log("New mawSacrifice auth:", await cosmetics.mawSacrifice());
    
    // Verify if it worked
    const newAuth = await cosmetics.mawSacrifice();
    if (newAuth.toLowerCase() === addresses.baseSepolia.MawSacrifice.toLowerCase()) {
      console.log("✅ Success! New proxy is now authorized!");
    } else {
      console.log("❌ Still not authorized. Auth is:", newAuth);
      console.log("Expected:", addresses.baseSepolia.MawSacrifice);
    }
    
  } catch (error) {
    console.error("Error:", error.message);
    console.log("\n💡 The setContracts function on old V4 may not update cosmetics authorization");
    console.log("   We may need to directly call setContracts on the cosmetics contract");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});