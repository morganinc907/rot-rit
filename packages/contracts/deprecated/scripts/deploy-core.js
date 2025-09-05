const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying core contracts for testing...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Deploy core contracts
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

  console.log("📄 Deploying Cosmetics...");
  const Cosmetics = await ethers.getContractFactory("Cosmetics");
  const cosmetics = await Cosmetics.deploy();
  await cosmetics.waitForDeployment();
  console.log("✅ Cosmetics deployed to:", await cosmetics.getAddress());

  console.log("📄 Deploying KeyShop...");
  const KeyShop = await ethers.getContractFactory("KeyShop");
  const keyShop = await KeyShop.deploy(
    await relics.getAddress()
  );
  await keyShop.waitForDeployment();
  console.log("✅ KeyShop deployed to:", await keyShop.getAddress());

  // Configure contracts
  console.log("\n🔗 Configuring contracts...");
  
  // Set KeyShop as authorized minter in Relics
  await relics.setKeyShop(await keyShop.getAddress());
  console.log("✅ KeyShop authorized in Relics");

  // Set up some basic configurations
  await demons.setMawSacrifice(deployer.address); // Temp for testing
  await cultists.setMawSacrifice(deployer.address); // Temp for testing
  console.log("✅ Basic authorizations set");

  // Create test cosmetics
  console.log("🎨 Creating test cosmetics...");
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
    2, // cosmeticId
    "Epic Crown", 
    "https://example.com/crown.png",
    "https://example.com/crown-layer.png",
    4, // legendary rarity
    1, // head slot
    1, // monthlySetId
    10 // maxSupply
  );
  console.log("✅ Test cosmetics created");

  // Enable public minting for raccoons (for testing)
  await raccoons.setMintConfig(
    ethers.parseEther("0.01"), // 0.01 ETH per raccoon
    10, 10, true, false, false
  );
  console.log("✅ Raccoon public minting enabled");

  // Save addresses for frontend
  const addresses = {
    raccoons: await raccoons.getAddress(),
    cultists: await cultists.getAddress(),
    relics: await relics.getAddress(),
    demons: await demons.getAddress(),
    cosmetics: await cosmetics.getAddress(),
    keyShop: await keyShop.getAddress(),
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    blockNumber: await ethers.provider.getBlockNumber(),
    keyPrice: "0.001",
    raccoonPrice: "0.01"
  };

  const fs = require('fs');
  const fileName = addresses.chainId === 1337 ? './src/contracts-local.json' : './src/contracts-testnet.json';
  fs.writeFileSync(fileName, JSON.stringify(addresses, null, 2));
  
  console.log(`\n💾 Contract addresses saved to ${fileName}`);
  console.log("\n🎉 Core deployment complete!");
  console.log("\n📋 Summary:");
  console.log("Raccoons:", addresses.raccoons);
  console.log("Cultists:", addresses.cultists);
  console.log("Relics:", addresses.relics);
  console.log("Demons:", addresses.demons);
  console.log("Cosmetics:", addresses.cosmetics);
  console.log("KeyShop:", addresses.keyShop);
  
  console.log("\n🧪 Ready to test:");
  console.log("1. Buy keys from KeyShop ✅");
  console.log("2. Mint raccoons ✅");
  console.log("3. Basic contract interactions ✅");
  console.log("4. Burn raccoons (when needed) ✅");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });