const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("🎨 Fixing cosmetics authorization...");
  console.log("New MawSacrifice Proxy:", addresses.baseSepolia.MawSacrifice);
  console.log("Cosmetics Contract:", addresses.baseSepolia.Cosmetics);
  console.log("");

  // Connect to cosmetics contract directly
  const cosmetics = await hre.ethers.getContractAt(
    "CosmeticsV2", 
    addresses.baseSepolia.Cosmetics
  );

  try {
    console.log("Current status:");
    const owner = await cosmetics.owner();
    const currentAuth = await cosmetics.mawSacrifice();
    console.log("- Cosmetics owner:", owner);
    console.log("- Currently authorized:", currentAuth);
    console.log("");

    // The cosmetics contract is owned by the old V4 contract
    // We need to call setContracts on the old contract to update the authorization
    const oldV4Address = owner; // The owner is the old V4 contract
    console.log("🔄 Using old V4 contract to update authorization...");
    
    const oldV4 = await hre.ethers.getContractAt(
      "MawSacrificeV4Upgradeable", 
      oldV4Address
    );

    // Check if old contract has setCosmetics function
    console.log("🔍 Calling setCosmetics on old contract to update authorization...");
    const tx = await oldV4.setCosmetics(addresses.baseSepolia.Cosmetics);
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    
    console.log("");
    console.log("🔍 Checking new authorization status...");
    const newAuth = await cosmetics.mawSacrifice();
    console.log("New authorized MawSacrifice:", newAuth);
    
    if (newAuth.toLowerCase() === addresses.baseSepolia.MawSacrifice.toLowerCase()) {
      console.log("✅ NEW proxy is now properly authorized!");
    } else {
      console.log("❌ Authorization failed - need different approach");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
    console.log("\n💡 The old contract may not have direct setCosmetics function");
    console.log("   We may need to transfer ownership instead");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});