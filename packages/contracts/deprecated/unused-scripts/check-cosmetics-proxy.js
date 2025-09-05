/**
 * Check cosmetic types in the V3 proxy contract that the frontend uses
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('🎨 Checking cosmetic types in V3 proxy contract...\n');
  
  const V3_PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  const V4_NEW_ADDRESS = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
  
  console.log('📄 V3 Proxy:', V3_PROXY_ADDRESS);
  console.log('📄 V4 New:', V4_NEW_ADDRESS);
  
  try {
    const v3Proxy = await ethers.getContractAt("MawSacrificeV4Upgradeable", V3_PROXY_ADDRESS);
    const v4New = await ethers.getContractAt("MawSacrificeV4Upgradeable", V4_NEW_ADDRESS);
    
    // Check cosmetic types in both contracts
    console.log('\n🔍 Checking cosmetic types...');
    
    const v3Types = await v3Proxy.getMonthlyCosmeticTypes();
    const v4Types = await v4New.getMonthlyCosmeticTypes();
    
    console.log('V3 Proxy cosmetic types:', v3Types.map(t => t.toString()));
    console.log('V4 New cosmetic types:', v4Types.map(t => t.toString()));
    
    // Check if they match
    const v3TypesStr = v3Types.map(t => t.toString()).join(',');
    const v4TypesStr = v4Types.map(t => t.toString()).join(',');
    
    if (v3TypesStr === v4TypesStr) {
      console.log('✅ Both contracts have matching cosmetic types');
    } else {
      console.log('❌ Cosmetic types differ between contracts!');
      console.log('   V3 Proxy needs to be updated to match V4 New');
      
      // Try to update the V3 proxy
      if (v4Types.length > 0) {
        console.log('\n🔧 Updating V3 proxy cosmetic types...');
        try {
          const tx = await v3Proxy.setMonthlyCosmeticTypes(v4Types);
          console.log('📝 Transaction sent:', tx.hash);
          await tx.wait();
          console.log('✅ V3 proxy updated successfully!');
          
          // Verify the update
          const updatedTypes = await v3Proxy.getMonthlyCosmeticTypes();
          console.log('📋 Updated V3 proxy types:', updatedTypes.map(t => t.toString()));
        } catch (error) {
          console.log('❌ Failed to update V3 proxy:', error.message);
        }
      }
    }
    
    // Also check cosmetics contract address
    console.log('\n🏭 Checking cosmetics contract addresses...');
    const v3CosmeticsAddr = await v3Proxy.cosmeticsContract();
    const v4CosmeticsAddr = await v4New.cosmeticsContract();
    
    console.log('V3 Proxy cosmetics contract:', v3CosmeticsAddr);
    console.log('V4 New cosmetics contract:', v4CosmeticsAddr);
    
    if (v3CosmeticsAddr === v4CosmeticsAddr) {
      console.log('✅ Both contracts use the same cosmetics contract');
    } else {
      console.log('❌ Cosmetics contract addresses differ!');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

main().catch(console.error);