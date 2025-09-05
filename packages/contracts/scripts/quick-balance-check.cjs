const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Quick balance check...");
  
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  
  console.log("User:", USER_ADDRESS);
  console.log("Relics contract:", addresses.baseSepolia.Relics);
  
  // Check rusted caps (ID 0)
  const rustedCaps = await relics.balanceOf(USER_ADDRESS, 0);
  console.log(`\n📦 Rusted caps (ID 0): ${rustedCaps}`);
  
  // Check glass shards (ID 6) 
  const glassShards = await relics.balanceOf(USER_ADDRESS, 6);
  console.log(`📦 Glass shards (ID 6): ${glassShards}`);
  
  // Check all other relics
  console.log("\n🏆 Other relics:");
  for (let i = 1; i <= 8; i++) {
    if (i === 6) continue; // Already showed glass shards
    const balance = await relics.balanceOf(USER_ADDRESS, i);
    if (balance > 0) {
      console.log(`  Relic ID ${i}: ${balance}`);
    }
  }
  
  // Check recent transactions to see if purchases went through
  console.log("\n📜 Recent transaction check:");
  const currentBlock = await ethers.provider.getBlockNumber();
  const fromBlock = currentBlock - 100; // Last 100 blocks
  
  try {
    const transferEvents = await relics.queryFilter(
      relics.filters.TransferSingle(null, null, USER_ADDRESS),
      fromBlock,
      currentBlock
    );
    
    console.log(`Found ${transferEvents.length} recent transfers TO user:`);
    for (const event of transferEvents.slice(-5)) { // Last 5 events
      console.log(`  Block ${event.blockNumber}: ${event.args.value} of token ID ${event.args.id}`);
    }
  } catch (error) {
    console.log("Could not fetch recent events");
  }
}

main().catch(console.error);