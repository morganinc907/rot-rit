#!/usr/bin/env node

/**
 * Test that the sacrifice fix works
 */

const { ethers } = require('ethers');

const MAW_ADDRESS = '0xB2e77ce03BC688C993Ee31F03000c56c211AD7db';
const USER_ADDRESS = '0x52257934A41c55F4758b92F4D23b69f920c3652A';

// Test both functions
const TEST_ABI = [
  'function sacrificeKeys(uint256 amount) external',
  'function sacrifice(uint256 amount) external'
];

async function testFix() {
  console.log('🧪 Testing sacrifice function fix...\n');
  
  const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
  const contract = new ethers.Contract(MAW_ADDRESS, TEST_ABI, provider);
  
  console.log('Testing sacrificeKeys(1)...');
  try {
    await contract.sacrificeKeys.estimateGas(1, { from: USER_ADDRESS });
    console.log('❌ sacrificeKeys still works - this is unexpected!');
  } catch (error) {
    console.log('✅ sacrificeKeys fails (expected)');
  }
  
  console.log('\nTesting sacrifice(1)...');
  try {
    const gasEstimate = await contract.sacrifice.estimateGas(1, { from: USER_ADDRESS });
    console.log(`✅ sacrifice works! Gas: ${gasEstimate.toString()}`);
    
    console.log('\n🎉 SUCCESS! The fix should work:');
    console.log('1. Frontend now calls sacrifice() instead of sacrificeKeys()');
    console.log('2. ABI includes the sacrifice function');
    console.log('3. Contract responds properly to sacrifice()');
    console.log('\nTry sacrificing rusted caps in the frontend now!');
    
  } catch (error) {
    console.log('❌ sacrifice still fails:', error.message);
    console.log('This suggests a deeper contract issue');
  }
}

testFix();