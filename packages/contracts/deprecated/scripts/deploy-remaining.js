const hre = require("hardhat");
require("dotenv").config();

const COSMETICS_ADDRESS = "0xa45358561Fc7D9C258F831a4Bf5958fe7982EF61";

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
  console.log("Deploying remaining contracts...");
  console.log("Deployer:", deployer.address);
  console.log("Network:", hre.network.name);

  const Contracts = {};

  console.log("\n=== Deploying Core Contracts ===");

  // Deploy Demons
  console.log("Deploying Demons...");
  const Demons = await hre.ethers.getContractFactory("Demons");
  const demons = await Demons.deploy(
    "ipfs://demons-images/",             // baseURI - placeholder for now  
    "ipfs://demons-mythic/"              // mythicBaseURI - placeholder for now
  );
  await demons.waitForDeployment();
  Contracts.Demons = await demons.getAddress();
  console.log("✅ Demons deployed at:", Contracts.Demons);

  // Deploy Relics
  console.log("Deploying Relics...");
  const Relics = await hre.ethers.getContractFactory("Relics");
  const relics = await Relics.deploy("ipfs://relics-base-uri/"); // baseUri parameter
  await relics.waitForDeployment();
  Contracts.Relics = await relics.getAddress();
  console.log("✅ Relics deployed at:", Contracts.Relics);

  // Deploy Cultists
  console.log("Deploying Cultists...");
  const Cultists = await hre.ethers.getContractFactory("Cultists");
  const cultists = await Cultists.deploy();
  await cultists.waitForDeployment();
  Contracts.Cultists = await cultists.getAddress();
  console.log("✅ Cultists deployed at:", Contracts.Cultists);

  console.log("\n=== Deploying MawSacrificeV2 with VRF ===");
  
  // Deploy MawSacrificeV2 with VRF configuration
  console.log("Deploying MawSacrificeV2...");
  const MawSacrificeV2 = await hre.ethers.getContractFactory("MawSacrificeV2");
  const maw = await MawSacrificeV2.deploy(
    Contracts.Relics,
    COSMETICS_ADDRESS,
    Contracts.Demons,
    Contracts.Cultists,
    VRF_CONFIG.coordinator,
    VRF_CONFIG.keyHash,
    1 // placeholder subscriptionId - will need to be updated after creating VRF subscription
  );
  await maw.waitForDeployment();
  Contracts.MawSacrificeV2 = await maw.getAddress();
  console.log("✅ MawSacrificeV2 deployed at:", Contracts.MawSacrificeV2);

  console.log("\n=== Setting Up Permissions ===");

  // Set permissions for Relics
  await (await relics.setMawSacrifice(Contracts.MawSacrificeV2)).wait();
  console.log("✅ Relics: setMawSacrifice ->", Contracts.MawSacrificeV2);

  // Set ritual permission for Demons
  await (await demons.setRitual(Contracts.MawSacrificeV2)).wait();
  console.log("✅ Demons: setRitual ->", Contracts.MawSacrificeV2);

  console.log("\n🎉 Core Contracts Deployment Complete!");
  console.log("\n📌 Deployed Contracts:");
  console.log("Demons:", Contracts.Demons);
  console.log("Relics:", Contracts.Relics);
  console.log("Cultists:", Contracts.Cultists);
  console.log("MawSacrificeV2:", Contracts.MawSacrificeV2);
  console.log("CosmeticsV2:", COSMETICS_ADDRESS);
  
  console.log("\n📌 Next Steps:");
  console.log("1. Update CosmeticsV2 to set MawSacrifice reference");
  console.log("2. Create VRF subscription at vrf.chain.link");
  console.log("3. Deploy support contracts (RaccoonRenderer, Aggregator)");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});