/**
 * Test multiple cosmetic sacrifices to check success rates
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('🎲 Testing multiple cosmetic sacrifices...\n');
  
  const MAW_ADDRESS = "0x09cB2813f07105385f76E5917C3b68c980a91E73";
  const COSMETICS_ADDRESS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  
  try {
    const [signer] = await ethers.getSigners();
    console.log('👤 Using account:', signer.address);
    
    const maw = await ethers.getContractAt("MawSacrificeV4Upgradeable", MAW_ADDRESS);
    
    // Check fragment balance
    const fragmentsAddr = await maw.relics();
    const relicsAbi = [
      "function balanceOf(address account, uint256 id) view returns (uint256)"
    ];
    const fragments = new ethers.Contract(fragmentsAddr, relicsAbi, signer);
    
    const fragmentBalance = await fragments.balanceOf(signer.address, 2);
    console.log(`💎 Lantern Fragment balance: ${fragmentBalance.toString()}`);
    
    if (fragmentBalance.toString() === "0") {
      console.log('❌ No fragments to sacrifice');
      return;
    }
    
    let successCount = 0;
    let totalAttempts = Math.min(3, fragmentBalance.toString()); // Try 3 times or until we run out
    
    console.log(`🎯 Attempting ${totalAttempts} cosmetic sacrifices (1 fragment each)...`);
    console.log('📊 Expected success rate: ~35%\n');
    
    for (let i = 0; i < totalAttempts; i++) {
      console.log(`🔥 Attempt ${i + 1}/${totalAttempts}:`);
      
      try {
        const tx = await maw.sacrificeForCosmetic(1, 0, {
          gasLimit: 500000
        });
        
        const receipt = await tx.wait();
        
        // Check if cosmetics contract was called
        const cosmeticsLogs = receipt.logs.filter(l => 
          l.address.toLowerCase() === COSMETICS_ADDRESS.toLowerCase()
        );
        
        if (cosmeticsLogs.length > 0) {
          console.log('  ✅ SUCCESS! Cosmetics contract was called');
          console.log(`     Cosmetics logs: ${cosmeticsLogs.length}`);
          successCount++;
        } else {
          console.log('  ❌ Failed - no cosmetics logs (got glass shards)');
        }
        
        console.log(`  📝 TX: ${tx.hash.slice(0, 10)}... (${receipt.gasUsed.toString()} gas)`);
        
      } catch (e) {
        console.log(`  💥 Transaction failed: ${e.message.split('\n')[0]}`);
      }
      
      console.log(''); // Empty line
    }
    
    console.log('🎯 Results Summary:');
    console.log(`   Successes: ${successCount}/${totalAttempts} (${((successCount/totalAttempts)*100).toFixed(1)}%)`);
    console.log(`   Expected: ~${(35*totalAttempts/100).toFixed(1)} successes`);
    
    if (successCount === 0) {
      console.log('\n🚨 NO SUCCESSES - This suggests:');
      console.log('   1. RNG is broken/deterministic');
      console.log('   2. Success chance calculation is wrong'); 
      console.log('   3. Cosmetic types issue still exists');
      console.log('   4. Some other contract bug');
      
      // Let's try a sacrifice with more fragments for higher success rate
      const remainingFragments = await fragments.balanceOf(signer.address, 2);
      if (remainingFragments.toString() >= "2") {
        console.log('\n🎲 Trying with 2 fragments (60% success rate)...');
        
        try {
          const tx = await maw.sacrificeForCosmetic(2, 0, {
            gasLimit: 500000
          });
          
          const receipt = await tx.wait();
          const cosmeticsLogs = receipt.logs.filter(l => 
            l.address.toLowerCase() === COSMETICS_ADDRESS.toLowerCase()
          );
          
          if (cosmeticsLogs.length > 0) {
            console.log('✅ SUCCESS with 2 fragments!');
          } else {
            console.log('❌ Still failed with 2 fragments - definitely a bug');
          }
          
        } catch (e) {
          console.log('💥 2-fragment sacrifice failed');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

main().catch(console.error);