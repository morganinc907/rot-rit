const hre = require("hardhat");

async function main() {
  const raccoons = await hre.ethers.getContractAt(
    "Raccoons",
    "0xE2DA9cC68789A52c4594FB4276823165734f0F28"
  );

  console.log("🦝 Updating Raccoons dynamicMetadataURI to local metadata API...");

  // Set dynamicMetadataURI to localhost:3001 (contract will append /raccoon/)
  const tx = await raccoons.setDynamicMetadataURI("http://localhost:3001");
  console.log("Transaction sent:", tx.hash);

  await tx.wait();
  console.log("✅ DynamicMetadataURI updated to: http://localhost:3001");

  // Verify
  const tokenURI = await raccoons.tokenURI(1);
  console.log("Token 1 URI now:", tokenURI);
}

main().catch(console.error);
