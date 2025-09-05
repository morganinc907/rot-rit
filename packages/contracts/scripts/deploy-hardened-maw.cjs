const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🚀 PASS 1 — Deploying hardened MAW contract...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  // Deploy new implementation
  const MawHardened = await ethers.getContractFactory("MawSacrificeV4Hardened");
  const newImpl = await MawHardened.deploy();
  await newImpl.waitForDeployment();
  
  const newImplAddress = await newImpl.getAddress();
  console.log("✅ New hardened implementation deployed at:", newImplAddress);
  
  // Upgrade the proxy
  console.log("🔄 Upgrading proxy to hardened version...");
  const proxy = await ethers.getContractAt("MawSacrificeV4NoTimelock", addresses.baseSepolia.MawSacrifice);
  
  try {
    const upgradeTx = await proxy.upgradeToAndCall(newImplAddress, "0x", {
      gasLimit: 1000000
    });
    
    console.log("Upgrade transaction:", upgradeTx.hash);
    const receipt = await upgradeTx.wait();
    
    if (receipt.status === 1) {
      console.log("✅ Proxy upgraded successfully!");
      console.log("Gas used:", receipt.gasUsed.toString());
      
      // Test the hardened contract
      console.log("\n🧪 Testing hardened contract...");
      const hardenedMaw = await ethers.getContractAt("MawSacrificeV4Hardened", addresses.baseSepolia.MawSacrifice);
      
      // Check configured IDs
      const capId = await hardenedMaw.capId();
      const keyId = await hardenedMaw.keyId();
      const fragId = await hardenedMaw.fragId();
      const shardId = await hardenedMaw.shardId();
      
      console.log("Configured IDs:");
      console.log(`  Cap ID: ${capId} (should be 0)`);
      console.log(`  Key ID: ${keyId} (should be 1)`);
      console.log(`  Frag ID: ${fragId} (should be 2)`);
      console.log(`  Shard ID: ${shardId} (should be 6)`);
      
      // Test RNG preview
      console.log("\n🎲 Testing RNG preview...");
      const seed = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const previewRewards = await hardenedMaw.previewRewards(3, seed);
      console.log("Preview rewards for 3 sacrifices:", previewRewards.map(r => r.toString()));
      
      // Test gas estimate with hardened version
      console.log("\n⛽ Testing gas estimation...");
      try {
        const gasEstimate = await hardenedMaw.sacrificeKeys.estimateGas(1);
        console.log(`Gas estimate: ${gasEstimate.toString()}`);
        
        if (gasEstimate < 1000000) {
          console.log("✅ Gas estimate looks reasonable!");
        } else {
          console.log("⚠️ Gas estimate still high, may need more optimization");
        }
        
      } catch (error) {
        console.log("❌ Gas estimation failed:", error.message);
      }
      
      // Test static call
      console.log("\n🧪 Testing static call...");
      try {
        await hardenedMaw.sacrificeKeys.staticCall(1);
        console.log("✅ Static call succeeds");
      } catch (error) {
        console.log("❌ Static call failed:", error.message);
      }
      
      console.log("\n🎯 Hardened contract deployed and tested!");
      console.log("Key improvements:");
      console.log("- Configurable token IDs");
      console.log("- Safe burn/mint with error bubbling");
      console.log("- Shard fallback prevents transaction failures");
      console.log("- RNG preview for off-chain testing");
      console.log("- Detailed event logging for debugging");
      
    } else {
      console.log("❌ Upgrade failed");
    }
    
  } catch (error) {
    console.log("❌ Upgrade failed:", error.message);
  }
}

main().catch(console.error);