const hre = require("hardhat");
require("dotenv").config();

const RACCOONS_ADDRESS = "0x7071269faa1FA8D24A5b8b03C745552B25021D90";
const COSMETICS_ADDRESS = "0xa45358561Fc7D9C258F831a4Bf5958fe7982EF61";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying RaccoonRenderer...");

  // Deploy RaccoonRenderer
  const RaccoonRenderer = await hre.ethers.getContractFactory("RaccoonRenderer");
  const renderer = await RaccoonRenderer.deploy(COSMETICS_ADDRESS, RACCOONS_ADDRESS);
  await renderer.waitForDeployment();
  const rendererAddress = await renderer.getAddress();
  console.log("✅ RaccoonRenderer deployed at:", rendererAddress);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});