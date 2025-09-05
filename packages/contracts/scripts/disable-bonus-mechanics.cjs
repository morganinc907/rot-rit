const hre = require("hardhat");

async function main() {
  console.log('🔄 Disabling bonus mechanics in sacrifice config...');
  
  const [signer] = await hre.ethers.getSigners();
  console.log('Signer:', signer.address);
  
  const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawAddress);
  
  try {
    console.log('🎯 Setting fragments-only sacrifice config...');
    const tx = await maw.setCosmeticSacrificeConfig(
      2,     // primaryTokenId: fragments (ID 2)
      1,     // primaryMin: 1
      3,     // primaryMax: 3  
      0,     // bonusTokenId: 0 (disabled)
      false, // bonusEnabled: false
      0      // bonusMax: 0
    );
    console.log('Transaction sent:', tx.hash);
    
    console.log('⏳ Waiting for confirmation...');
    await tx.wait();
    console.log('✅ Sacrifice config updated successfully');
    
    // Verify the update
    const newConfig = await maw.getCosmeticSacrificeConfig();
    console.log('\n✅ New sacrifice config:');
    console.log('  primaryTokenId:', newConfig[0].toString());
    console.log('  primaryMin:', newConfig[1].toString());
    console.log('  primaryMax:', newConfig[2].toString());
    console.log('  bonusTokenId:', newConfig[3].toString());
    console.log('  bonusEnabled:', newConfig[4]);
    console.log('  bonusMax:', newConfig[5].toString());
    
    console.log('\n🎉 SIMPLIFICATION COMPLETE!');
    console.log('✅ Cosmetic pool: Removed masks & ash vials');
    console.log('✅ Sacrifice config: Disabled bonus mechanics');
    console.log('✅ New system: Fragments-only → Cosmetics');
    console.log('✅ Frontend: Will auto-update via chain-first architecture');
    
  } catch (error) {
    console.log('❌ Error updating config:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});