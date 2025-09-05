const hre = require("hardhat");
const addresses = require("../../addresses/addresses.json");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("🎨 Checking cosmetics authorization for NEW proxy...");
  console.log("New MawSacrifice Proxy:", addresses.baseSepolia.MawSacrifice);
  console.log("Cosmetics Contract:", addresses.baseSepolia.Cosmetics);
  console.log("");

  // Connect to cosmetics contract
  const cosmetics = await hre.ethers.getContractAt(
    "CosmeticsV2", 
    addresses.baseSepolia.Cosmetics
  );

  try {
    const owner = await cosmetics.owner();
    console.log("Cosmetics owner:", owner);
    
    const mawSacrifice = await cosmetics.mawSacrifice();
    console.log("Authorized MawSacrifice:", mawSacrifice);
    
    console.log("");
    if (mawSacrifice.toLowerCase() === addresses.baseSepolia.MawSacrifice.toLowerCase()) {
      console.log("✅ NEW proxy is properly authorized!");
    } else {
      console.log("❌ NEW proxy is NOT authorized");
      console.log("Need to authorize:", addresses.baseSepolia.MawSacrifice);
    }
    
  } catch (error) {
    console.error("Error checking authorization:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});