const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Initializing V5 configuration...");
  
  const PROXY = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  console.log("Proxy:", PROXY);
  
  const v5 = await ethers.getContractAt("MawSacrificeV5", PROXY);
  
  // Check current state
  console.log("\n📊 Current configuration:");
  try {
    const capId = await v5.capId();
    const keyId = await v5.keyId(); 
    const fragId = await v5.fragId();
    const shardId = await v5.shardId();
    
    console.log(`  Cap ID: ${capId}`);
    console.log(`  Key ID: ${keyId}`);
    console.log(`  Frag ID: ${fragId}`);
    console.log(`  Shard ID: ${shardId}`);
    
    if (capId.toString() === "0" && keyId.toString() === "0") {
      console.log("\n🚀 Initializing V5 with correct token IDs...");
      
      const initTx = await v5.initializeV5(0, 1, 2, 6, {
        gasLimit: 300000
      });
      
      console.log("Initialize transaction:", initTx.hash);
      const receipt = await initTx.wait();
      
      if (receipt.status === 1) {
        console.log("✅ Initialization successful!");
        
        // Verify new configuration
        const newCapId = await v5.capId();
        const newKeyId = await v5.keyId(); 
        const newFragId = await v5.fragId();
        const newShardId = await v5.shardId();
        
        console.log("\n🎯 New configuration:");
        console.log(`  Cap ID: ${newCapId} (${await v5.idLabel(newCapId)})`);
        console.log(`  Key ID: ${newKeyId} (${await v5.idLabel(newKeyId)})`);
        console.log(`  Frag ID: ${newFragId} (${await v5.idLabel(newFragId)})`);
        console.log(`  Shard ID: ${newShardId} (${await v5.idLabel(newShardId)})`);
        
      } else {
        console.log("❌ Initialization failed");
      }
      
    } else {
      console.log("✅ V5 already initialized!");
    }
    
  } catch (error) {
    if (error.message.includes("already initialized")) {
      console.log("✅ V5 already initialized - using updateConfig instead");
      
      const updateTx = await v5.updateConfig(0, 1, 2, 6, {
        gasLimit: 300000
      });
      
      console.log("Update transaction:", updateTx.hash);
      const receipt = await updateTx.wait();
      
      if (receipt.status === 1) {
        console.log("✅ Configuration updated successfully!");
      }
      
    } else {
      console.log("❌ Error:", error.message);
    }
  }
}

main().catch(console.error);