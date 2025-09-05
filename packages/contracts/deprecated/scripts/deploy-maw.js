const hre = require("hardhat");
require("dotenv").config();

// Known deployed contract addresses
const COSMETICS_ADDRESS = "0xa45358561Fc7D9C258F831a4Bf5958fe7982EF61";
const DEMONS_ADDRESS = "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF";
const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
const CULTISTS_ADDRESS = "0x2D7cD25A014429282062298d2F712FA7983154B9";

// Base Sepolia VRF Configuration
const VRF_CONFIG = {
  coordinator: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B", // Base Sepolia VRF Coordinator
  keyHash: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae", // 500 gwei Key Hash
};

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying MawSacrificeV2...");
  console.log("Deployer:", deployer.address);
  console.log("Network:", hre.network.name);

  // Deploy MawSacrificeV2 with VRF configuration
  console.log("Deploying MawSacrificeV2...");
  const MawSacrificeV2 = await hre.ethers.getContractFactory("MawSacrificeV2");
  const maw = await MawSacrificeV2.deploy(
    RELICS_ADDRESS,
    COSMETICS_ADDRESS,
    DEMONS_ADDRESS,
    CULTISTS_ADDRESS,
    VRF_CONFIG.coordinator,
    VRF_CONFIG.keyHash,
    1 // placeholder subscriptionId - will need to be updated after creating VRF subscription
  );
  
  await maw.waitForDeployment();
  const mawAddress = await maw.getAddress();
  console.log("✅ MawSacrificeV2 deployed at:", mawAddress);

  console.log("\n=== Setting Up Permissions ===");

  // Set permissions for Relics
  const relics = await hre.ethers.getContractAt("Relics", RELICS_ADDRESS);
  await (await relics.setMawSacrifice(mawAddress)).wait();
  console.log("✅ Relics: setMawSacrifice ->", mawAddress);

  // Set ritual permission for Demons
  const demons = await hre.ethers.getContractAt("Demons", DEMONS_ADDRESS);
  await (await demons.setRitual(mawAddress)).wait();
  console.log("✅ Demons: setRitual ->", mawAddress);

  // Update CosmeticsV2 to include MawSacrifice reference
  const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", COSMETICS_ADDRESS);
  await (await cosmetics.setContracts("0x7071269faa1FA8D24A5b8b03C745552B25021D90", mawAddress)).wait();
  console.log("✅ CosmeticsV2: setContracts -> (Raccoons, MawSacrifice)");

  console.log("\n🎉 MawSacrificeV2 Deployment Complete!");
  console.log("MawSacrificeV2 Address:", mawAddress);
  console.log("\n📌 Next Steps:");
  console.log("1. Create VRF subscription at vrf.chain.link");
  console.log("2. Update subscription ID in MawSacrificeV2");
  console.log("3. Deploy support contracts (RaccoonRenderer, Aggregator)");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});