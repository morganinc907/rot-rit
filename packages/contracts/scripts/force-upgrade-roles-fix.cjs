const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("Force upgrading MAW V5 with role hash fix...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Upgrading with account:", deployer.address);

  // Contract addresses
  const MAW_PROXY = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  
  // Deploy new implementation
  const MawSacrificeV5 = await ethers.getContractFactory("MawSacrificeV5");
  console.log("Deploying new implementation...");
  const newImpl = await MawSacrificeV5.deploy();
  await newImpl.waitForDeployment();
  const newImplAddress = await newImpl.getAddress();
  
  console.log("New implementation deployed to:", newImplAddress);
  
  // Force upgrade bypassing safety checks
  console.log("Force upgrading proxy...");
  const maw = await upgrades.forceImport(MAW_PROXY, MawSacrificeV5);
  const upgradedMaw = await upgrades.upgradeProxy(MAW_PROXY, MawSacrificeV5, { 
    unsafeAllow: ['constructor', 'missing-public-upgradeto'],
    unsafeAllowRenames: true
  });
  
  console.log("MAW upgraded successfully!");
  
  // Test the role system
  const keyShopRole = ethers.keccak256(ethers.toUtf8Bytes("KEY_SHOP"));
  const keyShopAddress = await upgradedMaw.role(keyShopRole);
  console.log("KEY_SHOP role holder:", keyShopAddress);
  
  console.log("\nMAW V5 role system is now ready!");
  return MAW_PROXY;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });