const hre = require("hardhat");
require("dotenv").config();

const COSMETICS_ADDRESS = "0xa45358561Fc7D9C258F831a4Bf5958fe7982EF61";
const RACCOONS_ADDRESS = "0x7071269faa1FA8D24A5b8b03C745552B25021D90";
const MAW_ADDRESS = "0xf65B16c49E505F5BC5c941081c2FA213f8D15D2f";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Updating CosmeticsV2 with MawSacrifice reference...");
  
  const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", COSMETICS_ADDRESS);
  
  const tx = await cosmetics.setContracts(RACCOONS_ADDRESS, MAW_ADDRESS, {
    gasLimit: 100000
  });
  
  console.log("Transaction hash:", tx.hash);
  await tx.wait();
  console.log("✅ CosmeticsV2: setContracts -> (Raccoons, MawSacrifice)");
  
  // Verify the settings
  const raccoons = await cosmetics.raccoons();
  const mawSacrifice = await cosmetics.mawSacrifice();
  console.log("Verified raccoons address:", raccoons);
  console.log("Verified mawSacrifice address:", mawSacrifice);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});