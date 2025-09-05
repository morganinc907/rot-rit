const hre = require("hardhat");
require("dotenv").config();

const RACCOONS_ADDRESS = "0x7071269faa1FA8D24A5b8b03C745552B25021D90";
const COSMETICS_ADDRESS = "0xa45358561Fc7D9C258F831a4Bf5958fe7982EF61";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Setting Cosmetics reference in Raccoons...");
  
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);
  
  const tx = await raccoons.setCosmeticsContract(COSMETICS_ADDRESS, {
    gasLimit: 100000
  });
  
  console.log("Transaction hash:", tx.hash);
  await tx.wait();
  console.log("✅ Raccoons: setCosmeticsContract ->", COSMETICS_ADDRESS);
  
  // Verify the setting
  const cosmeticsAddr = await raccoons.cosmetics();
  console.log("Verified cosmetics address:", cosmeticsAddr);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});