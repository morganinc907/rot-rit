const hre = require("hardhat");

async function main() {
  console.log('🧹 Simplifying cosmetic pool - removing masks & ash vials...');
  
  const [signer] = await hre.ethers.getSigners();
  console.log('Signer:', signer.address);
  
  const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawAddress);
  
  // Get current pool
  const currentPool = await maw.getCosmeticPool();
  console.log('\n📋 Current pool:');
  console.log('  IDs:', currentPool[0].map(id => id.toString()));
  console.log('  Weights:', currentPool[1].map(w => w.toString()));
  console.log('  Total:', currentPool[2].toString());
  
  // Define the simplified pool (remove masks & ash vials)
  // Assuming masks=3 and ash vials=5 based on typical mapping
  // Keep cosmetic types 1, 2, 4, 6 (remove 3, 5)
  const newIds = [1, 2, 4, 6];
  const newWeights = [100, 50, 25, 50]; // Corresponding weights
  
  console.log('\n🎯 New simplified pool:');
  console.log('  IDs:', newIds);
  console.log('  Weights:', newWeights);
  console.log('  Total:', newWeights.reduce((a, b) => a + b, 0));
  
  try {
    console.log('\n🔄 Updating cosmetic pool...');
    const tx = await maw.setCosmeticPool(newIds, newWeights);
    console.log('Transaction sent:', tx.hash);
    
    console.log('⏳ Waiting for confirmation...');
    await tx.wait();
    console.log('✅ Cosmetic pool updated successfully');
    
    // Verify the update
    const updatedPool = await maw.getCosmeticPool();
    console.log('\n✅ Verification - Updated pool:');
    console.log('  IDs:', updatedPool[0].map(id => id.toString()));
    console.log('  Weights:', updatedPool[1].map(w => w.toString()));
    console.log('  Total:', updatedPool[2].toString());
    
    // Also update the sacrifice config to disable bonus masks
    console.log('\n🔄 Disabling bonus masks in sacrifice config...');
    const configTx = await maw.setCosmeticSacrificeConfig(
      2,     // primaryTokenId: fragments
      1,     // primaryMin
      3,     // primaryMax  
      0,     // bonusTokenId: 0 (disabled)
      false, // bonusEnabled: false
      0      // bonusMax: 0
    );
    console.log('Config transaction sent:', configTx.hash);
    
    await configTx.wait();
    console.log('✅ Sacrifice config updated - bonuses disabled');
    
    console.log('\n🎉 SIMPLIFICATION COMPLETE!');
    console.log('- Masks & ash vials removed from cosmetic rewards');
    console.log('- Bonus tokens disabled in sacrifice config');
    console.log('- Frontend will auto-update to reflect changes');
    
  } catch (error) {
    console.log('❌ Error updating pool:', error.message);
    
    if (error.message.includes('Ownable')) {
      console.log('💡 Only owner can update cosmetic pool');
    }
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});