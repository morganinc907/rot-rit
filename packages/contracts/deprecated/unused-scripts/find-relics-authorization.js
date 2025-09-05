/**
 * Find how to authorize burning on the Relics contract
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('🔍 Finding Relics authorization mechanism...\n');
  
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  
  console.log('📄 Relics contract:', RELICS_ADDRESS);
  console.log('📄 Proxy contract:', PROXY_ADDRESS);
  
  const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
  const [signer] = await ethers.getSigners();
  
  try {
    // Check if we're the owner
    const owner = await relics.owner();
    console.log('👤 Relics owner:', owner);
    console.log('👤 Our address:', signer.address);
    console.log('👑 We are owner:', owner.toLowerCase() === signer.address.toLowerCase());
    
    // Check what authorization-related functions exist
    console.log('\n🔍 Looking for authorization functions...');
    const authFunctions = [
      'setBurner',
      'addBurner',
      'removeBurner',
      'setBurners',
      'authorize',
      'unauthorize', 
      'setAuthorized',
      'grantRole',
      'addMinter',
      'setMinter',
      'allowBurn',
      'authorizeBurn',
      'burners',
      'authorizedBurners',
      'isBurner',
      'isAuthorized'
    ];
    
    for (const funcName of authFunctions) {
      try {
        if (relics[funcName]) {
          console.log(`✅ ${funcName} - exists`);
          
          // Try to call read-only functions
          if (funcName.startsWith('is') || funcName.includes('burner')) {
            try {
              const result = await relics[funcName](PROXY_ADDRESS);
              console.log(`   📊 ${funcName}(proxy): ${result}`);
            } catch (e) {
              console.log(`   ❌ ${funcName}(proxy) failed: ${e.message.split('\n')[0]}`);
            }
          }
        }
      } catch (e) {
        // Function doesn't exist
      }
    }
    
    // Try to examine the burn function signature and requirements
    console.log('\n🔍 Analyzing burn function...');
    try {
      // Get the function interface
      const burnFunction = relics.interface.getFunction('burn');
      if (burnFunction) {
        console.log('🔥 Burn function signature:', burnFunction.format());
      }
    } catch (e) {
      console.log('❌ Could not get burn function info');
    }
    
    // Try to see if it's as simple as setting approval
    console.log('\n🔍 Checking if it uses setApprovalForAll...');
    try {
      const isApproved = await relics.isApprovedForAll(signer.address, PROXY_ADDRESS);
      console.log('📋 User approved proxy for all:', isApproved);
      
      // Try setting approval as owner
      if (!isApproved) {
        console.log('🔧 Setting approval for all...');
        const tx = await relics.setApprovalForAll(PROXY_ADDRESS, true);
        console.log('📝 Transaction sent:', tx.hash);
        await tx.wait();
        console.log('✅ Approval set!');
        
        // Test if burn works now
        try {
          await relics.burn.staticCall(signer.address, 2, 1); // Try burning 1 fragment (ID 2)
          console.log('✅ Burn authorization now works!');
        } catch (e) {
          console.log('❌ Burn still fails:', e.message.split('\n')[0]);
        }
      }
    } catch (e) {
      console.log('❌ Approval check failed:', e.message.split('\n')[0]);
    }
    
  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
  }
}

main().catch(console.error);