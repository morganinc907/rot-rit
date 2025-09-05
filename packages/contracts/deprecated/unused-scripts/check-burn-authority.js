/**
 * Check if the Maw contract has burn authority on Relics
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('🔍 Checking burn authorization...\n');
  
  const MAW_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456"; // V3 Proxy
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  console.log('📄 Maw contract:', MAW_ADDRESS);
  console.log('📄 Relics contract:', RELICS_ADDRESS);
  
  const relics = await ethers.getContractAt("Relics", RELICS_ADDRESS);
  
  try {
    // Try to check if this is an ownable contract
    let owner;
    try {
      owner = await relics.owner();
      console.log('👤 Relics owner:', owner);
    } catch (e) {
      console.log('ℹ️ Relics is not an Ownable contract');
    }
    
    // Check if relics has a burn function and who can call it
    console.log('\n🧪 Testing burn authorization...');
    try {
      // Try a staticCall to see what happens when maw tries to burn
      await relics.burn.staticCall(MAW_ADDRESS, 1, 1);
      console.log('✅ Maw CAN burn relics');
    } catch (error) {
      console.log('❌ Maw CANNOT burn relics:', error.message);
      
      // Check if it's a role-based error
      if (error.message.includes('role') || error.message.includes('Role')) {
        console.log('   This appears to be a role-based access control issue');
      } else if (error.message.includes('owner') || error.message.includes('Owner')) {
        console.log('   This appears to be an ownership access control issue');  
      }
    }
    
    // Check what the old V3 maw address is set to
    const OLD_MAW_V3 = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
    console.log('\n🔍 Checking old V3 Maw contract authorization...');
    try {
      await relics.burn.staticCall(OLD_MAW_V3, 1, 1);
      console.log('✅ Old V3 Maw CAN burn relics');
    } catch (error) {
      console.log('❌ Old V3 Maw CANNOT burn relics:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

main().catch(console.error);