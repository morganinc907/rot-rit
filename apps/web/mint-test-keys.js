const { ethers } = require('ethers');

async function mintTestKeys() {
  const RPC_URL = 'https://sepolia.base.org';
  const PRIVATE_KEY = 'b861c6884ab3a602c54896010176bc4f89c563daba457b00a7838f5eb135cd45';
  const RELICS_ADDRESS = '0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b';
  const USER_ADDRESS = '0x52257934A41c55F4758b92F4D23b69f920c3652A';

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  const relicsABI = [
    'function mint(address,uint256,uint256,bytes) external',
    'function balanceOf(address,uint256) view returns (uint256)',
    'function owner() view returns (address)'
  ];

  const relics = new ethers.Contract(RELICS_ADDRESS, relicsABI, wallet);

  console.log('🔑 Minting test RUSTED KEYS (ID 1) for sacrifice...');
  console.log('User:', USER_ADDRESS);
  console.log('Relics:', RELICS_ADDRESS);
  console.log();

  try {
    // Check if we're the owner
    const owner = await relics.owner();
    console.log('Contract owner:', owner);
    console.log('Our address:', wallet.address);
    
    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
      console.error('❌ We are not the owner - cannot mint directly');
      console.log('Need to use dev faucet or other minting method');
      return;
    }

    // Check current balance
    const RUSTED_KEY_ID = 1;
    const currentBalance = await relics.balanceOf(USER_ADDRESS, RUSTED_KEY_ID);
    console.log('Current rusted keys balance:', currentBalance.toString());

    // Mint 5 rusted keys for testing
    const AMOUNT_TO_MINT = 5;
    console.log(`Minting ${AMOUNT_TO_MINT} rusted keys...`);
    
    const tx = await relics.mint(
      USER_ADDRESS,
      RUSTED_KEY_ID, 
      AMOUNT_TO_MINT,
      '0x'
    );
    
    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
    
    // Verify new balance
    const newBalance = await relics.balanceOf(USER_ADDRESS, RUSTED_KEY_ID);
    console.log('New rusted keys balance:', newBalance.toString());
    console.log('🎉 Success! You can now sacrifice keys.');
    
  } catch (error) {
    console.error('❌ Mint failed:', error.message);
    if (error.reason) {
      console.error('Reason:', error.reason);
    }
  }
}

mintTestKeys();