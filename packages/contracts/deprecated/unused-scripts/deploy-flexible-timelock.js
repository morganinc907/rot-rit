const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Deploying MawSacrificeV4FlexibleTimelock...");

  const [signer] = await ethers.getSigners();
  console.log(`Deploying with account: ${signer.address}`);

  // Deploy the flexible timelock implementation
  console.log("📦 Deploying flexible timelock implementation...");
  const MawSacrificeV4FlexibleTimelock = await ethers.getContractFactory("MawSacrificeV4FlexibleTimelock");
  const implementation = await MawSacrificeV4FlexibleTimelock.deploy();
  await implementation.waitForDeployment();
  
  const implementationAddress = await implementation.getAddress();
  console.log(`✅ MawSacrificeV4FlexibleTimelock deployed to: ${implementationAddress}`);

  console.log("\n🎯 DEPLOYMENT PLAN:");
  console.log("1. TODAY: Wait for RNG fix upgrade (already announced)");
  console.log("2. TOMORROW: Execute RNG fix upgrade");
  console.log("3. IMMEDIATELY AFTER: Announce this flexible timelock upgrade");  
  console.log("4. WAIT 24 HOURS: Then execute flexible upgrade");
  console.log("5. ENABLE DEV MODE: setDevelopmentMode(true)");
  console.log("6. FUTURE UPGRADES: 5 minute delays!");
  
  console.log(`\n📋 Flexible Timelock Implementation: ${implementationAddress}`);
  console.log(`⚠️  Save this address - you'll need it tomorrow!`);
  
  return {
    implementation: implementationAddress
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });