const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🧪 Testing conversion directly...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const RELICS_ADDRESS = addresses.baseSepolia.Relics;
  const GLASS_SHARD_ID = 6;
  const RUSTED_KEY_ID = 1;
  
  const [signer] = await ethers.getSigners();
  
  try {
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
    const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
    
    console.log("📊 Pre-conversion state:");
    const beforeShards = await relics.balanceOf(signer.address, GLASS_SHARD_ID);
    const beforeCaps = await relics.balanceOf(signer.address, RUSTED_KEY_ID);
    console.log(`- Glass Shards: ${beforeShards}`);
    console.log(`- Rusted Caps: ${beforeCaps}`);
    
    // Make sure we have enough shards
    if (beforeShards < 10) {
      console.log("🎁 Minting glass shards for testing...");
      const mintTx = await relics.mint(signer.address, GLASS_SHARD_ID, 15, "0x");
      await mintTx.wait();
      console.log("✅ Minted 15 glass shards");
      
      const newBalance = await relics.balanceOf(signer.address, GLASS_SHARD_ID);
      console.log(`- New balance: ${newBalance}`);
    }
    
    console.log("\n🔄 Attempting conversion...");
    try {
      const convertTx = await maw.convertShardsToRustedCaps(10);
      const receipt = await convertTx.wait();
      
      console.log("✅ Conversion successful!");
      console.log("Transaction hash:", receipt.hash);
      
      // Check final balances
      const afterShards = await relics.balanceOf(signer.address, GLASS_SHARD_ID);
      const afterCaps = await relics.balanceOf(signer.address, RUSTED_KEY_ID);
      console.log(`- Glass Shards after: ${afterShards} (was ${beforeShards})`);
      console.log(`- Rusted Caps after: ${afterCaps} (was ${beforeCaps})`);
      
    } catch (error) {
      console.log("❌ Conversion failed:");
      console.log("Error message:", error.message);
      
      // Check if it's a revert with data
      if (error.data) {
        console.log("Error data:", error.data);
        
        try {
          // Try to decode with the contract interface
          const decoded = maw.interface.parseError(error.data);
          console.log("Decoded error:", decoded);
        } catch (e) {
          console.log("Could not decode error");
        }
      }
      
      // Additional debugging
      console.log("\n🔍 Additional checks:");
      const isPaused = await maw.paused();
      const conversionsPaused = await maw.conversionsPaused();
      console.log(`- Contract paused: ${isPaused}`);
      console.log(`- Conversions paused: ${conversionsPaused}`);
      
      const isApproved = await relics.isApprovedForAll(signer.address, PROXY_ADDRESS);
      console.log(`- Approved: ${isApproved}`);
      
      const currentShards = await relics.balanceOf(signer.address, GLASS_SHARD_ID);
      console.log(`- Current shards: ${currentShards}`);
    }
    
  } catch (error) {
    console.error("Script error:", error.message);
  }
}

main().catch(console.error);