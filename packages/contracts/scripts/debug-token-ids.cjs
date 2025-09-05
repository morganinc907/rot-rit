const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔍 Debugging token IDs and permissions...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const RELICS_ADDRESS = addresses.baseSepolia.Relics;
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
  const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
  
  // Check what token IDs the MAW contract thinks it should use
  const glassShardId = await maw.GLASS_SHARD();
  const rustedCapId = await maw.RUSTED_CAP();
  console.log("MAW contract thinks:");
  console.log("  GLASS_SHARD ID:", glassShardId.toString());
  console.log("  RUSTED_CAP ID:", rustedCapId.toString());
  
  // Check user balances for these IDs
  const userGlassShards = await relics.balanceOf(USER_ADDRESS, glassShardId);
  const userRustedCaps = await relics.balanceOf(USER_ADDRESS, rustedCapId);
  console.log("\nUser balances:");
  console.log(`  Glass Shards (ID ${glassShardId}): ${userGlassShards}`);
  console.log(`  Rusted Caps (ID ${rustedCapId}): ${userRustedCaps}`);
  
  // Check MAW permissions
  console.log("\n🔍 Checking MAW permissions...");
  try {
    const mawRole = await relics.MAW_ROLE();
    const hasMawRole = await relics.hasRole(mawRole, PROXY_ADDRESS);
    console.log("MAW_ROLE hash:", mawRole);
    console.log("MAW contract has MAW_ROLE:", hasMawRole);
  } catch (error) {
    console.log("❌ Error checking MAW role:", error.message);
  }
  
  // Test if MAW can mint rusted caps
  console.log("\n🧪 Testing MAW mint capability...");
  try {
    // We need to simulate this call from the MAW contract's perspective
    const provider = ethers.provider;
    const callData = relics.interface.encodeFunctionData("mint", [
      USER_ADDRESS,
      rustedCapId,
      1,
      "0x"
    ]);
    
    const result = await provider.call({
      to: RELICS_ADDRESS,
      data: callData,
      from: PROXY_ADDRESS
    });
    
    console.log("✅ MAW contract can mint rusted caps");
  } catch (error) {
    console.log("❌ MAW contract cannot mint rusted caps:", error.message);
  }
  
  // Test canMintCaps
  console.log("\n🧪 Testing canMintCaps...");
  const canMint = await maw.canMintCaps(1);
  console.log("canMintCaps(1):", canMint);
}

main().catch(console.error);