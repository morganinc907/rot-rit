const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🎁 Setting up free keys for your address...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Your address:", deployer.address);

  // Load addresses
  const addresses = JSON.parse(fs.readFileSync('./src/contracts-base-sepolia.json', 'utf8'));
  
  console.log("New KeyShop:", addresses.keyShop);
  
  // Connect to contracts
  const keyShop = await ethers.getContractAt("KeyShop", addresses.keyShop);
  const relics = await ethers.getContractAt("Relics", addresses.relics);

  // First authorize the new KeyShop
  console.log("🔧 Authorizing new KeyShop...");
  try {
    await (await relics.setKeyShop(addresses.keyShop, { gasPrice: ethers.parseUnits("4", "gwei") })).wait();
    console.log("✅ KeyShop authorized");
  } catch (error) {
    console.log("⚠️ Authorization error (might already be set):", error.message);
  }

  // Give you free keys
  console.log("\n🎁 Minting free keys for your address...");
  try {
    await (await keyShop.mintFreeKeys(deployer.address, 20, { gasPrice: ethers.parseUnits("4", "gwei") })).wait();
    console.log("✅ Minted 20 free keys for you!");
  } catch (error) {
    console.log("❌ Free keys error:", error.message);
  }

  // Check your new balance
  const balance = await relics.balanceOf(deployer.address, 1);
  console.log("🔑 Your total keys:", balance.toString());

  console.log("\n🎯 You can now:");
  console.log("  • Buy keys normally from the frontend (costs ETH)");
  console.log("  • Ask me to mint more free keys anytime");
  console.log("  • Use keys to test the ash functionality!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });