/**
 * Test direct cosmetic minting to isolate the issue
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('🎨 Testing direct cosmetic minting...\n');
  
  const COSMETICS_ADDRESS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  const MAW_ADDRESS = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
  const TEST_ADDRESS = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  
  try {
    const [signer] = await ethers.getSigners();
    console.log('👤 Using account:', signer.address);
    
    // Use Maw contract to call cosmetics (since Maw owns it)
    const maw = await ethers.getContractAt("MawSacrificeV4Upgradeable", MAW_ADDRESS);
    
    console.log('🏭 Cosmetics contract:', COSMETICS_ADDRESS);
    console.log('🤖 Maw contract (owner):', MAW_ADDRESS);
    console.log('🎯 Test target:', TEST_ADDRESS);
    
    // Get the cosmetics contract address from Maw to verify
    const mawCosmeticsAddr = await maw.cosmetics();
    console.log('🔗 Maw thinks cosmetics is:', mawCosmeticsAddr);
    console.log('✅ Address matches:', mawCosmeticsAddr.toLowerCase() === COSMETICS_ADDRESS.toLowerCase());
    
    console.log('\n🧪 Testing direct mintTo call...');
    
    // We need to simulate calling cosmetics.mintTo() as if we're the Maw contract
    // Since I can't actually call it directly (not the Maw), let me create a script
    // that tries to mint through a transaction from Maw
    
    console.log('⚠️  Cannot test mintTo directly since it requires onlyMawSacrifice modifier');
    console.log('🔍 Instead, let\'s test if the cosmetic success logic works at all...');
    
    // Let's call a Maw function that SHOULD succeed and mint
    // First, let's check what the current success rate calculation returns
    console.log('\n🎲 Testing success rate calculation...');
    
    try {
      // Create a simple test: try many sacrifices with 3 fragments (80% success rate)
      // If we get 0% success with 80% rate, there's definitely a bug
      
      // First check if we have enough fragments
      const fragmentsAddr = await maw.relics();
      const relicsAbi = ["function balanceOf(address account, uint256 id) view returns (uint256)"];
      const fragments = new ethers.Contract(fragmentsAddr, relicsAbi, signer);
      
      const fragmentBalance = await fragments.balanceOf(signer.address, 2);
      console.log(`💎 Lantern Fragment balance: ${fragmentBalance.toString()}`);
      
      if (fragmentBalance < 3) {
        console.log('⚠️  Need at least 3 fragments for 80% success test');
        return;
      }
      
      // Try a 3-fragment sacrifice (80% success rate)
      console.log('\n🎯 Attempting 3-fragment sacrifice (80% success rate)...');
      
      const tx = await maw.sacrificeForCosmetic(3, 0, {
        gasLimit: 500000
      });
      
      const receipt = await tx.wait();
      
      // Check if cosmetics contract was called
      const cosmeticsLogs = receipt.logs.filter(l => 
        l.address.toLowerCase() === COSMETICS_ADDRESS.toLowerCase()
      );
      
      console.log('📝 Transaction:', tx.hash);
      console.log('⛽ Gas used:', receipt.gasUsed.toString());
      console.log('📊 Total logs:', receipt.logs.length);
      console.log('🎨 Cosmetics logs:', cosmeticsLogs.length);
      
      if (cosmeticsLogs.length > 0) {
        console.log('✅ SUCCESS! Cosmetics contract was called');
        console.log('🎉 The issue was just bad luck with low success rates!');
      } else {
        console.log('❌ STILL NO COSMETICS LOGS');
        console.log('🚨 This suggests a deeper issue with the success logic or mintTo()');
        
        // Check the events to see what actually happened
        console.log('\n📋 Transaction events analysis:');
        for (let i = 0; i < receipt.logs.length; i++) {
          const log = receipt.logs[i];
          try {
            if (log.address.toLowerCase() === MAW_ADDRESS.toLowerCase()) {
              const parsed = maw.interface.parseLog(log);
              console.log(`🤖 Maw event: ${parsed.name}`);
              
              if (parsed.name === 'CosmeticRitualAttempted') {
                console.log(`   Success: ${parsed.args.success}`);
                console.log(`   TypeId: ${parsed.args.typeId || 'N/A'}`);
              }
            }
          } catch (e) {
            console.log(`📝 Unparsed log: ${log.topics[0]}`);
          }
        }
      }
      
    } catch (e) {
      console.error('❌ 3-fragment test failed:', e.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

main().catch(console.error);