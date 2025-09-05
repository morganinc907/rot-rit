const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying KeyShop V2 (Routes through MAW)...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Contract addresses
  const MAW_ADDRESS = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  
  // Deploy KeyShop
  const KeyShop = await ethers.getContractFactory("KeyShop");
  const keyShop = await KeyShop.deploy(MAW_ADDRESS);
  
  await keyShop.waitForDeployment();
  const keyShopAddress = await keyShop.getAddress();
  
  console.log("KeyShop V2 deployed to:", keyShopAddress);
  
  // Set key price to match current (0.032 ETH)
  const currentPrice = ethers.parseEther("0.032");
  await keyShop.setKeyPrice(currentPrice);
  console.log("Key price set to:", ethers.formatEther(currentPrice), "ETH");
  
  // Test healthcheck
  try {
    const health = await keyShop.healthcheck();
    console.log("Health check successful:");
    console.log("- Relics:", health[0]);
    console.log("- MAW:", health[1]); 
    console.log("- Key ID:", health[2].toString());
    console.log("- Price:", ethers.formatEther(health[3]), "ETH");
    console.log("- Treasury:", health[4]);
  } catch (error) {
    console.log("Health check failed:", error.message);
  }
  
  console.log("\nNext steps:");
  console.log("1. Set KEY_SHOP role in MAW:");
  console.log(`   cast send ${MAW_ADDRESS} "setRole(bytes32,address)" $(cast keccak "KEY_SHOP") ${keyShopAddress} --private-key $PRIVATE_KEY --rpc-url https://sepolia.base.org`);
  console.log("\n2. Test purchase:");
  console.log(`   cast send ${keyShopAddress} "buyKeys(uint256)" 1 --value ${currentPrice.toString()} --private-key $PRIVATE_KEY --rpc-url https://sepolia.base.org`);
  
  return keyShopAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });