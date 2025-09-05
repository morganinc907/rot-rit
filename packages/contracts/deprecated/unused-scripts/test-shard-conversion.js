const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  console.log("🔍 Testing Glass Shard → Rusted Cap Conversion...\n");

  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();
  
  // Load addresses
  const addresses = require("../../addresses/addresses.json");
  const MawSacrifice = addresses.MawSacrifice;
  const RelicsAddress = addresses.Relics;
  
  if (!MawSacrifice || !RelicsAddress) {
    console.error("❌ Contract addresses not found");
    return;
  }

  // Get contract instances
  const MawABI = require("../../abis/MawSacrificeV4Upgradeable.json");
  const RelicsABI = require("../../abis/Relics.json");
  
  const maw = new ethers.Contract(MawSacrifice, MawABI, signer);
  const relics = new ethers.Contract(RelicsAddress, RelicsABI, signer);

  try {
    // Item IDs
    const ASHES = 8; // Glass Shards
    const RUSTED_KEY = 0; // Rusted Caps

    // Check current balances
    const ashesBalance = await relics.balanceOf(signerAddress, ASHES);
    const capsBalanceBefore = await relics.balanceOf(signerAddress, RUSTED_KEY);
    
    console.log("📊 Current Balances:");
    console.log(`  Glass Shards: ${ashesBalance}`);
    console.log(`  Rusted Caps: ${capsBalanceBefore}`);

    if (ashesBalance < 5) {
      console.log("\n⚠️  Not enough Glass Shards for testing (need at least 5)");
      console.log("💡 Run a key sacrifice that fails to get Glass Shards");
      return;
    }

    // Calculate conversion amounts
    const maxConvertible = Math.floor(Number(ashesBalance) / 5) * 5;
    const testAmount = Math.min(maxConvertible, 10); // Convert max 10 shards for testing
    const expectedCaps = testAmount / 5;

    console.log(`\n🔄 Testing Conversion:`);
    console.log(`  Converting: ${testAmount} Glass Shards`);
    console.log(`  Expected: ${expectedCaps} Rusted Caps`);

    // Check if approved
    const isApproved = await relics.isApprovedForAll(signerAddress, MawSacrifice);
    if (!isApproved) {
      console.log("\n📝 Approving Relics contract...");
      const approveTx = await relics.setApprovalForAll(MawSacrifice, true);
      await approveTx.wait();
      console.log("✅ Approval successful");
    }

    // Check anti-bot cooldown
    const lastBlock = await maw.lastSacrificeBlock(signerAddress);
    const minBlocks = await maw.minBlocksBetweenSacrifices();
    const currentBlock = await ethers.provider.getBlockNumber();
    const blocksRemaining = Math.max(0, Number(lastBlock) + Number(minBlocks) - currentBlock);

    if (blocksRemaining > 0) {
      console.log(`\n⏳ Waiting for cooldown: ${blocksRemaining} blocks remaining...`);
      // Wait for cooldown to pass
      for (let i = 0; i < blocksRemaining + 1; i++) {
        await ethers.provider.send("evm_mine", []);
      }
      console.log("✅ Cooldown passed");
    }

    // Perform conversion
    console.log(`\n🔄 Converting ${testAmount} Glass Shards...`);
    const tx = await maw.convertShardsToRustedCaps(testAmount);
    console.log("📤 Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");

    // Check new balances
    const ashesBalanceAfter = await relics.balanceOf(signerAddress, ASHES);
    const capsBalanceAfter = await relics.balanceOf(signerAddress, RUSTED_KEY);

    console.log("\n📊 Results:");
    console.log(`  Glass Shards: ${ashesBalance} → ${ashesBalanceAfter} (${Number(ashesBalance) - Number(ashesBalanceAfter)} burned)`);
    console.log(`  Rusted Caps: ${capsBalanceBefore} → ${capsBalanceAfter} (${Number(capsBalanceAfter) - Number(capsBalanceBefore)} gained)`);

    // Verify conversion worked correctly
    const shardsUsed = Number(ashesBalance) - Number(ashesBalanceAfter);
    const capsGained = Number(capsBalanceAfter) - Number(capsBalanceBefore);
    const expectedCapsFromUsed = shardsUsed / 5;

    if (shardsUsed === testAmount && capsGained === expectedCapsFromUsed) {
      console.log(`\n✅ CONVERSION SUCCESSFUL!`);
      console.log(`   ${shardsUsed} shards → ${capsGained} caps (perfect 5:1 ratio)`);
    } else {
      console.log(`\n❌ CONVERSION ISSUE:`);
      console.log(`   Expected: ${testAmount} shards → ${expectedCaps} caps`);
      console.log(`   Actual: ${shardsUsed} shards → ${capsGained} caps`);
    }

    // Check events
    const events = receipt.logs.map(log => {
      try {
        return maw.interface.parseLog(log);
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    if (events.length > 0) {
      console.log(`\n📋 Events emitted:`);
      events.forEach(event => {
        console.log(`   ${event.name}:`, event.args);
      });
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    
    // Check for common issues
    if (error.message.includes("TooSoon")) {
      console.log("💡 Try again after the anti-bot cooldown period");
    } else if (error.message.includes("InvalidAmount")) {
      console.log("💡 Make sure amount is multiple of 5 and you have enough shards");
    } else if (error.message.includes("InsufficientBalance")) {
      console.log("💡 Not enough Glass Shards for conversion");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });