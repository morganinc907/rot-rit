const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Rot & Ritual contracts locally...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy the CompleteDeployer
  console.log("\n📄 Deploying CompleteDeployer...");
  const CompleteDeployer = await ethers.getContractFactory("CompleteDeployer");
  
  const completeDeployer = await CompleteDeployer.deploy(
    2000, // maxSupply
    "https://example.com/normal/", // normalURI
    "https://example.com/cult/", // cultURI
    "https://example.com/dead/", // deadURI
    "https://example.com/relics/", // relicsBaseURI
    ethers.parseEther("0.001") // keyPrice (0.001 ETH for testing)
  );

  await completeDeployer.waitForDeployment();
  
  console.log("✅ CompleteDeployer deployed to:", await completeDeployer.getAddress());

  // Get all contract addresses
  const [
    raccoonsAddr,
    cultistsAddr,
    relicsAddr,
    demonsAddr,
    ritualsAddr,
    cosmeticsAddr,
    keyShopAddr,
    mawSacrificeAddr,
    cosmeticApplierAddr
  ] = await completeDeployer.getAllAddresses();

  console.log("\n📋 Contract Addresses:");
  console.log("├─ Raccoons:", raccoonsAddr);
  console.log("├─ Cultists:", cultistsAddr);
  console.log("├─ Relics:", relicsAddr);
  console.log("├─ Demons:", demonsAddr);
  console.log("├─ Rituals:", ritualsAddr);
  console.log("├─ Cosmetics:", cosmeticsAddr);
  console.log("├─ KeyShop:", keyShopAddr);
  console.log("├─ MawSacrifice:", mawSacrificeAddr);
  console.log("└─ CosmeticApplier:", cosmeticApplierAddr);

  // Verify configuration
  console.log("\n🔍 Verifying configuration...");
  const [configured, error] = await completeDeployer.verifyConfiguration();
  
  if (configured) {
    console.log("✅ All contracts properly configured!");
  } else {
    console.log("❌ Configuration error:", error);
  }

  // Setup some initial data for testing
  console.log("\n🎮 Setting up test data...");
  
  const mawSacrifice = await ethers.getContractAt("MawSacrifice", mawSacrificeAddr);
  const cosmetics = await ethers.getContractAt("Cosmetics", cosmeticsAddr);
  
  // Create some test cosmetics
  console.log("Creating test cosmetics...");
  await cosmetics.createCosmetic(
    1, // cosmeticId
    "Test Hat",
    "https://example.com/hat.png",
    "https://example.com/hat-layer.png",
    1, // common rarity
    1, // head slot
    1, // monthlySetId
    100 // maxSupply
  );
  
  await cosmetics.createCosmetic(
    2,
    "Epic Glasses",
    "https://example.com/glasses.png", 
    "https://example.com/glasses-layer.png",
    4, // legendary rarity
    3, // eyes slot
    1, // monthlySetId
    10 // maxSupply
  );

  // Set monthly cosmetics for MawSacrifice
  await mawSacrifice.setMonthlyCosmetics(1, [1, 2]);
  
  console.log("✅ Test cosmetics created and configured!");

  // Save addresses to file for frontend
  const addresses = {
    deployer: await completeDeployer.getAddress(),
    raccoons: raccoonsAddr,
    cultists: cultistsAddr,
    relics: relicsAddr,
    demons: demonsAddr,
    rituals: ritualsAddr,
    cosmetics: cosmeticsAddr,
    keyShop: keyShopAddr,
    mawSacrifice: mawSacrificeAddr,
    cosmeticApplier: cosmeticApplierAddr,
    chainId: 1337,
    blockNumber: await ethers.provider.getBlockNumber()
  };

  const fs = require('fs');
  fs.writeFileSync('./src/contracts-local.json', JSON.stringify(addresses, null, 2));
  
  console.log("\n💾 Contract addresses saved to src/contracts-local.json");
  console.log("\n🎉 Local deployment complete! Ready for testing.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });