const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔧 Removing all supply limits...");
  
  try {
    const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
    
    console.log("📊 Current supplies before fix:");
    for (let id = 0; id < 10; id++) {
      try {
        const supply = await relics.totalSupply(id);
        const maxSupply = await relics.maxSupply(id);
        
        if (maxSupply > 0) {
          const name = id === 0 ? "RUSTED_CAP" : 
                       id === 1 ? "CULTIST_SOUL" :
                       id === 2 ? "LANTERN_FRAGMENT" :
                       id === 3 ? "WORM_EATEN_MASK" :
                       id === 4 ? "BONE_DAGGER" :
                       id === 5 ? "ASH_VIAL" :
                       id === 6 ? "GLASS_SHARD" : `TOKEN_${id}`;
          
          console.log(`${name} (ID ${id}): ${supply}/${maxSupply} - NEEDS FIXING`);
        }
      } catch (e) {
        // Token might not exist
      }
    }
    
    console.log("\n🔧 Setting unlimited supply for all tokens...");
    
    // Set unlimited supply for all tokens that have limits
    for (let id = 0; id < 10; id++) {
      try {
        const maxSupply = await relics.maxSupply(id);
        
        if (maxSupply > 0) {
          console.log(`Setting unlimited supply for token ID ${id}...`);
          const tx = await relics.setMaxSupply(id, 0); // 0 = unlimited
          await tx.wait();
          console.log(`✅ Token ID ${id} set to unlimited supply`);
        }
      } catch (e) {
        console.log(`❌ Failed to update token ID ${id}:`, e.message);
      }
    }
    
    console.log("\n📊 Supplies after fix:");
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
        
        console.log(`${name} (ID ${id}): ${supply}/${maxSupply > 0 ? maxSupply : '∞'}`);
        
      } catch (e) {
        // Token might not exist
      }
    }
    
    console.log("\n✅ All supply limits removed!");
    
  } catch (error) {
    console.error("❌ Fix failed:", error.message);
  }
}

main().catch(console.error);