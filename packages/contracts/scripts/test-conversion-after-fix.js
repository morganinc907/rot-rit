const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🧪 Testing conversion after supply limit fix...");
  
  try {
    const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", addresses.baseSepolia.MawSacrifice);
    
    // Double-check TOKEN_7 supply
    const token7MaxSupply = await relics.maxSupply(7);
    console.log(`TOKEN_7 max supply: ${token7MaxSupply} (should be 0 for unlimited)`);
    
    if (token7MaxSupply > 0) {
      console.log("⚠️  TOKEN_7 still has supply limit, fixing...");
      const tx = await relics.setMaxSupply(7, 0);
      await tx.wait();
      console.log("✅ TOKEN_7 fixed");
    }
    
    // Test the conversion function
    console.log("\n🧪 Testing convertShardsToRustedCaps...");
    
    const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
    const GLASS_SHARD_ID = 6;
    
    // Check user balance first
    const shardBalance = await relics.balanceOf(USER_ADDRESS, GLASS_SHARD_ID);
    console.log(`User glass shard balance: ${shardBalance}`);
    
    if (shardBalance >= 5) {
      try {
        const result = await maw.convertShardsToRustedCaps.staticCall(5);
        console.log("✅ Conversion simulation succeeded!");
        
        // If simulation worked, the actual call should work too
        console.log("🎉 convertShardsToRustedCaps should now work in the frontend!");
        
      } catch (error) {
        console.log("❌ Conversion still failed:");
        console.log("- Message:", error.message);
        console.log("- Data:", error.data);
        
        if (error.data === "0x8a164f63") {
          console.log("🤔 Still getting MaxSupplyExceeded - there might be another token with limits");
        }
      }
    } else {
      console.log("⚠️  User doesn't have enough glass shards for testing");
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

main().catch(console.error);