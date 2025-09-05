const hre = require("hardhat");

async function main() {
  console.log('🔍 Debugging AddressRegistry...');
  
  const registryAddress = "0xF7FC9caa60f4D12d731B32883498A8D403b9c828";
  
  try {
    const registry = await hre.ethers.getContractAt("AddressRegistry", registryAddress);
    
    console.log('📋 Testing individual getters...');
    
    // Test individual keys
    const RELICS_KEY = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("RELICS"));
    const MAW_KEY = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("MAW_SACRIFICE"));
    const COSMETICS_KEY = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("COSMETICS"));
    
    console.log('Keys:');
    console.log('RELICS key:', RELICS_KEY);
    console.log('MAW key:', MAW_KEY);
    console.log('COSMETICS key:', COSMETICS_KEY);
    
    const relicsAddr = await registry.get(RELICS_KEY);
    const mawAddr = await registry.get(MAW_KEY);
    const cosmeticsAddr = await registry.get(COSMETICS_KEY);
    
    console.log('');
    console.log('Addresses:');
    console.log('Relics:', relicsAddr);
    console.log('MAW:', mawAddr);
    console.log('Cosmetics:', cosmeticsAddr);
    
    // Test getAll
    console.log('');
    console.log('📋 Testing getAll...');
    const allAddresses = await registry.getAll();
    console.log('All addresses:', {
      relics: allAddresses.relics,
      mawSacrifice: allAddresses.mawSacrifice,
      cosmetics: allAddresses.cosmetics
    });
    
    // Check if owner
    const owner = await registry.owner();
    const [signer] = await hre.ethers.getSigners();
    console.log('');
    console.log('Owner:', owner);
    console.log('Signer:', signer.address);
    console.log('Is owner?', owner.toLowerCase() === signer.address.toLowerCase());
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});