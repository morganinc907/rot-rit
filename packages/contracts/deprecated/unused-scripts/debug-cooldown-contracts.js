/**
 * Debug cooldown status on both contracts
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('🔍 Debugging cooldown on both contracts...\n');
  
  const OLD_MAW = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
  const DEV_MAW = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
  const USER = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  
  try {
    const [signer] = await ethers.getSigners();
    
    const mawAbi = [
      "function lastSacrificeBlock(address user) view returns (uint256)",
      "function minBlocksBetweenSacrifices() view returns (uint256)"
    ];
    
    const oldMaw = new ethers.Contract(OLD_MAW, mawAbi, signer);
    const devMaw = new ethers.Contract(DEV_MAW, mawAbi, signer);
    
    const currentBlock = await ethers.provider.getBlockNumber();
    console.log(`📅 Current block: ${currentBlock}\n`);
    
    console.log('📊 OLD CONTRACT:');
    try {
      const lastBlock = await oldMaw.lastSacrificeBlock(USER);
      const minBlocks = await oldMaw.minBlocksBetweenSacrifices();
      const blocksLeft = Math.max(0, Number(minBlocks) - (currentBlock - Number(lastBlock)));
      
      console.log(`   Last sacrifice: ${lastBlock.toString()}`);
      console.log(`   Min between: ${minBlocks.toString()}`);
      console.log(`   Blocks left: ${blocksLeft} ⬅️ This is probably what frontend sees!`);
    } catch (e) {
      console.log('   ❌ Error:', e.message.split('\n')[0]);
    }
    
    console.log('\n📊 DEV CONTRACT:');
    try {
      const lastBlock = await devMaw.lastSacrificeBlock(USER);
      const minBlocks = await devMaw.minBlocksBetweenSacrifices();
      const blocksLeft = Math.max(0, Number(minBlocks) - (currentBlock - Number(lastBlock)));
      
      console.log(`   Last sacrifice: ${lastBlock.toString()}`);
      console.log(`   Min between: ${minBlocks.toString()}`);
      console.log(`   Blocks left: ${blocksLeft}`);
    } catch (e) {
      console.log('   ❌ Error:', e.message.split('\n')[0]);
    }
    
    console.log('\n💡 Solutions:');
    console.log('1. Wait for cooldown on old contract to expire');
    console.log('2. Clear browser cache/refresh to pick up new contract');
    console.log('3. Check if addresses.json updated correctly in browser');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

main().catch(console.error);