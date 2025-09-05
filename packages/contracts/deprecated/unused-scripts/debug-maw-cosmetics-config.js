/**
 * Debug why Maw contract isn't calling cosmetics contract during sacrifices
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('🔍 Debugging Maw → Cosmetics connection...\n');
  
  const MAW_ADDRESS = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
  const EXPECTED_COSMETICS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  
  console.log('📄 Maw contract:', MAW_ADDRESS);
  console.log('🎨 Expected cosmetics:', EXPECTED_COSMETICS);
  
  try {
    const maw = await ethers.getContractAt("MawSacrificeV4Upgradeable", MAW_ADDRESS);
    
    // 1. Check what cosmetics contract address is configured
    console.log('\n1️⃣ Checking cosmetics contract configuration...');
    try {
      const cosmeticsAddr = await maw.cosmetics();
      console.log('🏭 Configured cosmetics address:', cosmeticsAddr);
      
      if (cosmeticsAddr.toLowerCase() === EXPECTED_COSMETICS.toLowerCase()) {
        console.log('✅ Cosmetics address is correct');
      } else {
        console.log('❌ MISMATCH: Wrong cosmetics address!');
        console.log('   Expected:', EXPECTED_COSMETICS);
        console.log('   Configured:', cosmeticsAddr);
        
        // This is likely the issue - try to fix it
        console.log('\n🔧 Attempting to update cosmetics address...');
        try {
          const tx = await maw.updateContracts(
            await maw.relics(),
            await maw.cultists(), 
            await maw.demons(),
            EXPECTED_COSMETICS // Fix cosmetics address
          );
          console.log('📝 Update transaction:', tx.hash);
          await tx.wait();
          console.log('✅ Cosmetics address updated!');
        } catch (e) {
          console.log('❌ Update failed:', e.message);
        }
      }
    } catch (e) {
      console.log('❌ Cannot read cosmetics address:', e.message);
    }
    
    // 2. Check cosmetic types configuration
    console.log('\n2️⃣ Checking cosmetic types...');
    try {
      const types = await maw.getCurrentCosmeticTypes();
      console.log('🎨 Current cosmetic types:', types.map(t => t.toString()));
      
      if (types.length === 0) {
        console.log('❌ NO COSMETIC TYPES SET! This explains why no cosmetics are minted.');
        
        // Set the cosmetic types
        console.log('\n🔧 Setting cosmetic types...');
        const tx = await maw.setMonthlyCosmeticTypes([1, 2, 3, 4, 5]);
        console.log('📝 Set types transaction:', tx.hash);
        await tx.wait();
        console.log('✅ Cosmetic types set!');
      } else {
        console.log('✅ Cosmetic types are configured');
      }
    } catch (e) {
      console.log('❌ Cannot read cosmetic types:', e.message);
    }
    
    // 3. Check if Maw can mint from cosmetics contract
    console.log('\n3️⃣ Checking cosmetics minting authorization...');
    try {
      const cosmetics = await ethers.getContractAt("CosmeticsV2", EXPECTED_COSMETICS);
      
      // Check if Maw is owner of cosmetics contract
      const cosmeticsOwner = await cosmetics.owner();
      console.log('👑 Cosmetics owner:', cosmeticsOwner);
      console.log('🤖 Maw address:', MAW_ADDRESS);
      console.log('👑 Maw is cosmetics owner:', cosmeticsOwner.toLowerCase() === MAW_ADDRESS.toLowerCase());
      
      if (cosmeticsOwner.toLowerCase() !== MAW_ADDRESS.toLowerCase()) {
        console.log('❌ AUTHORIZATION ISSUE: Maw is not owner of cosmetics contract!');
        console.log('   This explains why cosmetics are not being minted.');
        
        // Check who the current owner is
        const [signer] = await ethers.getSigners();
        if (cosmeticsOwner.toLowerCase() === signer.address.toLowerCase()) {
          console.log('\n🔧 You are the cosmetics owner. Transferring to Maw...');
          try {
            const tx = await cosmetics.transferOwnership(MAW_ADDRESS);
            console.log('📝 Transfer ownership transaction:', tx.hash);
            await tx.wait();
            console.log('✅ Ownership transferred to Maw!');
          } catch (e) {
            console.log('❌ Transfer failed:', e.message);
          }
        } else {
          console.log('   Current owner must transfer ownership to Maw contract');
        }
      } else {
        console.log('✅ Maw has permission to mint cosmetics');
      }
      
    } catch (e) {
      console.log('❌ Cannot check cosmetics authorization:', e.message);
    }
    
    console.log('\n📋 Summary:');
    console.log('The issue is likely one of:');
    console.log('1. Wrong cosmetics contract address in Maw');
    console.log('2. No cosmetic types configured');
    console.log('3. Maw not authorized to mint from cosmetics contract');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

main().catch(console.error);