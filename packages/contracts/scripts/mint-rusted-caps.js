const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const user = "0x7DC878A8f7Af8dfE99d8e4D448Da9E1AC61b6c7C";
  
  console.log("Minting RUSTED_CAPS (token ID 0) for user:", user);
  
  const relics = await hre.ethers.getContractAt(
    "Relics",
    "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b"
  );
  
  // Mint 5 RUSTED_CAPS (ID 0)
  const tx = await relics.mint(user, 0, 5, "0x");
  console.log("Mint tx:", tx.hash);
  
  await tx.wait();
  console.log("✅ Minted 5 RUSTED_CAPS (ID 0)");
  
  // Check balance
  const balance = await relics.balanceOf(user, 0);
  console.log("New RUSTED_CAP balance:", balance.toString());
}

main().catch(console.error);