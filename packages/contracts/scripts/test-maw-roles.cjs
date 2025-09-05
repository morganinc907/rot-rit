const hre = require("hardhat");

async function main() {
  console.log('🔍 Testing MAW roles...');
  
  const mawAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const cosmeticsAddress = "0x32640D260CeCD52581280e23B9DCc6F49D04Bdcb";
  
  console.log('MAW address:', mawAddress);
  console.log('Relics address:', relicsAddress);
  console.log('Cosmetics address:', cosmeticsAddress);
  
  // Check Relics authorization
  console.log('\n💎 Checking Relics authorization...');
  try {
    const relics = await hre.ethers.getContractAt("Relics", relicsAddress);
    
    const mawRole = await relics.MAW_ROLE();
    console.log('MAW_ROLE hash:', mawRole);
    
    const hasRole = await relics.hasRole(mawRole, mawAddress);
    console.log('MAW has MAW_ROLE:', hasRole);
    
    if (!hasRole) {
      console.log('❌ MAW does not have MAW_ROLE on Relics - cannot mint shards!');
      console.log('💡 Need to run: relics.grantRole(MAW_ROLE, mawAddress)');
    } else {
      console.log('✅ MAW can mint on Relics');
    }
    
    // Test if MAW can actually mint
    try {
      const userAddress = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
      await relics.mint.staticCall(userAddress, 6, 1, "0x");
      console.log('✅ Static call succeeded - MAW can mint shards');
    } catch (e) {
      console.log('❌ Static call failed:', e.message);
    }
    
  } catch (e) {
    console.log('❌ Error checking Relics:', e.message);
  }
  
  // Check Cosmetics authorization
  console.log('\n🎨 Checking Cosmetics authorization...');
  try {
    const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
    
    const currentMaw = await cosmetics.mawSacrifice();
    console.log('Cosmetics mawSacrifice address:', currentMaw);
    console.log('Addresses match:', currentMaw.toLowerCase() === mawAddress.toLowerCase());
    
    if (currentMaw.toLowerCase() === mawAddress.toLowerCase()) {
      console.log('✅ MAW address is correct in cosmetics');
      
      // Test if MAW can actually mint cosmetics
      try {
        const userAddress = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
        await cosmetics.mintTo.staticCall(userAddress, 1);
        console.log('✅ Static call succeeded - MAW can mint cosmetics');
      } catch (e) {
        console.log('❌ Static call failed:', e.message);
        if (e.message.includes('Only MawSacrifice')) {
          console.log('💡 Msg.sender is not matching the registered MAW address');
        }
      }
    } else {
      console.log('❌ MAW address mismatch in cosmetics');
    }
    
  } catch (e) {
    console.log('❌ Error checking Cosmetics:', e.message);
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});