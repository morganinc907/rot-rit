const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying SimpleKeyShop to Base Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Deploy SimpleKeyShop
  console.log("📄 Deploying SimpleKeyShop...");
  const SimpleKeyShop = await ethers.getContractFactory("SimpleKeyShop");
  const keyShop = await SimpleKeyShop.deploy();
  await keyShop.waitForDeployment();
  
  const keyShopAddress = await keyShop.getAddress();
  console.log("✅ SimpleKeyShop deployed to:", keyShopAddress);

  // Save addresses for frontend
  const addresses = {
    keyShop: keyShopAddress,
    chainId: 84532,
    blockNumber: await ethers.provider.getBlockNumber(),
    keyPrice: "0.001",
    note: "Simple KeyShop for testing on Base Sepolia"
  };

  const fs = require('fs');
  fs.writeFileSync('./src/contracts-base-sepolia.json', JSON.stringify(addresses, null, 2));
  
  console.log("\n💾 Contract address saved to src/contracts-base-sepolia.json");
  console.log("\n🎉 Deployment complete!");
  console.log("\n📋 Address:", keyShopAddress);
  console.log("🔗 View on BaseScan:", `https://sepolia.basescan.org/address/${keyShopAddress}`);
  console.log("\n⚠️  Make sure to:");
  console.log("1. Switch MetaMask to Base Sepolia network");
  console.log("2. Go to /store-debug page to test");
  console.log("3. Try purchasing keys!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });