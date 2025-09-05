const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying complete Rot & Ritual V2 system with new cosmetics...\n");

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
    "https://api.rotandrituals.com/raccoons/"
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

  console.log("📄 Deploying CosmeticsV2 (ERC1155 with burn-and-bind)...");
  const CosmeticsV2 = await ethers.getContractFactory("CosmeticsV2");
  const cosmetics = await CosmeticsV2.deploy(
    "https://api.rotandrituals.com/cosmetics/types/",  // baseTypeURI
    "https://api.rotandrituals.com/cosmetics/bound/"   // boundBaseURI
  );
  await cosmetics.waitForDeployment();
  console.log("✅ CosmeticsV2 deployed to:", await cosmetics.getAddress());

  console.log("📄 Deploying RaccoonRenderer...");
  const RaccoonRenderer = await ethers.getContractFactory("RaccoonRenderer");
  const renderer = await RaccoonRenderer.deploy(
    await cosmetics.getAddress(),
    await raccoons.getAddress()
  );
  await renderer.waitForDeployment();
  console.log("✅ RaccoonRenderer deployed to:", await renderer.getAddress());

  // 2) Deploy system contracts
  console.log("\n🔧 Deploying system contracts...");

  console.log("📄 Deploying MawSacrificeV2...");
  const MawSacrificeV2 = await ethers.getContractFactory("MawSacrificeV2");
  const mawSacrifice = await MawSacrificeV2.deploy(
    await relics.getAddress(),
    await cosmetics.getAddress(), 
    await demons.getAddress(),
    await cultists.getAddress()
  );
  await mawSacrifice.waitForDeployment();
  console.log("✅ MawSacrificeV2 deployed to:", await mawSacrifice.getAddress());

  console.log("📄 Deploying KeyShop...");
  const KeyShop = await ethers.getContractFactory("KeyShop");
  const keyShop = await KeyShop.deploy(await relics.getAddress());
  await keyShop.waitForDeployment();
  console.log("✅ KeyShop deployed to:", await keyShop.getAddress());

  console.log("📄 Deploying Rituals...");
  const Rituals = await ethers.getContractFactory("Rituals");
  const rituals = await Rituals.deploy(
    await raccoons.getAddress(),
    await cultists.getAddress(),
    await demons.getAddress()
  );
  await rituals.waitForDeployment();
  console.log("✅ Rituals deployed to:", await rituals.getAddress());

  // 3) Set up permissions and relationships
  console.log("\n🔗 Setting up permissions and relationships...");

  // Raccoons permissions
  console.log("Setting Raccoons ritual address...");
  await raccoons.setRitual(await rituals.getAddress());
  console.log("✅ Raccoons ritual set");

  // Cultists permissions
  console.log("Setting Cultists permissions...");
  await cultists.setRitual(await rituals.getAddress());
  await cultists.setMawSacrifice(await mawSacrifice.getAddress());
  console.log("✅ Cultists permissions set");

  // Demons permissions
  console.log("Setting Demons permissions...");
  await demons.setMawSacrifice(await mawSacrifice.getAddress());
  console.log("✅ Demons permissions set");

  // Relics permissions
  console.log("Setting Relics permissions...");
  await relics.setMawSacrifice(await mawSacrifice.getAddress());
  await relics.setKeyShop(await keyShop.getAddress());
  console.log("✅ Relics permissions set");

  // CosmeticsV2 permissions
  console.log("Setting CosmeticsV2 permissions...");
  await cosmetics.setContracts(
    await raccoons.getAddress(),
    await mawSacrifice.getAddress()
  );
  console.log("✅ CosmeticsV2 permissions set");

  // 4) Create sample cosmetic types for testing
  console.log("\n🎨 Creating sample cosmetic types...");

  // HEAD cosmetics
  await cosmetics.createCosmeticType(
    "Cool Cap",
    "https://api.rotandrituals.com/cosmetics/1.json",
    "https://api.rotandrituals.com/cosmetics/layers/1.png",
    1, // Common
    0, // HEAD slot
    1, // Monthly set 1
    1000 // Max supply
  );
  console.log("✅ Created HEAD cosmetic: Cool Cap");

  // FACE cosmetics
  await cosmetics.createCosmeticType(
    "Sunglasses",
    "https://api.rotandrituals.com/cosmetics/2.json",
    "https://api.rotandrituals.com/cosmetics/layers/2.png", 
    2, // Uncommon
    1, // FACE slot
    1, // Monthly set 1
    500 // Max supply
  );
  console.log("✅ Created FACE cosmetic: Sunglasses");

  // BODY cosmetics
  await cosmetics.createCosmeticType(
    "Leather Jacket",
    "https://api.rotandrituals.com/cosmetics/3.json",
    "https://api.rotandrituals.com/cosmetics/layers/3.png",
    3, // Rare
    2, // BODY slot
    1, // Monthly set 1
    100 // Max supply
  );
  console.log("✅ Created BODY cosmetic: Leather Jacket");

  // COLOR cosmetics
  await cosmetics.createCosmeticType(
    "Golden Fur",
    "https://api.rotandrituals.com/cosmetics/4.json",
    "https://api.rotandrituals.com/cosmetics/layers/4.png",
    4, // Legendary
    3, // COLOR slot
    1, // Monthly set 1
    25 // Max supply
  );
  console.log("✅ Created COLOR cosmetic: Golden Fur");

  // BACKGROUND cosmetics
  await cosmetics.createCosmeticType(
    "Mystical Aura",
    "https://api.rotandrituals.com/cosmetics/5.json", 
    "https://api.rotandrituals.com/cosmetics/layers/5.png",
    5, // Mythic
    4, // BACKGROUND slot
    1, // Monthly set 1
    5 // Max supply
  );
  console.log("✅ Created BACKGROUND cosmetic: Mystical Aura");

  // 5) Set monthly cosmetics in MawSacrificeV2
  console.log("Setting monthly cosmetics in MawSacrificeV2...");
  await mawSacrifice.setMonthlyCosmetics(1, [1, 2, 3, 4, 5]);
  console.log("✅ Monthly cosmetics set");

  // 6) Summary
  console.log("\n🎉 Deployment complete! Contract addresses:");
  console.log("=====================================");
  console.log("Raccoons:", await raccoons.getAddress());
  console.log("Cultists:", await cultists.getAddress());
  console.log("Demons:", await demons.getAddress());
  console.log("Relics:", await relics.getAddress());
  console.log("CosmeticsV2:", await cosmetics.getAddress());
  console.log("RaccoonRenderer:", await renderer.getAddress());
  console.log("MawSacrificeV2:", await mawSacrifice.getAddress());
  console.log("KeyShop:", await keyShop.getAddress());
  console.log("Rituals:", await rituals.getAddress());

  console.log("\n🔧 Next steps:");
  console.log("1. Update frontend to use new contract addresses");
  console.log("2. Set up off-chain image renderer service");
  console.log("3. Upload cosmetic assets to CDN");
  console.log("4. Test the new burn-and-bind cosmetics system!");

  // Create a summary object for easy frontend integration
  const deploymentInfo = {
    network: "base-sepolia",
    contracts: {
      Raccoons: await raccoons.getAddress(),
      Cultists: await cultists.getAddress(), 
      Demons: await demons.getAddress(),
      Relics: await relics.getAddress(),
      CosmeticsV2: await cosmetics.getAddress(),
      RaccoonRenderer: await renderer.getAddress(),
      MawSacrificeV2: await mawSacrifice.getAddress(),
      KeyShop: await keyShop.getAddress(),
      Rituals: await rituals.getAddress()
    },
    cosmeticTypes: {
      1: { name: "Cool Cap", slot: "HEAD", rarity: "Common" },
      2: { name: "Sunglasses", slot: "FACE", rarity: "Uncommon" },
      3: { name: "Leather Jacket", slot: "BODY", rarity: "Rare" },
      4: { name: "Golden Fur", slot: "COLOR", rarity: "Legendary" },
      5: { name: "Mystical Aura", slot: "BACKGROUND", rarity: "Mythic" }
    }
  };

  console.log("\n📋 Deployment summary saved:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });