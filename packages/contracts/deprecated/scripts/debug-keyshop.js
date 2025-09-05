const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🔍 Debugging KeyShop issues...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Account:", deployer.address);
  console.log("Balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Load contract addresses
  const addresses = JSON.parse(fs.readFileSync('./src/contracts-base-sepolia.json', 'utf8'));
  
  // Connect to contracts
  const keyShop = await ethers.getContractAt("KeyShop", addresses.keyShop);
  const relics = await ethers.getContractAt("Relics", addresses.relics);

  console.log("\n📋 KeyShop Status:");
  try {
    const keyPrice = await keyShop.keyPrice();
    console.log("Key price:", ethers.formatEther(keyPrice), "ETH");
    
    const maxKeys = await keyShop.maxKeysPerTx();
    console.log("Max keys per tx:", maxKeys.toString());
    
    const isPaused = await keyShop.paused();
    console.log("Contract paused:", isPaused);
    
    const relicsAddress = await keyShop.relics();
    console.log("KeyShop points to Relics:", relicsAddress);
    console.log("Expected Relics address:", addresses.relics);
    console.log("Addresses match:", relicsAddress.toLowerCase() === addresses.relics.toLowerCase());
  } catch (error) {
    console.error("Error checking KeyShop:", error.message);
  }

  console.log("\n📋 Relics Status:");
  try {
    const owner = await relics.owner();
    console.log("Relics owner:", owner);
    console.log("You are owner:", owner.toLowerCase() === deployer.address.toLowerCase());
  } catch (error) {
    console.error("Error checking Relics:", error.message);
  }

  console.log("\n🧪 Testing buyKeys call...");
  try {
    // Try to simulate the call first
    const amount = 1;
    const cost = await keyShop.keyPrice();
    
    console.log("Attempting to buy", amount, "key(s) for", ethers.formatEther(cost), "ETH");
    
    // This should simulate without actually sending the transaction
    await keyShop.buyKeys.staticCall(amount, { value: cost });
    console.log("✅ Static call succeeded - buyKeys should work");
    
    // Now try actual transaction
    const tx = await keyShop.buyKeys(amount, { value: cost });
    console.log("Transaction sent:", tx.hash);
    await tx.wait();
    console.log("✅ Transaction confirmed!");
    
  } catch (error) {
    console.error("❌ buyKeys failed:", error.message);
    
    // Check if it's a revert reason
    if (error.data) {
      try {
        const reason = ethers.toUtf8String("0x" + error.data.slice(10));
        console.log("Revert reason:", reason);
      } catch {}
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });