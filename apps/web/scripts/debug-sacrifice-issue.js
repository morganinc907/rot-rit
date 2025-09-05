#!/usr/bin/env node

/**
 * Debug the sacrifice transaction issue
 * This will check all the conditions needed for a successful sacrifice
 */

const { ethers } = require('ethers');

// Contract addresses
const MAW_ADDRESS = '0xB2e77ce03BC688C993Ee31F03000c56c211AD7db';
const RELICS_ADDRESS = '0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b';
const USER_ADDRESS = '0x52257934A41c55F4758b92F4D23b69f920c3652A';

// ABIs
const MAW_ABI = [
  {
    name: 'sacrificeKeys',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'isPaused',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'sacrificeTokenId',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'relics',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  }
];

const RELICS_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'isApprovedForAll',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'operator', type: 'address' }
    ],
    outputs: [{ name: '', type: 'bool' }],
  }
];

async function debugSacrifice() {
  console.log('🔍 Debugging Sacrifice Transaction Issue\n');
  
  const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
  const mawContract = new ethers.Contract(MAW_ADDRESS, MAW_ABI, provider);
  const relicsContract = new ethers.Contract(RELICS_ADDRESS, RELICS_ABI, provider);
  
  console.log('📋 Transaction Details:');
  console.log(`User: ${USER_ADDRESS}`);
  console.log(`Maw Contract: ${MAW_ADDRESS}`);
  console.log(`Relics Contract: ${RELICS_ADDRESS}`);
  console.log(`Function: sacrificeKeys(1)\n`);
  
  try {
    console.log('1️⃣ Checking if Maw contract is paused...');
    const isPaused = await mawContract.isPaused();
    console.log(`   Contract paused: ${isPaused}`);
    if (isPaused) {
      console.log('   ❌ ISSUE: Contract is paused - sacrifices cannot be made');
      return;
    }
    console.log('   ✅ Contract is not paused\n');

    console.log('2️⃣ Checking what token ID the Maw expects to sacrifice...');
    const sacrificeTokenId = await mawContract.sacrificeTokenId();
    console.log(`   Sacrifice token ID: ${sacrificeTokenId}`);
    console.log(`   Expected: 0 (Rusted Caps)`);
    if (sacrificeTokenId.toString() !== '0') {
      console.log(`   ⚠️  WARNING: Contract expects token ID ${sacrificeTokenId}, not 0`);
    } else {
      console.log('   ✅ Contract expects token ID 0 (Rusted Caps)\n');
    }

    console.log('3️⃣ Checking user balance of sacrifice token...');
    const userBalance = await relicsContract.balanceOf(USER_ADDRESS, sacrificeTokenId);
    console.log(`   User balance of token ID ${sacrificeTokenId}: ${userBalance}`);
    if (userBalance < 1) {
      console.log('   ❌ ISSUE: User does not have enough tokens to sacrifice');
      return;
    }
    console.log('   ✅ User has enough tokens\n');

    console.log('4️⃣ Checking if Relics contract is approved...');
    const isApproved = await relicsContract.isApprovedForAll(USER_ADDRESS, MAW_ADDRESS);
    console.log(`   Relics approved for Maw: ${isApproved}`);
    if (!isApproved) {
      console.log('   ❌ ISSUE: Relics contract is not approved for Maw');
      console.log('   💡 FIX: Call setApprovalForAll(mawAddress, true) on Relics contract');
      return;
    }
    console.log('   ✅ Approval is set\n');

    console.log('5️⃣ Checking Maw\'s configured Relics address...');
    try {
      const mawRelicsAddr = await mawContract.relics();
      console.log(`   Maw thinks Relics is at: ${mawRelicsAddr}`);
      console.log(`   Actual Relics address: ${RELICS_ADDRESS}`);
      if (mawRelicsAddr.toLowerCase() !== RELICS_ADDRESS.toLowerCase()) {
        console.log('   ❌ ISSUE: Maw contract has wrong Relics address');
        return;
      }
      console.log('   ✅ Maw has correct Relics address\n');
    } catch (err) {
      console.log('   ⚠️  Could not check Maw\'s Relics address (function may not exist)\n');
    }

    console.log('6️⃣ Simulating the transaction...');
    try {
      // Try to estimate gas for the transaction
      const gasEstimate = await mawContract.sacrificeKeys.estimateGas(1, { from: USER_ADDRESS });
      console.log(`   Gas estimate: ${gasEstimate}`);
      console.log('   ✅ Transaction simulation successful\n');
      
      console.log('✅ ALL CHECKS PASSED');
      console.log('💡 The transaction should work. The error might be:');
      console.log('   1. Network connectivity issue');
      console.log('   2. RPC provider issue'); 
      console.log('   3. Wallet/signing issue');
      console.log('   4. Recent contract change not reflected');
      
    } catch (simulationError) {
      console.log('   ❌ Transaction simulation failed');
      console.log(`   Error: ${simulationError.message}`);
      
      if (simulationError.message.includes('revert')) {
        console.log('\n🔍 Analyzing revert reason...');
        
        // Try to decode common revert reasons
        if (simulationError.data) {
          console.log(`   Raw error data: ${simulationError.data}`);
        }
        
        // Common failure reasons
        console.log('\n💡 Possible causes:');
        console.log('   1. Contract is paused');
        console.log('   2. Insufficient token balance');
        console.log('   3. Not approved for token transfers');
        console.log('   4. Cooldown period active');
        console.log('   5. Wrong token ID configuration');
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.log('\n🔧 Try these steps:');
    console.log('1. Check network connection');
    console.log('2. Verify contract addresses are correct');
    console.log('3. Make sure you\'re on Base Sepolia network');
  }
}

debugSacrifice();