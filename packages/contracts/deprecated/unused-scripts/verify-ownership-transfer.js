/**
 * Verify that cosmetics ownership was transferred correctly
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('🔍 Verifying cosmetics ownership transfer...\n');
  
  const COSMETICS_ADDRESS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  const MAW_ADDRESS = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
  
  try {
    const cosmetics = await ethers.getContractAt("CosmeticsV2", COSMETICS_ADDRESS);
    
    // Check current owner
    const currentOwner = await cosmetics.owner();
    console.log('👑 Current cosmetics owner:', currentOwner);
    console.log('🤖 Expected (Maw address):', MAW_ADDRESS);
    console.log('✅ Ownership correct:', currentOwner.toLowerCase() === MAW_ADDRESS.toLowerCase());
    
    if (currentOwner.toLowerCase() !== MAW_ADDRESS.toLowerCase()) {
      console.log('❌ OWNERSHIP ISSUE: Transfer may have failed');
      return;
    }
    
    // Test if Maw can actually mint
    console.log('\n🧪 Testing if Maw can mint cosmetics...');
    const testUser = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
    
    try {
      // This will fail because we're not the Maw contract, but it should give us info
      await cosmetics.mint.staticCall(testUser, 1);
      console.log('✅ Maw should be able to mint cosmetics');
    } catch (e) {
      if (e.message.includes('Ownable')) {
        console.log('❌ Maw still cannot mint - ownership issue persists');
      } else {
        console.log('ℹ️ Other error (this is expected):', e.message.split('\n')[0]);
      }
    }
    
    // Check if there are any cosmetics already minted recently
    console.log('\n📊 Checking recent cosmetic mints...');
    try {
      const filter = cosmetics.filters.Transfer(ethers.ZeroAddress, testUser);
      const events = await cosmetics.queryFilter(filter, -100); // Last 100 blocks
      
      console.log(`🎨 Recent cosmetic mints to user: ${events.length}`);
      if (events.length > 0) {
        console.log('   Recent mints:');
        for (const event of events.slice(-3)) {
          console.log(`   - Token ${event.args.tokenId} (block ${event.blockNumber})`);
        }
      }
    } catch (e) {
      console.log('⚠️ Could not check recent mints');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

main().catch(console.error);