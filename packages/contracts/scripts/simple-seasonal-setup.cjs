const hre = require("hardhat");

async function main() {
  console.log('🔧 Simple seasonal setup with proper gas...');
  
  const [signer] = await hre.ethers.getSigners();
  const cosmeticsAddress = "0x13290aCbf346B17E82C8be01178A7b74F20F748d";
  const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  
  try {
    // Step 1: Set seasonal cosmetics
    console.log('\n🎭 Step 1: Setting seasonal cosmetics...');
    
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
    
    // Check what we have first
    console.log('Current cosmetics status:');
    for (let id = 1; id <= 5; id++) {
      try {
        const exists = await cosmetics.typeExists(id);
        const info = await cosmetics.getCosmeticInfo(id);
        console.log(`   ID ${id}: ${info.name} (Active: ${info.active})`);
      } catch (e) {
        console.log(`   ID ${id}: Error - ${e.message.slice(0, 50)}`);
      }
    }
    
    // Set current types with gas settings
    const seasonCosmetics = [1, 2, 3, 4, 5];
    console.log(`\nSetting getCurrentCosmeticTypes to: [${seasonCosmetics.join(', ')}]`);
    
    const setSeasonTx = await cosmetics.setCurrentCosmeticTypes(seasonCosmetics, {
      gasLimit: 300000,
      gasPrice: hre.ethers.parseUnits('2', 'gwei')
    });
    
    console.log('Transaction sent:', setSeasonTx.hash);
    await setSeasonTx.wait();
    console.log('✅ Season setup complete!');
    
    // Verify
    const currentTypes = await cosmetics.getCurrentCosmeticTypes();
    console.log('Verification:', currentTypes.map(t => Number(t)));
    
    // Wait before next transaction
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 2: Set sacrifice pool  
    console.log('\n🎲 Step 2: Setting sacrifice pool...');
    
    const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawAddress);
    
    // Check current pool
    try {
      const currentPool = await maw.getCosmeticPool();
      console.log('Current pool:', {
        ids: currentPool[0].map(id => Number(id)),
        weights: currentPool[1].map(w => Number(w)),
        total: Number(currentPool[2])
      });
    } catch (e) {
      console.log('Could not read current pool');
    }
    
    // Set new pool: Glass Shards + cosmetics
    const poolIds = [1, 1, 2, 3, 4, 5]; // Glass Shards + your cosmetics
    const poolWeights = [100, 100, 100, 100, 100, 100]; // Equal weights
    
    console.log(`Setting pool IDs: [${poolIds.join(', ')}]`);
    console.log(`Setting weights: [${poolWeights.join(', ')}]`);
    
    const setPoolTx = await maw.setCosmeticPool(poolIds, poolWeights, {
      gasLimit: 400000,
      gasPrice: hre.ethers.parseUnits('2', 'gwei')
    });
    
    console.log('Transaction sent:', setPoolTx.hash);
    await setPoolTx.wait();
    console.log('✅ Sacrifice pool complete!');
    
    // Final verification
    const finalPool = await maw.getCosmeticPool();
    console.log('Final pool:', {
      ids: finalPool[0].map(id => Number(id)),
      weights: finalPool[1].map(w => Number(w)),
      total: Number(finalPool[2])
    });
    
    const finalTypes = await cosmetics.getCurrentCosmeticTypes();
    console.log('Final season types:', finalTypes.map(t => Number(t)));
    
    console.log('\n🎉 SETUP COMPLETE!');
    console.log('✅ Store will show your 5 cosmetics');
    console.log('✅ Sacrifices will give Glass Shards OR cosmetics');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});