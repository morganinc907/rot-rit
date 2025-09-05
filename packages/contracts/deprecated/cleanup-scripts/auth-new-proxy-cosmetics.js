const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("🎨 Authorizing NEW proxy with cosmetics...");
  console.log("New MawSacrifice Proxy:", addresses.baseSepolia.MawSacrifice);
  console.log("Cosmetics Contract:", addresses.baseSepolia.Cosmetics);
  console.log("");

  // Connect to old V4 contract that owns cosmetics
  const oldV4Address = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
  console.log("Using old V4 contract as owner:", oldV4Address);
  
  const oldV4 = await hre.ethers.getContractAt(
    "MawSacrificeV4Upgradeable", 
    oldV4Address
  );

  try {
    // Call setCosmetics on the old contract to authorize new proxy
    console.log("🔄 Calling setCosmetics to authorize new proxy...");
    const tx = await oldV4.setCosmetics(addresses.baseSepolia.Cosmetics);
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    console.log("✅ Authorization complete!");
    
  } catch (error) {
    console.error("Error authorizing:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});