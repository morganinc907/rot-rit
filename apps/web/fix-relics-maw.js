const { ethers } = require('ethers');

async function fixRelicsMawAddress() {
  const RPC_URL = 'https://sepolia.base.org';
  const PRIVATE_KEY = 'b861c6884ab3a602c54896010176bc4f89c563daba457b00a7838f5eb135cd45';
  const RELICS_ADDRESS = '0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b';
  const NEW_MAW_ADDRESS = '0xB2e77ce03BC688C993Ee31F03000c56c211AD7db';

  // Connect to Base Sepolia
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  // Minimal Relics ABI with just the functions we need
  const relicsABI = [
    'function mawSacrifice() view returns (address)',
    'function setMawSacrifice(address _mawSacrifice)',
    'function owner() view returns (address)'
  ];

  const relics = new ethers.Contract(RELICS_ADDRESS, relicsABI, wallet);

  try {
    console.log('🔍 Reading current mawSacrifice address...');
    const currentMaw = await relics.mawSacrifice();
    console.log('Current mawSacrifice:', currentMaw);
    console.log('Target mawSacrifice:', NEW_MAW_ADDRESS);

    if (currentMaw.toLowerCase() === NEW_MAW_ADDRESS.toLowerCase()) {
      console.log('✅ Already points to correct address!');
      return;
    }

    console.log('🔑 Checking owner...');
    const owner = await relics.owner();
    console.log('Relics owner:', owner);
    console.log('Our address:', wallet.address);

    console.log('🚀 Setting new mawSacrifice address...');
    const tx = await relics.setMawSacrifice(NEW_MAW_ADDRESS);
    console.log('Transaction sent:', tx.hash);

    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log('✅ Confirmed in block:', receipt.blockNumber);

    console.log('🔍 Verifying change...');
    const newMaw = await relics.mawSacrifice();
    console.log('New mawSacrifice:', newMaw);

    if (newMaw.toLowerCase() === NEW_MAW_ADDRESS.toLowerCase()) {
      console.log('🎉 Successfully updated mawSacrifice address!');
    } else {
      console.log('❌ Update failed - address mismatch!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.reason) console.error('Reason:', error.reason);
  }
}

fixRelicsMawAddress();