const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying MawSacrificeV5 with Role System...");
  
  const deployer = await ethers.getSigners().then(s => s[0]);
  console.log("Deployer:", deployer.address);
  
  const PROXY = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  console.log("Proxy:", PROXY);
  
  // Deploy new implementation with role system
  console.log("\n📦 Deploying V5 implementation with roles...");
  const MawV5 = await ethers.getContractFactory("MawSacrificeV5");
  const impl = await MawV5.deploy();
  await impl.waitForDeployment();
  
  const implAddress = await impl.getAddress();
  console.log("✅ V5 implementation deployed at:", implAddress);
  
  // Upgrade proxy to new implementation
  console.log("\n🔄 Upgrading proxy to V5 with roles...");
  const proxy = await ethers.getContractAt("MawSacrificeV5", PROXY);
  
  try {
    const upgradeTx = await proxy.upgradeToAndCall(implAddress, "0x", {
      gasLimit: 500000
    });
    
    console.log("Upgrade transaction:", upgradeTx.hash);
    const receipt = await upgradeTx.wait();
    
    if (receipt.status === 1) {
      console.log("✅ Upgrade successful!");
      
      // Test the new role functions
      console.log("\n🧪 Testing role system...");
      
      // Check if role functions exist
      const keyShopRole = ethers.keccak256(ethers.toUtf8Bytes("KEY_SHOP"));
      console.log("KEY_SHOP role hash:", keyShopRole);
      
      const currentKeyShopRole = await proxy.role(keyShopRole);
      console.log("Current KEY_SHOP role holder:", currentKeyShopRole);
      
      // Test healthcheck still works
      try {
        const health = await proxy.healthcheck();
        console.log("✅ Healthcheck working:", {
          relics: health[0],
          maw: health[1], 
          capId: health[2].toString(),
          keyId: health[3].toString(),
          fragId: health[4].toString(),
          shardId: health[5].toString()
        });
      } catch (error) {
        console.log("⚠️  Healthcheck not available yet:", error.message);
      }
      
      console.log("\n🎉 MAW V5 with role system deployed successfully!");
      console.log("Next steps:");
      console.log("1. Set KEY_SHOP role:", `cast send ${PROXY} "setRole(bytes32,address)" ${keyShopRole} 0x9Bd1651f1f8aB416A72f094fB60BbC1737B67DB6`);
      console.log("2. Set COSMETICS role:", `cast send ${PROXY} "setRole(bytes32,address)" $(cast keccak "COSMETICS") 0x32640D260CeCD52581280e23B9DCc6F49D04Bdcb`);
      
    } else {
      console.log("❌ Upgrade failed");
    }
    
  } catch (error) {
    console.error("❌ Upgrade failed:", error.message);
  }
}

main().catch(console.error);