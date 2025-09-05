const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking all upgrade announcements...");

  const proxyAddress = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  const proxy = await ethers.getContractAt("MawSacrificeV4Upgradeable", proxyAddress);
  
  const currentTime = Math.floor(Date.now() / 1000);
  console.log(`Current time: ${currentTime} (${new Date().toISOString()})`);
  console.log(`Proxy address: ${proxyAddress}`);
  
  // Check current implementation
  try {
    const currentImpl = await proxy.implementation();
    console.log(`Current implementation: ${currentImpl}`);
  } catch (e) {
    console.log("Could not get current implementation via implementation() call");
  }
  
  // Check upgrade delay constant
  try {
    const upgradeDelay = await proxy.UPGRADE_DELAY();
    console.log(`Upgrade delay: ${upgradeDelay} seconds (${upgradeDelay / 3600} hours)`);
  } catch (e) {
    console.log("Could not get upgrade delay");
  }
  
  // Look for all upgrade announcement events with wider block range
  try {
    console.log("\n🔍 Searching for upgrade announcements...");
    const filter = proxy.filters.UpgradeAnnounced();
    const events = await proxy.queryFilter(filter, -5000); // Last 5000 blocks (~24 hours)
    
    console.log(`Found ${events.length} upgrade announcement events:`);
    
    if (events.length === 0) {
      console.log("❌ No upgrade announcements found!");
      console.log("💡 The RNG fix upgrade may not have been announced yet.");
      console.log("\n🚀 To announce the RNG fix upgrade, run:");
      console.log("PRIVATE_KEY=xxx npx hardhat run scripts/announce-rng-upgrade.js --network baseSepolia");
      return;
    }
    
    for (const event of events) {
      console.log(`\n📢 Upgrade announced:`);
      console.log(`  Block: ${event.blockNumber}`);
      console.log(`  ID: ${event.args.id}`);
      console.log(`  Implementation: ${event.args.newImplementation}`);
      console.log(`  Execute time: ${event.args.executeTime} (${new Date(Number(event.args.executeTime) * 1000).toISOString()})`);
      
      const timeRemaining = Number(event.args.executeTime) - currentTime;
      
      if (timeRemaining <= 0) {
        console.log(`  ✅ READY TO EXECUTE! (${Math.abs(timeRemaining)} seconds ago)`);
      } else {
        const hours = Math.floor(timeRemaining / 3600);
        const minutes = Math.floor((timeRemaining % 3600) / 60);
        const seconds = timeRemaining % 60;
        console.log(`  ⏳ Time remaining: ${hours}h ${minutes}m ${seconds}s`);
      }
    }
    
  } catch (error) {
    console.error(`Error querying events: ${error.message}`);
  }
  
  // List available implementations we could upgrade to
  console.log("\n📦 Available implementations:");
  console.log("- RNG Fix (Dev): 0xE9F133387d1bA847Cf25c391f01D5CFE6D151083");
  // Add others if we know them
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });