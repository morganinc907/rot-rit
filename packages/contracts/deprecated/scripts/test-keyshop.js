const hre = require("hardhat");
require("dotenv").config();

const KEYSHOP_ADDRESS = "0x1a343EA8FA0cfDF7D0AECD6Fe39A6aaA1642CA48";
const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Testing KeyShop functionality...");
  console.log("Deployer:", deployer.address);
  console.log("KeyShop:", KEYSHOP_ADDRESS);

  const keyShop = await hre.ethers.getContractAt("KeyShop", KEYSHOP_ADDRESS);
  const relics = await hre.ethers.getContractAt("Relics", RELICS_ADDRESS);

  console.log("\n=== KeyShop Configuration ===");
  
  // Check KeyShop configuration
  const keyPrice = await keyShop.keyPrice();
  const maxKeysPerTx = await keyShop.maxKeysPerTx();
  const relicsAddress = await keyShop.relics();
  
  console.log("Key price:", hre.ethers.formatEther(keyPrice), "ETH");
  console.log("Max keys per tx:", maxKeysPerTx.toString());
  console.log("Relics contract:", relicsAddress);
  
  console.log("\n=== Testing Key Purchase ===");
  
  // Check deployer's current key balance (token ID 1 = RUSTED_KEY)
  const initialBalance = await relics.balanceOf(deployer.address, 1);
  console.log("Initial Rusted Key balance:", initialBalance.toString());
  
  // Purchase 1 key
  console.log("Purchasing 1 Rusted Key...");
  try {
    const tx = await keyShop.buyKeys(1, { 
      value: keyPrice,
      gasLimit: 200000
    });
    
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    console.log("✅ Key purchase successful!");
    
    // Check final balance
    const finalBalance = await relics.balanceOf(deployer.address, 1);
    console.log("Final Rusted Key balance:", finalBalance.toString());
    console.log("Keys purchased:", (finalBalance - initialBalance).toString());
    
  } catch (error) {
    console.log("❌ Key purchase failed:", error.message);
  }

  console.log("\n📌 KeyShop Summary:");
  console.log("- Purchase Rusted Keys with ETH");
  console.log("- Current price: 0.002 ETH per key");
  console.log("- Keys can be sacrificed in MawSacrificeV2 for relics");
  console.log("- Max 100 keys per transaction");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});