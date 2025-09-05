const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Deploying MawSacrificeV4Flexible...");

  const [signer] = await ethers.getSigners();
  console.log(`Deploying with account: ${signer.address}`);

  // Deploy the flexible implementation
  console.log("📦 Deploying implementation...");
  const MawSacrificeV4Flexible = await ethers.getContractFactory("MawSacrificeV4Flexible");
  const implementation = await MawSacrificeV4Flexible.deploy();
  await implementation.waitForDeployment();
  
  const implementationAddress = await implementation.getAddress();
  console.log(`✅ MawSacrificeV4Flexible deployed to: ${implementationAddress}`);

  // Get the current proxy to announce the next upgrade
  const proxyAddress = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  const proxy = await ethers.getContractAt("MawSacrificeV4Upgradeable", proxyAddress);
  
  console.log("🚀 Announcing flexible upgrade for AFTER RNG fix...");
  
  // Announce this as the NEXT upgrade (to be executed after RNG fix tomorrow)
  const tx = await proxy.announceUpgrade(implementationAddress);
  console.log(`📢 Flexible upgrade announced: ${tx.hash}`);
  await tx.wait();
  
  // Calculate upgrade ID for reference
  const upgradeId = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'uint256'],
      [implementationAddress, (await ethers.provider.getBlock('latest')).timestamp]
    )
  );
  
  console.log(`📋 Flexible upgrade ID: ${upgradeId}`);
  console.log(`⏰ Can execute after: ${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()}`);
  
  console.log("\n🎯 PLAN:");
  console.log("1. Tomorrow: Execute RNG fix upgrade");
  console.log("2. Immediately after: Execute flexible upgrade");  
  console.log("3. Enable dev mode: setDevelopmentMode(true)");
  console.log("4. Future upgrades: 5 minute delays!");
  
  return {
    implementation: implementationAddress,
    upgradeId,
    proxyAddress
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });