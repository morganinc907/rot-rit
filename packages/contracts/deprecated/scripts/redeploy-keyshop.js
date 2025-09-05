const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("🚀 Redeploying KeyShop with free keys function...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Load existing contract addresses
  const addresses = JSON.parse(fs.readFileSync('./src/contracts-base-sepolia.json', 'utf8'));
  
  console.log("Using existing Relics contract:", addresses.relics);

  // Deploy new KeyShop with free keys function
  console.log("\n📄 Deploying updated KeyShop...");
  const KeyShop = await ethers.getContractFactory("KeyShop");
  const keyShop = await KeyShop.deploy(addresses.relics, {
    gasPrice: ethers.parseUnits("3", "gwei"),
  });
  await keyShop.waitForDeployment();
  
  const keyShopAddress = await keyShop.getAddress();
  console.log("✅ New KeyShop deployed to:", keyShopAddress);

  // Authorize new KeyShop in Relics contract
  console.log("\n⚙️ Authorizing new KeyShop in Relics...");
  const relics = await ethers.getContractAt("Relics", addresses.relics);
  await (await relics.setKeyShop(keyShopAddress)).wait();
  console.log("✅ New KeyShop authorized");

  // Update contract addresses file
  addresses.keyShop = keyShopAddress;
  addresses.blockNumber = await ethers.provider.getBlockNumber();
  addresses.note = "Updated KeyShop with mintFreeKeys function";
  
  fs.writeFileSync('./src/contracts-base-sepolia.json', JSON.stringify(addresses, null, 2));
  console.log("\n✅ Updated contracts-base-sepolia.json");

  // Test the free keys function
  console.log("\n🧪 Testing free keys function...");
  await (await keyShop.mintFreeKeys(deployer.address, 10)).wait();
  console.log("✅ Minted 10 free keys to your address!");

  console.log("\n🎯 New KeyShop features:");
  console.log("  ✅ buyKeys() - buy with ETH (existing function)");
  console.log("  ✅ mintFreeKeys() - owner can mint free keys");
  
  console.log("\nNew KeyShop address:", keyShopAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });