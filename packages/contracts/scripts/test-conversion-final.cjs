const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🎯 Final conversion test...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  
  const [signer] = await ethers.getSigners();
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  
  // Check balances before
  const shardsBefore = await relics.balanceOf(USER_ADDRESS, 6);
  const capsBefore = await relics.balanceOf(USER_ADDRESS, 0);
  console.log(`Before: ${shardsBefore} shards, ${capsBefore} caps`);
  
  if (shardsBefore < 5) {
    console.log("❌ Need 5 shards for conversion");
    return;
  }
  
  // Try the conversion
  console.log("\n🚀 Attempting conversion of 5 shards to 1 cap...");
  try {
    const tx = await maw.convertShardsToRustedCaps(5, {
      gasLimit: 500000
    });
    console.log("Transaction:", tx.hash);
    
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      console.log("🎉 CONVERSION SUCCESSFUL!");
      console.log("Gas used:", receipt.gasUsed.toString());
      
      // Check new balances
      const shardsAfter = await relics.balanceOf(USER_ADDRESS, 6);
      const capsAfter = await relics.balanceOf(USER_ADDRESS, 0);
      console.log(`After: ${shardsAfter} shards, ${capsAfter} caps`);
      
      console.log("✅ Glass shard to rusted cap conversion is now working!");
      
    } else {
      console.log("❌ Transaction failed (status 0)");
    }
    
  } catch (error) {
    console.log("❌ Conversion failed:", error.message);
    if (error.data) {
      console.log("Error data:", error.data);
    }
  }
}

main().catch(console.error);