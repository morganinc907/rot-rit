const hre = require("hardhat");

async function main() {
  console.log('🔍 Testing with explicit gas limit...');
  
  const [signer] = await hre.ethers.getSigners();
  const userAddress = signer.address;
  console.log('User:', userAddress);
  
  const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawAddress);
  
  // Check balances first
  const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const relics = await hre.ethers.getContractAt("Relics", relicsAddress);
  
  const fragmentBalance = await relics.balanceOf(userAddress, 2);
  console.log('Fragment balance:', fragmentBalance.toString());
  
  if (fragmentBalance < 1) {
    console.log('❌ User has no fragments to sacrifice');
    return;
  }
  
  // Estimate gas first
  try {
    console.log('📊 Estimating gas for sacrificeForCosmetic(1, 0)...');
    const gasEstimate = await maw.sacrificeForCosmetic.estimateGas(1, 0);
    console.log('Estimated gas:', gasEstimate.toString());
    
    // Try with 50% more gas
    const gasLimit = gasEstimate * 150n / 100n;
    console.log('Using gas limit:', gasLimit.toString());
    
    console.log('🎯 Executing with explicit gas limit...');
    const tx = await maw.sacrificeForCosmetic(1, 0, { gasLimit });
    console.log('Transaction sent:', tx.hash);
    
    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log('Transaction confirmed!');
    console.log('Status:', receipt.status);
    console.log('Gas used:', receipt.gasUsed.toString());
    
    if (receipt.status === 1) {
      console.log('✅ SUCCESS! Transaction completed successfully');
    } else {
      console.log('❌ FAILED! Transaction reverted');
    }
    
  } catch (error) {
    console.log('❌ Error during gas estimation or execution:');
    console.log(error.message);
    
    // If gas estimation fails, the transaction will definitely fail
    if (error.message.includes('execution reverted')) {
      console.log('\n💡 DIAGNOSIS: Transaction reverts during gas estimation');
      console.log('This means there is a logical error in the contract call, not just a gas issue');
      
      // Try to get more specific error info
      try {
        console.log('\n🔍 Trying to get specific revert reason...');
        await maw.sacrificeForCosmetic.staticCall(1, 0);
        console.log('Static call succeeded - this is strange');
      } catch (staticError) {
        console.log('Static call failed:', staticError.message);
        
        // Check for specific error patterns
        if (staticError.message.includes('InvalidConfiguration')) {
          console.log('💡 Issue: Configuration problem');
        } else if (staticError.message.includes('InsufficientBalance')) {
          console.log('💡 Issue: Balance problem');
        } else if (staticError.message.includes('NotAuthorized')) {
          console.log('💡 Issue: Authorization problem');
        }
      }
    }
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});