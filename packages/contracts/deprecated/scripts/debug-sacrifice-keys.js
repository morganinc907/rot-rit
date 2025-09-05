const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debug sacrificeKeys function specifically...\n");
  
  const [signer] = await ethers.getSigners();
  console.log("Testing with account:", signer.address);
  
  // Load proxy
  const proxy = await ethers.getContractAt("MawSacrificeV3Upgradeable", "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456");
  const relics = await ethers.getContractAt("Relics", "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b");
  
  console.log("📋 Current State:");
  const keyBalance = await relics.balanceOf(signer.address, 1);
  const isApproved = await relics.isApprovedForAll(signer.address, proxy.target);
  const currentBlock = await ethers.provider.getBlockNumber();
  let lastSacrificeBlock = "unknown";
  let minBlocks = "unknown";
  
  try {
    lastSacrificeBlock = await proxy.lastSacrificeBlock(signer.address);
    minBlocks = await proxy.minBlocksBetweenSacrifices();
  } catch (e) {
    // Functions may not exist in this version
  }
  
  console.log("  Key balance:", keyBalance.toString());
  console.log("  Is approved:", isApproved);
  console.log("  Last sacrifice block:", typeof lastSacrificeBlock === 'string' ? lastSacrificeBlock : lastSacrificeBlock.toString());
  console.log("  Current block:", currentBlock);
  console.log("  Min blocks required:", typeof minBlocks === 'string' ? minBlocks : minBlocks.toString());
  
  console.log("\n🧪 Testing static call:");
  try {
    await proxy.sacrificeKeys.staticCall(1);
    console.log("  ✅ Static call would succeed");
  } catch (error) {
    console.log("  ❌ Static call failed:", error.message);
    if (error.data) {
      try {
        const decoded = proxy.interface.parseError(error.data);
        console.log("  📝 Decoded error:", decoded);
      } catch (e) {
        console.log("  📝 Raw error data:", error.data);
      }
    }
    return;
  }
  
  console.log("\n🚀 Attempting actual transaction:");
  try {
    const tx = await proxy.sacrificeKeys(1);
    console.log("  Transaction hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("  ✅ SUCCESS! Gas used:", receipt.gasUsed.toString());
  } catch (error) {
    console.log("  ❌ Transaction failed:", error.message);
    if (error.data) {
      console.log("  📝 Error data:", error.data);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});