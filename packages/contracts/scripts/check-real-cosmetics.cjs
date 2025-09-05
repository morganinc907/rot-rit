const hre = require("hardhat");

async function main() {
  console.log('🎭 Checking the REAL cosmetics contract...');
  
  const [signer] = await hre.ethers.getSigners();
  
  // Use the correct address from addresses.json
  const cosmeticsAddress = "0x32640D260CeCD52581280e23B9DCc6F49D04Bdcb";
  const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  console.log('🔍 Real Cosmetics contract:', cosmeticsAddress);
  console.log('📜 Relics contract (was checking wrong one):', relicsAddress);
  
  try {
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
    
    console.log('\n✅ Connected to real cosmetics contract!');
    
    // Check basic info
    const owner = await cosmetics.owner();
    console.log('Owner:', owner);
    
    try {
      const baseTypeURI = await cosmetics.baseTypeURI();
      console.log('Base Type URI:', baseTypeURI);
    } catch (e) {
      console.log('Base Type URI: (method not available)');
    }
    
    try {
      const currentSetId = await cosmetics.currentMonthlySetId();
      console.log('Current Monthly Set ID:', currentSetId.toString());
    } catch (e) {
      console.log('Current Monthly Set ID: (method not available)');
    }
    
    // Now search for your cosmetics!
    console.log('\n🎭 Searching for existing cosmetics...');
    
    const foundCosmetics = [];
    
    // Check IDs 1-200 for existing cosmetics
    for (let id = 1; id <= 200; id++) {
      try {
        const exists = await cosmetics.typeExists(id);
        if (exists) {
          console.log(`\n✅ Found cosmetic ID ${id}:`);
          
          try {
            const info = await cosmetics.getCosmeticInfo(id);
            foundCosmetics.push({
              id: id,
              name: info.name,
              imageURI: info.imageURI,
              slot: info.slot,
              rarity: info.rarity,
              active: info.active,
              supply: `${info.currentSupply}/${info.maxSupply}`,
              monthlySetId: info.monthlySetId
            });
            
            console.log(`   Name: "${info.name}"`);
            console.log(`   Image: ${info.imageURI}`);
            console.log(`   Slot: ${info.slot}, Rarity: ${info.rarity}`);
            console.log(`   Active: ${info.active}`);
            console.log(`   Supply: ${info.currentSupply}/${info.maxSupply}`);
            console.log(`   Monthly Set: ${info.monthlySetId}`);
          } catch (infoError) {
            console.log(`   (Exists but couldn't get info: ${infoError.message})`);
            foundCosmetics.push({ id: id, error: infoError.message });
          }
        }
      } catch (e) {
        // ID doesn't exist, continue
      }
    }
    
    // Summary and setup commands
    console.log('\n' + '='.repeat(60));
    console.log('📊 COSMETICS DISCOVERY SUMMARY');
    console.log('='.repeat(60));
    
    if (foundCosmetics.length > 0) {
      console.log(`🎯 Found ${foundCosmetics.length} cosmetics!`);
      
      const validCosmetics = foundCosmetics.filter(c => !c.error);
      const activeCosmetics = validCosmetics.filter(c => c.active);
      
      if (activeCosmetics.length > 0) {
        console.log(`\n✅ Active Cosmetics (${activeCosmetics.length}):`);
        activeCosmetics.forEach(c => {
          console.log(`   ID ${c.id}: ${c.name} (Slot: ${c.slot}, Rarity: ${c.rarity})`);
        });
        
        console.log('\n🏪 STORE SETUP COMMANDS:');
        console.log('=' * 30);
        const activeIds = activeCosmetics.map(c => c.id);
        
        console.log('1. Set seasonal cosmetics for store:');
        console.log(`export COSMETICS="${cosmeticsAddress}"`);
        console.log(`export ACTIVE_IDS="[${activeIds.join(',')}]"`);
        console.log(`cast send $COSMETICS "setCurrentCosmeticTypes(uint256[])" "$ACTIVE_IDS" --rpc-url $RPC --private-key $OWNER_PK`);
        
        console.log('\n2. Set MAW sacrifice pool:');
        console.log(`export MAW="0xB2e77ce03BC688C993Ee31F03000c56c211AD7db"`);
        console.log(`export POOL_IDS="[1,${activeIds.join(',')}]"  # Glass Shards + cosmetics`);
        console.log(`export WEIGHTS="[${Array(activeIds.length + 1).fill(100).join(',')}]"  # Equal weights`);
        console.log(`cast send $MAW "setCosmeticPool(uint256[],uint256[])" "$POOL_IDS" "$WEIGHTS" --rpc-url $RPC --private-key $OWNER_PK`);
        
        console.log('\n📋 Copy/paste ready commands:');
        console.log(`PRIVATE_KEY=b861c6884ab3a602c54896010176bc4f89c563daba457b00a7838f5eb135cd45 npx hardhat run scripts/setup-found-cosmetics.js --network baseSepolia`);
      }
      
      const inactiveCosmetics = validCosmetics.filter(c => !c.active);
      if (inactiveCosmetics.length > 0) {
        console.log(`\n⚠️ Inactive Cosmetics (${inactiveCosmetics.length}):`);
        inactiveCosmetics.forEach(c => {
          console.log(`   ID ${c.id}: ${c.name} (INACTIVE)`);
        });
      }
      
    } else {
      console.log('❌ No cosmetics found in the real contract either');
      console.log('💡 You may need to create cosmetics first');
    }
    
    // Check monthly sets too
    console.log('\n🗓️ Monthly Sets Check:');
    try {
      const currentSet = await cosmetics.currentMonthlySetId();
      console.log(`Current set: ${currentSet}`);
      
      for (let setId = 1; setId <= 5; setId++) {
        try {
          const setCosmetics = [];
          for (let i = 0; i < 10; i++) {
            try {
              const cosmeticId = await cosmetics.monthlySetCosmetics(setId, i);
              if (cosmeticId.toString() !== '0') {
                setCosmetics.push(cosmeticId.toString());
              }
            } catch (e) {
              break;
            }
          }
          
          if (setCosmetics.length > 0) {
            console.log(`   Set ${setId}: [${setCosmetics.join(', ')}]`);
          }
        } catch (e) {
          // Set doesn't exist
        }
      }
    } catch (e) {
      console.log('Monthly sets not available');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});