const hre = require("hardhat");
const fs = require("fs");
require("dotenv").config();

const CFG_PATH = "deploy.config.json";

async function main() {
  const cfg = fs.existsSync(CFG_PATH) ? JSON.parse(fs.readFileSync(CFG_PATH, "utf8")) : {};

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const Contracts = {};

  // 1) Core + items
  const Relics = await hre.ethers.getContractFactory("Relics");
  const relics = await Relics.deploy();
  await relics.deployed();
  Contracts.Relics = relics.address;
  console.log("Relics:", relics.address);

  const Raccoons = await hre.ethers.getContractFactory("Raccoons");
  const raccoons = await Raccoons.deploy();
  await raccoons.deployed();
  Contracts.Raccoons = raccoons.address;
  console.log("Raccoons:", raccoons.address);

  const Cultists = await hre.ethers.getContractFactory("Cultists");
  const cultists = await Cultists.deploy();
  await cultists.deployed();
  Contracts.Cultists = cultists.address;
  console.log("Cultists:", cultists.address);

  const Demons = await hre.ethers.getContractFactory("Demons");
  const demons = await Demons.deploy();
  await demons.deployed();
  Contracts.Demons = demons.address;
  console.log("Demons:", demons.address);

  const CosmeticsV2 = await hre.ethers.getContractFactory("CosmeticsV2");
  const baseTypeURI = process.env.BASE_TYPE_URI || cfg.baseTypeURI || "";
  const boundBaseURI = process.env.BOUND_BASE_URI || cfg.boundBaseURI || "";
  const cosmetics = await CosmeticsV2.deploy(baseTypeURI, boundBaseURI);
  await cosmetics.deployed();
  Contracts.CosmeticsV2 = cosmetics.address;
  console.log("CosmeticsV2:", cosmetics.address);

  // 2) MawSacrificeV2
  const MawSacrificeV2 = await hre.ethers.getContractFactory("MawSacrificeV2");
  const maw = await MawSacrificeV2.deploy(relics.address, cosmetics.address, demons.address, cultists.address);
  await maw.deployed();
  Contracts.MawSacrificeV2 = maw.address;
  console.log("MawSacrificeV2:", maw.address);

  // Relics permissions
  await (await relics.setMawSacrifice(maw.address)).wait();
  console.log("Relics: setMawSacrifice ->", maw.address);

  // 3) Renderer
  const RaccoonRenderer = await hre.ethers.getContractFactory("RaccoonRenderer");
  const renderer = await RaccoonRenderer.deploy(cosmetics.address, raccoons.address);
  await renderer.deployed();
  Contracts.RaccoonRenderer = renderer.address;
  console.log("RaccoonRenderer:", renderer.address);

  // 4) Optional KeyShop
  if (cfg.keyShop && cfg.keyShop.enabled) {
    const KeyShop = await hre.ethers.getContractFactory("KeyShop");
    const price = cfg.keyShop.priceWei || "0";
    const treasury = cfg.keyShop.treasury || deployer.address;
    const shop = await KeyShop.deploy(relics.address, price, treasury);
    await shop.deployed();
    Contracts.KeyShop = shop.address;
    console.log("KeyShop:", shop.address);

    await (await relics.setKeyShop(shop.address)).wait();
    console.log("Relics: setKeyShop ->", shop.address);
  }

  // 5) Aggregator
  const RitualReadAggregator = await hre.ethers.getContractFactory("RitualReadAggregator");
  const aggregator = await RitualReadAggregator.deploy(cosmetics.address, raccoons.address, relics.address);
  await aggregator.deployed();
  Contracts.RitualReadAggregator = aggregator.address;
  console.log("RitualReadAggregator:", aggregator.address);

  // 6) Configure Maw
  if (cfg.rarityPools) {
    for (const rarity of Object.keys(cfg.rarityPools)) {
      const arr = cfg.rarityPools[rarity];
      if (arr && arr.length > 0) {
        await (await maw.setCosmeticPool(parseInt(rarity), arr)).wait();
        console.log("Set pool for rarity", rarity, arr);
      }
    }
  }
  if (cfg.rarityWeights) {
    for (const masks of Object.keys(cfg.rarityWeights)) {
      const weights = cfg.rarityWeights[masks];
      if (Array.isArray(weights) && weights.length === 5) {
        await (await maw.setRarityWeights(parseInt(masks), weights)).wait();
        console.log("Set weights for masks", masks, weights);
      }
    }
  }
  if (cfg.cooldownBlocks !== undefined) {
    await (await maw.setCooldown(cfg.cooldownBlocks)).wait();
    console.log("Cooldown blocks:", cfg.cooldownBlocks);
  }
  if (cfg.ashPerVial !== undefined) {
    await (await maw.setAshPerVial(cfg.ashPerVial)).wait();
    console.log("Ash per vial:", cfg.ashPerVial);
  }

  fs.writeFileSync("deploy.output.json", JSON.stringify(Contracts, null, 2));
  console.log("\nDeployed addresses written to deploy.output.json");
}

main().catch((e) => { console.error(e); process.exit(1); });
