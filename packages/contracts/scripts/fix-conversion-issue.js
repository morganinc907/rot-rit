const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔧 Checking and fixing conversion issue...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const RELICS_ADDRESS = addresses.baseSepolia.Relics;
  const GLASS_SHARD_ID = 6;
  const RUSTED_KEY_ID = 1;
  const [signer] = await ethers.getSigners();
  
  // Use the signer address (our deployer address as proxy for the user)
  const USER_ADDRESS = signer.address;
  
  try {
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
    const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
    
    console.log("📊 Checking user balances for:", USER_ADDRESS);
    const shardBalance = await relics.balanceOf(USER_ADDRESS, GLASS_SHARD_ID);
    const keyBalance = await relics.balanceOf(USER_ADDRESS, RUSTED_KEY_ID);
    console.log(`- Glass Shards: ${shardBalance}`);
    console.log(`- Rusted Caps: ${keyBalance}`);
    
    if (shardBalance < 10n) {
      console.log("❌ Not enough glass shards! Need at least 10, have " + shardBalance.toString());
      
      // Let's mint some glass shards for testing
      console.log("🎁 Minting some glass shards for testing...");
      try {
        const mintTx = await relics.mint(USER_ADDRESS, GLASS_SHARD_ID, 20, "0x");
        await mintTx.wait();
        console.log("✅ Minted 20 glass shards");
        
        const newBalance = await relics.balanceOf(USER_ADDRESS, GLASS_SHARD_ID);
        console.log(`- New glass shard balance: ${newBalance}`);
      } catch (e) {
        console.log("❌ Cannot mint glass shards:", e.message);
      }
    }
    
    console.log("\n🔗 Checking approvals:");
    const isApproved = await relics.isApprovedForAll(USER_ADDRESS, PROXY_ADDRESS);
    console.log(`- Is approved for all: ${isApproved}`);
    
    if (!isApproved) {
      console.log("🔧 Setting approval for MawSacrifice contract...");
      try {
        const approveTx = await relics.setApprovalForAll(PROXY_ADDRESS, true);
        await approveTx.wait();
        console.log("✅ Approval set successfully");
      } catch (e) {
        console.log("❌ Cannot set approval:", e.message);
      }
    }
    
    // Final check - try the conversion
    console.log("\n🧪 Testing conversion with current state:");
    const finalShardBalance = await relics.balanceOf(USER_ADDRESS, GLASS_SHARD_ID);
    const finalApproval = await relics.isApprovedForAll(USER_ADDRESS, PROXY_ADDRESS);
    
    console.log(`- Final shard balance: ${finalShardBalance}`);
    console.log(`- Final approval status: ${finalApproval}`);
    
    if (finalShardBalance >= 10n && finalApproval) {
      console.log("✅ Should be able to convert 10 shards to 2 rusted caps now");
      
      // Try the conversion
      try {
        console.log("🔄 Attempting conversion...");
        const convertTx = await maw.convertShardsToRustedCaps(10);
        await convertTx.wait();
        console.log("✅ Conversion successful!");
        
        const newKeyBalance = await relics.balanceOf(USER_ADDRESS, RUSTED_KEY_ID);
        console.log(`- New rusted caps balance: ${newKeyBalance}`);
      } catch (e) {
        console.log("❌ Conversion still failed:", e.message);
      }
    } else {
      console.log("❌ Still missing requirements for conversion");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main().catch(console.error);