/**
 * Debug what interface the V3 proxy actually supports
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('🔍 Debugging V3 proxy interface...\n');
  
  const V3_PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  console.log('📄 V3 Proxy:', V3_PROXY_ADDRESS);
  
  try {
    // Try different contract types to see what works
    const contractTypes = ["MawSacrificeV3Upgradeable", "MawSacrificeV4Upgradeable"];
    
    for (const contractType of contractTypes) {
      try {
        console.log(`\n🧪 Trying ${contractType}...`);
        const contract = await ethers.getContractAt(contractType, V3_PROXY_ADDRESS);
        
        // Test common functions
        const testFunctions = [
          'sacrificeKeys',
          'getMonthlyCosmeticTypes', 
          'setMonthlyCosmeticTypes',
          'cosmeticsContract',
          'paused',
          'lastSacrificeBlock'
        ];
        
        for (const funcName of testFunctions) {
          try {
            if (contract[funcName]) {
              console.log(`  ✅ ${funcName} - exists`);
              
              // Try to call read-only functions
              if (funcName === 'paused') {
                const result = await contract[funcName]();
                console.log(`     paused: ${result}`);
              } else if (funcName === 'cosmeticsContract') {
                const result = await contract[funcName]();
                console.log(`     cosmetics address: ${result}`);
              } else if (funcName === 'getMonthlyCosmeticTypes') {
                const result = await contract[funcName]();
                console.log(`     cosmetic types: ${result.map(t => t.toString())}`);
              }
            }
          } catch (e) {
            console.log(`  ❌ ${funcName} - ${e.message.split('\n')[0]}`);
          }
        }
        
        break; // If we got here, this contract type worked
        
      } catch (e) {
        console.log(`❌ ${contractType} failed: ${e.message.split('\n')[0]}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

main().catch(console.error);