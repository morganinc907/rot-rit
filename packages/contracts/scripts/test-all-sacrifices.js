const { ethers } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🧪 Testing all sacrifice functions...");
  
  const [deployer] = await ethers.getSigners();
  const networkAddresses = addresses.baseSepolia;
  
  console.log("User:", deployer.address);
  console.log("MawSacrifice:", networkAddresses.MawSacrifice);
  
  try {
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", networkAddresses.MawSacrifice);
    const relics = await ethers.getContractAt("Relics", networkAddresses.Relics);
    
    // Check balances
    const keyBalance = await relics.balanceOf(deployer.address, 1);
    const fragmentBalance = await relics.balanceOf(deployer.address, 2);
    const maskBalance = await relics.balanceOf(deployer.address, 3);
    
    console.log("\nBalances:");
    console.log("- Rusted Caps (1):", keyBalance.toString());
    console.log("- Lantern Fragments (2):", fragmentBalance.toString()); 
    console.log("- Worm-eaten Masks (3):", maskBalance.toString());
    
    // Test 1: Keys sacrifice (already works)
    console.log("\n🔑 Testing sacrificeKeys...");
    if (keyBalance > 0) {
      try {
        await maw.sacrificeKeys.staticCall(1);
        console.log("✅ sacrificeKeys simulation successful");
      } catch (e) {
        console.log("❌ sacrificeKeys failed:", e.message);
      }
    } else {
      console.log("⏭️  No keys to sacrifice");
    }
    
    // Test 2: Cosmetic sacrifice
    console.log("\n🎨 Testing sacrificeForCosmetic...");
    if (fragmentBalance > 0) {
      try {
        await maw.sacrificeForCosmetic.staticCall(1, 0);
        console.log("✅ sacrificeForCosmetic simulation successful");
      } catch (e) {
        console.log("❌ sacrificeForCosmetic failed:", e.message);
      }
    } else {
      console.log("⏭️  No fragments to sacrifice");
    }
    
    // Test 3: Demon sacrifice
    console.log("\n👹 Testing sacrificeForDemon...");
    if (fragmentBalance > 0) {
      try {
        await maw.sacrificeForDemon.staticCall(1, 0, 1); // 1 fragment, 0 masks, cultist 1
        console.log("✅ sacrificeForDemon simulation successful");
      } catch (e) {
        console.log("❌ sacrificeForDemon failed:", e.message);
      }
    } else {
      console.log("⏭️  No fragments for demon sacrifice");
    }
    
  } catch (error) {
    console.error("Script error:", error.message);
  }
}

main().catch(console.error);
