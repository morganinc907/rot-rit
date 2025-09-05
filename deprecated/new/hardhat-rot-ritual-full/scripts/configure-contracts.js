const hre = require("hardhat");
const fs = require("fs");

// Load deployment addresses
function loadDeployment() {
  if (!fs.existsSync("deployment-output.json")) {
    throw new Error("deployment-output.json not found. Run deploy-with-ipfs.js first.");
  }
  return JSON.parse(fs.readFileSync("deployment-output.json", "utf8"));
}

// Trait configurations matching the raccoon artwork
const TRAIT_CONFIG = {
  // Trait names for each slot (matching your generated art)
  traitNames: {
    0: ["Cap", "Beanie", "Crown", "Bandana", "None"],           // Head
    1: ["Glasses", "Eyepatch", "Mask", "None", "Scar"],        // Face  
    2: ["Shirt", "Hoodie", "Armor", "Jacket", "None"],         // Body
    3: ["Brown", "Gray", "Black", "White", "Golden"],          // Fur
    4: ["Forest", "City", "Mountain", "Beach", "Space"]        // Background
  },
  
  // Rarity weights for trait generation (out of 10000)
  rarityWeights: {
    0: [1000, 2000, 500, 1500, 5000],  // Head: Cap(10%), Beanie(20%), Crown(5%), Bandana(15%), None(50%)
    1: [1500, 800, 700, 4000, 3000],   // Face: Glasses(15%), Eyepatch(8%), Mask(7%), None(40%), Scar(30%)  
    2: [2000, 1500, 800, 1700, 4000],  // Body: Shirt(20%), Hoodie(15%), Armor(8%), Jacket(17%), None(40%)
    3: [2500, 2000, 1500, 1000, 3000], // Fur: Brown(25%), Gray(20%), Black(15%), White(10%), Golden(30%)
    4: [2000, 2000, 2000, 2000, 2000]  // Background: Equal distribution (20% each)
  }
};

// Sample cosmetic pools (you'll need to create cosmetics first)
const COSMETIC_POOLS = {
  // Rarity 0 (Common) cosmetics
  0: [], // Will be populated when cosmetics are created
  
  // Rarity 1 (Rare) cosmetics  
  1: [],
  
  // Rarity 2 (Epic) cosmetics
  2: [],
  
  // Rarity 3 (Legendary) cosmetics
  3: []
};

async function main() {
  const deployment = loadDeployment();
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Configuring contracts on", hre.network.name);
  console.log("Deployer:", deployer.address);

  // Get contract instances
  const raccoons = await hre.ethers.getContractAt("Raccoons", deployment.contracts.Raccoons);
  const maw = await hre.ethers.getContractAt("MawSacrificeV2", deployment.contracts.MawSacrificeV2);
  const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", deployment.contracts.CosmeticsV2);

  console.log("\n=== 1. Configuring Raccoon Traits ===");
  
  // Set trait names for each slot
  for (const [slot, names] of Object.entries(TRAIT_CONFIG.traitNames)) {
    console.log(`Setting trait names for slot ${slot}:`, names);
    try {
      await (await raccoons.setTraitNames(parseInt(slot), names)).wait();
      console.log(`✅ Slot ${slot} trait names set`);
    } catch (error) {
      console.log(`❌ Failed to set trait names for slot ${slot}:`, error.message);
    }
  }

  // Set rarity weights for trait generation
  for (const [slot, weights] of Object.entries(TRAIT_CONFIG.rarityWeights)) {
    console.log(`Setting rarity weights for slot ${slot}:`, weights);
    try {
      await (await raccoons.setSlotWeights(parseInt(slot), weights)).wait();
      console.log(`✅ Slot ${slot} weights set`);
    } catch (error) {
      console.log(`❌ Failed to set weights for slot ${slot}:`, error.message);
    }
  }

  console.log("\n=== 2. Configuring MawSacrificeV2 ===");

  // Set cosmetic pools for different rarities
  for (const [rarity, pool] of Object.entries(COSMETIC_POOLS)) {
    if (pool.length > 0) {
      console.log(`Setting cosmetic pool for rarity ${rarity}:`, pool);
      try {
        await (await maw.setCosmeticPool(parseInt(rarity), pool)).wait();
        console.log(`✅ Rarity ${rarity} pool set`);
      } catch (error) {
        console.log(`❌ Failed to set pool for rarity ${rarity}:`, error.message);
      }
    } else {
      console.log(`⚠️ Skipping rarity ${rarity} pool (empty)`);
    }
  }

  // Set default cooldown (e.g., 1 hour = 300 blocks on Base)
  const cooldownBlocks = 300;
  console.log(`Setting cooldown to ${cooldownBlocks} blocks`);
  try {
    await (await maw.setCooldown(cooldownBlocks)).wait();
    console.log(`✅ Cooldown set to ${cooldownBlocks} blocks`);
  } catch (error) {
    console.log(`❌ Failed to set cooldown:`, error.message);
  }

  // Set ash per vial (default 100)
  const ashPerVial = 100;
  console.log(`Setting ash per vial to ${ashPerVial}`);
  try {
    await (await maw.setAshPerVial(ashPerVial)).wait();
    console.log(`✅ Ash per vial set to ${ashPerVial}`);
  } catch (error) {
    console.log(`❌ Failed to set ash per vial:`, error.message);
  }

  console.log("\n=== 3. Enabling Revelation ===");
  
  // Enable revelation for raccoons (so they show traits instead of pre-reveal)
  try {
    await (await raccoons.setRevealed(true)).wait();
    console.log("✅ Raccoons revelation enabled");
  } catch (error) {
    console.log("❌ Failed to enable revelation:", error.message);
  }

  console.log("\n🎉 Configuration Complete!");
  console.log("\n📌 Next Steps:");
  console.log("1. Create cosmetic types in CosmeticsV2 contract");
  console.log("2. Update cosmetic pools in MawSacrificeV2");
  console.log("3. Test minting raccoons to verify trait generation");
  console.log("4. Test sacrifice mechanics");
  console.log("5. Set up VRF subscription if not done already");

  // Save configuration info
  const configInfo = {
    timestamp: new Date().toISOString(),
    network: hre.network.name,
    traitConfig: TRAIT_CONFIG,
    cosmeticPools: COSMETIC_POOLS,
    settings: {
      cooldownBlocks,
      ashPerVial,
      revealed: true
    }
  };

  fs.writeFileSync("configuration-output.json", JSON.stringify(configInfo, null, 2));
  console.log("📁 Configuration info written to configuration-output.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});