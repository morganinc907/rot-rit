const hre = require("hardhat");

async function main() {
  console.log('🧹 Removing duplicate cosmetic ID 6...');
  
  const [signer] = await hre.ethers.getSigners();
  const cosmeticsAddress = "0x32640D260CeCD52581280e23B9DCc6F49D04Bdcb";
  
  try {
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
    
    console.log('✅ Connected to cosmetics contract');
    console.log('Signer:', signer.address);
    
    // Check current state
    console.log('\n📋 Before cleanup:');
    for (let id = 5; id <= 6; id++) {
      try {
        const exists = await cosmetics.typeExists(id);
        if (exists) {
          const info = await cosmetics.getCosmeticInfo(id);
          console.log(`   ID ${id}: ${info.name} (Active: ${info.active})`);
        }
      } catch (e) {
        console.log(`   ID ${id}: Does not exist`);
      }
    }
    
    // Deactivate ID 6 (duplicate underpants)
    try {
      console.log('\n🔧 Deactivating duplicate cosmetic ID 6...');
      const tx = await cosmetics.setTypeActive(6, false);
      console.log('Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
      
    } catch (error) {
      console.log('❌ Error deactivating cosmetic:', error.message);
      
      // Check if we have permission
      const owner = await cosmetics.owner();
      console.log('Contract owner:', owner);
      console.log('Our address:', signer.address);
      
      if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        console.log('⚠️ Not the owner - cannot deactivate cosmetic');
        return;
      }
    }
    
    // Verify cleanup
    console.log('\n📋 After cleanup:');
    for (let id = 5; id <= 6; id++) {
      try {
        const exists = await cosmetics.typeExists(id);
        if (exists) {
          const info = await cosmetics.getCosmeticInfo(id);
          console.log(`   ID ${id}: ${info.name} (Active: ${info.active})`);
        }
      } catch (e) {
        console.log(`   ID ${id}: Does not exist`);
      }
    }
    
    // Show clean cosmetic list
    console.log('\n🎯 Clean cosmetic list for setup:');
    const cleanCosmetics = [];
    
    for (let id = 1; id <= 5; id++) {
      try {
        const exists = await cosmetics.typeExists(id);
        if (exists) {
          const info = await cosmetics.getCosmeticInfo(id);
          if (info.active) {
            cleanCosmetics.push({
              id: id,
              name: info.name,
              slot: info.slot,
              rarity: info.rarity
            });
          }
        }
      } catch (e) {
        // Skip
      }
    }
    
    console.log('\n✨ Final active cosmetics:');
    cleanCosmetics.forEach(c => {
      console.log(`   ID ${c.id}: ${c.name} (Slot: ${c.slot}, Rarity: ${c.rarity})`);
    });
    
    const activeIds = cleanCosmetics.map(c => c.id);
    console.log('\n📋 Setup commands with clean list:');
    console.log('=' * 50);
    console.log('Active cosmetic IDs:', `[${activeIds.join(', ')}]`);
    console.log('For sacrifice pool:', `[1, ${activeIds.join(', ')}]`); // Glass Shards + cosmetics
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});