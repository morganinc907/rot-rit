const hre = require("hardhat");

async function main() {
  console.log('🏗️ Deploying AddressRegistry for full chain-first resolution...');
  
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
    console.log('📦 Deploying AddressRegistry contract...');
    
    const AddressRegistry = await hre.ethers.getContractFactory("AddressRegistry");
    const registry = await AddressRegistry.deploy();
    await registry.waitForDeployment();
    
    const registryAddress = await registry.getAddress();
    console.log('✅ AddressRegistry deployed at:', registryAddress);
    
    console.log('🔧 Setting all ecosystem addresses...');
    
    const setAllTx = await registry.setAll(
      addresses.relics,
      addresses.mawSacrifice,
      addresses.cosmetics,
      addresses.demons,
      addresses.cultists,
      addresses.keyShop,
      addresses.raccoons,
      addresses.raccoonRenderer,
      addresses.ritualReadAggregator
    );
    
    console.log('📤 SetAll transaction sent:', setAllTx.hash);
    const setAllReceipt = await setAllTx.wait();
    console.log('✅ Addresses set in block:', setAllReceipt.blockNumber);
    
    console.log('🔍 Verifying registry...');
    
    // Test all getters
    const allAddresses = await registry.getAll();
    console.log('📋 Registry contents:');
    console.log('  Relics:', allAddresses.relics);
    console.log('  MAW Sacrifice:', allAddresses.mawSacrifice);
    console.log('  Cosmetics:', allAddresses.cosmetics);
    console.log('  Demons:', allAddresses.demons);
    console.log('  Cultists:', allAddresses.cultists);
    console.log('  KeyShop:', allAddresses.keyShop);
    console.log('  Raccoons:', allAddresses.raccoons);
    console.log('  Raccoon Renderer:', allAddresses.raccoonRenderer);
    console.log('  Ritual Read Aggregator:', allAddresses.ritualReadAggregator);
    
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
      console.log('🎯 Registry Address (save this):');
      console.log(`   ${registryAddress}`);
      console.log('');
      console.log('📱 Frontend can now use:');
      console.log(`   const registry = getContract('${registryAddress}', registryABI);`);
      console.log('   const cosmetics = await registry.get(COSMETICS_KEY);');
      console.log('');
      console.log('💡 Next steps:');
      console.log('1. Update useAddress hook to use registry');
      console.log('2. Add registry address to .env');
      console.log('3. Update frontend to use registry.get() for all addresses');
      
    } else {
      console.log('❌ Health check failed - not all addresses are set');
    }
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});