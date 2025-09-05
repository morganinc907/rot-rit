const hre = require("hardhat");

async function main() {
  console.log('📋 Checking current MAW contract getters...');
  
  const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  
  try {
    const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawAddress);
    
    console.log('✅ Current getters available:');
    
    // Check existing getters
    const relics = await maw.relics();
    console.log('  relics():', relics);
    
    const cosmetics = await maw.cosmetics(); 
    console.log('  cosmetics():', cosmetics);
    
    const demons = await maw.demons();
    console.log('  demons():', demons);
    
    const cultists = await maw.cultists();
    console.log('  cultists():', cultists);
    
    console.log('');
    console.log('❌ Missing getters (need to add):');
    console.log('  keyShop() - for KeyShop address');
    console.log('  raccoons() - for Raccoons NFT contract');  
    console.log('  raccoonRenderer() - for RaccoonRenderer');
    console.log('  ritualReadAggregator() - for data aggregation');
    console.log('  healthcheck() - for dependency verification');
    console.log('  configHash() - for config drift detection');
    
    console.log('');
    console.log('🎯 Strategy:');
    console.log('Since we need to add getters but preserve storage layout,');
    console.log('we can either:');
    console.log('1. Use unstructured storage for new addresses');
    console.log('2. Create separate registry contract');
    console.log('3. Use existing contract interfaces where possible');
    
    // Let's see if we can get some addresses from existing contracts
    console.log('');
    console.log('🔍 Checking if we can resolve some addresses from existing contracts...');
    
    // Check if Raccoons contract has a renderer getter
    const raccoonsAddr = "0x6DB1C2d60579679A82C3Ac39cf7097B442E1Aa9f";
    try {
      const raccoons = await hre.ethers.getContractAt("IERC721", raccoonsAddr);
      console.log('✅ Raccoons contract accessible at:', raccoonsAddr);
    } catch (e) {
      console.log('❌ Raccoons contract check failed:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});