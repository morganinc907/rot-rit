const { ethers } = require("hardhat");

async function main() {
  console.log("🔑 Minting test keys...");
  
  const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const [deployer] = await ethers.getSigners();
  
  const relicsContract = await ethers.getContractAt("Relics", relicsAddress);
  
  // Check current balance (keys are token ID 1, not 0)
  const RUSTED_KEY_ID = 1;
  const currentBalance = await relicsContract.balanceOf(deployer.address, RUSTED_KEY_ID);
  console.log(`🔑 Current keys (token ID ${RUSTED_KEY_ID}): ${currentBalance}`);
  
  if (currentBalance < 10) {
    const needed = 10 - Number(currentBalance);
    console.log(`🔨 Minting ${needed} additional keys...`);
    const tx = await relicsContract.mint(deployer.address, RUSTED_KEY_ID, needed, "0x");
    const receipt = await tx.wait();
    console.log(`✅ Minted! Transaction: ${receipt.hash}`);
    
    // Verify
    const newBalance = await relicsContract.balanceOf(deployer.address, 0);
    console.log(`🔑 New balance: ${newBalance}`);
  } else {
    console.log(`✅ Already have ${currentBalance} keys`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});