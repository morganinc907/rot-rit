const hre = require("hardhat");

async function main() {
  console.log('🔍 Comprehensive search for existing cosmetics...');
  
  const [signer] = await hre.ethers.getSigners();
  const cosmeticsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  try {
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
    
    console.log('\n📋 Contract address:', cosmeticsAddress);
    console.log('Signer address:', signer.address);
    
    // Method 1: Check _nextTypeId to see range
    try {
      // This is private but let's see if we can get events
      console.log('\n🎭 Method 1: Checking events for created cosmetics...');
      
      // Get CosmeticTypeCreated events
      const filter = cosmetics.filters.CosmeticTypeCreated();
      const events = await cosmetics.queryFilter(filter, 0, 'latest');
      
      console.log(`Found ${events.length} CosmeticTypeCreated events:`);
      events.forEach((event, i) => {
        console.log(`   ${i + 1}. Type ID ${event.args.typeId}: "${event.args.name}" (Rarity: ${event.args.rarity}, Slot: ${event.args.slot})`);
      });
      
      if (events.length > 0) {
        // Now check if these types still exist and are active
        console.log('\n🔍 Checking status of found cosmetics:');
        
        for (const event of events) {
          const typeId = event.args.typeId;
          try {
            const exists = await cosmetics.typeExists(typeId);
            if (exists) {
              const info = await cosmetics.getCosmeticInfo(typeId);
              console.log(`   ✅ ID ${typeId}: ${info.name} (Active: ${info.active}, Supply: ${info.currentSupply}/${info.maxSupply})`);
            } else {
              console.log(`   ❌ ID ${typeId}: No longer exists`);
            }
          } catch (e) {
            console.log(`   ⚠️ ID ${typeId}: Error checking - ${e.message}`);
          }
        }
      }
      
    } catch (e) {
      console.log('❌ Event search failed:', e.message);
    }
    
    // Method 2: Check storage slots or other ways
    console.log('\n🎭 Method 2: Brute force check higher IDs...');
    
    const foundCosmetics = [];
    for (let id = 1; id <= 200; id++) {
      try {
        const exists = await cosmetics.typeExists(id);
        if (exists) {
          const info = await cosmetics.getCosmeticInfo(id);
          foundCosmetics.push({
            id: id,
            name: info.name,
            active: info.active,
            supply: `${info.currentSupply}/${info.maxSupply}`,
            slot: info.slot,
            rarity: info.rarity
          });
        }
      } catch (e) {
        // Not found
      }
    }
    
    if (foundCosmetics.length > 0) {
      console.log(`\n🎯 Found ${foundCosmetics.length} cosmetics by brute force:`);
      foundCosmetics.forEach(c => {
        console.log(`   ID ${c.id}: ${c.name} (Slot: ${c.slot}, Rarity: ${c.rarity}, Active: ${c.active}, Supply: ${c.supply})`);
      });
    } else {
      console.log('\n❌ No cosmetics found by brute force either');
    }
    
    // Method 3: Check monthly sets
    console.log('\n🎭 Method 3: Checking monthly sets...');
    
    try {
      const currentSet = await cosmetics.currentMonthlySetId();
      console.log(`Current monthly set: ${currentSet}`);
      
      // Check sets 0-10
      for (let setId = 0; setId <= 10; setId++) {
        try {
          const cosmetics_in_set = [];
          for (let slot = 0; slot < 20; slot++) {
            try {
              const cosmeticId = await cosmetics.monthlySetCosmetics(setId, slot);
              if (cosmeticId.toString() !== '0') {
                cosmetics_in_set.push(cosmeticId.toString());
              } else if (slot === 0) {
                // Check if 0 is a valid cosmetic or just empty
                const exists = await cosmetics.typeExists(0);
                if (exists) {
                  cosmetics_in_set.push('0');
                }
              }
            } catch (e) {
              break; // No more in this set
            }
          }
          
          if (cosmetics_in_set.length > 0) {
            console.log(`   Set ${setId}: [${cosmetics_in_set.join(', ')}]`);
          }
        } catch (e) {
          // Set doesn't exist
        }
      }
    } catch (e) {
      console.log('❌ Monthly set check failed:', e.message);
    }
    
    // Method 4: Check contract methods available
    console.log('\n🎭 Method 4: Available contract methods:');
    const fragment = cosmetics.interface.fragments;
    const viewFunctions = [];
    
    Object.keys(fragment).forEach(key => {
      const func = fragment[key];
      if (func.type === 'function' && func.stateMutability === 'view') {
        viewFunctions.push(`${func.name}(${func.inputs.map(i => i.type).join(', ')})`);
      }
    });
    
    console.log('Available view functions:');
    viewFunctions.forEach(f => console.log(`   ${f}`));
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});