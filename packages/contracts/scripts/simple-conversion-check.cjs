const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Quick conversion check...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  
  // Check what the contract thinks the glass shard ID is
  const contractGlassShardId = await maw.GLASS_SHARD();
  console.log(`Contract thinks glass shard ID is: ${contractGlassShardId}`);
  
  // Check user balance for both IDs
  const balanceId6 = await relics.balanceOf(USER_ADDRESS, 6);
  const balanceId8 = await relics.balanceOf(USER_ADDRESS, 8);
  console.log(`User balance at ID 6: ${balanceId6}`);
  console.log(`User balance at ID 8: ${balanceId8}`);
  
  // Check if conversions are paused
  const conversionsPaused = await maw.conversionsPaused();
  console.log(`Conversions paused: ${conversionsPaused}`);
  
  // Try with correct amount (5 shards)
  try {
    await maw.convertShardsToRustedCaps.staticCall(5, { from: USER_ADDRESS });
    console.log("✅ Converting 5 shards would succeed");
  } catch (error) {
    console.log("❌ Converting 5 shards failed:", error.data);
  }
}

main().catch(console.error);