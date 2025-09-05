const hre = require("hardhat");
require("dotenv").config();

// Known deployed contract addresses
const RACCOONS_ADDRESS = "0x7071269faa1FA8D24A5b8b03C745552B25021D90";
const COSMETICS_ADDRESS = "0xa45358561Fc7D9C258F831a4Bf5958fe7982EF61";
const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying support contracts...");
  console.log("Deployer:", deployer.address);
  console.log("Network:", hre.network.name);

  const Contracts = {};

  console.log("\n=== Deploying Support Contracts ===");

  // Deploy KeyShop
  console.log("Deploying KeyShop...");
  const KeyShop = await hre.ethers.getContractFactory("KeyShop");
  const keyShop = await KeyShop.deploy(RELICS_ADDRESS);
  await keyShop.waitForDeployment();
  Contracts.KeyShop = await keyShop.getAddress();
  console.log("✅ KeyShop deployed at:", Contracts.KeyShop);

  // Deploy RaccoonRenderer
  console.log("Deploying RaccoonRenderer...");
  const RaccoonRenderer = await hre.ethers.getContractFactory("RaccoonRenderer");
  const renderer = await RaccoonRenderer.deploy(COSMETICS_ADDRESS, RACCOONS_ADDRESS);
  await renderer.waitForDeployment();
  Contracts.RaccoonRenderer = await renderer.getAddress();
  console.log("✅ RaccoonRenderer deployed at:", Contracts.RaccoonRenderer);

  // Deploy RitualReadAggregator
  console.log("Deploying RitualReadAggregator...");
  const RitualReadAggregator = await hre.ethers.getContractFactory("RitualReadAggregator");
  const aggregator = await RitualReadAggregator.deploy(
    COSMETICS_ADDRESS,
    RACCOONS_ADDRESS,
    RELICS_ADDRESS
  );
  await aggregator.waitForDeployment();
  Contracts.RitualReadAggregator = await aggregator.getAddress();
  console.log("✅ RitualReadAggregator deployed at:", Contracts.RitualReadAggregator);

  console.log("\n=== Setting Up Permissions ===");

  // Set KeyShop permission in Relics
  const relics = await hre.ethers.getContractAt("Relics", RELICS_ADDRESS);
  try {
    await (await relics.setKeyShop(Contracts.KeyShop)).wait();
    console.log("✅ Relics: setKeyShop ->", Contracts.KeyShop);
  } catch (error) {
    console.log("ℹ️  Relics: KeyShop permission may need to be set manually");
  }

  console.log("\n🎉 Support Contracts Deployment Complete!");
  console.log("\n📌 Newly Deployed Support Contracts:");
  console.log("KeyShop:", Contracts.KeyShop);
  console.log("RaccoonRenderer:", Contracts.RaccoonRenderer);
  console.log("RitualReadAggregator:", Contracts.RitualReadAggregator);
  
  console.log("\n📌 Complete Contract Suite:");
  console.log("Raccoons:", RACCOONS_ADDRESS);
  console.log("CosmeticsV2:", COSMETICS_ADDRESS);
  console.log("Relics:", RELICS_ADDRESS);
  console.log("KeyShop:", Contracts.KeyShop);
  console.log("RaccoonRenderer:", Contracts.RaccoonRenderer);
  console.log("RitualReadAggregator:", Contracts.RitualReadAggregator);

  console.log("\n🎯 KeyShop Features:");
  console.log("- Purchase Rusted Keys with ETH");
  console.log("- Current price: 0.002 ETH per key");
  console.log("- Max 100 keys per transaction");
  console.log("- Keys can be sacrificed in MawSacrificeV2 for rewards");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});