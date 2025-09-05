/**
 * Verify cosmetic configuration on the V4 contract the frontend uses
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('🔍 Verifying V4 cosmetic configuration...\n');
  
  const V4_ADDRESS = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
  const COSMETICS_ADDRESS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  
  console.log('📄 V4 contract:', V4_ADDRESS);
  console.log('🎨 Expected cosmetics:', COSMETICS_ADDRESS);
  
  try {
    const v4 = await ethers.getContractAt("MawSacrificeV4Upgradeable", V4_ADDRESS);
    
    // Check if we can simulate a cosmetic sacrifice
    console.log('🧪 Testing cosmetic sacrifice simulation...');
    try {
      const result = await v4.sacrificeForCosmetic.staticCall(1, 0); // 1 fragment, 0 masks
      console.log('✅ Cosmetic sacrifice simulation succeeded');
      console.log('📊 Result structure:', Object.keys(result || {}));
      
      if (result) {
        console.log('📋 Detailed result:');
        if (Array.isArray(result)) {
          result.forEach((item, index) => {
            console.log(`   [${index}]:`, item.toString());
          });
        } else if (typeof result === 'object') {
          Object.entries(result).forEach(([key, value]) => {
            console.log(`   ${key}:`, value.toString());
          });
        }
      }
    } catch (error) {
      console.log('❌ Cosmetic sacrifice simulation failed:', error.message);
      
      // Check if it's a gas estimation issue vs actual revert
      if (error.message.includes('gas')) {
        console.log('   This might be a gas estimation issue');
      } else if (error.message.includes('revert')) {
        console.log('   This is a contract revert - function is failing');
      }
    }
    
    // Check what the success rate calculation shows
    console.log('\n🎯 Testing success rate calculation...');
    try {
      // Look for success rate functions
      const testFunctions = [
        'getCosmeticSuccessRate',
        'calculateSuccessRate', 
        'getSuccessChance',
        'cosmeticSuccessRate'
      ];
      
      for (const funcName of testFunctions) {
        try {
          if (v4[funcName]) {
            const rate = await v4[funcName](1, 0); // 1 fragment, 0 masks
            console.log(`✅ ${funcName}(1,0):`, rate.toString(), '%');
          }
        } catch (e) {
          console.log(`❌ ${funcName}: not found or failed`);
        }
      }
    } catch (e) {
      console.log('⚠️  Could not test success rates');
    }
    
    // Check if cosmetics contract can actually mint
    console.log('\n🏭 Testing cosmetics contract minting...');
    try {
      const cosmetics = await ethers.getContractAt("Cosmetics", COSMETICS_ADDRESS);
      
      // Check if V4 contract is authorized to mint cosmetics
      const [signer] = await ethers.getSigners();
      const userAddress = signer.address;
      
      // Try to see if V4 can mint cosmetics
      try {
        await cosmetics.mint.staticCall(userAddress, 1); // Try minting cosmetic ID 1
        console.log('✅ Cosmetics contract CAN mint to user');
      } catch (e) {
        console.log('❌ Cosmetics minting failed:', e.message.split('\n')[0]);
        
        // Check if it's an authorization issue
        if (e.message.includes('owner') || e.message.includes('authorized')) {
          console.log('   This appears to be an authorization issue');
          
          // Check who can mint
          try {
            const owner = await cosmetics.owner();
            console.log('   Cosmetics owner:', owner);
            console.log('   V4 address:', V4_ADDRESS);
            console.log('   V4 is owner:', owner.toLowerCase() === V4_ADDRESS.toLowerCase());
          } catch (e2) {
            console.log('   Could not check cosmetics ownership');
          }
        }
      }
    } catch (e) {
      console.log('❌ Could not test cosmetics contract');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

main().catch(console.error);