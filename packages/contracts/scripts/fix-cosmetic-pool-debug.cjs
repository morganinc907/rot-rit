const hre = require("hardhat");

async function main() {
  console.log('🔧 Debugging cosmetic pool update...');
  
  const [signer] = await hre.ethers.getSigners();
  console.log('Signer:', signer.address);
  
  const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawAddress);
  
  try {
    // Check current pool first
    const currentPool = await maw.getCosmeticPool();
    console.log('\n📋 Current cosmetic pool:');
    console.log('  IDs:', currentPool[0].map(id => id.toString()));
    console.log('  Weights:', currentPool[1].map(w => w.toString()));
    console.log('  Total:', currentPool[2].toString());
    
    // Check if we have the right permissions
    try {
      const owner = await maw.owner();
      console.log('\n🔑 Contract owner:', owner);
      console.log('🔑 Our signer:', signer.address);
      console.log('🔑 Are we owner?', owner.toLowerCase() === signer.address.toLowerCase());
    } catch (e) {
      console.log('⚠️ Could not check owner (might not have owner() function)');
    }
    
    // Try to check if there's an admin role or similar
    try {
      const adminRole = await maw.DEFAULT_ADMIN_ROLE();
      const hasAdminRole = await maw.hasRole(adminRole, signer.address);
      console.log('🔑 Has admin role?', hasAdminRole);
    } catch (e) {
      console.log('⚠️ Could not check admin role');
    }
    
    // Define correct cosmetic pool - ONLY Glass Shards for now (simplest fix)
    const correctIds = [1];
    const correctWeights = [100];
    
    console.log('\n🎯 Attempting to set cosmetic pool to:', correctIds);
    
    // Estimate gas first
    try {
      const gasEstimate = await maw.setCosmeticPool.estimateGas(correctIds, correctWeights);
      console.log('📊 Gas estimate:', gasEstimate.toString());
    } catch (gasError) {
      console.log('⚠️ Gas estimation failed:', gasError.message);
    }
    
    const tx = await maw.setCosmeticPool(correctIds, correctWeights, {
      gasLimit: 200000 // Explicit gas limit
    });
    console.log('📤 Transaction sent:', tx.hash);
    
    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log('📥 Transaction confirmed in block:', receipt.blockNumber);
    console.log('🔥 Gas used:', receipt.gasUsed.toString());
    console.log('✅ Status:', receipt.status === 1 ? 'SUCCESS' : 'FAILED');
    
    if (receipt.status !== 1) {
      console.log('❌ Transaction failed! Logs:', receipt.logs);
      return;
    }
    
    // Wait a bit and verify the change
    console.log('⏳ Waiting 3 seconds before verification...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const updatedPool = await maw.getCosmeticPool();
    console.log('\n✅ Verification - Updated pool:');
    console.log('  IDs:', updatedPool[0].map(id => id.toString()));
    console.log('  Weights:', updatedPool[1].map(w => w.toString()));
    console.log('  Total:', updatedPool[2].toString());
    
    const poolChanged = JSON.stringify(updatedPool[0].map(id => id.toString())) !== JSON.stringify(currentPool[0].map(id => id.toString()));
    
    if (poolChanged) {
      console.log('\n🎉 SUCCESS! Cosmetic pool has been updated!');
      console.log('✅ Removed bone daggers, masks, and other non-cosmetics');
      console.log('✅ Lantern fragments will now only give Glass Shards (fallback)');
    } else {
      console.log('\n❌ FAILED! Pool did not change despite successful transaction');
      console.log('🔍 This suggests the function call succeeded but had no effect');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
    
    if (error.message.includes('Ownable')) {
      console.log('💡 Only owner can update cosmetic pool');
    } else if (error.message.includes('AccessControl')) {
      console.log('💡 Missing required role to update cosmetic pool');
    }
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});