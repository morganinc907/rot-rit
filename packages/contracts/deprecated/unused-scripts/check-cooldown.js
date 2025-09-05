/**
 * Check and potentially disable cooldown on dev contract
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('⏰ Checking cooldown status...\n');
  
  const DEV_MAW_ADDRESS = "0xE9F133387d1bA847Cf25c391f01D5CFE6D151083";
  
  try {
    const [signer] = await ethers.getSigners();
    console.log('👤 Using account:', signer.address);
    
    const mawAbi = [
      "function lastSacrificeBlock(address user) view returns (uint256)",
      "function minBlocksBetweenSacrifices() view returns (uint256)",
      "function setMinBlocksBetweenSacrifices(uint256 blocks) external"
    ];
    
    const maw = new ethers.Contract(DEV_MAW_ADDRESS, mawAbi, signer);
    
    // Check current cooldown settings
    const lastBlock = await maw.lastSacrificeBlock(signer.address);
    const minBlocks = await maw.minBlocksBetweenSacrifices();
    const currentBlock = await ethers.provider.getBlockNumber();
    
    console.log('📊 Cooldown Status:');
    console.log(`   Current block: ${currentBlock}`);
    console.log(`   Last sacrifice block: ${lastBlock.toString()}`);
    console.log(`   Min blocks between: ${minBlocks.toString()}`);
    console.log(`   Blocks since last: ${currentBlock - Number(lastBlock.toString())}`);
    console.log(`   Blocks remaining: ${Math.max(0, Number(minBlocks.toString()) - (currentBlock - Number(lastBlock.toString())))}`);
    
    if (Number(minBlocks.toString()) > 0) {
      console.log('\n🔧 Disabling cooldown for dev testing...');
      try {
        const tx = await maw.setMinBlocksBetweenSacrifices(0, {
          gasLimit: 100000
        });
        await tx.wait();
        console.log('✅ Cooldown disabled! You can now sacrifice immediately.');
      } catch (e) {
        console.log('❌ Failed to disable cooldown:', e.message.split('\n')[0]);
        console.log('⏰ You need to wait for the cooldown to expire naturally');
      }
    } else {
      console.log('✅ Cooldown already disabled');
    }
    
  } catch (error) {
    console.error('❌ Cooldown check failed:', error.message);
  }
}

main().catch(console.error);