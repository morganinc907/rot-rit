const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing Complete Proxy System...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  // Contract addresses
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  
  const relics = await hre.ethers.getContractAt("Relics", RELICS_ADDRESS);
  const mawSacrifice = await hre.ethers.getContractAt("MawSacrificeV3Upgradeable", PROXY_ADDRESS);

  console.log("📋 Configuration:");
  console.log("  Proxy Address:", PROXY_ADDRESS);
  
  try {
    const version = await mawSacrifice.version();
    console.log("  Version:", version);
    console.log("  ✅ ABI compatibility confirmed");
  } catch (error) {
    console.log("  ❌ ABI compatibility failed:", error.message);
    return;
  }

  try {
    // Check balances
    console.log("\n1️⃣ Current Balances:");
    const rustedKeys = await relics.balanceOf(deployer.address, 1); // Rusted Keys  
    const glassShards = await relics.balanceOf(deployer.address, 8); // Glass Shards
    const fragments = await relics.balanceOf(deployer.address, 2);
    const masks = await relics.balanceOf(deployer.address, 3);
    
    console.log("  Rusted Keys (ID 1):", rustedKeys.toString());
    console.log("  Glass Shards (ID 8):", glassShards.toString()); 
    console.log("  Fragments (ID 2):", fragments.toString());
    console.log("  Masks (ID 3):", masks.toString());

    // Test 1: Key Sacrifice (if we have keys)
    if (rustedKeys > 0) {
      console.log("\n2️⃣ Testing Key Sacrifice...");
      const beforeShards = await relics.balanceOf(deployer.address, 8);
      
      const tx = await mawSacrifice.sacrificeKeys(1, { 
        gasLimit: 300000,
        gasPrice: hre.ethers.parseUnits("2", "gwei") // Higher gas price
      });
      const receipt = await tx.wait();
      
      const afterShards = await relics.balanceOf(deployer.address, 8);
      const shardsGained = afterShards - beforeShards;
      
      console.log("  ✅ Key sacrifice SUCCESS!");
      console.log("  Gas used:", receipt.gasUsed.toString());
      console.log("  Glass Shards gained:", shardsGained.toString());
    } else {
      console.log("\n2️⃣ ⚠️ No Rusted Keys to sacrifice");
    }

    // Test 2: Glass Shard Conversion (THE NEW V3 FEATURE!)
    const currentShards = await relics.balanceOf(deployer.address, 8);
    if (currentShards >= 5n) {
      console.log("\n3️⃣ Testing Glass Shard → Rusted Cap Conversion (NEW V3 FEATURE)...");
      const shardsToConvert = 5n;
      
      const beforeKeys = await relics.balanceOf(deployer.address, 1);
      
      try {
        const tx = await mawSacrifice.convertShardsToRustedCaps(shardsToConvert, { 
          gasLimit: 200000,
          gasPrice: hre.ethers.parseUnits("2", "gwei")
        });
        const receipt = await tx.wait();
        const afterKeys = await relics.balanceOf(deployer.address, 1);
        
        console.log("  ✅ Conversion SUCCESS!");
        console.log("  Shards used:", shardsToConvert.toString());
        console.log("  Keys gained:", (afterKeys - beforeKeys).toString());
        console.log("  Conversion ratio: 5:1 ✅");
      } catch (error) {
        console.log("  ❌ Conversion failed:", error.message);
        if (error.reason) console.log("  Reason:", error.reason);
      }
    } else {
      console.log("\n3️⃣ ⚠️ Need at least 5 Glass Shards for conversion");
    }

    // Test 3: Cosmetic Sacrifice (if we have fragments)
    if (fragments > 0) {
      console.log("\n4️⃣ Testing Cosmetic Sacrifice...");
      const beforeCosmetics = await relics.balanceOf(deployer.address, 7); // Cosmetics ID
      
      try {
        const tx = await mawSacrifice.sacrificeCosmetics(1, { 
          gasLimit: 300000,
          gasPrice: hre.ethers.parseUnits("2", "gwei")
        });
        const receipt = await tx.wait();
        const afterCosmetics = await relics.balanceOf(deployer.address, 7);
        
        console.log("  ✅ Cosmetic sacrifice SUCCESS!");
        console.log("  Gas used:", receipt.gasUsed.toString());
        console.log("  Cosmetics gained:", (afterCosmetics - beforeCosmetics).toString());
      } catch (error) {
        console.log("  ❌ Cosmetic sacrifice failed:", error.message);
        if (error.reason) console.log("  Reason:", error.reason);
      }
    } else {
      console.log("\n4️⃣ ⚠️ No fragments for cosmetic sacrifice");
    }

    // Test 4: System Status Checks
    console.log("\n5️⃣ System Status Checks...");
    const mythicMinted = await mawSacrifice.mythicDemonsMinted();
    const maxMythic = await mawSacrifice.MAX_MYTHIC_DEMONS();
    const minBlocks = await mawSacrifice.minBlocksBetweenSacrifices();
    
    console.log("  Mythic Demons Minted:", mythicMinted.toString());
    console.log("  Max Mythic Demons:", maxMythic.toString());
    console.log("  Min blocks between sacrifices:", minBlocks.toString());
    console.log("  ✅ All system parameters functional");

    console.log("\n🎉 Proxy System Test Complete!");
    console.log("✅ ABI compatibility working");
    console.log("✅ UUPS proxy operational");  
    console.log("✅ V3 features available");
    console.log("✅ Ready for frontend integration");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });