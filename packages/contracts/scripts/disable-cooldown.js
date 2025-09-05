const { ethers } = require("hardhat");

async function main() {
  console.log("Disabling cooldown completely...\n");
  
  const NEW_MAW = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625";
  
  const [signer] = await ethers.getSigners();
  console.log(`Using account: ${signer.address}`);
  
  const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", NEW_MAW);
  
  try {
    // Check current cooldown setting
    const currentMinBlocks = await maw.minBlocksBetweenSacrifices();
    console.log(`Current min blocks between sacrifices: ${currentMinBlocks}`);
    
    if (currentMinBlocks == 0) {
      console.log("Cooldown already disabled!");
      return;
    }
    
    console.log("Setting minBlocksBetweenSacrifices to 0...");
    const tx = await maw.setMinBlocksBetweenSacrifices(0, {
      gasLimit: 200000
    });
    
    console.log(`Transaction sent: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Cooldown disabled! Block: ${receipt.blockNumber}`);
    console.log(`Gas used: ${receipt.gasUsed}`);
    
    // Verify
    const newMinBlocks = await maw.minBlocksBetweenSacrifices();
    console.log(`New min blocks between sacrifices: ${newMinBlocks}`);
    
    if (newMinBlocks == 0) {
      console.log("\nSUCCESS! Cooldown completely disabled!");
      console.log("Users can now sacrifice without any waiting period!");
    }
    
  } catch (error) {
    console.log(`Failed to disable cooldown: ${error.message}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});