const hre = require("hardhat");

const RACCOONS_ADDRESS = "0x84d329C3a42Ad20Eb3335f6c86384ECd550c0aBa";

async function main() {
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);

  console.log("Setting dynamic metadata URI...");
  const tx = await raccoons.setDynamicMetadataURI("http://localhost:3002", {
    gasLimit: 100000,
    gasPrice: hre.ethers.parseUnits("5", "gwei")
  });
  await tx.wait();
  console.log("✅ Dynamic metadata URI set");
}

main().catch(console.error);