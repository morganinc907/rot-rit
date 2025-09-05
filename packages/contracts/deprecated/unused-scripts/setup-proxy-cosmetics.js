/**
 * Setup cosmetic types in the V3 proxy contract
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('🔧 Setting up cosmetic types in V3 proxy...\n');
  
  const V3_PROXY_ADDRESS = "0x09cB2813f07105385f76E5917C3b68c980a91E73"; // NEW V4 that frontend uses
  const COSMETIC_TYPES = [1, 2, 3, 4, 5]; // All available cosmetics
  
  console.log('📄 V3 Proxy:', V3_PROXY_ADDRESS);
  console.log('🎨 Setting types:', COSMETIC_TYPES);
  
  try {
    const proxy = await ethers.getContractAt("MawSacrificeV4Upgradeable", V3_PROXY_ADDRESS);
    
    // Check current cosmetic types
    try {
      const currentTypes = await proxy.getMonthlyCosmeticTypes();
      console.log('📋 Current cosmetic types:', currentTypes.map(t => t.toString()));
      
      const currentTypesStr = currentTypes.map(t => t.toString()).join(',');
      const targetTypesStr = COSMETIC_TYPES.join(',');
      
      if (currentTypesStr === targetTypesStr) {
        console.log('✅ Cosmetic types already set correctly!');
        return;
      }
    } catch (e) {
      console.log('⚠️  Could not read current types:', e.message.split('\n')[0]);
    }
    
    // Set the cosmetic types
    console.log('\n🔧 Setting cosmetic types...');
    const tx = await proxy.setMonthlyCosmeticTypes(COSMETIC_TYPES);
    console.log('📝 Transaction sent:', tx.hash);
    console.log('⏳ Waiting for confirmation...');
    await tx.wait();
    console.log('✅ Transaction confirmed!');
    
    // Verify the setting
    try {
      const updatedTypes = await proxy.getMonthlyCosmeticTypes();
      console.log('📋 Updated cosmetic types:', updatedTypes.map(t => t.toString()));
      console.log('✅ Cosmetic types successfully set!');
    } catch (e) {
      console.log('⚠️  Could not verify update:', e.message.split('\n')[0]);
    }
    
    // Also check cosmetics contract address
    try {
      const cosmeticsAddr = await proxy.cosmeticsContract();
      console.log('🏭 Cosmetics contract:', cosmeticsAddr);
      
      // Expected address from addresses.json
      const expectedAddr = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
      if (cosmeticsAddr.toLowerCase() === expectedAddr.toLowerCase()) {
        console.log('✅ Cosmetics contract address is correct');
      } else {
        console.log('❌ Cosmetics contract address mismatch!');
        console.log('   Expected:', expectedAddr);
        console.log('   Actual:', cosmeticsAddr);
      }
    } catch (e) {
      console.log('⚠️  Could not check cosmetics contract:', e.message.split('\n')[0]);
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

main().catch(console.error);