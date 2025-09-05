const hre = require("hardhat");

async function main() {
  console.log('🔍 Checking cosmetic sacrifice configuration...');
  
  const [signer] = await hre.ethers.getSigners();
  const userAddress = signer.address;
  console.log('User:', userAddress);
  
  const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawAddress);
  
  try {
    // Check if the cosmetic sacrifice config is set up
    console.log('\n🎨 Checking cosmetic sacrifice configuration...');
    
    // This function might not exist if not configured
    console.log('Attempting to read cosmetic sacrifice config...');
    
    // Try to call the contract directly to see what happens
    const provider = hre.ethers.provider;
    
    // Use low-level call to check if config exists
    const configCalldata = maw.interface.encodeFunctionData('getCosmeticSacrificeConfig');
    const result = await provider.call({
      to: mawAddress,
      data: configCalldata
    });
    
    if (result === '0x') {
      console.log('❌ Cosmetic sacrifice config not found or not set up');
    } else {
      console.log('✅ Config exists, decoding...');
      const decoded = maw.interface.decodeFunctionResult('getCosmeticSacrificeConfig', result);
      console.log('Config:', {
        primaryTokenId: decoded[0].toString(),
        primaryMin: decoded[1].toString(), 
        primaryMax: decoded[2].toString(),
        bonusTokenId: decoded[3].toString(),
        bonusEnabled: decoded[4],
        bonusMax: decoded[5].toString()
      });
    }
    
  } catch (error) {
    console.log('❌ Error reading cosmetic config:', error.message);
    
    // The issue might be that the cosmetic sacrifice config isn't initialized
    if (error.message.includes('InvalidConfiguration') || error.message.includes('primaryTokenId == 0')) {
      console.log('\n💡 DIAGNOSIS: Cosmetic sacrifice config is not initialized!');
      console.log('Need to call setCosmeticSacrificeConfig() to set up:');
      console.log('- primaryTokenId: 2 (lantern fragments)');
      console.log('- primaryMin: 1');  
      console.log('- primaryMax: 3');
      console.log('- bonusTokenId: 3 (masks)');
      console.log('- bonusEnabled: true');
      console.log('- bonusMax: 3');
    }
  }
  
  // Check cosmetic pool too
  try {
    console.log('\n🎰 Checking cosmetic pool...');
    const poolResult = await hre.ethers.provider.call({
      to: mawAddress,
      data: maw.interface.encodeFunctionData('getCosmeticPool')
    });
    
    if (poolResult === '0x') {
      console.log('❌ Cosmetic pool not set up');
    } else {
      const poolDecoded = maw.interface.decodeFunctionResult('getCosmeticPool', poolResult);
      console.log('Pool:', {
        ids: poolDecoded[0].map(id => id.toString()),
        weights: poolDecoded[1].map(w => w.toString()),
        total: poolDecoded[2].toString()
      });
    }
  } catch (error) {
    console.log('❌ Error reading cosmetic pool:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});