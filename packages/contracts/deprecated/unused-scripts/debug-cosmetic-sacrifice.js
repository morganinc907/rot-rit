/**
 * Debug why cosmetic sacrifices are only giving glass shards
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('🎨 Debugging cosmetic sacrifice...\n');
  
  const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  
  console.log('📄 Proxy contract:', PROXY_ADDRESS);
  console.log('👤 User:', USER_ADDRESS);
  
  try {
    const proxy = await ethers.getContractAt("MawSacrificeV4Upgradeable", PROXY_ADDRESS);
    const relics = await ethers.getContractAt("Relics", "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b");
    
    // Check user's fragment balance
    const fragmentBalance = await relics.balanceOf(USER_ADDRESS, 2); // Fragments are ID 2
    console.log('🧩 User fragment balance:', fragmentBalance.toString());
    
    if (fragmentBalance.toString() === '0') {
      console.log('❌ No fragments to sacrifice!');
      return;
    }
    
    // Check what functions exist for cosmetic sacrifices
    console.log('\n🧪 Testing cosmetic sacrifice functions...');
    const cosmeticFunctions = [
      'sacrificeForCosmetic',
      'sacrificeCosmetics', 
      'sacrifice',
      'sacrificeFragments',
      'sacrificeForCosmetics'
    ];
    
    for (const funcName of cosmeticFunctions) {
      try {
        if (proxy[funcName]) {
          console.log(`✅ ${funcName} - exists`);
          
          // Try to call it
          try {
            const result = await proxy[funcName].staticCall(1, 0);
            console.log(`   📊 ${funcName} static call result:`, result);
          } catch (e) {
            console.log(`   ❌ ${funcName} static call failed: ${e.message.split('\n')[0]}`);
          }
        } else {
          console.log(`❌ ${funcName} - does not exist`);
        }
      } catch (e) {
        console.log(`❌ ${funcName} - error: ${e.message.split('\n')[0]}`);
      }
    }
    
    // Check if cosmetic types are actually set
    console.log('\n🔍 Checking cosmetic configuration...');
    try {
      // Try different ways to check cosmetic types
      const methods = ['getMonthlyCosmeticTypes', 'monthlyCosmeticTypes', 'cosmeticTypes'];
      
      for (const method of methods) {
        try {
          if (proxy[method]) {
            const types = await proxy[method]();
            console.log(`✅ ${method}:`, types.map ? types.map(t => t.toString()) : types.toString());
            break;
          }
        } catch (e) {
          console.log(`❌ ${method}: ${e.message.split('\n')[0]}`);
        }
      }
    } catch (e) {
      console.log('⚠️  Could not check cosmetic types');
    }
    
    // Check cosmetics contract
    try {
      const cosmeticsAddr = await proxy.cosmeticsContract();
      console.log('🏭 Cosmetics contract:', cosmeticsAddr);
      
      // Check if it's the right address
      const expectedAddr = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
      if (cosmeticsAddr.toLowerCase() === expectedAddr.toLowerCase()) {
        console.log('✅ Correct cosmetics contract');
      } else {
        console.log('❌ Wrong cosmetics contract!');
        console.log('   Expected:', expectedAddr);
      }
    } catch (e) {
      console.log('⚠️  Could not check cosmetics contract:', e.message.split('\n')[0]);
    }
    
    // Check if contract is paused or has issues
    console.log('\n🔍 Checking contract state...');
    const paused = await proxy.paused();
    console.log('⏸️ Contract paused:', paused);
    
    try {
      const sacrificesPaused = await proxy.sacrificesPaused();
      console.log('⏸️ Sacrifices paused:', sacrificesPaused);
    } catch (e) {
      console.log('⚠️  Could not check sacrifices paused');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

main().catch(console.error);