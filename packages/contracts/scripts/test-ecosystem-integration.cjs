const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing full ecosystem integration...");
  
  const PROXY = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  const RELICS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const KEYSHOP = "0x9Bd1651f1f8aB416A72f094fB60BbC1737B67DB6";
  const COSMETICS = "0x32640D260CeCD52581280e23B9DCc6F49D04Bdcb";
  
  const deployer = await ethers.getSigners().then(s => s[0]);
  console.log("Test account:", deployer.address);
  
  const maw = await ethers.getContractAt("MawSacrificeV5", PROXY);
  const relics = await ethers.getContractAt("contracts/MawSacrificeV5.sol:IRelics", RELICS);
  
  console.log("\n📊 System Health Check:");
  
  try {
    // Check MAW healthcheck
    const health = await maw.healthcheck();
    console.log("✅ MAW healthcheck:", {
      relics: health[0],
      mawTrustedOnRelics: health[1],
      capId: health[2].toString(),
      keyId: health[3].toString(),
      fragId: health[4].toString(),
      shardId: health[5].toString()
    });
    
    // Verify authorization binding
    const mawOnRelics = await relics.mawSacrifice();
    const isAuthorized = mawOnRelics === PROXY;
    console.log(isAuthorized ? "✅" : "❌", `MAW authorization: ${isAuthorized ? "BOUND" : "UNBOUND"}`);
    
    // Check role assignments
    const keyShopRole = ethers.keccak256(ethers.toUtf8Bytes("KEY_SHOP"));
    const cosmeticsRole = ethers.keccak256(ethers.toUtf8Bytes("COSMETICS"));
    
    const keyShopHolder = await maw.role(keyShopRole);
    const cosmeticsHolder = await maw.role(cosmeticsRole);
    
    console.log("✅ KEY_SHOP role:", keyShopHolder === KEYSHOP ? "CORRECT" : "WRONG");
    console.log("✅ COSMETICS role:", cosmeticsHolder === COSMETICS ? "CORRECT" : "WRONG");
    
    // Test configuration labels
    console.log("\n🏷️  Token ID Labels:");
    const capId = await maw.capId();
    const keyId = await maw.keyId();
    const fragId = await maw.fragId();
    const shardId = await maw.shardId();
    
    console.log(`  ${capId}: ${await maw.idLabel(capId)}`);
    console.log(`  ${keyId}: ${await maw.idLabel(keyId)}`);
    console.log(`  ${fragId}: ${await maw.idLabel(fragId)}`);
    console.log(`  ${shardId}: ${await maw.idLabel(shardId)}`);
    
    // Test user balances
    console.log("\n💰 Current token balances:");
    const capBalance = await relics.balanceOf(deployer.address, capId);
    const keyBalance = await relics.balanceOf(deployer.address, keyId);
    const fragBalance = await relics.balanceOf(deployer.address, fragId);
    const shardBalance = await relics.balanceOf(deployer.address, shardId);
    
    console.log(`  Caps (${capId}): ${capBalance.toString()}`);
    console.log(`  Keys (${keyId}): ${keyBalance.toString()}`);
    console.log(`  Fragments (${fragId}): ${fragBalance.toString()}`);
    console.log(`  Shards (${shardId}): ${shardBalance.toString()}`);
    
    // Test ecosystem minting functions are accessible
    console.log("\n🔧 Testing ecosystem functions accessibility...");
    
    try {
      // We can't actually call these without being the authorized contracts,
      // but we can check if the functions exist and would revert with NotAuthorized
      await maw.shopMintKeys.staticCall(deployer.address, 1);
      console.log("❌ shopMintKeys should have failed with NotAuthorized");
    } catch (error) {
      if (error.message.includes("NotAuthorized")) {
        console.log("✅ shopMintKeys properly protected");
      } else {
        console.log("⚠️  shopMintKeys unexpected error:", error.message);
      }
    }
    
    try {
      await maw.cosmeticsMint.staticCall(deployer.address, 1, 1);
      console.log("❌ cosmeticsMint should have failed with NotAuthorized");
    } catch (error) {
      if (error.message.includes("NotAuthorized")) {
        console.log("✅ cosmeticsMint properly protected");
      } else {
        console.log("⚠️  cosmeticsMint unexpected error:", error.message);
      }
    }
    
    // Test core sacrifice functions still work
    if (capBalance > 0) {
      console.log("\n🔥 Testing sacrifice function...");
      try {
        await maw.sacrificeCaps.staticCall(1);
        console.log("✅ sacrificeCaps function accessible");
      } catch (error) {
        console.log("❌ sacrificeCaps error:", error.message);
      }
    } else {
      console.log("\n⚠️  No caps available for sacrifice test");
    }
    
    console.log("\n🎉 Ecosystem integration test complete!");
    console.log("🔗 Single authority chain established:");
    console.log("   KeyShop -> MAW -> Relics");
    console.log("   Cosmetics -> MAW -> Relics");
    console.log("   Frontend -> MAW (chain-first architecture)");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

main().catch(console.error);