const hre = require("hardhat");

async function main() {
  console.log('🔧 Setting up AddressRegistry...');
  
  const registryAddress = "0xF7FC9caa60f4D12d731B32883498A8D403b9c828";
  const addresses = {
    relics: "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b",
    mawSacrifice: "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db", 
    cosmetics: "0x13290aCbf346B17E82C8be01178A7b74F20F748d",
    demons: "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF",
    cultists: "0x2D7cD25A014429282062298d2F712FA7983154B9",
    keyShop: "0xF2851E53bD86dff9fb7b9d67c19AF1CCe2Ce7076",
    raccoons: "0x6DB1C2d60579679A82C3Ac39cf7097B442E1Aa9f",
    raccoonRenderer: "0x3eE467d8Dc8Fdf26dFC17dA8630EE1078aEd3A85",
    ritualReadAggregator: "0xe14830B91Bf666E51305a89C1196d0e88bad98a2"
  };
  
  try {
    const registry = await hre.ethers.getContractAt("AddressRegistry", registryAddress);
    
    console.log('🔧 Setting all ecosystem addresses with higher gas...');
    
    const setAllTx = await registry.setAll(
      addresses.relics,
      addresses.mawSacrifice,
      addresses.cosmetics,
      addresses.demons,
      addresses.cultists,
      addresses.keyShop,
      addresses.raccoons,
      addresses.raccoonRenderer,
      addresses.ritualReadAggregator,
      {
        gasLimit: 500000,
        gasPrice: hre.ethers.parseUnits("20", "gwei")
      }
    );
    
    console.log('📤 SetAll transaction sent:', setAllTx.hash);
    const setAllReceipt = await setAllTx.wait();
    console.log('✅ Addresses set in block:', setAllReceipt.blockNumber);
    
    console.log('🔍 Verifying registry...');
    
    // Health check
    const healthcheck = await registry.healthcheck();
    console.log('');
    console.log('📊 Health Check:');
    console.log('  Total Keys:', Number(healthcheck.totalKeys));
    console.log('  Set Addresses:', Number(healthcheck.setAddresses));
    console.log('  All Set:', healthcheck.allSet);
    console.log('  Config Hash:', healthcheck.currentConfigHash);
    
    if (healthcheck.allSet) {
      console.log('');
      console.log('🎉 SUCCESS: AddressRegistry fully configured!');
      console.log('✅ All 9 contracts registered');
      console.log('🔒 Address drift protection: FULLY ENABLED');
      console.log('');
      console.log('🎯 Registry Address:');
      console.log(`   ${registryAddress}`);
      
    } else {
      console.log('❌ Health check failed');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});