const { ethers } = require("hardhat");

async function main() {
  console.log("⏰ Setting timelock delay to 0...");

  const [signer] = await ethers.getSigners();
  
  // Main proxy contract address
  const proxyAddress = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  
  console.log(`Proxy Contract: ${proxyAddress}`);
  console.log(`User: ${signer.address}`);
  
  // Get the proxy contract
  const proxy = await ethers.getContractAt("MawSacrificeV4Upgradeable", proxyAddress);
  
  // Check current upgrade delay
  try {
    const currentDelay = await proxy.UPGRADE_DELAY();
    console.log(`Current upgrade delay: ${currentDelay} seconds`);
  } catch (e) {
    console.log("Could not check current delay");
  }
  
  // Try to set the delay to 0
  try {
    console.log("📞 Setting upgrade delay to 0...");
    const tx = await proxy.setUpgradeDelay(0);
    console.log(`Transaction: ${tx.hash}`);
    await tx.wait();
    console.log("✅ Upgrade delay set to 0!");
    
    // Verify
    const newDelay = await proxy.UPGRADE_DELAY();
    console.log(`New upgrade delay: ${newDelay} seconds`);
    
  } catch (error) {
    console.error(`❌ Failed to set delay: ${error.message}`);
    
    // Check if there's a different function name
    console.log("🔍 Trying alternative function names...");
    try {
      const tx2 = await proxy.setUpgradeDelay(0);
      console.log("setUpgradeDelay worked");
    } catch (e2) {
      console.log("setUpgradeDelay not available");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });