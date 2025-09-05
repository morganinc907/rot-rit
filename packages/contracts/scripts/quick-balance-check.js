const { ethers } = require("hardhat");
const { ADDRS, CHAIN } = require("@rot-ritual/addresses");

async function main() {
  const [signer] = await ethers.getSigners();
  const userAddress = signer.address;

  console.log(`\n🔍 Quick Token Balance Check`);
  console.log(`User: ${userAddress}`);
  
  // Get current addresses
  const relicsAddr = ADDRS[CHAIN.BASE_SEPOLIA].Relics;
  const mawAddr = ADDRS[CHAIN.BASE_SEPOLIA].MawSacrifice;
  
  console.log(`Relics Contract: ${relicsAddr}`);
  console.log(`Maw Contract: ${mawAddr}`);

  try {
    const relics = await ethers.getContractAt("Relics", relicsAddr);
    
    // Check Token ID 0 (Rusted Caps) - what we use for sacrifice
    const capsBalance = await relics.balanceOf(userAddress, 0);
    console.log(`\n📊 Token ID 0 (Rusted Caps): ${capsBalance.toString()}`);
    
    // Check Token ID 6 (Glass Shards) - what converts to caps
    const shardsBalance = await relics.balanceOf(userAddress, 6);
    console.log(`📊 Token ID 6 (Glass Shards): ${shardsBalance.toString()}`);
    
    console.log(`\n✅ Balance check complete!`);
    if (capsBalance > 0n) {
      console.log(`🎯 You have ${capsBalance} Rusted Caps ready for sacrifice!`);
    } else {
      console.log(`💡 You need Rusted Caps (Token ID 0) to sacrifice.`);
    }
    
  } catch (error) {
    console.error(`❌ Error:`, error.message);
  }
}

main().catch(console.error);