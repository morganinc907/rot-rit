const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Checking rusted cap supply limits...");
  
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  
  // Check supply info for Rusted Caps (ID 0)
  const supplyInfo = await relics.getSupplyInfo(0);
  console.log(`Rusted Caps (ID 0):`);
  console.log(`  Current supply: ${supplyInfo[0]}`);
  console.log(`  Max supply: ${supplyInfo[1]} (0 = unlimited)`);
  
  if (supplyInfo[1] > 0 && supplyInfo[0] >= supplyInfo[1]) {
    console.log("❌ Rusted Caps are sold out!");
  } else {
    console.log("✅ Rusted Caps are available for minting");
  }
  
  // Also check a few other token supplies for context
  for (let i = 1; i <= 8; i++) {
    const supply = await relics.getSupplyInfo(i);
    console.log(`Token ID ${i}: ${supply[0]}/${supply[1]} (${supply[1] === 0n ? 'unlimited' : 'limited'})`);
  }
}

main().catch(console.error);