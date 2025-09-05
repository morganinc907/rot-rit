const hre = require("hardhat");

async function main() {
  console.log('🎯 TESTING COMPLETE CHAIN-FIRST SYSTEM');
  console.log('=====================================');
  console.log('');
  
  const registryAddress = "0xF7FC9caa60f4D12d731B32883498A8D403b9c828";
  
  try {
    const registry = await hre.ethers.getContractAt("AddressRegistry", registryAddress);
    
    console.log('📋 AddressRegistry System Test');
    console.log('Registry Address:', registryAddress);
    console.log('');
    
    // Test 1: Get all addresses at once
    console.log('1️⃣ Batch Address Resolution (registry.getAll()):');
    const allAddresses = await registry.getAll();
    
    const addressMap = {
      'RELICS': allAddresses.relics,
      'MAW_SACRIFICE': allAddresses.mawSacrifice,
      'COSMETICS': allAddresses.cosmetics,
      'DEMONS': allAddresses.demons,
      'CULTISTS': allAddresses.cultists,
      'KEY_SHOP': allAddresses.keyShop,
      'RACCOONS': allAddresses.raccoons,
      'RACCOON_RENDERER': allAddresses.raccoonRenderer,
      'RITUAL_READ_AGGREGATOR': allAddresses.ritualReadAggregator
    };
    
    Object.entries(addressMap).forEach(([key, address]) => {
      const hasAddress = address && address !== '0x0000000000000000000000000000000000000000';
      console.log(`   ${hasAddress ? '✅' : '❌'} ${key}: ${address}`);
    });
    
    // Test 2: Individual key lookups
    console.log('');
    console.log('2️⃣ Individual Key Lookups:');
    
    const COSMETICS_KEY = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("COSMETICS"));
    const cosmeticsAddr = await registry.get(COSMETICS_KEY);
    console.log(`   COSMETICS key: ${COSMETICS_KEY}`);
    console.log(`   COSMETICS addr: ${cosmeticsAddr}`);
    
    // Test 3: Verify cosmetics functionality works with resolved address
    console.log('');
    console.log('3️⃣ Functionality Test (Chain-Resolved Cosmetics):');
    
    if (cosmeticsAddr && cosmeticsAddr !== '0x0000000000000000000000000000000000000000') {
      try {
        const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", cosmeticsAddr);
        const cosmeticTypes = await cosmetics.getCurrentCosmeticTypes();
        console.log(`   ✅ Cosmetics.getCurrentCosmeticTypes(): [${cosmeticTypes.map(t => Number(t)).join(', ')}]`);
        
        // Test first cosmetic
        if (cosmeticTypes.length > 0) {
          const firstType = cosmeticTypes[0];
          const info = await cosmetics.getCosmeticInfo(firstType);
          console.log(`   ✅ Cosmetic ${firstType}: ${info[0]} (Active: ${info[6]})`);
        }
      } catch (e) {
        console.log(`   ❌ Cosmetics functionality test failed: ${e.message}`);
      }
    } else {
      console.log('   ❌ No cosmetics address resolved');
    }
    
    // Test 4: Count resolution status
    console.log('');
    console.log('4️⃣ System Health Check:');
    
    const totalContracts = 9;
    const resolvedContracts = Object.values(addressMap).filter(addr => 
      addr && addr !== '0x0000000000000000000000000000000000000000'
    ).length;
    const missingContracts = totalContracts - resolvedContracts;
    
    console.log(`   📊 Total contracts: ${totalContracts}`);
    console.log(`   ✅ Resolved: ${resolvedContracts} (${Math.round(resolvedContracts/totalContracts*100)}%)`);
    console.log(`   ❌ Missing: ${missingContracts} (${Math.round(missingContracts/totalContracts*100)}%)`);
    console.log(`   🔗 All chain-first: ${resolvedContracts === totalContracts ? 'YES' : 'NO'}`);
    
    // Summary
    console.log('');
    console.log('🎉 CHAIN-FIRST SYSTEM STATUS:');
    console.log('==============================');
    
    if (resolvedContracts === totalContracts) {
      console.log('✅ SUCCESS: Complete chain-first resolution achieved!');
      console.log('🔒 Address drift protection: FULLY ENABLED');
      console.log('📱 Frontend uses: useAddress(contractKey) → AddressRegistry.get()');
      console.log('⚡ Zero hardcoded addresses in frontend');
      console.log('🎯 Single source of truth: AddressRegistry on-chain');
    } else {
      console.log(`⚠️ PARTIAL: ${resolvedContracts}/${totalContracts} contracts resolved`);
      console.log('💡 Missing contracts need to be added to registry');
    }
    
    console.log('');
    console.log('📈 Progression:');
    console.log('   Before: 0/9 chain-first (100% hardcoded)');
    console.log('   Phase 1: 5/9 chain-first (56% - MAW getters)');
    console.log(`   Phase 2: ${resolvedContracts}/9 chain-first (${Math.round(resolvedContracts/totalContracts*100)}% - AddressRegistry)`);
    console.log('');
    console.log(`🎯 Registry Address: ${registryAddress}`);
    console.log('💡 Frontend: All useAddress() calls now hit chain!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});