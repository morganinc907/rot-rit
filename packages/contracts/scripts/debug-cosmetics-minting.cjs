const hre = require("hardhat");

async function main() {
  console.log('🔍 Debugging cosmetics minting issues...');
  
  const [signer] = await hre.ethers.getSigners();
  const userAddress = signer.address;
  
  const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  const cosmeticsAddress = "0x32640D260CeCD52581280e23B9DCc6F49D04Bdcb";
  const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  // Check if cosmetics contract exists and has the expected interface
  console.log('\n🎨 Checking cosmetics contract interface...');
  try {
    const provider = hre.ethers.provider;
    const code = await provider.getCode(cosmeticsAddress);
    
    if (code === '0x') {
      console.log('❌ Cosmetics contract not found at address!');
      return;
    }
    
    console.log('✅ Cosmetics contract exists');
    
    // Try different contract interfaces
    console.log('\n🧪 Testing different contract interfaces...');
    
    try {
      // Try as CosmeticsV2
      const cosmeticsV2 = await hre.ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
      const owner = await cosmeticsV2.owner();
      console.log('✅ CosmeticsV2 interface works, owner:', owner);
      
      // Check if MAW can mint
      try {
        await cosmeticsV2.mintTo.staticCall(userAddress, 1);
        console.log('✅ MAW can mint cosmetics');
      } catch (e) {
        console.log('❌ MAW cannot mint cosmetics:', e.message);
        
        // Check if it's an authorization issue
        if (e.message.includes('AccessControlUnauthorized') || e.message.includes('not authorized')) {
          console.log('💡 This is an authorization issue - MAW needs MINTER_ROLE');
        }
      }
      
    } catch (e) {
      console.log('❌ CosmeticsV2 interface failed:', e.message);
    }
    
  } catch (e) {
    console.log('❌ Error checking cosmetics contract:', e.message);
  }
  
  // Check relics contract for shard minting
  console.log('\n💎 Checking relics contract for shard minting...');
  try {
    const relics = await hre.ethers.getContractAt("Relics", relicsAddress);
    const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawAddress);
    
    // Check if MAW can mint shards (token ID 6)
    const shardBalance = await relics.balanceOf(userAddress, 6);
    console.log('Current shard balance:', shardBalance.toString());
    
    // Test if MAW can mint shards to user
    try {
      await relics.mint.staticCall(userAddress, 6, 1, "0x", { from: mawAddress });
      console.log('✅ MAW can mint shards to user');
    } catch (e) {
      console.log('❌ MAW cannot mint shards:', e.message);
      
      // Check if MAW has proper role
      try {
        const mawRole = await relics.MAW_ROLE();
        const hasRole = await relics.hasRole(mawRole, mawAddress);
        console.log('MAW has MAW_ROLE on Relics:', hasRole);
        
        if (!hasRole) {
          console.log('💡 Issue: MAW needs MAW_ROLE on Relics contract to mint fallback shards');
        }
      } catch (roleError) {
        console.log('Error checking MAW role:', roleError.message);
      }
    }
    
  } catch (e) {
    console.log('❌ Error checking relics contract:', e.message);
  }
  
  // Check MAW config
  console.log('\n⚙️ Checking MAW shard configuration...');
  try {
    const maw = await hre.ethers.getContractAt("MawSacrificeV5", mawAddress);
    
    // The config might have wrong shard ID
    console.log('Checking MAW configuration for shard ID...');
    // This would require accessing the _cfg() internal function
    console.log('Note: Cannot directly read internal config, but shardId should be 6');
    
  } catch (e) {
    console.log('❌ Error checking MAW config:', e.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});