#!/usr/bin/env node

/**
 * Compare different sacrifice functions to see why rusted caps fail
 */

const { ethers } = require('ethers');

const MAW_ADDRESS = '0xB2e77ce03BC688C993Ee31F03000c56c211AD7db';
const USER_ADDRESS = '0x52257934A41c55F4758b92F4D23b69f920c3652A';

// Different sacrifice functions that might exist
const SACRIFICE_FUNCTIONS = [
  'function sacrificeKeys(uint256 amount) external',
  'function sacrifice(uint256 amount) external', 
  'function sacrificeCosmetic(uint256 fragments, uint256 masks) external',
  'function sacrificeTokens(uint8[] calldata tokenTypes, uint256[] calldata tokenIds, uint256[] calldata amounts) external'
];

async function compareSacrifice() {
  console.log('🔍 Comparing sacrifice functions...\n');
  console.log('✅ Lantern fragments work');
  console.log('❌ Rusted caps fail');
  console.log('❌ No glass shards on failure\n');
  
  const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
  
  // Test each function
  for (const funcSig of SACRIFICE_FUNCTIONS) {
    const funcName = funcSig.match(/function (\w+)/)[1];
    console.log(`Testing ${funcName}()...`);
    
    try {
      const abi = [funcSig];
      const contract = new ethers.Contract(MAW_ADDRESS, abi, provider);
      
      // Test with rusted caps (token ID 0)
      let gasEstimate;
      if (funcName === 'sacrificeKeys' || funcName === 'sacrifice') {
        gasEstimate = await contract[funcName].estimateGas(1, {
          from: USER_ADDRESS
        });
      } else if (funcName === 'sacrificeCosmetic') {
        gasEstimate = await contract[funcName].estimateGas(1, 0, {
          from: USER_ADDRESS
        });
      } else if (funcName === 'sacrificeTokens') {
        // Try with rusted caps format
        gasEstimate = await contract[funcName].estimateGas(
          [0], // tokenTypes - 0 for relics?
          [0], // tokenIds - rusted caps
          [1], // amounts
          { from: USER_ADDRESS }
        );
      }
      
      console.log(`✅ ${funcName} works - gas: ${gasEstimate.toString()}`);
      
    } catch (error) {
      console.log(`❌ ${funcName} fails: ${error.message.slice(0, 100)}...`);
    }
  }
  
  console.log('\n🎯 Hypothesis: The issue might be:');
  console.log('1. Frontend calling wrong function for rusted caps');
  console.log('2. Rusted caps need different parameters');
  console.log('3. Glass shards reward logic is broken');
  console.log('4. Contract treats rusted caps differently than other tokens');
  
  // Check what function lantern fragments used
  console.log('\n💡 IMPORTANT: How did you sacrifice lantern fragments?');
  console.log('   - Which button/function did you use?');
  console.log('   - Was it through cosmetic sacrifice?');
  console.log('   - This will tell us the working path');
}

compareSacrifice();