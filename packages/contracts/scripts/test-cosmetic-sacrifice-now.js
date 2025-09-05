const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🧪 Testing cosmetic sacrifice with complete setup...");
  console.log("User:", deployer.address);
  
  // Load contract addresses
  const addressesPath = '../../addresses/addresses.json';
  const addresses = require(addressesPath);
  const { baseSepolia: contractAddresses } = addresses;
  
  const MawSacrifice = await hre.ethers.getContractAt(
    "MawSacrificeV4NoTimelock",
    contractAddresses.MawSacrifice
  );
  
  const Relics = await hre.ethers.getContractAt(
    "Relics",
    contractAddresses.Relics
  );
  
  const Cosmetics = await hre.ethers.getContractAt(
    "CosmeticsV2",
    contractAddresses.Cosmetics
  );
  
  // Check balances
  const fragmentBalance = await Relics.balanceOf(deployer.address, 3); // Lantern Fragments
  console.log("\n💰 User Balance:");
  console.log("- Lantern Fragments:", fragmentBalance.toString());
  
  if (fragmentBalance < 1) {
    console.log("❌ Need at least 1 Lantern Fragment to test");
    return;
  }
  
  // Check cosmetics before sacrifice
  console.log("\n🎨 Cosmetics before sacrifice:");
  for (let typeId = 1; typeId <= 6; typeId++) {
    try {
      const balance = await Cosmetics.balanceOf(deployer.address, typeId);
      if (balance > 0) {
        console.log(`  Type ${typeId}: ${balance} owned`);
      }
    } catch {
      // Skip
    }
  }
  
  // Test sacrifice with static call first
  console.log("\n🧪 Testing sacrifice with static call...");
  try {
    await MawSacrifice.sacrificeForCosmetic.staticCall(1, 0);
    console.log("✅ Static call succeeded - transaction should work!");
  } catch (error) {
    console.log("❌ Static call failed:", error.message);
    if (error.data) {
      console.log("   Error data:", error.data);
    }
    return;
  }
  
  // Execute actual sacrifice
  console.log("\n🎯 Executing cosmetic sacrifice...");
  console.log("- Using 1 Lantern Fragment (35% success rate)");
  console.log("- Using 0 Worm-Eaten Masks (no rarity boost)");
  
  try {
    const tx = await MawSacrifice.sacrificeForCosmetic(1, 0, {
      gasLimit: 500000
    });
    
    console.log("📤 Transaction:", tx.hash);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log("⛽ Gas used:", receipt.gasUsed.toString());
    
    // Parse events
    let cosmeticMinted = false;
    let glassShardsReceived = false;
    
    for (const log of receipt.logs) {
      try {
        // Check for MawSacrifice events
        const mawParsed = MawSacrifice.interface.parseLog(log);
        if (mawParsed) {
          console.log("📋 MawSacrifice Event:", mawParsed.name, mawParsed.args);
        }
      } catch {
        try {
          // Check for Cosmetics events
          const cosmeticsParsed = Cosmetics.interface.parseLog(log);
          if (cosmeticsParsed && cosmeticsParsed.name === 'TransferSingle') {
            console.log("🎨 Cosmetic minted! Type:", cosmeticsParsed.args.id, "Amount:", cosmeticsParsed.args.value);
            cosmeticMinted = true;
          }
        } catch {
          try {
            // Check for Relics events (Glass Shards)
            const relicsParsed = Relics.interface.parseLog(log);
            if (relicsParsed && relicsParsed.name === 'TransferSingle' && relicsParsed.args.id == 6) {
              console.log("✨ Glass Shards received! Amount:", relicsParsed.args.value);
              glassShardsReceived = true;
            }
          } catch {
            // Not a relevant event
          }
        }
      }
    }
    
    if (cosmeticMinted) {
      console.log("🎉 SUCCESS: Cosmetic sacrifice worked! You received a cosmetic item!");
    } else if (glassShardsReceived) {
      console.log("💎 PARTIAL SUCCESS: Sacrifice failed but you received Glass Shards as compensation!");
    } else {
      console.log("❓ UNCLEAR: Transaction succeeded but no clear rewards detected");
    }
    
    // Check cosmetics after sacrifice
    console.log("\n🎨 Cosmetics after sacrifice:");
    for (let typeId = 1; typeId <= 6; typeId++) {
      try {
        const balance = await Cosmetics.balanceOf(deployer.address, typeId);
        if (balance > 0) {
          const cosmeticInfo = await Cosmetics.getCosmeticInfo(typeId);
          console.log(`  Type ${typeId}: ${balance} owned (${cosmeticInfo[0]})`);
        }
      } catch {
        // Skip
      }
    }
    
    // Check glass shards
    const glassShardsAfter = await Relics.balanceOf(deployer.address, 6);
    console.log(`\n✨ Glass Shards after: ${glassShardsAfter}`);
    
  } catch (error) {
    console.error("❌ Transaction failed:", error.message);
  }
  
  console.log("\n✅ Cosmetic sacrifice test complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});