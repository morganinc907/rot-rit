/**
 * Debug script to check why sacrificeKeys(1) is failing
 */
const { ethers } = require("hardhat");

async function debugSacrificeKeys() {
  console.log('🔍 Debugging sacrificeKeys failure...\n');
  
  const MAW_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456"; // V3 Proxy
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const USER_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  
  console.log('👤 User address:', USER_ADDRESS);
  console.log('📄 Maw contract:', MAW_ADDRESS);
  console.log('📄 Relics contract:', RELICS_ADDRESS);
  
  const maw = await ethers.getContractAt("MawSacrificeV4Upgradeable", MAW_ADDRESS);
  const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
  
  try {
    // Check all preconditions
    console.log('\n📊 Checking preconditions...');
    
    // 1. User balance
    const keyBalance = await relics.balanceOf(USER_ADDRESS, 1); // Keys are token ID 1
    console.log('🗝️ User key balance:', keyBalance.toString());
    
    // 2. Contract approval
    const isApproved = await relics.isApprovedForAll(USER_ADDRESS, MAW_ADDRESS);
    console.log('✅ Approval status:', isApproved);
    
    // 3. Contract paused state
    const isPaused = await maw.paused();
    console.log('⏸️ Contract paused:', isPaused);
    
    // 4. Cooldown check
    const lastSacrificeBlock = await maw.lastSacrificeBlock(USER_ADDRESS);
    const minBlocksBetween = await maw.minBlocksBetweenSacrifices();
    const currentBlock = await ethers.provider.getBlockNumber();
    
    // 4b. Check sacrifices paused
    const sacrificesPaused = await maw.sacrificesPaused();
    console.log('⏸️ Sacrifices paused:', sacrificesPaused);
    
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
    console.log(`Sacrifices not paused: ${!sacrificesPaused ? '✅' : '❌'}`);
    console.log(`Cooldown: ${!inCooldown ? '✅' : '❌'} (${blocksLeft} blocks left)`);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

async function main() {
  await debugSacrificeKeys();
}

main().catch(console.error);