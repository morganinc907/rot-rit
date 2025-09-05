const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying MAW V5 with caps fix...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Contract addresses
  const MAW_PROXY = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  
  // Deploy new implementation
  const MawSacrificeV5 = await ethers.getContractFactory("MawSacrificeV5");
  console.log("Deploying new implementation...");
  const newImpl = await MawSacrificeV5.deploy();
  await newImpl.waitForDeployment();
  const newImplAddress = await newImpl.getAddress();
  
  console.log("New implementation deployed to:", newImplAddress);
  
  // Upgrade the proxy
  console.log("Upgrading proxy to new implementation...");
  const maw = await ethers.getContractAt("MawSacrificeV5", MAW_PROXY);
  await maw.upgradeToAndCall(newImplAddress, "0x");
  
  console.log("MAW upgraded successfully!");
  
  // Test the system
  const keyShopRole = ethers.keccak256(ethers.toUtf8Bytes("KEY_SHOP"));
  const keyShopAddress = await maw.role(keyShopRole);
  console.log("KEY_SHOP role holder:", keyShopAddress);
  
  // Test healthcheck
  try {
    const health = await maw.healthcheck();
    console.log("Health check successful:");
    console.log("- Cap ID:", health[2].toString(), "(should be 0)");
    console.log("- Key ID:", health[3].toString(), "(should be 1)");
  } catch (error) {
    console.log("Health check failed:", error.message);
  }
  
  console.log("\nMAW V5 with caps fix deployed!");
  console.log("KeyShop will now mint Rusted Caps (ID 0) instead of Keys (ID 1)");
  return newImplAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });