const hre = require("hardhat");
require("dotenv").config();

// IPFS Configuration
const IMAGES_HASH = "bafybeidbtpaiyged4rrdfr62wvhedz3aaxku7wd3zp7fdl5ik5736tw464";
const METADATA_HASH = "bafybeifsiog2puwlxfhszxjs3ttqi5r6y2zzdwhvswwanzehasc7tj3sf4";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying Raccoons contract with fixed minting logic...");
  console.log("Deployer:", deployer.address);
  console.log("Network:", hre.network.name);

  // Deploy Raccoons with IPFS configuration  
  console.log("Deploying Raccoons...");
  const Raccoons = await hre.ethers.getContractFactory("Raccoons");
  const raccoons = await Raccoons.deploy(
    "Trash Raccoons",                                           // name
    "TRASH",                                                   // symbol  
    444,                                                       // maxSupply
    `ipfs://${IMAGES_HASH}/prereveal.png`                      // preRevealURI
  );
  await raccoons.waitForDeployment();
  const raccoonAddress = await raccoons.getAddress();
  console.log("✅ Raccoons deployed at:", raccoonAddress);
  
  console.log("\n🎉 Deployment Complete!");
  console.log("Contract Address:", raccoonAddress);
  console.log("\nNext: Run configure script to set IPFS URIs");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});