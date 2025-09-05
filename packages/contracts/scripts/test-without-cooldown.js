const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing theory about cooldown timing...");
  
  const [deployer] = await ethers.getSigners();
  const mawAddress = "0x15243987458f1ed05b02e6213b532bb060027f4c";
  const contract = await ethers.getContractAt("MawSacrificeV4NoTimelock", mawAddress);
  
  // First, let's check the exact timing
  const currentBlock = await ethers.provider.getBlockNumber();
  const lastSacrificeBlock = await contract.lastSacrificeBlock(deployer.address);
  const minBlocks = await contract.minBlocksBetweenSacrifices();
  
  console.log("⏰ Timing analysis:");
  console.log(`Current block: ${currentBlock}`);
  console.log(`Last sacrifice: ${lastSacrificeBlock}`);  
  console.log(`Min blocks: ${minBlocks}`);
  console.log(`Next allowed block: ${Number(lastSacrificeBlock) + Number(minBlocks)}`);
  console.log(`Cooldown should be over: ${currentBlock > Number(lastSacrificeBlock) + Number(minBlocks)}`);
  
  // Try to mine a few more blocks and test again
  console.log("\n⛏️  Mining a few blocks to be extra sure...");
  
  // Send some dummy transactions to advance blocks
  for (let i = 0; i < 3; i++) {
    try {
      const tx = await deployer.sendTransaction({
        to: deployer.address,
        value: 0
      });
      await tx.wait();
      const newBlock = await ethers.provider.getBlockNumber();
      console.log(`Mined block: ${newBlock}`);
    } catch (e) {
      console.log("Could not mine block:", e.message);
    }
  }
  
  // Now try the sacrifice again
  console.log("\n🔥 Trying sacrifice after mining blocks...");
  const finalBlock = await ethers.provider.getBlockNumber();
  console.log(`Final block: ${finalBlock}, blocks since last sacrifice: ${finalBlock - Number(lastSacrificeBlock)}`);
  
  try {
    const tx = await contract.sacrificeKeys(1);
    const receipt = await tx.wait();
    console.log(`✅ Success! Transaction: ${receipt.hash}`);
  } catch (error) {
    console.log("❌ Still failing:", error.message);
    
    // Check if the issue is the cooldown storage not updating
    const currentLastBlock = await contract.lastSacrificeBlock(deployer.address);
    if (currentLastBlock !== lastSacrificeBlock) {
      console.log(`📦 WAIT! Last sacrifice block changed: ${lastSacrificeBlock} → ${currentLastBlock}`);
      console.log("This means a transaction succeeded but we didn't see it!");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});