const hre = require("hardhat");

async function main() {
  const raccoons = await hre.ethers.getContractAt(
    "Raccoons",
    "0xE2DA9cC68789A52c4594FB4276823165734f0F28"
  );

  console.log("🦝 Checking Raccoons tokenURI...");

  // Check token 1
  const uri1 = await raccoons.tokenURI(1);
  console.log("Token 1 URI:", uri1);

  // Check token 7
  const uri7 = await raccoons.tokenURI(7);
  console.log("Token 7 URI:", uri7);
}

main().catch(console.error);
