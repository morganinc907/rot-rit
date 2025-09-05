const hre = require("hardhat");
require("dotenv").config();

const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
const KEYSHOP_ADDRESS = "0x1a343EA8FA0cfDF7D0AECD6Fe39A6aaA1642CA48";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Setting KeyShop permission in Relics...");
  
  const relics = await hre.ethers.getContractAt("Relics", RELICS_ADDRESS);
  
  const tx = await relics.setKeyShop(KEYSHOP_ADDRESS, {
    gasLimit: 100000
  });
  
  console.log("Transaction hash:", tx.hash);
  await tx.wait();
  console.log("✅ Relics: setKeyShop ->", KEYSHOP_ADDRESS);
  
  // Verify the setting
  const keyShop = await relics.keyShop();
  console.log("Verified keyShop address:", keyShop);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});