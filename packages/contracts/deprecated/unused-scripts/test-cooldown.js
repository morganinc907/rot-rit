const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  console.log("🔍 Testing Anti-Bot Cooldown System...\n");

  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();
  
  // Load addresses
  const addresses = require("../../addresses/addresses.json");
  const MawSacrifice = addresses.baseSepolia?.MawSacrifice || addresses.MawSacrifice;
  
  if (!MawSacrifice) {
    console.error("❌ MawSacrifice address not found");
    return;
  }

  // Get contract instance
  const MawABI = require("../../abis/MawSacrifice.json");
  const maw = new ethers.Contract(MawSacrifice, MawABI, signer);

  try {
    // Check cooldown parameters
    const lastBlock = await maw.lastSacrificeBlock(signerAddress);
    const minBlocks = await maw.minBlocksBetweenSacrifices();
    const currentBlock = await ethers.provider.getBlockNumber();
    
    console.log("📊 Cooldown Status:");
    console.log(`  Current Block: ${currentBlock}`);
    console.log(`  Last Sacrifice Block: ${lastBlock}`);
    console.log(`  Min Blocks Between: ${minBlocks}`);
    
    const nextAllowedBlock = Number(lastBlock) + Number(minBlocks);
    const blocksRemaining = Math.max(0, nextAllowedBlock - currentBlock);
    
    if (blocksRemaining > 0) {
      console.log(`\n⏳ IN COOLDOWN: Wait ${blocksRemaining} blocks (~${blocksRemaining * 2}s)`);
      console.log(`  Next allowed block: ${nextAllowedBlock}`);
      
      // Try to sacrifice (should fail)
      console.log("\n🧪 Testing sacrifice during cooldown (should fail)...");
      try {
        const tx = await maw.sacrificeKeys(1);
        await tx.wait();
        console.log("❌ UNEXPECTED: Transaction succeeded during cooldown!");
      } catch (error) {
        if (error.message.includes("TooSoon")) {
          console.log("✅ CORRECT: Transaction failed with TooSoon error");
        } else {
          console.log("⚠️ Transaction failed with unexpected error:", error.message);
        }
      }
    } else {
      console.log("\n✅ NOT IN COOLDOWN: Can sacrifice now");
      console.log(`  Blocks since last: ${currentBlock - Number(lastBlock)}`);
      
      // Check if user has keys
      const RelicsABI = require("../../abis/Relics.json");
      const relics = new ethers.Contract(addresses.baseSepolia?.Relics || addresses.Relics, RelicsABI, signer);
      const keyBalance = await relics.balanceOf(signerAddress, 0); // RUSTED_KEY = 0
      
      if (keyBalance > 0) {
        console.log(`\n🔑 You have ${keyBalance} keys. Testing sacrifice...`);
        
        // Check approval
        const isApproved = await relics.isApprovedForAll(signerAddress, MawSacrifice);
        if (!isApproved) {
          console.log("📝 Approving contract...");
          const approveTx = await relics.setApprovalForAll(MawSacrifice, true);
          await approveTx.wait();
        }
        
        // Try sacrifice
        const tx = await maw.sacrificeKeys(1);
        console.log("📤 Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("✅ Sacrifice successful!");
        
        // Check new cooldown
        const newLastBlock = await maw.lastSacrificeBlock(signerAddress);
        console.log(`\n📊 New cooldown started at block ${newLastBlock}`);
        console.log(`  Next sacrifice allowed at block ${Number(newLastBlock) + Number(minBlocks)}`);
      } else {
        console.log("\n⚠️ No keys available for testing");
      }
    }
    
    // Display cooldown timing info
    console.log("\n⏱️ Cooldown Timing on Base Sepolia:");
    console.log(`  Block time: ~2 seconds`);
    console.log(`  Cooldown blocks: ${minBlocks}`);
    console.log(`  Cooldown duration: ~${Number(minBlocks) * 2} seconds`);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });