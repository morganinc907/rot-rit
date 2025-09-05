const hre = require("hardhat");

const RACCOONS_ADDRESS = "0x84d329C3a42Ad20Eb3335f6c86384ECd550c0aBa";

async function main() {
  console.log("Testing new Raccoons contract...");
  
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);

  // Test mint
  console.log("Minting 1 raccoon...");
  const mintTx = await raccoons.mint(1, {
    value: 0, // Free mint
    gasLimit: 200000
  });
  await mintTx.wait();
  
  console.log("✅ Mint successful!");

  // Check tokenURI
  console.log("Checking tokenURI...");
  const tokenURI = await raccoons.tokenURI(1);
  console.log("Token 1 URI:", tokenURI);

  // Check total supply
  const totalSupply = await raccoons.totalSupply();
  console.log("Total supply:", totalSupply.toString());

  console.log("🎉 New Raccoons contract is working!");
}

main().catch(console.error);