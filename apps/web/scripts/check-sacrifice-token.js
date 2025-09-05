#!/usr/bin/env node

/**
 * Check what token ID the sacrificeKeys function uses
 */

const { ethers } = require('ethers');

const MAW_ADDRESS = '0xB2e77ce03BC688C993Ee31F03000c56c211AD7db';

// Try different function signatures that might exist
const POSSIBLE_FUNCTIONS = [
  {
    name: 'sacrificeTokenId',
    signature: 'function sacrificeTokenId() view returns (uint256)'
  },
  {
    name: 'rustedKeyId', 
    signature: 'function rustedKeyId() view returns (uint256)'
  },
  {
    name: 'SACRIFICE_TOKEN_ID',
    signature: 'function SACRIFICE_TOKEN_ID() view returns (uint256)'
  }
];

async function checkSacrificeToken() {
  console.log('🔍 Checking what token ID sacrificeKeys uses...\n');
  
  const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
  
  for (const func of POSSIBLE_FUNCTIONS) {
    try {
      console.log(`Trying ${func.name}()...`);
      const abi = [func.signature];
      const contract = new ethers.Contract(MAW_ADDRESS, abi, provider);
      const result = await contract[func.name]();
      console.log(`✅ ${func.name}(): ${result}`);
      
      if (result.toString() === '0') {
        console.log('   ✅ GOOD: Uses token ID 0 (Rusted Caps)');
      } else {
        console.log(`   ⚠️  WARNING: Uses token ID ${result} (not Rusted Caps)`);
      }
      
    } catch (error) {
      console.log(`❌ ${func.name}() not found or failed`);
    }
  }
  
  console.log('\n🎯 Expected: Token ID 0 should be used for Rusted Caps');
  console.log('💡 If wrong token ID is configured, the contract needs to be updated');
}

checkSacrificeToken();