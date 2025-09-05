const hre = require("hardhat");

async function main() {
  console.log('🎨 Checking cosmetics balance...');
  
  const userAddress = "0x52257934A41c55F4758b92F4D23b69f920c3652A";
  const cosmeticsAddress = "0x32640D260CeCD52581280e23B9DCc6F49D04Bdcb";
  
  const cosmetics = await hre.ethers.getContractAt("CosmeticsV2", cosmeticsAddress);
  
  console.log('User:', userAddress);
  console.log('Cosmetics contract:', cosmeticsAddress);
  
  // Check balance for each cosmetic type (1-6)
  console.log('\n🎭 Cosmetic balances:');
  for (let i = 1; i <= 6; i++) {
    try {
      const balance = await cosmetics.balanceOf(userAddress, i);
      if (balance > 0) {
        console.log(`  Cosmetic Type ${i}: ${balance.toString()}`);
      }
    } catch (e) {
      console.log(`  Cosmetic Type ${i}: Error checking - ${e.message}`);
    }
  }
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});