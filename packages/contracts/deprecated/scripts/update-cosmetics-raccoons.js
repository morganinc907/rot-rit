const hre = require("hardhat");

const COSMETICS_ADDRESS = "0x0de59ef75ddf2d7c6310f5f8c84bb52e6e0873b3";
const NEW_RACCOONS_ADDRESS = "0x84d329C3a42Ad20Eb3335f6c86384ECd550c0aBa";
const MAW_ADDRESS = "0x1f8fa66b4e91c844db85b8fc95e1e78e4bf56b13";

async function main() {
  console.log("Updating CosmeticsV2 with new Raccoons address...");
  
  const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", COSMETICS_ADDRESS);

  const tx = await cosmetics.setContracts(NEW_RACCOONS_ADDRESS, MAW_ADDRESS, {
    gasLimit: 100000,
    gasPrice: hre.ethers.parseUnits("3", "gwei")
  });
  await tx.wait();
  
  console.log("✅ CosmeticsV2 updated with new Raccoons address");
  console.log("New Raccoons:", NEW_RACCOONS_ADDRESS);
}

main().catch(console.error);