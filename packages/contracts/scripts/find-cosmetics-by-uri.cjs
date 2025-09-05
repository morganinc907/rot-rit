const hre = require("hardhat");

async function main() {
  console.log('🔍 Finding cosmetics by checking IPFS URIs...');
  
  const [signer] = await hre.ethers.getSigners();
  const cosmeticsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  try {
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
    
    // Check base URIs first
    const baseTypeURI = await cosmetics.baseTypeURI();
    const boundBaseURI = await cosmetics.boundBaseURI();
    
    console.log('\n📋 Base URIs:');
    console.log('  Base Type URI:', baseTypeURI);
    console.log('  Bound Base URI:', boundBaseURI);
    
    // Check URIs for IDs 0-500 to find existing cosmetics
    console.log('\n🎭 Checking URIs for cosmetic IDs...');
    
    const foundCosmetics = [];
    
    for (let id = 0; id <= 500; id++) {
      try {
        const uri = await cosmetics.uri(id);
        
        // Check if it's a real cosmetic (not default) and points to IPFS
        if (uri && uri !== '' && uri.includes('ipfs')) {
          console.log(`   ✅ ID ${id}: ${uri}`);
          
          // Try to get more info about this cosmetic
          try {
            const exists = await cosmetics.typeExists(id);
            if (exists) {
              const info = await cosmetics.getCosmeticInfo(id);
              foundCosmetics.push({
                id: id,
                uri: uri,
                name: info.name,
                imageURI: info.imageURI,
                slot: info.slot,
                rarity: info.rarity,
                active: info.active,
                supply: `${info.currentSupply}/${info.maxSupply}`
              });
              console.log(`     Name: ${info.name}`);
              console.log(`     Image: ${info.imageURI}`);
              console.log(`     Slot: ${info.slot}, Rarity: ${info.rarity}`);
              console.log(`     Active: ${info.active}, Supply: ${info.currentSupply}/${info.maxSupply}`);
            } else {
              console.log(`     (URI exists but typeExists = false)`);
            }
          } catch (e) {
            console.log(`     (URI exists but couldn't get info: ${e.message})`);
          }
        }
      } catch (e) {
        // No URI for this ID, continue
      }
    }
    
    console.log('\n📊 Summary:');
    console.log('='.repeat(60));
    
    if (foundCosmetics.length > 0) {
      console.log(`🎯 Found ${foundCosmetics.length} cosmetics with IPFS URIs:`);
      
      const activeCosmetics = foundCosmetics.filter(c => c.active);
      const inactiveCosmetics = foundCosmetics.filter(c => !c.active);
      
      if (activeCosmetics.length > 0) {
        console.log(`\n✅ Active Cosmetics (${activeCosmetics.length}):`);
        activeCosmetics.forEach(c => {
          console.log(`   ID ${c.id}: ${c.name} (Slot: ${c.slot}, Rarity: ${c.rarity})`);
          console.log(`   Image: ${c.imageURI}`);
        });
        
        console.log('\n🔧 For Store Season Setup:');
        const activeIds = activeCosmetics.map(c => c.id);
        console.log(`   Active IDs: [${activeIds.join(', ')}]`);
        console.log(`   Cast command: cast send $COSMETICS "setCurrentCosmeticTypes(uint256[])" "[${activeIds.join(',')}]" --rpc-url $RPC --private-key $OWNER_PK`);
        
        console.log('\n🎲 For MAW Sacrifice Pool:');
        console.log(`   Pool IDs: [1, ${activeIds.join(', ')}] # Glass Shards + cosmetics`);
        console.log(`   Equal weights: [${Array(activeIds.length + 1).fill(50).join(', ')}]`);
        console.log(`   Cast command: cast send $MAW "setCosmeticPool(uint256[],uint256[])" "[1,${activeIds.join(',')}]" "[${Array(activeIds.length + 1).fill(50).join(',')}]" --rpc-url $RPC --private-key $OWNER_PK`);
      }
      
      if (inactiveCosmetics.length > 0) {
        console.log(`\n⚠️ Inactive Cosmetics (${inactiveCosmetics.length}):`);
        inactiveCosmetics.forEach(c => {
          console.log(`   ID ${c.id}: ${c.name} (INACTIVE)`);
        });
      }
      
    } else {
      console.log('❌ No cosmetics with IPFS URIs found');
      console.log('💡 You may need to create cosmetics first using createCosmeticType()');
    }
    
    // Check if any standard metadata URIs exist that might be cosmetics
    console.log('\n🔍 Checking for any non-IPFS URIs that might be cosmetics:');
    
    let otherUris = 0;
    for (let id = 0; id <= 100; id++) {
      try {
        const uri = await cosmetics.uri(id);
        if (uri && uri !== '' && !uri.includes('ipfs') && !uri.includes(baseTypeURI) && !uri.includes(boundBaseURI)) {
          console.log(`   ID ${id}: ${uri}`);
          otherUris++;
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (otherUris === 0) {
      console.log('   (No other URIs found)');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});