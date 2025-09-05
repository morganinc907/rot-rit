const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking cooldown settings...
");
  
  const NEW_MAW = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
  
  const [signer] = await ethers.getSigners();
  console.log(`👤 Using account: ${signer.address}`);
  
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", NEW_MAW);
  
  try {
    // Check cooldown settings
    const minBlocks = await maw.minBlocksBetweenSacrifices();
    const lastSacrificeBlock = await maw.lastSacrificeBlock(signer.address);
    const currentBlock = await ethers.provider.getBlockNumber();
    
    console.log(`🕐 Min blocks between sacrifices: ${minBlocks}`);
    console.log(`📍 Last sacrifice block: ${lastSacrificeBlock}`);
    console.log(`📍 Current block: ${currentBlock}`);
    console.log(`📊 Blocks since last sacrifice: ${currentBlock - Number(lastSacrificeBlock)}`);
    console.log(`📊 Blocks still needed: ${Number(minBlocks) - (currentBlock - Number(lastSacrificeBlock))}`);
    
    const isOnCooldown = currentBlock <= Number(lastSacrificeBlock) + Number(minBlocks);
    console.log(`❄️  Is on cooldown: ${isOnCooldown}`);
    
    if (isOnCooldown) {
      const blocksLeft = Number(lastSacrificeBlock) + Number(minBlocks) - currentBlock;
      console.log(`⏰ Blocks remaining: ${blocksLeft}`);
    } else {
      console.log("✅ Ready to sacrifice!");
    }
    
  } catch (error) {
    console.log(`❌ Failed to check cooldown: ${error.message}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
