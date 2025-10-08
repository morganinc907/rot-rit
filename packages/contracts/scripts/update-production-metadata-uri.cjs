const hre = require("hardhat");

async function main() {
  const raccoons = await hre.ethers.getContractAt(
    "Raccoons",
    "0xE2DA9cC68789A52c4594FB4276823165734f0F28"
  );

  console.log("🦝 Updating Raccoons dynamicMetadataURI to production metadata API...");

  // Set dynamicMetadataURI to production Render.com URL
  const productionURL = "https://rotrit5.onrender.com";

  const tx = await raccoons.setDynamicMetadataURI(productionURL);
  console.log("Transaction sent:", tx.hash);

  await tx.wait();
  console.log(`✅ DynamicMetadataURI updated to: ${productionURL}`);

  // Verify
  console.log("\n📋 Verifying tokenURIs...");
  const tokenURI1 = await raccoons.tokenURI(1);
  console.log("Token 1 URI:", tokenURI1);

  const tokenURI7 = await raccoons.tokenURI(7);
  console.log("Token 7 URI:", tokenURI7);

  console.log("\n✅ Contract configuration complete!");
  console.log("🔗 Metadata API: https://rotrit5.onrender.com/metadata/1");
}

main().catch(console.error);
