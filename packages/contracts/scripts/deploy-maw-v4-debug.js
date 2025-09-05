const { ethers, upgrades } = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🔄 Upgrading MawSacrifice to V4 Debug version...");
  
  const [deployer] = await ethers.getSigners();
  console.log(`🔑 Deploying with account: ${deployer.address}`);
  
  // Current proxy address
  const PROXY_ADDRESS = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  
  // Deploy new implementation
  const MawSacrificeV4Debug = await ethers.getContractFactory("MawSacrificeV4NoTimelock");
  
  console.log("📦 Upgrading to debug version...");
  const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, MawSacrificeV4Debug);
  
  console.log(`✅ Upgraded MawSacrifice at: ${upgraded.address}`);
  
  // Test the new version function
  const version = await upgraded.version();
  console.log(`📝 Contract version: ${version}`);
  
  // Set cooldown to 0 for testing
  console.log("⚙️  Setting cooldown to 0 for testing...");
  await upgraded.setMinBlocksBetweenSacrifices(0);
  console.log("✅ Cooldown set to 0");
  
  console.log("\n🎉 Debug upgrade complete!");
  console.log("   - Per-key burning implemented");
  console.log("   - Debug events added");  
  console.log("   - Preflight checks active");
  console.log("   - Conversion guards enabled");
  console.log("   - Cooldown disabled for testing");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});