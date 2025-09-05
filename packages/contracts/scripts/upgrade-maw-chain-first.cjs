const hre = require("hardhat");

async function main() {
  console.log('🚀 Upgrading MAW to chain-first version...');
  
  const mawProxyAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  const addresses = {
    keyShop: "0xF2851E53bD86dff9fb7b9d67c19AF1CCe2Ce7076",
    raccoons: "0x6DB1C2d60579679A82C3Ac39cf7097B442E1Aa9f",
    raccoonRenderer: "0x3eE467d8Dc8Fdf26dFC17dA8630EE1078aEd3A85",
    ritualReadAggregator: "0xe14830B91Bf666E51305a89C1196d0e88bad98a2"
  };
  
  try {
    console.log('📦 Deploying MawSacrificeV5ChainFirst implementation...');
    
    const MawChainFirst = await hre.ethers.getContractFactory("MawSacrificeV5ChainFirst");
    const newImplementation = await MawChainFirst.deploy();
    await newImplementation.waitForDeployment();
    
    const newImplAddress = await newImplementation.getAddress();
    console.log('✅ New implementation deployed at:', newImplAddress);
    
    console.log('🔧 Upgrading proxy to new implementation...');
    
    // Get the current proxy contract
    const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawProxyAddress);
    
    // Upgrade to new implementation
    const upgradeTx = await maw.upgradeToAndCall(newImplAddress, "0x");
    console.log('📤 Upgrade transaction sent:', upgradeTx.hash);
    
    const upgradeReceipt = await upgradeTx.wait();
    console.log('✅ Upgrade confirmed in block:', upgradeReceipt.blockNumber);
    
    console.log('⏱️ Waiting for upgrade to settle...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🔧 Setting chain-first addresses...');
    
    // Connect to the upgraded contract
    const mawChainFirst = await hre.ethers.getContractAt("MawSacrificeV5ChainFirst", mawProxyAddress);
    
    // Set the chain-first addresses
    const setAddressesTx = await mawChainFirst.setChainFirstAddresses(
      addresses.keyShop,
      addresses.raccoons,
      addresses.raccoonRenderer,
      addresses.ritualReadAggregator
    );
    console.log('📤 Set addresses transaction sent:', setAddressesTx.hash);
    
    const setAddressesReceipt = await setAddressesTx.wait();
    console.log('✅ Addresses set in block:', setAddressesReceipt.blockNumber);
    
    console.log('🔍 Verifying upgrade...');
    
    // Test all getters
    const healthcheck = await mawChainFirst.chainFirstHealthcheck();
    console.log('📋 Chain-first health check results:');
    console.log('  Relics:', healthcheck._relics);
    console.log('  Cosmetics:', healthcheck._cosmetics);
    console.log('  Demons:', healthcheck._demons);
    console.log('  Cultists:', healthcheck._cultists);
    console.log('  KeyShop:', healthcheck._keyShop);
    console.log('  Raccoons:', healthcheck._raccoons);
    console.log('  RaccoonRenderer:', healthcheck._raccoonRenderer);
    console.log('  RitualReadAggregator:', healthcheck._ritualReadAggregator);
    console.log('  All Set:', healthcheck._allSet);
    
    if (healthcheck._allSet) {
      console.log('');
      console.log('🎉 SUCCESS: MAW upgrade complete!');
      console.log('✅ All 9 contracts now chain-resolvable via MAW getters');
      console.log('🔒 Address drift protection: FULLY ENABLED');
      console.log('');
      console.log('🎯 New getters available:');
      console.log('  maw.keyShop()');
      console.log('  maw.raccoons()');
      console.log('  maw.raccoonRenderer()');
      console.log('  maw.ritualReadAggregator()');
      console.log('  maw.healthcheck()');
      console.log('  maw.configHash()');
      
    } else {
      console.log('❌ Health check failed - not all addresses are set');
    }
    
  } catch (error) {
    console.error('❌ Upgrade failed:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});