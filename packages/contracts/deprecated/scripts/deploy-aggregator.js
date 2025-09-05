const hre = require("hardhat");
require("dotenv").config();

const RACCOONS_ADDRESS = "0x7071269faa1FA8D24A5b8b03C745552B25021D90";
const COSMETICS_ADDRESS = "0xa45358561Fc7D9C258F831a4Bf5958fe7982EF61";
const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying RitualReadAggregator...");

  // Deploy RitualReadAggregator
  const RitualReadAggregator = await hre.ethers.getContractFactory("RitualReadAggregator");
  const aggregator = await RitualReadAggregator.deploy(
    COSMETICS_ADDRESS,
    RACCOONS_ADDRESS,
    RELICS_ADDRESS
  );
  await aggregator.waitForDeployment();
  const aggregatorAddress = await aggregator.getAddress();
  console.log("✅ RitualReadAggregator deployed at:", aggregatorAddress);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});