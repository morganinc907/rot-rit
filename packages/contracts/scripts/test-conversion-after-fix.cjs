const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🧪 Testing conversion after canMintCaps fix...");
  
  const PROXY_ADDRESS = addresses.baseSepolia.MawSacrifice;
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  
  const [signer] = await ethers.getSigners();
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", PROXY_ADDRESS);
  const relics = await ethers.getContractAt("Relics", addresses.baseSepolia.Relics);
  
  // Check current balances
  const shardBalance = await relics.balanceOf(USER_ADDRESS, 6);
  const capBalance = await relics.balanceOf(USER_ADDRESS, 0);
  console.log(`Before conversion - Shards (ID 6): ${shardBalance}, Caps (ID 0): ${capBalance}`);
  
  if (shardBalance < 5) {
    console.log("❌ Need at least 5 shards for conversion");
    return;
  }
  
  // Test canMintCaps first
  console.log("\n🔍 Testing canMintCaps...");
  const canMint = await maw.canMintCaps(1);
  console.log("canMintCaps(1):", canMint);
  
  // Try static call first
  console.log("\n🧪 Testing static call...");
  try {
    await maw.convertShardsToRustedCaps.staticCall(5);
    console.log("✅ Static call succeeded - conversion should work!");
  } catch (error) {
    console.log("❌ Static call failed:", error.message);
    if (error.data) {
      console.log("Error data:", error.data);
    }
    return;
  }
  
  // If static call worked, try the actual conversion
  console.log("\n🚀 Attempting actual conversion...");
  try {
    const tx = await maw.convertShardsToRustedCaps(5, {
      gasLimit: 500000
    });
    console.log("Transaction hash:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Conversion successful!");
    console.log("Gas used:", receipt.gasUsed.toString());
    
    // Check new balances
    const newShardBalance = await relics.balanceOf(USER_ADDRESS, 6);
    const newCapBalance = await relics.balanceOf(USER_ADDRESS, 0);
    console.log(`After conversion - Shards: ${newShardBalance}, Caps: ${newCapBalance}`);
    
    console.log("🎉 Conversion feature is now working!");
    
  } catch (error) {
    console.log("❌ Conversion failed:", error.message);
    if (error.data) {
      console.log("Error data:", error.data);
    }
  }
}

main().catch(console.error);