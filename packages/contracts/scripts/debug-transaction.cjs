const hre = require("hardhat");

async function main() {
  console.log('🔍 Debugging transaction...');
  
  const txHash = "0xf179f635684ef936e5c25a6ac24f2578e9ab60df85bf4479c52d729cd0fa6899";
  
  try {
    const tx = await hre.ethers.provider.getTransaction(txHash);
    const receipt = await hre.ethers.provider.getTransactionReceipt(txHash);
    
    console.log('📤 Transaction:', {
      hash: tx.hash,
      to: tx.to,
      data: tx.data.slice(0, 100) + '...',
      status: receipt.status
    });
    
    console.log('📋 Receipt status:', receipt.status === 1 ? 'SUCCESS' : 'FAILED');
    console.log('🗂️ Logs count:', receipt.logs.length);
    
    // Check events
    receipt.logs.forEach((log, i) => {
      console.log(`📝 Log ${i}:`, {
        address: log.address,
        topics: log.topics.slice(0, 2),
        data: log.data.slice(0, 50) + '...'
      });
    });
    
    // Check current state
    const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
    const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawAddress);
    
    console.log('🔍 Current state after tx:');
    const cosmetics = await maw.cosmetics();
    const relics = await maw.relics();
    console.log('Cosmetics:', cosmetics);
    console.log('Relics:', relics);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});