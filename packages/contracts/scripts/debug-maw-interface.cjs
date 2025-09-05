const hre = require("hardhat");

async function main() {
  console.log('🔍 Checking MAW contract interface...');
  
  const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  
  try {
    // Try different contract interfaces
    console.log('🔍 Trying MawSacrificeV5...');
    const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawAddress);
    
    console.log('📋 Available methods:');
    
    // Check cosmetics getter
    try {
      const cosmetics = await maw.cosmetics();
      console.log('✅ cosmetics():', cosmetics);
    } catch (e) {
      console.log('❌ cosmetics() failed:', e.message);
    }
    
    // Check if there's a different getter
    try {
      const relics = await maw.relics();
      console.log('✅ relics():', relics);
    } catch (e) {
      console.log('❌ relics() failed:', e.message);
    }
    
    // Check if there's a raccoons getter
    try {
      const raccoons = await maw.raccoons();
      console.log('✅ raccoons():', raccoons);
    } catch (e) {
      console.log('❌ raccoons() failed:', e.message);
    }
    
    // Check owner
    try {
      const owner = await maw.owner();
      console.log('✅ owner():', owner);
    } catch (e) {
      console.log('❌ owner() failed:', e.message);
    }
    
    // Check setContracts
    console.log('🔍 Checking setContracts method...');
    // Just check if the method exists without calling it
    console.log('Contract interface checks completed');
    
  } catch (error) {
    console.error('❌ Interface check failed:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});