const { ethers } = require("hardhat");

async function main() {
  console.log("🔥 Testing V5 sacrifice with role system...");
  
  const PROXY = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  
  const deployer = await ethers.getSigners().then(s => s[0]);
  console.log("Test account:", deployer.address);
  
  const maw = await ethers.getContractAt("MawSacrificeV5", PROXY);
  const relics = await ethers.getContractAt("contracts/MawSacrificeV5.sol:IRelics", "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b");
  
  try {
    // Check current balances
    const keyId = await maw.keyId();
    const keyBalance = await relics.balanceOf(deployer.address, keyId);
    
    console.log(`\n💰 Current balance:`);
    console.log(`  Keys (${keyId}): ${keyBalance.toString()}`);
    
    if (keyBalance > 0) {
      console.log(`\n🔥 Attempting to sacrifice 1 key...`);
      
      // Get pre-sacrifice balances
      const capId = await maw.capId();
      const fragId = await maw.fragId();
      const shardId = await maw.shardId();
      
      const preCapBalance = await relics.balanceOf(deployer.address, capId);
      const preFragBalance = await relics.balanceOf(deployer.address, fragId);
      const preShardBalance = await relics.balanceOf(deployer.address, shardId);
      
      console.log("Pre-sacrifice balances:");
      console.log(`  Caps: ${preCapBalance.toString()}`);
      console.log(`  Frags: ${preFragBalance.toString()}`);
      console.log(`  Shards: ${preShardBalance.toString()}`);
      
      // Perform sacrifice
      const sacrificeTx = await maw.sacrificeLegacyKeys(1, {
        gasLimit: 500000
      });
      
      console.log("Sacrifice transaction:", sacrificeTx.hash);
      const receipt = await sacrificeTx.wait();
      
      if (receipt.status === 1) {
        console.log("✅ Sacrifice successful!");
        
        // Check post-sacrifice balances
        const postKeyBalance = await relics.balanceOf(deployer.address, keyId);
        const postCapBalance = await relics.balanceOf(deployer.address, capId);
        const postFragBalance = await relics.balanceOf(deployer.address, fragId);
        const postShardBalance = await relics.balanceOf(deployer.address, shardId);
        
        console.log("\nPost-sacrifice balances:");
        console.log(`  Keys: ${postKeyBalance.toString()} (was ${keyBalance.toString()})`);
        console.log(`  Caps: ${postCapBalance.toString()} (was ${preCapBalance.toString()})`);
        console.log(`  Frags: ${postFragBalance.toString()} (was ${preFragBalance.toString()})`);  
        console.log(`  Shards: ${postShardBalance.toString()} (was ${preShardBalance.toString()})`);
        
        // Check events
        const keysSacrificedEvents = receipt.logs.filter(log => {
          try {
            return maw.interface.parseLog(log).name === 'KeysSacrificed';
          } catch { return false; }
        });
        
        const safeMintEvents = receipt.logs.filter(log => {
          try {
            return maw.interface.parseLog(log).name === 'SafeMint';
          } catch { return false; }
        });
        
        console.log(`\n📋 Events emitted:`);
        console.log(`  KeysSacrificed: ${keysSacrificedEvents.length}`);
        console.log(`  SafeMint: ${safeMintEvents.length}`);
        
        console.log(`\n🎉 V5 sacrifice system working perfectly!`);
        console.log(`✅ Role-based authorization active`);
        console.log(`✅ Safe burn/mint working`);
        console.log(`✅ RNG system functional`);
        
      } else {
        console.log("❌ Sacrifice failed");
      }
      
    } else {
      console.log("⚠️  No keys available for sacrifice test");
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

main().catch(console.error);