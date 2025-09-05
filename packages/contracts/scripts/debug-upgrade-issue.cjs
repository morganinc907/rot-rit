const hre = require("hardhat");

async function main() {
  console.log('🔍 Debugging MAW upgrade issue...');
  
  const mawProxyAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  
  try {
    const [signer] = await hre.ethers.getSigners();
    console.log('Signer address:', signer.address);
    
    const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawProxyAddress);
    
    console.log('📋 Current MAW status:');
    const owner = await maw.owner();
    console.log('Owner:', owner);
    
    const isOwner = signer.address.toLowerCase() === owner.toLowerCase();
    console.log('Is signer owner?', isOwner);
    
    // Check if contract is paused
    try {
      const paused = await maw.paused();
      console.log('Paused:', paused);
    } catch (e) {
      console.log('Paused check failed:', e.message);
    }
    
    // Check current implementation
    try {
      // Check implementation slot
      const implSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
      const implAddr = await hre.ethers.provider.getStorage(mawProxyAddress, implSlot);
      const cleanAddr = "0x" + implAddr.slice(-40);
      console.log('Current implementation:', cleanAddr);
    } catch (e) {
      console.log('Implementation check failed:', e.message);
    }
    
    if (!isOwner) {
      console.log('❌ Not the owner - cannot upgrade');
      return;
    }
    
    console.log('💡 Since we are the owner, the upgrade should work...');
    console.log('   The "execution reverted" might be due to:');
    console.log('   1. Contract initialization issues');
    console.log('   2. Constructor parameters');
    console.log('   3. Storage layout conflicts');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});