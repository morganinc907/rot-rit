/**
 * Check user's current inventory
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('📦 Checking user inventory...\n');
  
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  
  const itemNames = {
    1: "Rusted Keys",
    2: "Lantern Fragments", 
    3: "Worm-Eaten Masks",
    4: "Demonic Daggers",
    5: "Blood Vials",
    6: "Binding Contracts",
    7: "Soul Deeds", 
    8: "Glass Shards"
  };
  
  try {
    const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
    
    console.log('👤 User:', USER_ADDRESS);
    console.log('📊 Current inventory:');
    
    for (let id = 1; id <= 8; id++) {
      try {
        const balance = await relics.balanceOf(USER_ADDRESS, id);
        const name = itemNames[id] || `Item ${id}`;
        console.log(`   ${name}: ${balance.toString()}`);
      } catch (e) {
        console.log(`   Item ${id}: Error checking balance`);
      }
    }
    
  } catch (error) {
    console.error('❌ Inventory check failed:', error.message);
  }
}

main().catch(console.error);