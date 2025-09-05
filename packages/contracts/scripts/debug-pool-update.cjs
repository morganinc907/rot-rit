const hre = require("hardhat");

async function main() {
  console.log('🔍 Debugging pool update issue...');
  
  const [signer] = await hre.ethers.getSigners();
  const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  
  try {
    const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawAddress);
    
    console.log('Signer:', signer.address);
    
    // Check permissions
    const owner = await maw.owner();
    console.log('MAW Owner:', owner);
    console.log('Are we owner?', owner.toLowerCase() === signer.address.toLowerCase());
    
    // Check current pool
    const currentPool = await maw.getCosmeticPool();
    console.log('Current pool:', {
      ids: currentPool[0].map(id => Number(id)),
      weights: currentPool[1].map(w => Number(w)),
      total: Number(currentPool[2])
    });
    
    // Try to set pool with detailed error handling
    console.log('\n🔧 Attempting pool update...');
    
    const newIds = [1, 1, 2, 3, 4, 5];
    const newWeights = [100, 100, 100, 100, 100, 100];
    
    console.log('Target IDs:', newIds);
    console.log('Target weights:', newWeights);
    
    // Check if arrays are same length
    if (newIds.length !== newWeights.length) {
      console.log('❌ Array length mismatch!');
      return;
    }
    
    try {
      // Estimate gas first
      const gasEstimate = await maw.setCosmeticPool.estimateGas(newIds, newWeights);
      console.log('Gas estimate:', gasEstimate.toString());
      
      // Try the call
      const tx = await maw.setCosmeticPool(newIds, newWeights, {
        gasLimit: gasEstimate * 2n, // Double the estimate
        gasPrice: hre.ethers.parseUnits('3', 'gwei')
      });
      
      console.log('Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
      
      // Verify the update
      const updatedPool = await maw.getCosmeticPool();
      console.log('Updated pool:', {
        ids: updatedPool[0].map(id => Number(id)),
        weights: updatedPool[1].map(w => Number(w)),
        total: Number(updatedPool[2])
      });
      
      if (updatedPool[0].length === newIds.length) {
        console.log('✅ Pool updated successfully!');
      } else {
        console.log('⚠️ Pool may not have updated correctly');
      }
      
    } catch (txError) {
      console.log('❌ Transaction failed:', txError.message);
      
      // Try to decode the error
      if (txError.message.includes('execution reverted')) {
        console.log('🔍 This might be a permission or validation error');
        console.log('Checking if all cosmetic IDs exist in the cosmetics contract...');
        
        // Check if cosmetics contract is set correctly
        try {
          const cosmeticsAddr = await maw.cosmetics();
          console.log('MAW cosmetics address:', cosmeticsAddr);
          console.log('Expected cosmetics address: 0x13290aCbf346B17E82C8be01178A7b74F20F748d');
          
          if (cosmeticsAddr.toLowerCase() !== '0x13290aCbf346B17E82C8be01178A7b74F20F748d'.toLowerCase()) {
            console.log('❌ MAW is pointing to wrong cosmetics contract!');
            console.log('Need to update MAW cosmetics address first');
          }
        } catch (e) {
          console.log('Could not check cosmetics address');
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});