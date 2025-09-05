const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔄 Simple V5 upgrade (upgrade first, initialize after)...");
  
  const PROXY = addresses.baseSepolia.MawSacrifice;
  const IMPL = "0x5FFe133461c89D3432dBc662787D1a18922B376E"; // From previous deployment
  
  console.log("Proxy:", PROXY);
  console.log("Implementation:", IMPL);
  
  // Step 1: Just upgrade (no initialization)
  console.log("\n🚀 Step 1: Upgrading to V5 implementation...");
  const proxy = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY);
  
  try {
    const upgradeTx = await proxy.upgradeTo(IMPL, {
      gasLimit: 500000
    });
    
    console.log("Upgrade transaction:", upgradeTx.hash);
    const receipt = await upgradeTx.wait();
    
    if (receipt.status === 1) {
      console.log("✅ Upgrade successful!");
      
      // Step 2: Initialize the configuration
      console.log("\n🔧 Step 2: Initializing V5 configuration...");
      const v5 = await ethers.getContractAt("MawSacrificeV5", PROXY);
      
      try {
        const initTx = await v5.initializeV5(0, 1, 2, 6, {
          gasLimit: 300000
        });
        
        console.log("Initialize transaction:", initTx.hash);
        const initReceipt = await initTx.wait();
        
        if (initReceipt.status === 1) {
          console.log("✅ Initialization successful!");
          
          // Step 3: Verify configuration
          console.log("\n🔍 Step 3: Verifying configuration...");
          const capId = await v5.capId();
          const keyId = await v5.keyId();
          const fragId = await v5.fragId();
          const shardId = await v5.shardId();
          
          console.log("Token IDs:");
          console.log(`  Cap ID: ${capId}`);
          console.log(`  Key ID: ${keyId}`);
          console.log(`  Frag ID: ${fragId}`);
          console.log(`  Shard ID: ${shardId}`);
          
          // Step 4: Test the fix
          console.log("\n🧪 Step 4: Testing the arithmetic underflow fix...");
          try {
            const gasEstimate = await v5.sacrificeKeys.estimateGas(1);
            console.log(`✅ Gas estimate: ${gasEstimate.toString()}`);
            
            if (gasEstimate < 1000000) {
              console.log("🎉 ARITHMETIC UNDERFLOW FIXED!");
              console.log("V5 deployment complete and working!");
            }
            
          } catch (error) {
            console.log("❌ Still have issues:", error.message);
          }
          
        } else {
          console.log("❌ Initialization failed");
        }
        
      } catch (error) {
        console.log("❌ Initialize failed:", error.message);
      }
      
    } else {
      console.log("❌ Upgrade failed");
    }
    
  } catch (error) {
    console.log("❌ Upgrade failed:", error.message);
  }
}

main().catch(console.error);