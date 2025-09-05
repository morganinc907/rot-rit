#!/usr/bin/env node

/**
 * Test the sacrifice transaction with detailed error handling
 */

const { ethers } = require('ethers');

const MAW_ADDRESS = '0xB2e77ce03BC688C993Ee31F03000c56c211AD7db';

// Simple ABI for sacrificeKeys
const MAW_ABI = [
  'function sacrificeKeys(uint256 amount) external'
];

async function testSacrifice() {
  console.log('🧪 Testing sacrifice transaction...\n');
  
  const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
  const contract = new ethers.Contract(MAW_ADDRESS, MAW_ABI, provider);
  
  try {
    // Try to estimate gas first
    console.log('1️⃣ Estimating gas for sacrificeKeys(1)...');
    
    const gasEstimate = await contract.sacrificeKeys.estimateGas(1, {
      from: '0x52257934A41c55F4758b92F4D23b69f920c3652A'
    });
    
    console.log(`✅ Gas estimate successful: ${gasEstimate.toString()}`);
    console.log('   This means the transaction should work');
    
    // Try callStatic to simulate without sending
    console.log('\n2️⃣ Simulating transaction...');
    await contract.sacrificeKeys.staticCall(1, {
      from: '0x52257934A41c55F4758b92F4D23b69f920c3652A'
    });
    
    console.log('✅ Static call successful');
    console.log('   Transaction simulation passed');
    
    console.log('\n🎉 RESULT: The transaction should work!');
    console.log('💡 The "Internal JSON-RPC error" might be:');
    console.log('   1. Wallet/MetaMask connection issue');
    console.log('   2. Network congestion');
    console.log('   3. Gas price too low');
    console.log('   4. Try refreshing the page and reconnecting wallet');
    
  } catch (error) {
    console.log('❌ Transaction would fail');
    console.log(`Error: ${error.message}`);
    
    if (error.data) {
      console.log(`Error data: ${error.data}`);
    }
    
    // Try to decode common error reasons
    if (error.message.includes('revert')) {
      console.log('\n🔍 Analyzing revert...');
      
      if (error.message.includes('ERC1155: insufficient balance')) {
        console.log('   Issue: Not enough Rusted Caps');
      } else if (error.message.includes('ERC1155: caller is not owner nor approved')) {
        console.log('   Issue: Not approved to transfer tokens');
      } else if (error.message.includes('paused')) {
        console.log('   Issue: Contract is paused');
      } else {
        console.log('   Unknown revert reason');
        console.log('   The contract might have custom requirements not being met');
      }
    }
  }
}

testSacrifice();