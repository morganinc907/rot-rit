const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Debugging convertShardsToRustedCaps call...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  
  try {
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
    const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
    
    console.log("📊 Checking user state...");
    
    // Check user's glass shard balance
    const GLASS_SHARD_ID = 8;
    const shardBalance = await relics.balanceOf(USER_ADDRESS, GLASS_SHARD_ID);
    console.log(`Glass shard balance (ID ${GLASS_SHARD_ID}): ${shardBalance}`);
    
    // Check if user has approved the maw contract
    const isApproved = await relics.isApprovedForAll(USER_ADDRESS, PROXY_ADDRESS);
    console.log(`Approved for all: ${isApproved}`);
    
    // Check contract state
    const isPaused = await maw.paused();
    console.log(`Contract paused: ${isPaused}`);
    
    // Check if conversion is enabled
    try {
      const conversionEnabled = await maw.conversionEnabled();
      console.log(`Conversion enabled: ${conversionEnabled}`);
    } catch (e) {
      console.log("No conversionEnabled function");
    }
    
    // Check MAW authorization on Relics contract
    const mawRole = await relics.MAW_ROLE();
    const hasMawRole = await relics.hasRole(mawRole, PROXY_ADDRESS);
    console.log(`MAW contract has MAW_ROLE: ${hasMawRole}`);
    
    // Check conversion rate
    const shardsPerCap = await maw.GLASS_SHARDS_PER_RUSTED_CAP();
    console.log(`Glass shards per rusted cap: ${shardsPerCap}`);
    
    // Try to simulate the call
    console.log("\n🧪 Simulating conversion call...");
    try {
      // Use staticCall to simulate without actually executing
      const result = await maw.convertShardsToRustedCaps.staticCall(1);
      console.log("✅ Static call succeeded:", result);
    } catch (error) {
      console.log("❌ Static call failed:");
      console.log("Error message:", error.message);
      console.log("Error reason:", error.reason);
      console.log("Error code:", error.code);
      
      // Try to decode the error
      if (error.data) {
        console.log("Error data:", error.data);
      }
    }
    
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

main().catch(console.error);