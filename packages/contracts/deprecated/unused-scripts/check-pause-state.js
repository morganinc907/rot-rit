const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  console.log("🔍 Checking Contract Pause State...\n");

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
    // Check all pause states
    const paused = await maw.paused();
    const sacrificesPaused = await maw.sacrificesPaused();
    const conversionsPaused = await maw.conversionsPaused();
    
    console.log("📊 Pause States:");
    console.log(`  Contract Paused: ${paused}`);
    console.log(`  Sacrifices Paused: ${sacrificesPaused}`);
    console.log(`  Conversions Paused: ${conversionsPaused}`);
    
    // Check user balance
    const RelicsABI = require("../../abis/Relics.json");
    const relics = new ethers.Contract(addresses.baseSepolia?.Relics || addresses.Relics, RelicsABI, signer);
    const keyBalance = await relics.balanceOf(signerAddress, 0); // RUSTED_KEY = 0
    
    console.log(`\n🔑 User State:`);
    console.log(`  Address: ${signerAddress}`);
    console.log(`  Key Balance: ${keyBalance}`);
    
    // Check approval
    const isApproved = await relics.isApprovedForAll(signerAddress, MawSacrifice);
    console.log(`  Approved: ${isApproved}`);
    
    // Check cooldown in detail
    const lastBlock = await maw.lastSacrificeBlock(signerAddress);
    const minBlocks = await maw.minBlocksBetweenSacrifices();
    const currentBlock = await ethers.provider.getBlockNumber();
    const nextAllowedBlock = Number(lastBlock) + Number(minBlocks);
    const blocksRemaining = Math.max(0, nextAllowedBlock - currentBlock);
    
    console.log(`\n⏱️ Cooldown Detail:`);
    console.log(`  Last Sacrifice Block: ${lastBlock}`);
    console.log(`  Min Blocks Between: ${minBlocks}`);
    console.log(`  Current Block: ${currentBlock}`);
    console.log(`  Next Allowed Block: ${nextAllowedBlock}`);
    console.log(`  Blocks Remaining: ${blocksRemaining}`);
    console.log(`  In Cooldown: ${blocksRemaining > 0}`);
    
    // Test transaction simulation (without sending)
    if (keyBalance > 0 && isApproved && !paused && !sacrificesPaused) {
      console.log(`\n🧪 Transaction Simulation:`);
      try {
        // Estimate gas for the transaction
        const gasEstimate = await maw.sacrificeKeys.estimateGas(1);
        console.log(`  ✅ Gas Estimate: ${gasEstimate}`);
        
        // Try to call the function statically
        await maw.sacrificeKeys.staticCall(1);
        console.log(`  ✅ Static Call: SUCCESS`);
      } catch (error) {
        console.log(`  ❌ Transaction would fail:`);
        console.log(`     Error: ${error.message}`);
        
        // Check specific error types
        if (error.message.includes('TooSoon')) {
          console.log(`     🕐 Reason: Anti-bot cooldown`);
        } else if (error.message.includes('InsufficientBalance')) {
          console.log(`     💰 Reason: Not enough keys`);
        } else if (error.message.includes('Pausable: paused')) {
          console.log(`     ⏸️ Reason: Contract is paused`);
        }
      }
    } else {
      console.log(`\n⚠️ Cannot simulate transaction:`);
      if (keyBalance <= 0) console.log(`  - No keys to sacrifice`);
      if (!isApproved) console.log(`  - Contract not approved`);
      if (paused) console.log(`  - Contract is paused`);
      if (sacrificesPaused) console.log(`  - Sacrifices are paused`);
    }
    
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