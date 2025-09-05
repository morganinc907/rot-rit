const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🔍 Debugging cosmetic sacrifice...");
  console.log("User:", deployer.address);
  
  // Load contract addresses
  const addressesPath = '../../addresses/addresses.json';
  const addresses = require(addressesPath);
  const { baseSepolia: contractAddresses } = addresses;
  
  console.log("\n📍 Contract Addresses:");
  console.log("MawSacrifice:", contractAddresses.MawSacrifice);
  console.log("Cosmetics:", contractAddresses.Cosmetics);
  console.log("Relics:", contractAddresses.Relics);
  
  // Get contracts
  const MawSacrifice = await hre.ethers.getContractAt(
    "MawSacrificeV4NoTimelock",
    contractAddresses.MawSacrifice
  );
  
  const Relics = await hre.ethers.getContractAt(
    "Relics",
    contractAddresses.Relics
  );
  
  // Check balances
  console.log("\n💰 User Balances:");
  const fragmentBalance = await Relics.balanceOf(deployer.address, 3); // Lantern Fragments
  const maskBalance = await Relics.balanceOf(deployer.address, 4); // Worm-Eaten Masks
  console.log("- Lantern Fragments:", fragmentBalance.toString());
  console.log("- Worm-Eaten Masks:", maskBalance.toString());
  
  if (fragmentBalance < 1) {
    console.log("❌ Need at least 1 Lantern Fragment to test");
    return;
  }
  
  // Check contract configuration
  console.log("\n🔧 Contract Configuration:");
  const cosmeticsRef = await MawSacrifice.cosmetics();
  const relicsRef = await MawSacrifice.relics();
  console.log("- MawSacrifice → Cosmetics:", cosmeticsRef);
  console.log("- MawSacrifice → Relics:", relicsRef);
  console.log("- Expected Cosmetics:", contractAddresses.Cosmetics);
  console.log("- Expected Relics:", contractAddresses.Relics);
  
  // Check cosmetic types
  const availableTypes = await MawSacrifice.getCurrentCosmeticTypes();
  console.log("- Available cosmetic types:", availableTypes.map(t => Number(t)));
  
  // Check approval
  console.log("\n🔐 Approval Status:");
  const isApproved = await Relics.isApprovedForAll(deployer.address, contractAddresses.MawSacrifice);
  console.log("- Is approved for all:", isApproved);
  
  if (!isApproved) {
    console.log("🔧 Setting approval...");
    const approveTx = await Relics.setApprovalForAll(contractAddresses.MawSacrifice, true);
    await approveTx.wait();
    console.log("✅ Approval set");
  }
  
  // Check paused state
  console.log("\n⏸️ Contract State:");
  try {
    const paused = await MawSacrifice.paused();
    console.log("- Contract paused:", paused);
    
    const sacrificesPaused = await MawSacrifice.sacrificesPaused();
    console.log("- Sacrifices paused:", sacrificesPaused);
  } catch (err) {
    console.log("- Pause state check failed:", err.message);
  }
  
  // Try static call first
  console.log("\n🧪 Testing sacrifice with static call...");
  try {
    await MawSacrifice.sacrificeForCosmetic.staticCall(1, 0);
    console.log("✅ Static call succeeded - transaction should work");
  } catch (error) {
    console.log("❌ Static call failed:", error.message);
    
    // Try to decode the error
    if (error.data) {
      try {
        const reason = hre.ethers.toUtf8String(error.data);
        console.log("   Decoded reason:", reason);
      } catch {
        console.log("   Raw error data:", error.data);
      }
    }
    return;
  }
  
  // If static call works, try actual transaction
  console.log("\n🎯 Executing actual sacrifice...");
  try {
    const tx = await MawSacrifice.sacrificeForCosmetic(1, 0);
    console.log("📤 Transaction:", tx.hash);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log("⛽ Gas used:", receipt.gasUsed.toString());
    
    // Check for events
    for (const log of receipt.logs) {
      try {
        const parsed = MawSacrifice.interface.parseLog(log);
        if (parsed) {
          console.log("📋 Event:", parsed.name, parsed.args);
        }
      } catch {
        // Not a MawSacrifice event, skip
      }
    }
    
  } catch (error) {
    console.log("❌ Transaction failed:", error.message);
  }
  
  console.log("\n✅ Debug complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});