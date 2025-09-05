const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🧪 PASS 2 — Testing hardened contract...");
  
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  
  // Use the hardened interface on the proxy
  const maw = await ethers.getContractAt("MawSacrificeV4Hardened", addresses.baseSepolia.MawSacrifice);
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  
  console.log("Testing hardened MAW at:", addresses.baseSepolia.MawSacrifice);
  
  // Test configured IDs (should use defaults from old contract)
  console.log("\n🔢 Checking token IDs...");
  try {
    const capId = await maw.capId();
    const keyId = await maw.keyId();
    const shardId = await maw.shardId();
    
    console.log(`Cap ID: ${capId}`);
    console.log(`Key ID: ${keyId}`);
    console.log(`Shard ID: ${shardId}`);
  } catch (error) {
    console.log("Need to initialize IDs");
  }
  
  // Test RNG preview
  console.log("\n🎲 Testing RNG preview...");
  try {
    const seed = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const rewards = await maw.previewRewards(3, seed);
    console.log("Predicted rewards:", rewards.map(r => r.toString()));
  } catch (error) {
    console.log("Preview failed:", error.message);
  }
  
  // Check user balance
  console.log("\n💰 User balance check...");
  const caps = await relics.balanceOf(USER_ADDRESS, 0);
  console.log(`User rusted caps: ${caps}`);
  
  if (caps > 0) {
    // Test gas estimation
    console.log("\n⛽ Gas estimation test...");
    try {
      const gasEstimate = await maw.sacrificeKeys.estimateGas(1);
      console.log(`Gas estimate: ${gasEstimate.toString()}`);
      
      if (gasEstimate < 500000) {
        console.log("✅ Gas estimate is reasonable!");
        
        // Try actual sacrifice
        console.log("\n🎲 Attempting sacrifice with hardened contract...");
        const sacrificeTx = await maw.sacrificeKeys(1, {
          gasLimit: gasEstimate * 2n
        });
        
        console.log("Transaction:", sacrificeTx.hash);
        const receipt = await sacrificeTx.wait();
        
        if (receipt.status === 1) {
          console.log("🎉 HARDENED CONTRACT SUCCESS!");
          console.log("Gas used:", receipt.gasUsed.toString());
          
          // Parse events for debugging
          for (const log of receipt.logs) {
            try {
              const parsed = maw.interface.parseLog(log);
              if (parsed) {
                console.log(`Event: ${parsed.name}`, parsed.args);
              }
            } catch (e) {}
          }
          
        } else {
          console.log("❌ Transaction failed with status 0");
        }
        
      } else {
        console.log("⚠️ Gas estimate still high:", gasEstimate.toString());
      }
      
    } catch (error) {
      console.log("❌ Gas estimation failed:", error.message);
    }
  } else {
    console.log("❌ User has no caps to sacrifice");
  }
  
  console.log("\n✅ Hardened contract test complete!");
}

main().catch(console.error);