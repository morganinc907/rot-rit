const hre = require("hardhat");

async function main() {
  console.log('🔍 Checking MAW contract methods for cosmetic data access...');
  
  const [signer] = await hre.ethers.getSigners();
  const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  
  try {
    const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawAddress);
    
    // Check cosmetic pool directly
    console.log('\n📋 Current cosmetic pool:');
    const currentPool = await maw.getCosmeticPool();
    console.log('  IDs:', currentPool[0].map(id => id.toString()));
    console.log('  Weights:', currentPool[1].map(w => w.toString()));
    console.log('  Total:', currentPool[2].toString());
    
    // Check what methods are available on the contract
    console.log('\n📄 Available MAW contract methods:');
    const fragment = maw.interface.fragments;
    const viewFunctions = [];
    
    Object.keys(fragment).forEach(key => {
      const func = fragment[key];
      if (func.type === 'function' && (func.stateMutability === 'view' || func.stateMutability === 'pure')) {
        const signature = `${func.name}(${func.inputs.map(i => i.type).join(', ')})`;
        viewFunctions.push(signature);
        
        // Look for cosmetic-related methods
        if (func.name.toLowerCase().includes('cosmetic')) {
          console.log(`   🎭 ${signature}`);
        }
      }
    });
    
    console.log('\n🔧 Suggested approach:');
    console.log('- Store.jsx should call getCosmeticPool() instead of getCurrentCosmeticTypes()');
    console.log('- Use the cosmetic pool IDs to fetch cosmetic info from CosmeticsV2 contract');
    console.log('- This matches how the MAW sacrifice works internally');
    
    console.log('\n📝 Current cosmetic pool has these IDs:', currentPool[0].map(id => id.toString()));
    console.log('- ID 1 = Glass Shards (fallback reward, not a wearable cosmetic)');
    console.log('- Need to check CosmeticsV2 contract for actual wearable cosmetics');
    
    // Check if there are methods to get cosmetic types
    console.log('\n🎭 Cosmetic-related methods available:');
    Object.keys(fragment).forEach(key => {
      const func = fragment[key];
      if (func.type === 'function' && func.name.toLowerCase().includes('cosmetic')) {
        const signature = `${func.name}(${func.inputs.map(i => `${i.name}: ${i.type}`).join(', ')})`;
        const outputs = func.outputs ? ` -> ${func.outputs.map(o => o.type).join(', ')}` : '';
        console.log(`   ${signature}${outputs}`);
      }
    });
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});