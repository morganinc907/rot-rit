/**
 * Debug script to check why sacrificeKeys(1) is failing
 */
require('dotenv').config();
const { ethers } = require('hardhat');
const addresses = require('../packages/addresses/addresses.json');

async function debugSacrificeKeys() {
  const [signer] = await ethers.getSigners();
  const userAddress = signer.address;
  
  console.log('🔍 Debugging sacrificeKeys failure...');
  console.log('👤 User address:', userAddress);
  
  // Get contracts
  const mawAddress = addresses.baseSepolia.MawSacrificeV3Upgradeable;
  const relicsAddress = addresses.baseSepolia.Relics;
  
  console.log('📄 Maw contract:', mawAddress);
  console.log('📄 Relics contract:', relicsAddress);
  
  // Get ABIs
  const MawABI = require('../packages/contracts/artifacts/contracts/MawSacrificeV3Upgradeable.sol/MawSacrificeV3Upgradeable.json').abi;
  const RelicsABI = require('../packages/contracts/artifacts/contracts/Relics.sol/Relics.json').abi;
  
  const maw = new ethers.Contract(mawAddress, MawABI, signer);
  const relics = new ethers.Contract(relicsAddress, RelicsABI, signer);
  
  try {
    // Check all preconditions
    console.log('\n📊 Checking preconditions...');
    
    // 1. User balance
    const keyBalance = await relics.balanceOf(userAddress, 1); // Keys are token ID 1
    console.log('🗝️ User key balance:', keyBalance.toString());
    
    // 2. Contract approval
    const isApproved = await relics.isApprovedForAll(userAddress, mawAddress);
    console.log('✅ Approval status:', isApproved);
    
    // 3. Contract paused state
    const isPaused = await maw.paused();
    console.log('⏸️ Contract paused:', isPaused);
    
    // 4. Cooldown check
    const lastSacrificeBlock = await maw.userLastSacrificeBlock(userAddress);
    const minBlocksBetween = await maw.minBlocksBetweenSacrifices();
    const currentBlock = await ethers.provider.getBlockNumber();
    
    console.log('🧊 Last sacrifice block:', lastSacrificeBlock.toString());
    console.log('🧊 Min blocks between:', minBlocksBetween.toString());
    console.log('🧊 Current block:', currentBlock);
    
    const nextAllowedBlock = Number(lastSacrificeBlock) + Number(minBlocksBetween);
    const blocksLeft = nextAllowedBlock - currentBlock;
    const inCooldown = currentBlock <= nextAllowedBlock;
    
    console.log('🧊 Next allowed block:', nextAllowedBlock);
    console.log('🧊 Blocks left in cooldown:', blocksLeft);
    console.log('🧊 In cooldown:', inCooldown);
    
    // 5. Gas estimation
    try {
      const gasEstimate = await maw.sacrificeKeys.estimateGas(1);
      console.log('⛽ Gas estimate:', gasEstimate.toString());
    } catch (gasError) {
      console.log('❌ Gas estimation failed:', gasError.message);
      
      // Try to get revert reason
      try {
        await maw.sacrificeKeys.staticCall(1);
      } catch (staticError) {
        console.log('❌ Static call failed:', staticError.message);
      }
    }
    
    // Summary
    console.log('\n📋 Summary:');
    console.log(`Keys: ${keyBalance.toString() >= 1 ? '✅' : '❌'} (have ${keyBalance.toString()}, need 1)`);
    console.log(`Approval: ${isApproved ? '✅' : '❌'}`);
    console.log(`Not paused: ${!isPaused ? '✅' : '❌'}`);
    console.log(`Cooldown: ${!inCooldown ? '✅' : '❌'} (${blocksLeft} blocks left)`);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugSacrificeKeys().catch(console.error);