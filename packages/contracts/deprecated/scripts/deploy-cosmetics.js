const hre = require("hardhat");
require("dotenv").config();

const RACCOONS_ADDRESS = "0x7071269faa1FA8D24A5b8b03C745552B25021D90";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying CosmeticsV2...");
  console.log("Deployer:", deployer.address);
  console.log("Network:", hre.network.name);

  // Deploy CosmeticsV2
  console.log("Deploying CosmeticsV2...");
  const CosmeticsV2 = await hre.ethers.getContractFactory("CosmeticsV2");
  const cosmetics = await CosmeticsV2.deploy(
    "ipfs://cosmetics-base-uri/",  // baseTypeURI - placeholder for now
    "ipfs://bound-base-uri/"       // boundBaseURI - for bound item metadata
  );
  
  await cosmetics.waitForDeployment();
  const cosmeticsAddress = await cosmetics.getAddress();
  console.log("✅ CosmeticsV2 deployed at:", cosmeticsAddress);

  // Set raccoons reference in CosmeticsV2 (we'll set mawSacrifice to zero for now)
  console.log("Setting Raccoons reference...");
  await (await cosmetics.setContracts(RACCOONS_ADDRESS, "0x0000000000000000000000000000000000000000")).wait();
  console.log("✅ CosmeticsV2: setContracts ->", RACCOONS_ADDRESS);

  // Set cosmetics contract in Raccoons
  console.log("Setting Cosmetics reference in Raccoons...");
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);
  await (await raccoons.setCosmeticsContract(cosmeticsAddress)).wait();
  console.log("✅ Raccoons: setCosmeticsContract ->", cosmeticsAddress);

  console.log("\n🎉 CosmeticsV2 Deployment Complete!");
  console.log("CosmeticsV2 Address:", cosmeticsAddress);
  console.log("Raccoons Address:", RACCOONS_ADDRESS);
  console.log("\nNext: Deploy Demons, Relics, Cultists, and MawSacrificeV2");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});