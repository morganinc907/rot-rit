const hre = require("hardhat");

async function main() {
  console.log('🔍 Debugging fragment sacrifice revert...');
  
  const [signer] = await hre.ethers.getSigners();
  const userAddress = signer.address;
  console.log('User:', userAddress);
  
  // Contract addresses
  const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const cosmeticsAddress = "0x32640D260CeCD52581280e23B9DCc6F49D04Bdcb";
  
  // Get contracts
  const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawAddress);
  const relics = await hre.ethers.getContractAt("Relics", relicsAddress);
  const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
  
  // Check balances
  const fragmentBalance = await relics.balanceOf(userAddress, 2);
  const maskBalance = await relics.balanceOf(userAddress, 3);
  console.log('Fragment balance:', fragmentBalance.toString());
  console.log('Mask balance:', maskBalance.toString());
  
  // Check approvals
  const isApproved = await relics.isApprovedForAll(userAddress, mawAddress);
  console.log('MAW approved for relics:', isApproved);
  
  // Check if MAW can mint cosmetics
  try {
    const canMint = await cosmetics.hasRole(await cosmetics.MINTER_ROLE(), mawAddress);
    console.log('MAW has MINTER_ROLE on cosmetics:', canMint);
  } catch (e) {
    console.log('❌ Error checking MINTER_ROLE:', e.message);
  }
  
  // Check if sacrifices are paused
  const sacrificesPaused = await maw.sacrificesPaused();
  console.log('Sacrifices paused:', sacrificesPaused);
  
  // Check cosmetic configuration
  try {
    const config = await maw.cosmeticConfig();
    console.log('Cosmetic config:');
    console.log('  primaryTokenId:', config.primaryTokenId.toString());
    console.log('  primaryMin:', config.primaryMin.toString());
    console.log('  primaryMax:', config.primaryMax.toString());
    console.log('  bonusTokenId:', config.bonusTokenId.toString());
    console.log('  bonusEnabled:', config.bonusEnabled);
    console.log('  bonusMax:', config.bonusMax.toString());
  } catch (e) {
    console.log('❌ Error getting cosmetic config:', e.message);
  }
  
  // Try to simulate the transaction
  console.log('\n🎯 Attempting to simulate sacrificeForCosmetic(1, 0)...');
  try {
    // Use staticCall to simulate without sending transaction
    await maw.sacrificeForCosmetic.staticCall(1, 0);
    console.log('✅ Simulation successful - transaction should work');
  } catch (error) {
    console.log('❌ Simulation failed:');
    console.log('Error:', error.message);
    
    // Check if it's a specific revert reason
    if (error.message.includes('InsufficientBalance')) {
      console.log('💡 Issue: User doesn\'t have enough tokens');
    } else if (error.message.includes('NotAuthorized')) {
      console.log('💡 Issue: Authorization problem');
    } else if (error.message.includes('InvalidAmount')) {
      console.log('💡 Issue: Invalid sacrifice amounts');
    } else if (error.message.includes('Paused')) {
      console.log('💡 Issue: Contract is paused');
    } else {
      console.log('💡 Issue: Unknown revert reason');
    }
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});