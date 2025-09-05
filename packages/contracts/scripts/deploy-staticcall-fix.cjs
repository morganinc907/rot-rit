const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🚀 Deploying staticcall fix...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Deploy new implementation
  console.log("📦 Deploying implementation without broken staticcall check...");
  const MawSacrifice = await ethers.getContractFactory("MawSacrificeV4NoTimelock");
  const newImpl = await MawSacrifice.deploy();
  await newImpl.waitForDeployment();
  
  const newImplAddress = await newImpl.getAddress();
  console.log("✅ New implementation deployed at:", newImplAddress);
  
  // Upgrade the proxy
  console.log("🔄 Upgrading proxy...");
  const proxyAddress = addresses.baseSepolia.MawSacrifice;
  const proxy = await ethers.getContractAt("MawSacrificeV4NoTimelock", proxyAddress);
  
  const tx = await proxy.upgradeToAndCall(newImplAddress, "0x");
  console.log("Upgrade transaction:", tx.hash);
  await tx.wait();
  console.log("✅ Proxy upgraded!");
  
  // Test the conversion now
  console.log("\n🧪 Testing conversion...");
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  const userAddress = deployer.address;
  
  const shardsBefore = await relics.balanceOf(userAddress, 6);
  const capsBefore = await relics.balanceOf(userAddress, 0);
  console.log(`Before: ${shardsBefore} shards, ${capsBefore} caps`);
  
  if (shardsBefore >= 5) {
    try {
      console.log("🚀 Attempting conversion...");
      const convertTx = await proxy.convertShardsToRustedCaps(5, {
        gasLimit: 500000
      });
      console.log("Conversion transaction:", convertTx.hash);
      
      const receipt = await convertTx.wait();
      if (receipt.status === 1) {
        console.log("🎉 CONVERSION SUCCESSFUL!");
        
        const shardsAfter = await relics.balanceOf(userAddress, 6);
        const capsAfter = await relics.balanceOf(userAddress, 0);
        console.log(`After: ${shardsAfter} shards, ${capsAfter} caps`);
        console.log("✅ Glass shard to rusted cap conversion is now working!");
      } else {
        console.log("❌ Transaction failed");
      }
      
    } catch (error) {
      console.log("❌ Conversion failed:", error.message);
      if (error.data) {
        console.log("Error data:", error.data);
      }
    }
  } else {
    console.log("⚠️ Not enough shards to test conversion");
  }
}

main().catch(console.error);