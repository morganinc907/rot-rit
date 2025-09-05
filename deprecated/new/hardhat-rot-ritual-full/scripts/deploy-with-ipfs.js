const hre = require("hardhat");
const fs = require("fs");
require("dotenv").config();

// IPFS Configuration
const IMAGES_HASH = "bafybeidbtpaiyged4rrdfr62wvhedz3aaxku7wd3zp7fdl5ik5736tw464";
const METADATA_HASH = "bafybeifsiog2puwlxfhszxjs3ttqi5r6y2zzdwhvswwanzehasc7tj3sf4";

// Base Sepolia VRF Configuration
const VRF_CONFIG = {
  coordinator: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B", // Base Sepolia VRF Coordinator
  keyHash: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae", // 500 gwei Key Hash
  subscriptionId: 0, // Will need to be set after creating subscription
  callbackGasLimit: 200000,
  requestConfirmations: 3
};

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Network:", hre.network.name);

  const Contracts = {};

  console.log("\n=== 1. Deploying Core Contracts ===");

  // Deploy Raccoons with IPFS configuration
  console.log("Deploying Raccoons...");
  const Raccoons = await hre.ethers.getContractFactory("Raccoons");
  const raccoons = await Raccoons.deploy(
    "Trash Raccoons",                                           // name
    "TRASH",                                                   // symbol  
    `ipfs://${IMAGES_HASH}/`,                                  // baseImageURI
    `ipfs://${METADATA_HASH}/`,                                // baseTokenURI
    `ipfs://${IMAGES_HASH}/prereveal.png`                      // preRevealImageURI
  );
  await raccoons.deployed();
  Contracts.Raccoons = raccoons.address;
  console.log("✅ Raccoons deployed at:", raccoons.address);

  // Deploy CosmeticsV2
  console.log("Deploying CosmeticsV2...");
  const CosmeticsV2 = await hre.ethers.getContractFactory("CosmeticsV2");
  const cosmetics = await CosmeticsV2.deploy(
    "ipfs://cosmetics-base-uri/",  // baseTypeURI - will need cosmetics IPFS later
    "ipfs://bound-base-uri/"       // boundBaseURI - for bound item metadata
  );
  await cosmetics.deployed();
  Contracts.CosmeticsV2 = cosmetics.address;
  console.log("✅ CosmeticsV2 deployed at:", cosmetics.address);

  // Deploy Demons
  console.log("Deploying Demons...");
  const Demons = await hre.ethers.getContractFactory("Demons");
  const demons = await Demons.deploy(
    "Ritual Demons",                      // name
    "DEMON",                             // symbol
    "ipfs://demons-images/",             // baseImageURI - will need demons IPFS later  
    "ipfs://demons-metadata/"            // baseTokenURI - will need demons metadata IPFS later
  );
  await demons.deployed();
  Contracts.Demons = demons.address;
  console.log("✅ Demons deployed at:", demons.address);

  // Deploy Relics
  console.log("Deploying Relics...");
  const Relics = await hre.ethers.getContractFactory("Relics");
  const relics = await Relics.deploy();
  await relics.deployed();
  Contracts.Relics = relics.address;
  console.log("✅ Relics deployed at:", relics.address);

  // Deploy Cultists
  console.log("Deploying Cultists...");
  const Cultists = await hre.ethers.getContractFactory("Cultists");
  const cultists = await Cultists.deploy();
  await cultists.deployed();
  Contracts.Cultists = cultists.address;
  console.log("✅ Cultists deployed at:", cultists.address);

  console.log("\n=== 2. Deploying MawSacrificeV2 with VRF ===");
  
  // Deploy MawSacrificeV2 with VRF configuration
  console.log("Deploying MawSacrificeV2...");
  const MawSacrificeV2 = await hre.ethers.getContractFactory("MawSacrificeV2");
  const maw = await MawSacrificeV2.deploy(
    relics.address,
    cosmetics.address,
    demons.address,
    cultists.address,
    VRF_CONFIG.coordinator,
    VRF_CONFIG.keyHash,
    VRF_CONFIG.subscriptionId,
    VRF_CONFIG.callbackGasLimit,
    VRF_CONFIG.requestConfirmations
  );
  await maw.deployed();
  Contracts.MawSacrificeV2 = maw.address;
  console.log("✅ MawSacrificeV2 deployed at:", maw.address);

  console.log("\n=== 3. Setting Up Permissions ===");

  // Set permissions for Relics
  await (await relics.setMawSacrifice(maw.address)).wait();
  console.log("✅ Relics: setMawSacrifice ->", maw.address);

  // Set ritual permission for Demons
  await (await demons.setRitual(maw.address)).wait();
  console.log("✅ Demons: setRitual ->", maw.address);

  // Set raccoons reference in CosmeticsV2
  await (await cosmetics.setRaccoons(raccoons.address)).wait();
  console.log("✅ CosmeticsV2: setRaccoons ->", raccoons.address);

  console.log("\n=== 4. Deploying Support Contracts ===");

  // Deploy RaccoonRenderer
  console.log("Deploying RaccoonRenderer...");
  const RaccoonRenderer = await hre.ethers.getContractFactory("RaccoonRenderer");
  const renderer = await RaccoonRenderer.deploy(cosmetics.address, raccoons.address);
  await renderer.deployed();
  Contracts.RaccoonRenderer = renderer.address;
  console.log("✅ RaccoonRenderer deployed at:", renderer.address);

  // Deploy Aggregator
  console.log("Deploying RitualReadAggregator...");
  const RitualReadAggregator = await hre.ethers.getContractFactory("RitualReadAggregator");
  const aggregator = await RitualReadAggregator.deploy(
    cosmetics.address,
    raccoons.address,
    relics.address
  );
  await aggregator.deployed();
  Contracts.RitualReadAggregator = aggregator.address;
  console.log("✅ RitualReadAggregator deployed at:", aggregator.address);

  console.log("\n=== 5. Final Configuration ===");

  // Write deployment output
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: Contracts,
    ipfs: {
      images: IMAGES_HASH,
      metadata: METADATA_HASH
    },
    vrf: VRF_CONFIG
  };

  fs.writeFileSync("deployment-output.json", JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n🎉 Deployment Complete!");
  console.log("📁 Deployment info written to deployment-output.json");
  console.log("\n📌 Next Steps:");
  console.log("1. Create VRF subscription at vrf.chain.link");
  console.log("2. Update subscription ID in MawSacrificeV2");
  console.log("3. Add MawSacrificeV2 as consumer to VRF subscription");
  console.log("4. Fund VRF subscription with LINK");
  console.log("5. Configure trait data and cosmetic pools");
  console.log("6. Test minting and sacrifice functions");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});