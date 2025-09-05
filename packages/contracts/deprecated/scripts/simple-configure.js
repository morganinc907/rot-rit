const hre = require("hardhat");
require("dotenv").config();

const RACCOONS_ADDRESS = "0x7071269faa1FA8D24A5b8b03C745552B25021D90";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Setting revelation to true...");
  
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);

  // Simple revelation setting with higher gas limit
  const tx = await raccoons.setRevealed(true, {
    gasLimit: 100000
  });
  
  console.log("Transaction hash:", tx.hash);
  await tx.wait();
  console.log("✅ Revelation enabled!");
  
  // Check the state
  const revealed = await raccoons.revealed();
  console.log("Revealed status:", revealed);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});