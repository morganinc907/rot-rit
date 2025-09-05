const { ethers } = require('ethers');

async function verifyTokenIds() {
  const RPC_URL = 'https://sepolia.base.org';
  const PRIVATE_KEY = 'b861c6884ab3a602c54896010176bc4f89c563daba457b00a7838f5eb135cd45';
  const RELICS_ADDRESS = '0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b';
  const USER_ADDRESS = '0x52257934A41c55F4758b92F4D23b69f920c3652A';

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  const relicsABI = [
    'function balanceOf(address,uint256) view returns (uint256)',
    'function uri(uint256) view returns (string)'
  ];

  const relics = new ethers.Contract(RELICS_ADDRESS, relicsABI, provider);

  console.log('🔍 Verifying token IDs and balances...');
  console.log('User:', USER_ADDRESS);
  console.log('Relics:', RELICS_ADDRESS);
  console.log();

  // Test all token IDs 1-9
  const tokenIds = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  for (const id of tokenIds) {
    try {
      const balance = await relics.balanceOf(USER_ADDRESS, id);
      const uri = await relics.uri(id).catch(() => 'N/A');
      
      if (balance > 0n) {
        console.log(`✅ Token ID ${id}: Balance = ${balance.toString()}, URI = ${uri}`);
      } else {
        console.log(`   Token ID ${id}: Balance = 0`);
      }
    } catch (error) {
      console.log(`❌ Token ID ${id}: Error - ${error.message}`);
    }
  }
  
  console.log();
  console.log('📋 Based on our constants:');
  console.log('  RUSTED_KEY (1) should be for sacrifice');
  console.log('  RUSTED_CAP (7) should be converted from shards');
  console.log();
  console.log('🔍 If user shows "12 keys" but has 0 balance on ID 1,');
  console.log('   then UI is reading the wrong token ID (probably caps ID 7)');
}

verifyTokenIds();