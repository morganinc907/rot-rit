#!/usr/bin/env node

/**
 * Check if Relics is approved for Maw contract
 */

const { ethers } = require('ethers');

const MAW_ADDRESS = '0xB2e77ce03BC688C993Ee31F03000c56c211AD7db';
const RELICS_ADDRESS = '0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b';
const USER_ADDRESS = '0x52257934A41c55F4758b92F4D23b69f920c3652A';

const RELICS_ABI = [
  'function isApprovedForAll(address account, address operator) view returns (bool)',
  'function balanceOf(address account, uint256 id) view returns (uint256)'
];

async function checkApproval() {
  console.log('🔍 Checking Relics approval for Maw contract...\n');
  
  const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
  const relicsContract = new ethers.Contract(RELICS_ADDRESS, RELICS_ABI, provider);
  
  try {
    // Check approval
    const isApproved = await relicsContract.isApprovedForAll(USER_ADDRESS, MAW_ADDRESS);
    console.log(`User: ${USER_ADDRESS}`);
    console.log(`Relics: ${RELICS_ADDRESS}`);
    console.log(`Maw: ${MAW_ADDRESS}`);
    console.log(`\nApproved: ${isApproved}`);
    
    // Check balance of Rusted Caps
    const balance = await relicsContract.balanceOf(USER_ADDRESS, 0);
    console.log(`Rusted Caps balance: ${balance}`);
    
    if (!isApproved) {
      console.log('\n❌ ISSUE FOUND: Relics not approved for Maw');
      console.log('💡 SOLUTION: You need to approve the Maw contract to spend your Relics');
      console.log('   Call: setApprovalForAll(mawAddress, true) on Relics contract');
      console.log('   Or use the "Approve Contract" button in the frontend');
    } else if (balance < 1) {
      console.log('\n❌ ISSUE FOUND: Not enough Rusted Caps');
      console.log(`   You have ${balance} Rusted Caps but need at least 1 to sacrifice`);
    } else {
      console.log('\n✅ Approval and balance look good');
      console.log('   The issue might be elsewhere');
    }
    
  } catch (error) {
    console.error('❌ Error checking approval:', error.message);
  }
}

checkApproval();