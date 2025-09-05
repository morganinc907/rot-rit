const { ethers } = require("hardhat");
const { ADDRS, CHAIN } = require("@rot-ritual/addresses");

async function main() {
  const [signer] = await ethers.getSigners();
  const userAddress = signer.address;

  console.log(`\n🔍 Testing Sacrifice Prerequisites`);
  console.log(`User Address: ${userAddress}`);
  
  const relicsAddr = ADDRS[CHAIN.BASE_SEPOLIA].Relics;
  const mawAddr = ADDRS[CHAIN.BASE_SEPOLIA].MawSacrifice;
  
  console.log(`Relics Contract: ${relicsAddr}`);
  console.log(`Maw Contract: ${mawAddr}`);

  try {
    const relics = await ethers.getContractAt("Relics", relicsAddr);
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", mawAddr);
    
    // 1. Check Token ID 0 balance
    const balance = await relics.balanceOf(userAddress, 0);
    console.log(`\n📊 Token ID 0 (Rusted Caps): ${balance.toString()}`);
    
    // 2. Check if approved
    const isApproved = await relics.isApprovedForAll(userAddress, mawAddr);
    console.log(`🔐 Approved for Maw Contract: ${isApproved}`);
    
    // 3. Check if sacrifices are paused
    const paused = await maw.sacrificesPaused();
    console.log(`⏸️  Sacrifices Paused: ${paused}`);
    
    // 4. Check cooldown status
    try {
      const lastSacrifice = await maw.lastSacrificeBlock(userAddress);
      const minBlocks = await maw.minBlocksBetweenSacrifices();
      const currentBlock = await ethers.provider.getBlockNumber();
      
      const inCooldown = (currentBlock - lastSacrifice) < minBlocks;
      const blocksLeft = lastSacrifice + minBlocks - currentBlock;
      
      console.log(`🕐 Cooldown Status:`);
      console.log(`   Last Sacrifice Block: ${lastSacrifice}`);
      console.log(`   Current Block: ${currentBlock}`);
      console.log(`   Min Blocks Between: ${minBlocks}`);
      console.log(`   In Cooldown: ${inCooldown}`);
      if (inCooldown) {
        console.log(`   Blocks Left: ${blocksLeft}`);
      }
    } catch (e) {
      console.log(`🕐 Cooldown Check Error: ${e.message}`);
    }
    
    console.log(`\n🎯 DIAGNOSIS:`);
    
    if (balance === 0n) {
      console.log(`❌ You have 0 Rusted Caps (Token ID 0) to sacrifice`);
    } else if (!isApproved) {
      console.log(`❌ You need to APPROVE the Maw contract first`);
      console.log(`   Call: relics.setApprovalForAll("${mawAddr}", true)`);
    } else if (paused) {
      console.log(`❌ Sacrifices are currently paused by contract`);
    } else {
      console.log(`✅ Prerequisites look good! You should be able to sacrifice.`);
      console.log(`   Balance: ${balance} Rusted Caps`);
      console.log(`   Approved: ${isApproved}`);
      console.log(`   Not Paused: ${!paused}`);
    }
    
  } catch (error) {
    console.error(`❌ Error:`, error.message);
  }
}

main().catch(console.error);