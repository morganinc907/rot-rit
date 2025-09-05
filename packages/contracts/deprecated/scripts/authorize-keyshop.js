const hre = require("hardhat");

const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
const NEW_KEYSHOP_ADDRESS = "0x9Bd1651f1f8aB416A72f094fB60BbC1737B67DB6";

async function main() {
  console.log("Authorizing new KeyShop in Relics...");
  
  const relics = await hre.ethers.getContractAt("Relics", RELICS_ADDRESS);

  const tx = await relics.setKeyShop(NEW_KEYSHOP_ADDRESS, {
    gasPrice: hre.ethers.parseUnits("5", "gwei"),
    gasLimit: 100000
  });
  await tx.wait();
  
  console.log("✅ New KeyShop authorized in Relics");
  console.log("KeyShop:", NEW_KEYSHOP_ADDRESS);
}

main().catch(console.error);