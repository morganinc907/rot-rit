const { ethers } = require('ethers');

async function debugSacrifice() {
  const RPC_URL = 'https://sepolia.base.org';
  const PRIVATE_KEY = 'b861c6884ab3a602c54896010176bc4f89c563daba457b00a7838f5eb135cd45';
  const MAW_ADDRESS = '0xB2e77ce03BC688C993Ee31F03000c56c211AD7db';
  const RELICS_ADDRESS = '0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b';
  const USER_ADDRESS = '0x52257934A41c55F4758b92F4D23b69f920c3652A';

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  // Minimal ABIs for testing
  const mawABI = [
    'function sacrificeKeys(uint256) external',
    'function paused() view returns (bool)',
    'function sacrificesPaused() view returns (bool)'
  ];
  
  const relicsABI = [
    'function balanceOf(address,uint256) view returns (uint256)',
    'function isApprovedForAll(address,address) view returns (bool)',
    'function mawSacrifice() view returns (address)'
  ];

  const maw = new ethers.Contract(MAW_ADDRESS, mawABI, wallet);
  const relics = new ethers.Contract(RELICS_ADDRESS, relicsABI, provider);

  console.log('🔍 Debugging sacrifice transaction...');
  console.log('User:', USER_ADDRESS);
  console.log('MawSacrifice:', MAW_ADDRESS);
  console.log('Relics:', RELICS_ADDRESS);
  console.log();

  try {
    // Check basic contract states
    console.log('📋 Contract States:');
    
    const isPaused = await maw.paused().catch(() => 'N/A');
    console.log('  MawSacrifice paused:', isPaused);
    
    const sacrificesPaused = await maw.sacrificesPaused().catch(() => 'N/A');
    console.log('  Sacrifices paused:', sacrificesPaused);
    
    const mawFromRelics = await relics.mawSacrifice();
    console.log('  Relics.mawSacrifice():', mawFromRelics);
    console.log('  Addresses match:', mawFromRelics.toLowerCase() === MAW_ADDRESS.toLowerCase());
    console.log();

    // Check user's key balance and approval
    console.log('👤 User State:');
    const RUSTED_KEY_ID = 1;
    const keyBalance = await relics.balanceOf(USER_ADDRESS, RUSTED_KEY_ID);
    console.log('  Rusted keys balance:', keyBalance.toString());
    
    const isApproved = await relics.isApprovedForAll(USER_ADDRESS, MAW_ADDRESS);
    console.log('  Approved for all:', isApproved);
    console.log();

    // Try the actual sacrifice transaction simulation
    console.log('🧪 Simulating sacrificeKeys(1)...');
    
    try {
      const tx = await maw.sacrificeKeys.populateTransaction(1);
      const result = await provider.call({
        to: MAW_ADDRESS,
        from: USER_ADDRESS,
        data: tx.data
      });
      
      console.log('✅ Simulation passed! Result:', result);
      
    } catch (simulateError) {
      console.error('❌ Simulation failed:');
      console.error('  Error:', simulateError.message);
      
      if (simulateError.data) {
        console.error('  Raw error data:', simulateError.data);
        
        // Try to decode common errors
        const errorData = simulateError.data;
        if (errorData.startsWith('0x08c379a0')) {
          // Standard revert with reason string
          try {
            const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + errorData.slice(10));
            console.error('  Decoded reason:', decoded[0]);
          } catch (e) {
            console.error('  Could not decode reason string');
          }
        } else if (errorData.length >= 10) {
          console.error('  Error selector (4 bytes):', errorData.slice(0, 10));
        }
      }
      
      if (simulateError.reason) {
        console.error('  Reason:', simulateError.reason);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugSacrifice();