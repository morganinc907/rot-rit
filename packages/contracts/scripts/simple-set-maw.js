const { ethers } = require("hardhat");

async function main() {
  console.log("🔑 Setting new MawSacrifice address (simple version)...\n");
  
  const NEW_MAW = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
  const RELICS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  
  const [signer] = await ethers.getSigners();
  console.log(`👤 Using account: ${signer.address}`);
  
  // Connect to Relics contract
  const relics = await ethers.getContractAt("Relics", RELICS);
  
  try {
    console.log("=== SETTING NEW MAW SACRIFICE ===");
    console.log(`Setting MawSacrifice to: ${NEW_MAW}`);
    
    const setMawTx = await relics.setMawSacrifice(NEW_MAW, {
      gasLimit: 300000
    });
    
    console.log(`📤 Transaction sent: ${setMawTx.hash}`);
    const receipt = await setMawTx.wait();
    console.log(`✅ MawSacrifice updated! Block: ${receipt.blockNumber}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed}`);
    
    console.log("\n🎉 SUCCESS! MawSacrifice address updated!");
    console.log("🎯 Ready to test fragment sacrifices!");
    
  } catch (error) {
    console.log(`❌ Failed to set MawSacrifice: ${error.message}`);
    console.log(`💡 Error details:`, error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});