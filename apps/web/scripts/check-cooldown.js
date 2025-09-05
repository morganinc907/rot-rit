#!/usr/bin/env node

/**
 * Check for cooldown or other blocking conditions
 */

const { ethers } = require('ethers');

const MAW_ADDRESS = '0xB2e77ce03BC688C993Ee31F03000c56c211AD7db';
const USER_ADDRESS = '0x52257934A41c55F4758b92F4D23b69f920c3652A';

// Try different possible functions that might exist
const POSSIBLE_CHECKS = [
  'function lastSacrificeTime(address) view returns (uint256)',
  'function cooldownPeriod() view returns (uint256)', 
  'function canSacrifice(address) view returns (bool)',
  'function getUserCooldown(address) view returns (uint256)',
  'function isPaused() view returns (bool)',
  'function minimumDelay() view returns (uint256)'
];

async function checkCooldown() {
  console.log('🕐 Checking for cooldown or blocking conditions...\n');
  
  const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
  
  for (const funcSig of POSSIBLE_CHECKS) {
    try {
      const abi = [funcSig];
      const contract = new ethers.Contract(MAW_ADDRESS, abi, provider);
      const funcName = funcSig.match(/function (\w+)/)[1];
      
      let result;
      if (funcSig.includes('address')) {
        result = await contract[funcName](USER_ADDRESS);
      } else {
        result = await contract[funcName]();
      }
      
      console.log(`✅ ${funcName}(): ${result}`);
      
      // Interpret results
      if (funcName.includes('cooldown') || funcName.includes('Delay')) {
        if (result.toString() !== '0') {
          console.log(`   ⏰ Cooldown period: ${result} seconds`);
        }
      } else if (funcName === 'canSacrifice') {
        if (!result) {
          console.log('   ❌ Cannot sacrifice right now');
        }
      } else if (funcName === 'isPaused') {
        if (result) {
          console.log('   ⏸️  Contract is paused');
        }
      } else if (funcName === 'lastSacrificeTime') {
        const now = Math.floor(Date.now() / 1000);
        const timeSince = now - parseInt(result.toString());
        console.log(`   📅 Last sacrifice: ${timeSince} seconds ago`);
      }
      
    } catch (error) {
      // Function doesn't exist, skip
    }
  }
  
  console.log('\n🎯 If no blocking conditions found, the issue might be:');
  console.log('1. Contract has a bug or incorrect logic');
  console.log('2. Contract expects different parameters');
  console.log('3. Frontend is calling wrong function name');
  console.log('4. Contract needs to be redeployed/fixed');
}

checkCooldown();