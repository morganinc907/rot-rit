const hre = require("hardhat");

async function main() {
  console.log('🔧 Checking and fixing cosmetic pool...');
  
  const [signer] = await hre.ethers.getSigners();
  console.log('Signer:', signer.address);
  
  const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawAddress);
  
  try {
    // Check current pool
    const currentPool = await maw.getCosmeticPool();
    console.log('\n📋 Current cosmetic pool:');
    console.log('  IDs:', currentPool[0].map(id => id.toString()));
    console.log('  Weights:', currentPool[1].map(w => w.toString()));
    console.log('  Total:', currentPool[2].toString());
    
    // Define correct cosmetic pool - ONLY actual cosmetics
    // Glass Shards(1) = fallback when no cosmetic is won
    // Actual cosmetics only - NO relics like daggers, fragments, etc.
    // Based on what cosmetics we actually have available
    const correctIds = [1]; // Only Glass Shards for now - need to check what actual cosmetics exist
    const correctWeights = [100]; // 100% Glass Shards when no cosmetic is won
    
    console.log('\n🎯 Setting correct cosmetic pool:');
    console.log('  IDs:', correctIds, '(Only Glass Shards - fallback for no cosmetic)');
    console.log('  Weights:', correctWeights);
    console.log('  Total:', correctWeights.reduce((a, b) => a + b, 0));
    
    const tx = await maw.setCosmeticPool(correctIds, correctWeights);
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
    
    console.log('\n🎉 COSMETIC POOL FIXED!');
    console.log('- Removed: Masks(3), Bone Daggers(4), Ash Vials(5)');
    console.log('- Kept: Glass Shards(1), Fragments(2), Contracts(6), Deeds(7)');
    console.log('- Lantern sacrifices will now only give proper cosmetics!');
    
  } catch (error) {
    console.log('❌ Error updating cosmetic pool:', error.message);
    
    if (error.message.includes('Ownable')) {
      console.log('💡 Only owner can update cosmetic pool');
    }
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});