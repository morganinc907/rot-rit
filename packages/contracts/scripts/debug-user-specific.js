const { ethers } = require("hardhat");
const { ADDRS, CHAIN } = require("@rot-ritual/addresses");

async function main() {
  const [signer] = await ethers.getSigners();
  const userAddress = signer.address;

  console.log(`\n🔍 Debug User Token Balances`);
  console.log(`User Address: ${userAddress}`);
  
  const relicsAddr = ADDRS[CHAIN.BASE_SEPOLIA].Relics;
  console.log(`Relics Contract: ${relicsAddr}`);

  try {
    const relics = await ethers.getContractAt("Relics", relicsAddr);
    
    console.log(`\n📊 Individual Token Balances:`);
    
    // Check all relevant token IDs
    for (let tokenId = 0; tokenId <= 10; tokenId++) {
      try {
        const balance = await relics.balanceOf(userAddress, tokenId);
        if (balance > 0n) {
          console.log(`  Token ID ${tokenId}: ${balance.toString()} tokens`);
        } else {
          console.log(`  Token ID ${tokenId}: 0 tokens`);
        }
      } catch (e) {
        console.log(`  Token ID ${tokenId}: Error - ${e.message.slice(0, 50)}...`);
      }
    }
    
    console.log(`\n🎯 Key Findings:`);
    const token0 = await relics.balanceOf(userAddress, 0);
    const token1 = await relics.balanceOf(userAddress, 1);
    const token6 = await relics.balanceOf(userAddress, 6);
    
    console.log(`  Token ID 0 (Rusted Caps - for sacrifice): ${token0.toString()}`);
    console.log(`  Token ID 1 (Should be 0, we removed this): ${token1.toString()}`);
    console.log(`  Token ID 6 (Glass Shards - convert to caps): ${token6.toString()}`);
    
    if (token1 > 0n) {
      console.log(`\n⚠️  WARNING: You have ${token1} of Token ID 1!`);
      console.log(`    This might be leftover from old contract interaction.`);
      console.log(`    Frontend should NOT show this as "Rusted Caps"`);
    }
    
  } catch (error) {
    console.error(`❌ Error:`, error.message);
  }
}

main().catch(console.error);