const { ethers } = require("hardhat");

async function main() {
  console.log("⏰ Checking upgrade timelock status...");

  const proxyAddress = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  const proxy = await ethers.getContractAt("MawSacrificeV4Upgradeable", proxyAddress);
  
  const currentTime = Math.floor(Date.now() / 1000);
  console.log(`Current time: ${currentTime} (${new Date().toISOString()})`);
  
  // Get the RNG fix implementation address that we deployed earlier
  const rngFixAddress = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083"; // From yesterday's deployment
  
  // Calculate upgrade ID - this is how we announced it
  // The upgrade ID is keccak256(abi.encodePacked(implementation, timestamp))
  // We need to find the right timestamp from when it was announced
  
  console.log(`Looking for upgrade to: ${rngFixAddress}`);
  
  // Try to get recent events to find the announcement
  try {
    const filter = proxy.filters.UpgradeAnnounced();
    const events = await proxy.queryFilter(filter, -1000); // Last 1000 blocks
    
    console.log(`Found ${events.length} upgrade announcement events:`);
    
    for (const event of events) {
      console.log(`\nUpgrade announced:`);
      console.log(`  ID: ${event.args.id}`);
      console.log(`  Implementation: ${event.args.newImplementation}`);
      console.log(`  Execute time: ${event.args.executeTime} (${new Date(Number(event.args.executeTime) * 1000).toISOString()})`);
      
      const timeRemaining = Number(event.args.executeTime) - currentTime;
      
      if (event.args.newImplementation.toLowerCase() === rngFixAddress.toLowerCase()) {
        console.log(`  🎯 THIS IS OUR RNG FIX UPGRADE!`);
        
        if (timeRemaining <= 0) {
          console.log(`  ✅ READY TO EXECUTE! (${Math.abs(timeRemaining)} seconds ago)`);
          console.log(`  \n🚀 Run this command to execute:`);
          console.log(`  PRIVATE_KEY=xxx npx hardhat run scripts/execute-upgrade.js --network baseSepolia`);
        } else {
          const hours = Math.floor(timeRemaining / 3600);
          const minutes = Math.floor((timeRemaining % 3600) / 60);
          const seconds = timeRemaining % 60;
          console.log(`  ⏳ Time remaining: ${hours}h ${minutes}m ${seconds}s`);
          console.log(`  📅 Ready at: ${new Date(Number(event.args.executeTime) * 1000).toLocaleString()}`);
        }
      }
    }
    
  } catch (error) {
    console.log(`Could not query events: ${error.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });