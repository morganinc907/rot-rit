const hre = require("hardhat");

const RACCOONS_ADDRESS = "0xAFC30C3f38487592bc2F67AaAB5aE30368b6B586";
const YOUR_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";

async function main() {
  console.log("Testing final Raccoons contract...");
  
  const raccoons = await hre.ethers.getContractAt("Raccoons", RACCOONS_ADDRESS);

  // Set revealed to true and mint
  console.log("Setting revealed to true...");
  await (await raccoons.setRevealed(true)).wait();
  
  console.log("Minting 1 raccoon...");
  const mintTx = await raccoons.ownerMint(YOUR_ADDRESS, 1, {
    gasLimit: 300000
  });
  await mintTx.wait();
  
  console.log("✅ Raccoon minted!");

  // Test tokenURI
  try {
    const tokenURI = await raccoons.tokenURI(1);
    console.log("✅ TokenURI works:", tokenURI);
  } catch (err) {
    console.error("❌ TokenURI still failing:", err.message);
  }
  
  // Check balance
  const balance = await raccoons.balanceOf(YOUR_ADDRESS);
  console.log("Your balance:", balance.toString());
  
  if (balance > 0) {
    const tokenId = await raccoons.tokenOfOwnerByIndex(YOUR_ADDRESS, 0);
    console.log("Your first token ID:", tokenId.toString());
  }
}

main().catch(console.error);