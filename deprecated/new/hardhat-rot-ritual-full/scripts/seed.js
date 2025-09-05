const hre = require("hardhat");
const fs = require("fs");
require("dotenv").config();

async function main() {
  const cfg = JSON.parse(fs.readFileSync("deploy.config.json", "utf8"));
  const out = JSON.parse(fs.readFileSync("deploy.output.json", "utf8"));

  const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", out.CosmeticsV2);
  const maw = await hre.ethers.getContractAt("MawSacrificeV2", out.MawSacrificeV2);

  const poolsEmpty = Object.values(cfg.rarityPools || {}).every((arr) => (arr || []).length === 0);
  const typeIdsByRarity = { 1: [], 2: [], 3: [], 4: [], 5: [] };

  if (poolsEmpty) {
    console.log("Seeding sample cosmetic types...");
    const slots = [0,1,2,3,4]; // HEAD, FACE, BODY, COLOR, BACKGROUND
    let created = 0;
    for (let rarity = 1; rarity <= 4; rarity++) {
      for (const slot of slots) {
        const name = `Sample ${["Head","Face","Body","Color","Background"][slot]} R${rarity}`;
        const imageURI = `${process.env.BASE_TYPE_URI || cfg.baseTypeURI}${rarity}-${slot}-full.png`;
        const previewLayerURI = `${process.env.BASE_TYPE_URI || cfg.baseTypeURI}${rarity}-${slot}-layer.png`;
        const monthlySetId = 1;
        const maxSupply = 1000;
        const tx = await cosmetics.createCosmeticType(name, imageURI, previewLayerURI, rarity, slot, monthlySetId, maxSupply);
        const rc = await tx.wait();
        const evt = rc.events.find(e => e.event === "CosmeticTypeCreated");
        const typeId = evt.args.typeId.toNumber();
        typeIdsByRarity[rarity].push(typeId);
        created++;
        console.log(`  - created typeId=${typeId} rarity=${rarity} slot=${slot}`);
      }
    }
    console.log(`Created ${created} sample types.`);
  } else {
    console.log("Using pools from deploy.config.json; no types created.");
    for (const r of Object.keys(cfg.rarityPools)) {
      typeIdsByRarity[parseInt(r)] = cfg.rarityPools[r];
    }
  }

  for (let rarity = 1; rarity <= 5; rarity++) {
    const pool = typeIdsByRarity[rarity];
    if (pool && pool.length > 0) {
      await (await maw.setCosmeticPool(rarity, pool)).wait();
      console.log("Set Maw pool for rarity", rarity, pool);
    }
  }

  for (const masks of Object.keys(cfg.rarityWeights)) {
    const weights = cfg.rarityWeights[masks];
    await (await maw.setRarityWeights(parseInt(masks), weights)).wait();
    console.log("Set weights for masks=", masks, weights);
  }

  if (cfg.cooldownBlocks !== undefined) {
    await (await maw.setCooldown(cfg.cooldownBlocks)).wait();
    console.log("Cooldown blocks:", cfg.cooldownBlocks);
  }
  if (cfg.ashPerVial !== undefined) {
    await (await maw.setAshPerVial(cfg.ashPerVial)).wait();
    console.log("Ash per vial:", cfg.ashPerVial);
  }

  console.log("\nSeeding complete.");
}

main().catch((e) => { console.error(e); process.exit(1); });
