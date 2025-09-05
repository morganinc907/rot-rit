const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Debugging convertShardsToRustedCaps function...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const RELICS_ADDRESS = addresses.baseSepolia.Relics;
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f";
  const GLASS_SHARD_ID = 6;
  const RUSTED_KEY_ID = 1;
  
  try {
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
    const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
    
    console.log("📊 Checking user balances:");
    const shardBalance = await relics.balanceOf(USER_ADDRESS, GLASS_SHARD_ID);
    const keyBalance = await relics.balanceOf(USER_ADDRESS, RUSTED_KEY_ID);
    console.log(`- Glass Shards: ${shardBalance}`);
    console.log(`- Rusted Caps: ${keyBalance}`);
    
    if (shardBalance < 10) {
      console.log("❌ User doesn't have enough glass shards (need 10, has " + shardBalance + ")");
      return;
    }
    
    console.log("\n🔐 Checking contract state:");
    
    // Check if conversion is paused
    try {
      const isPaused = await maw.paused();
      console.log(`- Contract paused: ${isPaused}`);
    } catch (e) {
      console.log("- Contract paused: unknown (method might not exist)");
    }
    
    // Check conversion rate
    try {
      const conversionRate = await maw.shardToKeyConversionRate();
      console.log(`- Conversion rate: ${conversionRate} shards per key`);
    } catch (e) {
      console.log("- Conversion rate: method not found");
    }
    
    // Check if function exists and is callable
    console.log("\n🧪 Testing function call simulation:");
    try {
      // Simulate the call from the user's address
      await ethers.provider.call({
        from: USER_ADDRESS,
        to: PROXY_ADDRESS,
        data: maw.interface.encodeFunctionData("convertShardsToRustedCaps", [10])
      });
      console.log("✅ Simulation successful - should work");
    } catch (error) {
      console.log("❌ Simulation failed:");
      console.log("Error message:", error.message);
      
      // Try to decode the error
      if (error.data) {
        try {
          const decoded = maw.interface.parseError(error.data);
          console.log("Decoded error:", decoded);
        } catch (e) {
          console.log("Raw error data:", error.data);
        }
      }
    }
    
    // Check approvals
    console.log("\n🔗 Checking approvals:");
    const isApproved = await relics.isApprovedForAll(USER_ADDRESS, PROXY_ADDRESS);
    console.log(`- Is approved for all: ${isApproved}`);
    
    if (!isApproved) {
      const allowance = await relics.balanceOf(USER_ADDRESS, GLASS_SHARD_ID);
      console.log("❌ User hasn't approved the contract to spend their glass shards");
      console.log("Need to call setApprovalForAll first");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);