const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔄 Converting glass shards to rusted caps...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  
  // Check current balances
  const glassShards = await relics.balanceOf(USER_ADDRESS, 6);
  const rustedCaps = await relics.balanceOf(USER_ADDRESS, 0);
  
  console.log("Current balances:");
  console.log(`  Glass shards (ID 6): ${glassShards}`);
  console.log(`  Rusted caps (ID 0): ${rustedCaps}`);
  
  if (glassShards >= 5) {
    console.log("\n🚀 Converting 5 glass shards to 1 rusted cap...");
    
    try {
      const tx = await maw.convertShardsToRustedCaps(5, {
        gasLimit: 500000
      });
      
      console.log("Conversion transaction:", tx.hash);
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log("✅ Conversion successful!");
        console.log("Gas used:", receipt.gasUsed.toString());
        
        // Check new balances
        const newShards = await relics.balanceOf(USER_ADDRESS, 6);
        const newCaps = await relics.balanceOf(USER_ADDRESS, 0);
        
        console.log("\nNew balances:");
        console.log(`  Glass shards (ID 6): ${newShards} (was ${glassShards})`);
        console.log(`  Rusted caps (ID 0): ${newCaps} (was ${rustedCaps})`);
        
        console.log("\n🎯 Now you can use sacrificeKeys!");
        
      } else {
        console.log("❌ Conversion failed");
      }
      
    } catch (error) {
      console.log("❌ Conversion error:", error.message);
    }
    
  } else {
    console.log(`\n❌ Need at least 5 glass shards to convert. You have ${glassShards}`);
    console.log("💡 You have 3 Rusted Keys (ID 1) from KeyShop - that's different from Rusted Caps (ID 0)");
    console.log("💡 KeyShop = Rusted Keys, sacrificeKeys = needs Rusted Caps");
  }
}

main().catch(console.error);