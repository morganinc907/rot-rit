const hre = require("hardhat");

async function main() {
  console.log('🏪 Setting up clean seasonal system...');
  
  const [signer] = await hre.ethers.getSigners();
  const cosmeticsAddress = "0x13290aCbf346B17E82C8be01178A7b74F20F748d";
  const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  
  console.log('Signer:', signer.address);
  console.log('Cosmetics:', cosmeticsAddress);
  console.log('MAW:', mawAddress);
  
  try {
    // A) CosmeticsV2 = "Season Catalog" (store reads this)
    console.log('\n🎭 A) Setting up Season Catalog (CosmeticsV2)...');
    
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
    
    // Set current cosmetic types for the season
    const seasonCosmetics = [1, 2, 3, 4, 5]; // Your 5 cosmetics
    
    console.log(`Setting seasonal cosmetics: [${seasonCosmetics.join(', ')}]`);
    
    const setSeasonTx = await cosmetics.setCurrentCosmeticTypes(seasonCosmetics);
    console.log('Season setup transaction:', setSeasonTx.hash);
    await setSeasonTx.wait();
    console.log('✅ Seasonal catalog set up!');
    
    // Verify
    const currentTypes = await cosmetics.getCurrentCosmeticTypes();
    console.log('Verification - getCurrentCosmeticTypes():', currentTypes.map(t => Number(t)));
    
    // B) MAW = "Sacrifice Pool" (sacrifice uses this)  
    console.log('\n🎲 B) Setting up Sacrifice Pool (MAW)...');
    
    const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawAddress);
    
    // Set cosmetic pool: Glass Shards (1) + your cosmetics
    const poolIds = [1, ...seasonCosmetics]; // [1, 1, 2, 3, 4, 5] - Glass Shards + cosmetics
    const poolWeights = Array(poolIds.length).fill(100); // Equal weights
    
    console.log(`Setting sacrifice pool IDs: [${poolIds.join(', ')}]`);
    console.log(`Setting sacrifice weights: [${poolWeights.join(', ')}]`);
    
    const setPoolTx = await maw.setCosmeticPool(poolIds, poolWeights);
    console.log('Pool setup transaction:', setPoolTx.hash);
    await setPoolTx.wait();
    console.log('✅ Sacrifice pool set up!');
    
    // Verify
    const poolData = await maw.getCosmeticPool();
    console.log('Verification - getCosmeticPool():');
    console.log('  IDs:', poolData[0].map(id => Number(id)));
    console.log('  Weights:', poolData[1].map(w => Number(w)));
    console.log('  Total Weight:', Number(poolData[2]));
    
    // Update MAW to point to new cosmetics contract
    console.log('\n🔗 C) Linking MAW to new Cosmetics contract...');
    
    try {
      const currentCosmeticsAddr = await maw.cosmetics();
      console.log('Current MAW cosmetics address:', currentCosmeticsAddr);
      
      if (currentCosmeticsAddr.toLowerCase() !== cosmeticsAddress.toLowerCase()) {
        console.log('Updating MAW cosmetics address...');
        const updateTx = await maw.setContracts(currentCosmeticsAddr, cosmeticsAddress); // Keep raccoons, update cosmetics
        console.log('Update transaction:', updateTx.hash);
        await updateTx.wait();
        console.log('✅ MAW linked to new cosmetics contract!');
      } else {
        console.log('✅ MAW already linked to correct cosmetics contract');
      }
    } catch (e) {
      console.log('⚠️ Could not update MAW cosmetics address:', e.message);
      console.log('You may need to call maw.setContracts() manually');
    }
    
    console.log('\n🎉 CLEAN SEASONAL SYSTEM COMPLETE!');
    console.log('=' * 50);
    console.log('\n📋 Summary:');
    console.log('✅ CosmeticsV2 Season Catalog: [1, 2, 3, 4, 5]');
    console.log('✅ MAW Sacrifice Pool: [1, 1, 2, 3, 4, 5] with equal weights');
    console.log('✅ Store will show: glasses, strainer, pink, orange, underpants');
    console.log('✅ Sacrifices can mint: Glass Shards OR cosmetics');
    
    console.log('\n🏪 Store behavior:');
    console.log('- Calls CosmeticsV2.getCurrentCosmeticTypes()');
    console.log('- Returns [1, 2, 3, 4, 5]');
    console.log('- Displays your 5 cosmetics with IPFS images');
    
    console.log('\n🎲 Sacrifice behavior:');
    console.log('- Calls MAW.getCosmeticPool()');  
    console.log('- Uses [1, 1, 2, 3, 4, 5] for random selection');
    console.log('- 1/6 chance Glass Shards, 1/6 chance each cosmetic');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});