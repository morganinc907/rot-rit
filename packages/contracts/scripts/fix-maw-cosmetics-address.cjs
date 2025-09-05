const hre = require("hardhat");

async function main() {
  console.log('🔧 Fixing MAW cosmetics address...');
  
  const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  const correctCosmeticsAddress = "0x13290aCbf346B17E82C8be01178A7b74F20F748d";
  
  // Get addresses from the addresses.json file
  const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const demonsAddress = "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF"; 
  const cultistsAddress = "0x2D7cD25A014429282062298d2F712FA7983154B9";
  
  try {
    const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawAddress);
    
    console.log('📋 Current state:');
    const currentCosmetics = await maw.cosmetics();
    const currentRelics = await maw.relics();
    console.log('Current cosmetics:', currentCosmetics);
    console.log('Current relics:', currentRelics);
    console.log('Target cosmetics:', correctCosmeticsAddress);
    
    if (currentCosmetics.toLowerCase() === correctCosmeticsAddress.toLowerCase()) {
      console.log('✅ MAW already points to correct cosmetics address');
      return;
    }
    
    console.log('🔧 Updating MAW to point to correct cosmetics...');
    console.log('Using setContracts with 4 parameters:');
    console.log('  relics:', relicsAddress);
    console.log('  cosmetics:', correctCosmeticsAddress);
    console.log('  demons:', demonsAddress);
    console.log('  cultists:', cultistsAddress);
    
    const tx = await maw.setContracts(
      relicsAddress,
      correctCosmeticsAddress, 
      demonsAddress,
      cultistsAddress
    );
    console.log('📤 Transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed in block:', receipt.blockNumber);
    
    // Verify the update
    const newCosmetics = await maw.cosmetics();
    console.log('🔍 Verification:');
    console.log('New cosmetics address:', newCosmetics);
    
    if (newCosmetics.toLowerCase() === correctCosmeticsAddress.toLowerCase()) {
      console.log('✅ MAW successfully updated to point to correct cosmetics');
      console.log('🎯 Chain-first pattern is now ready!');
    } else {
      console.log('❌ Update failed - addresses do not match');
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});