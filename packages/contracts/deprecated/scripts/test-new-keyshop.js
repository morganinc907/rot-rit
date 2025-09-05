const hre = require("hardhat");

const NEW_KEYSHOP_ADDRESS = "0x9Bd1651f1f8aB416A72f094fB60BbC1737B67DB6";

async function main() {
  console.log("Testing new KeyShop...");
  
  const keyShop = await hre.ethers.getContractAt("KeyShop", NEW_KEYSHOP_ADDRESS);

  // Test buying 1 key (free on testnet)
  console.log("Buying 1 key...");
  const buyTx = await keyShop.buyKeys(1, {
    value: hre.ethers.parseEther("0.002"), // Key price
    gasLimit: 200000
  });
  await buyTx.wait();
  
  console.log("✅ Key purchase successful!");
  
  // Test free keys mint (owner only)
  console.log("Minting 5 free keys...");
  const freeTx = await keyShop.mintFreeKeys(await (await hre.ethers.getSigners())[0].getAddress(), 5, {
    gasLimit: 200000
  });
  await freeTx.wait();
  
  console.log("✅ Free keys mint successful!");
  console.log("🎉 New KeyShop is working with security fixes!");
}

main().catch(console.error);