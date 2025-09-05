const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying complete Rot & Ritual system to Base Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // 1) Deploy core contracts
  console.log("\n📄 Deploying core contracts...");
  
  console.log("📄 Deploying Relics...");
  const Relics = await ethers.getContractFactory("Relics");
  const relics = await Relics.deploy("https://api.rotandrituals.com/relics/");
  await relics.waitForDeployment();
  console.log("✅ Relics deployed to:", await relics.getAddress());

  console.log("📄 Deploying Raccoons...");
  const Raccoons = await ethers.getContractFactory("Raccoons");
  const raccoons = await Raccoons.deploy(
    "Rot Ritual Raccoons",
    "TRASH", 
    2000,
    "https://api.rotandrituals.com/raccoons/normal/",
    "https://api.rotandrituals.com/raccoons/cult/",
    "https://api.rotandrituals.com/raccoons/dead/"
  );
  await raccoons.waitForDeployment();
  console.log("✅ Raccoons deployed to:", await raccoons.getAddress());

  console.log("📄 Deploying Cultists...");
  const Cultists = await ethers.getContractFactory("Cultists");
  const cultists = await Cultists.deploy();
  await cultists.waitForDeployment();
  console.log("✅ Cultists deployed to:", await cultists.getAddress());

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

  // 2) Deploy system contracts
  console.log("\n📄 Deploying system contracts...");

  console.log("📄 Deploying Rituals...");
  const Rituals = await ethers.getContractFactory("Rituals");
  const rituals = await Rituals.deploy(
    await raccoons.getAddress(),
    await cultists.getAddress(),
    await relics.getAddress(),
    await demons.getAddress()
  );
  await rituals.waitForDeployment();
  console.log("✅ Rituals deployed to:", await rituals.getAddress());

  console.log("📄 Deploying KeyShop...");
  const KeyShop = await ethers.getContractFactory("KeyShop");
  const keyShop = await KeyShop.deploy(await relics.getAddress());
  await keyShop.waitForDeployment();
  console.log("✅ KeyShop deployed to:", await keyShop.getAddress());

  console.log("📄 Deploying MawSacrifice...");
  const MawSacrifice = await ethers.getContractFactory("MawSacrifice");
  const maw = await MawSacrifice.deploy(
    await relics.getAddress(),
    await cosmetics.getAddress(),
    await demons.getAddress(),
    await cultists.getAddress()
  );
  await maw.waitForDeployment();
  console.log("✅ MawSacrifice deployed to:", await maw.getAddress());

  console.log("📄 Deploying CosmeticApplier...");
  const CosmeticApplier = await ethers.getContractFactory("CosmeticApplier");
  const applier = await CosmeticApplier.deploy(
    await raccoons.getAddress(),
    await cosmetics.getAddress()
  );
  await applier.waitForDeployment();
  console.log("✅ CosmeticApplier deployed to:", await applier.getAddress());

  // 3) Wire roles (critical!)
  console.log("\n🔗 Wiring contract roles...");

  // Relics authorizations
  console.log("🔗 Setting Relics authorizations...");
  await (await relics.setKeyShop(await keyShop.getAddress())).wait();
  await (await relics.setMawSacrifice(await maw.getAddress())).wait();
  await (await relics.setRitual(await rituals.getAddress())).wait();
  console.log("✅ Relics authorizations set");

  // Raccoons
  console.log("🔗 Setting Raccoons ritual...");
  await (await raccoons.setRitual(await rituals.getAddress())).wait();
  console.log("✅ Raccoons ritual set");

  // Cultists 
  console.log("🔗 Setting Cultists authorizations...");
  await (await cultists.setRitual(await rituals.getAddress())).wait();
  await (await cultists.setMawSacrifice(await maw.getAddress())).wait();
  console.log("✅ Cultists authorizations set");

  // Demons
  console.log("🔗 Setting Demons authorizations...");
  await (await demons.setRitual(await rituals.getAddress())).wait();
  await (await demons.setMawSacrifice(await maw.getAddress())).wait();
  console.log("✅ Demons authorizations set");

  // Cosmetics
  console.log("🔗 Setting Cosmetics authorizations...");
  await (await cosmetics.setMawSacrifice(await maw.getAddress())).wait();
  await (await cosmetics.setCosmeticApplier(await applier.getAddress())).wait();
  console.log("✅ Cosmetics authorizations set");

  // 4) Configure runtime parameters
  console.log("\n⚙️  Configuring runtime parameters...");

  // MawSacrifice settings
  console.log("⚙️  Configuring MawSacrifice...");
  await (await maw.setMinBlocksBetweenSacrifices(1)).wait();
  await (await maw.setAshesPerVial(50)).wait();
  console.log("✅ MawSacrifice configured");

  // Demon tier URIs
  console.log("⚙️  Setting Demon tier URIs...");
  await (await demons.setTierBaseURI(1, "https://api.rotandrituals.com/demons/common/")).wait();
  await (await demons.setTierBaseURI(2, "https://api.rotandrituals.com/demons/rare/")).wait();
  await (await demons.setTierBaseURI(3, "https://api.rotandrituals.com/demons/legendary/")).wait();
  console.log("✅ Demon tier URIs set");

  // KeyShop price (0.002 ETH for testnet)
  console.log("⚙️  Setting KeyShop price...");
  await (await keyShop.setKeyPrice(ethers.parseEther("0.002"))).wait();
  console.log("✅ KeyShop price set to 0.002 ETH");

  // Raccoon minting config (0.01 ETH for testnet)
  console.log("⚙️  Configuring Raccoon minting...");
  await (await raccoons.setMintConfig(
    ethers.parseEther("0.01"), // 0.01 ETH per raccoon
    10, 10, true, false, false
  )).wait();
  console.log("✅ Raccoon minting configured");

  // Create test cosmetics
  console.log("🎨 Creating test cosmetics...");
  await (await cosmetics.createCosmetic(
    1, // cosmeticId
    "Test Hat",
    "https://api.rotandrituals.com/cosmetics/hat.png",
    "https://api.rotandrituals.com/cosmetics/hat-layer.png",
    1, // common rarity
    1, // head slot
    1, // monthlySetId
    100 // maxSupply
  )).wait();
  
  await (await cosmetics.createCosmetic(
    2, // cosmeticId
    "Epic Crown", 
    "https://api.rotandrituals.com/cosmetics/crown.png",
    "https://api.rotandrituals.com/cosmetics/crown-layer.png",
    4, // legendary rarity
    1, // head slot
    1, // monthlySetId
    10 // maxSupply
  )).wait();
  console.log("✅ Test cosmetics created");

  // Set monthly cosmetics for sacrifice
  console.log("🎨 Setting monthly cosmetics...");
  await (await maw.setMonthlyCosmetics(1, [1, 2])).wait();
  console.log("✅ Monthly cosmetics set");

  // Save contract addresses
  const addresses = {
    relics: await relics.getAddress(),
    raccoons: await raccoons.getAddress(),
    cultists: await cultists.getAddress(),
    demons: await demons.getAddress(),
    cosmetics: await cosmetics.getAddress(),
    rituals: await rituals.getAddress(),
    keyShop: await keyShop.getAddress(),
    mawSacrifice: await maw.getAddress(),
    cosmeticApplier: await applier.getAddress(),
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    blockNumber: await ethers.provider.getBlockNumber(),
    keyPrice: "0.002",
    raccoonPrice: "0.01"
  };

  const fs = require('fs');
  const fileName = './src/contracts-base-sepolia.json';
  fs.writeFileSync(fileName, JSON.stringify(addresses, null, 2));
  
  console.log(`\n💾 Contract addresses saved to ${fileName}`);
  console.log("\n🎉 Complete system deployment successful!");
  console.log("\n📋 Contract Summary:");
  console.log("Relics:", addresses.relics);
  console.log("Raccoons:", addresses.raccoons);
  console.log("Cultists:", addresses.cultists);
  console.log("Demons:", addresses.demons);
  console.log("Cosmetics:", addresses.cosmetics);
  console.log("Rituals:", addresses.rituals);
  console.log("KeyShop:", addresses.keyShop);
  console.log("MawSacrifice:", addresses.mawSacrifice);
  console.log("CosmeticApplier:", addresses.cosmeticApplier);
  
  console.log("\n🧪 Ready for smoke testing:");
  console.log("1. Buy keys from KeyShop (0.002 ETH each) ✅");
  console.log("2. Mint raccoons (0.01 ETH each) ✅");
  console.log("3. Sacrifice keys for relics ✅");
  console.log("4. Cosmetic rituals ✅");
  console.log("5. Demon rituals ✅");
  console.log("6. Apply cosmetics ✅");
  
  console.log(`\n🌐 Verify on BaseScan: https://sepolia.basescan.org/`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });