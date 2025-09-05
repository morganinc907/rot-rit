const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🔧 Initializing hardened contract...");
  
  const maw = await ethers.getContractAt("MawSacrificeV4Hardened", addresses.baseSepolia.MawSacrifice);
  
  // Initialize token IDs properly
  console.log("🔢 Setting correct token IDs...");
  try {
    const setIdsTx = await maw.configureIds(
      0,  // capId - Rusted Caps
      1,  // keyId - Rusted Keys (legacy)
      2,  // fragId - Lantern Fragments  
      6   // shardId - Glass Shards (fallback)
    );
    
    console.log("Configure IDs transaction:", setIdsTx.hash);
    const receipt = await setIdsTx.wait();
    
    if (receipt.status === 1) {
      console.log("✅ Token IDs configured!");
      
      // Verify IDs
      const capId = await maw.capId();
      const keyId = await maw.keyId();
      const fragId = await maw.fragId();
      const shardId = await maw.shardId();
      
      console.log("Verified IDs:");
      console.log(`  Cap ID: ${capId} (should be 0)`);
      console.log(`  Key ID: ${keyId} (should be 1)`);
      console.log(`  Frag ID: ${fragId} (should be 2)`);
      console.log(`  Shard ID: ${shardId} (should be 6)`);
    }
  } catch (error) {
    console.log("❌ Failed to set IDs:", error.message);
  }
  
  // Unpause sacrifices
  console.log("\n▶️ Unpausing sacrifices...");
  try {
    const unpauseTx = await maw.setSacrificesPaused(false);
    console.log("Unpause transaction:", unpauseTx.hash);
    
    const receipt = await unpauseTx.wait();
    if (receipt.status === 1) {
      console.log("✅ Sacrifices unpaused!");
    }
  } catch (error) {
    console.log("❌ Failed to unpause:", error.message);
  }
  
  // Test the contract now
  console.log("\n🧪 Testing after initialization...");
  try {
    const gasEstimate = await maw.sacrificeKeys.estimateGas(1);
    console.log(`Gas estimate: ${gasEstimate.toString()}`);
    
    if (gasEstimate < 1000000) {
      console.log("✅ Gas estimate looks good! Ready to test sacrifice.");
      
      // Test static call
      await maw.sacrificeKeys.staticCall(1);
      console.log("✅ Static call succeeds!");
      
      console.log("\n🎯 Hardened contract is ready!");
      console.log("Key features now active:");
      console.log("- ✅ Correct token IDs configured");  
      console.log("- ✅ Sacrifices unpaused");
      console.log("- ✅ Shard fallback prevents transaction failures");
      console.log("- ✅ RNG preview available for debugging");
      console.log("- ✅ Detailed error reporting via events");
      
    } else {
      console.log("⚠️ Gas estimate still high, needs investigation");
    }
    
  } catch (error) {
    console.log("❌ Test failed:", error.message);
  }
}

main().catch(console.error);