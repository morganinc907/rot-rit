const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  const [deployer] = await ethers.getSigners();
  const addresses = JSON.parse(fs.readFileSync('./src/contracts-base-sepolia.json', 'utf8'));
  
  const keyShop = await ethers.getContractAt("KeyShop", addresses.keyShop);
  const relics = await ethers.getContractAt("Relics", addresses.relics);
  
  console.log("🎁 Minting 20 free keys...");
  
  const nonce = await deployer.provider.getTransactionCount(deployer.address, "pending");
  
  try {
    const tx = await keyShop.mintFreeKeys(deployer.address, 20, {
      gasPrice: ethers.parseUnits("5", "gwei"),
      gasLimit: 200000,
      nonce: nonce
    });
    
    console.log("Transaction sent:", tx.hash);
    await tx.wait();
    console.log("✅ 20 free keys minted!");
    
    const balance = await relics.balanceOf(deployer.address, 1);
    console.log("🔑 Your total keys:", balance.toString());
    
  } catch (error) {
    console.log("❌ Error:", error.message);
  }
}

main().catch(console.error);