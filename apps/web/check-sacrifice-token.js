const { ethers } = require('ethers');

async function checkSacrificeToken() {
  const RPC_URL = 'https://sepolia.base.org';
  const MAW_ADDRESS = '0xB2e77ce03BC688C993Ee31F03000c56c211AD7db';
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  const mawABI = [
    'function RUSTED_KEY() view returns (uint256)',
    'function RUSTED_CAP() view returns (uint256)', 
    'function sacrificeKeys(uint256) external'
  ];

  const maw = new ethers.Contract(MAW_ADDRESS, mawABI, provider);

  console.log('🔍 Checking what token ID sacrificeKeys() actually burns...');
  
  try {
    // Check if contract has RUSTED_KEY constant
    try {
      const rustedKey = await maw.RUSTED_KEY();
      console.log('✅ Contract RUSTED_KEY constant:', rustedKey.toString());
    } catch (e) {
      console.log('❌ No RUSTED_KEY constant found');
    }
    
    // Check if contract has RUSTED_CAP constant  
    try {
      const rustedCap = await maw.RUSTED_CAP();
      console.log('✅ Contract RUSTED_CAP constant:', rustedCap.toString());
    } catch (e) {
      console.log('❌ No RUSTED_CAP constant found');
    }
    
    console.log('\n📋 Current user balances:');
    console.log('  Token ID 1 (old keys): 5');
    console.log('  Token ID 7 (caps): 3');
    console.log('\n🤔 Question: Which token ID does sacrificeKeys() actually burn?');
    console.log('  If caps replaced keys, then sacrificeKeys() should burn ID 7 (caps)');
    console.log('  But I minted ID 1 (keys) which might be wrong token now');
    
  } catch (error) {
    console.error('❌ Error checking constants:', error.message);
  }
}

checkSacrificeToken();