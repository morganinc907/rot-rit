const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying contracts individually...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy contracts one by one to avoid interface conflicts
  console.log("📄 Deploying Raccoons...");
  const Raccoons = await ethers.getContractFactory("Raccoons");
  const raccoons = await Raccoons.deploy(
    "Rot Ritual Raccoons",
    "TRASH",
    2000,
    "https://example.com/normal/",
    "https://example.com/cult/",
    "https://example.com/dead/"
  );
  await raccoons.waitForDeployment();
  console.log("✅ Raccoons deployed to:", await raccoons.getAddress());

  console.log("📄 Deploying Cultists...");
  const Cultists = await ethers.getContractFactory("Cultists");
  const cultists = await Cultists.deploy();
  await cultists.waitForDeployment();
  console.log("✅ Cultists deployed to:", await cultists.getAddress());

  console.log("📄 Deploying Relics...");
  const Relics = await ethers.getContractFactory("Relics");
  const relics = await Relics.deploy("https://example.com/relics/");
  await relics.waitForDeployment();
  console.log("✅ Relics deployed to:", await relics.getAddress());

  console.log("📄 Deploying Demons...");
  const Demons = await ethers.getContractFactory("Demons");
  const demons = await Demons.deploy();
  await demons.waitForDeployment();
  console.log("✅ Demons deployed to:", await demons.getAddress());

  console.log("📄 Deploying KeyShop...");
  const KeyShop = await ethers.getContractFactory("KeyShop");
  const keyShop = await KeyShop.deploy(
    await relics.getAddress(),
    ethers.parseEther("0.001") // 0.001 ETH per key
  );
  await keyShop.waitForDeployment();
  console.log("✅ KeyShop deployed to:", await keyShop.getAddress());

  // Configure contracts
  console.log("\n🔗 Configuring contracts...");
  
  // Set KeyShop as authorized minter in Relics
  await relics.setKeyShop(await keyShop.getAddress());
  console.log("✅ KeyShop authorized in Relics");

  // Save addresses for frontend
  const addresses = {
    raccoons: await raccoons.getAddress(),
    cultists: await cultists.getAddress(),
    relics: await relics.getAddress(),
    demons: await demons.getAddress(),
    keyShop: await keyShop.getAddress(),
    chainId: 1337,
    blockNumber: await ethers.provider.getBlockNumber()
  };

  const fs = require('fs');
  fs.writeFileSync('./src/contracts-local.json', JSON.stringify(addresses, null, 2));
  
  console.log("\n💾 Contract addresses saved to src/contracts-local.json");
  console.log("\n🎉 Basic deployment complete!");
  console.log("\n📋 Addresses:");
  console.log("Raccoons:", addresses.raccoons);
  console.log("Cultists:", addresses.cultists);
  console.log("Relics:", addresses.relics);
  console.log("Demons:", addresses.demons);
  console.log("KeyShop:", addresses.keyShop);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });