const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Checking RUSTED_CAP supply limits...");
  
  try {
    const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
    
    const RUSTED_CAP_ID = 0;
    const GLASS_SHARD_ID = 6;
    
    // Check rusted cap supply
    console.log("📊 RUSTED_CAP (ID 0) supply info:");
    const rustedCapSupply = await relics.totalSupply(RUSTED_CAP_ID);
    const rustedCapMaxSupply = await relics.maxSupply(RUSTED_CAP_ID);
    
    console.log(`- Current supply: ${rustedCapSupply}`);
    console.log(`- Max supply: ${rustedCapMaxSupply}`);
    
    if (rustedCapMaxSupply > 0) {
      const remaining = rustedCapMaxSupply - rustedCapSupply;
      console.log(`- Remaining supply: ${remaining}`);
      
      if (remaining < 1) {
        console.log("🚨 RUSTED_CAP is at max supply!");
        console.log("This is why conversion is failing - can't mint more rusted caps");
      }
    } else {
      console.log("✅ RUSTED_CAP has unlimited supply");
    }
    
    // Check all token supplies
    console.log("\n📋 All token supplies:");
    for (let id = 0; id < 10; id++) {
      try {
        const supply = await relics.totalSupply(id);
        const maxSupply = await relics.maxSupply(id);
        const name = id === 0 ? "RUSTED_CAP" : 
                     id === 1 ? "CULTIST_SOUL" :
                     id === 2 ? "LANTERN_FRAGMENT" :
                     id === 3 ? "WORM_EATEN_MASK" :
                     id === 4 ? "BONE_DAGGER" :
                     id === 5 ? "ASH_VIAL" :
                     id === 6 ? "GLASS_SHARD" : `TOKEN_${id}`;
        
        const remaining = maxSupply > 0 ? maxSupply - supply : "∞";
        console.log(`${name} (ID ${id}): ${supply}/${maxSupply > 0 ? maxSupply : '∞'} (${remaining} remaining)`);
        
      } catch (e) {
        // Token might not exist
      }
    }
    
  } catch (error) {
    console.error("❌ Check failed:", error.message);
  }
}

main().catch(console.error);