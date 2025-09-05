const hre = require("hardhat");

async function main() {
  console.log('🔧 Fixing cosmetic pool - restoring all cosmetic types...');
  
  const [signer] = await hre.ethers.getSigners();
  console.log('Signer:', signer.address);
  
  const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawAddress);
  
  try {
    // Restore full cosmetic pool (all cosmetic types should be available as rewards)
    const allIds = [1, 2, 3, 4, 5, 6];
    const allWeights = [100, 50, 50, 25, 50, 50]; // Original weights
    
    console.log('🎯 Restoring full cosmetic pool:');
    console.log('  IDs:', allIds);
    console.log('  Weights:', allWeights);
    
    const tx = await maw.setCosmeticPool(allIds, allWeights);
    console.log('Transaction sent:', tx.hash);
    
    console.log('⏳ Waiting for confirmation...');
    await tx.wait();
    console.log('✅ Cosmetic pool restored successfully');
    
    // Verify
    const updatedPool = await maw.getCosmeticPool();
    console.log('\n✅ Restored pool:');
    console.log('  IDs:', updatedPool[0].map(id => id.toString()));
    console.log('  Weights:', updatedPool[1].map(w => w.toString()));
    console.log('  Total:', updatedPool[2].toString());
    
    console.log('\n💡 Next: Only disable the INPUT bonus mechanics (masks/vials as sacrifice inputs)');
    console.log('💡 Keep: All cosmetic types as possible REWARDS');
    
  } catch (error) {
    console.log('❌ Error restoring pool:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});