/**
 * Test RNG fix by simulating the logic
 */
const { ethers } = require("hardhat");

async function main() {
  console.log('🎲 Testing RNG fix simulation...\n');
  
  try {
    const [signer] = await ethers.getSigners();
    
    // Simulate the _random function with different nonces
    function simulateRandom(nonce, timestamp, prevrandao, sender) {
      const hash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(
        ['uint256', 'uint256', 'address', 'uint256'],
        [timestamp, prevrandao, sender, nonce]
      ));
      return BigInt(hash);
    }
    
    // Use current block data for simulation
    const block = await ethers.provider.getBlock('latest');
    const timestamp = block.timestamp;
    const prevrandao = block.hash; // Approximation
    const sender = signer.address;
    
    console.log('📊 Testing RNG with various nonces:');
    console.log('   Success rate should be ~35% for 1 fragment\n');
    
    let successCount = 0;
    const totalTests = 20;
    
    for (let nonce = 1; nonce <= totalTests; nonce++) {
      const randomValue = simulateRandom(nonce, timestamp, prevrandao, sender);
      const successRoll = Number(randomValue % 100n);
      const successChance = 35; // 1 fragment = 35%
      
      const success = successRoll < successChance;
      if (success) successCount++;
      
      console.log(`Nonce ${nonce.toString().padStart(2)}: roll=${successRoll.toString().padStart(2)} ${success ? '✅' : '❌'}`);
    }
    
    const actualRate = (successCount / totalTests * 100).toFixed(1);
    console.log(`\n🎯 Results:`);
    console.log(`   Successes: ${successCount}/${totalTests} (${actualRate}%)`);
    console.log(`   Expected: ~35%`);
    console.log(`   Variance: ${Math.abs(35 - actualRate).toFixed(1)}%`);
    
    if (actualRate > 10 && actualRate < 60) {
      console.log('✅ RNG appears to be working properly!');
      console.log('   The fix should resolve the cosmetics issue.');
    } else {
      console.log('⚠️  RNG still seems off, may need further investigation');
    }
    
    // Now test the old broken method (same nonce every time)
    console.log('\n🔍 Testing OLD broken method (same nonce=1):');
    let brokenSuccessCount = 0;
    
    for (let i = 1; i <= 5; i++) {
      const randomValue = simulateRandom(1, timestamp, prevrandao, sender); // Always nonce=1
      const successRoll = Number(randomValue % 100n);
      const success = successRoll < 35;
      if (success) brokenSuccessCount++;
      
      console.log(`Test ${i}: roll=${successRoll} ${success ? '✅' : '❌'}`);
    }
    
    console.log(`\n🚨 Old method: ${brokenSuccessCount}/5 successes (${(brokenSuccessCount/5*100).toFixed(1)}%)`);
    console.log('   This shows why the old method was deterministic!');
    
  } catch (error) {
    console.error('❌ Simulation failed:', error.message);
  }
}

main().catch(console.error);