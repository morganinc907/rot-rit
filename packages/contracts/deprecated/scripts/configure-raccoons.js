const hre = require("hardhat");
require("dotenv").config();

// IPFS Configuration
const IMAGES_HASH = "bafybeidbtpaiyged4rrdfr62wvhedz3aaxku7wd3zp7fdl5ik5736tw464";
const METADATA_HASH = "bafybeifsiog2puwlxfhszxjs3ttqi5r6y2zzdwhvswwanzehasc7tj3sf4";

// Deployed contract address
const RACCOONS_ADDRESS = "0xAFC30C3f38487592bc2F67AaAB5aE30368b6B586";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Configuring Raccoons contract...");
  console.log("Deployer:", deployer.address);
  console.log("Contract:", RACCOONS_ADDRESS);

  // Get contract instance
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);

  console.log("\n=== Configuring IPFS URIs ===");
  
  try {
    // Set base token URI
    console.log("Setting base token URI...");
    await (await raccoons.setBaseTokenURI(`ipfs://${METADATA_HASH}/`)).wait();
    console.log("✅ Base token URI set");

    // Enable revelation
    console.log("Enabling revelation...");
    await (await raccoons.setRevealed(true, {
      gasLimit: 50000,
      gasPrice: hre.ethers.parseUnits("2", "gwei")
    })).wait();
    console.log("✅ Revelation enabled");

    console.log("\n🎉 Raccoons contract fully configured!");
    console.log("📌 Ready for minting and testing");

  } catch (error) {
    console.error("❌ Configuration failed:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});