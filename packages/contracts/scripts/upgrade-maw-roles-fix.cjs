const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("Upgrading MAW V5 with role hash fix...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Upgrading with account:", deployer.address);

  // Contract addresses
  const MAW_PROXY = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  
  // Deploy new implementation
  const MawSacrificeV5 = await ethers.getContractFactory("MawSacrificeV5");
  
  console.log("Upgrading proxy to new implementation...");
  const maw = await upgrades.upgradeProxy(MAW_PROXY, MawSacrificeV5);
  
  console.log("MAW upgraded successfully!");
  
  // Test the role system
  const keyShopRole = ethers.keccak256(ethers.toUtf8Bytes("KEY_SHOP"));
  const keyShopAddress = await maw.role(keyShopRole);
  console.log("KEY_SHOP role holder:", keyShopAddress);
  
  // Test healthcheck
  try {
    const health = await maw.healthcheck();
    console.log("Health check successful:");
    console.log("- Relics:", health[0]);
    console.log("- MAW trusted by Relics:", health[1]); 
    console.log("- Cap ID:", health[2].toString());
    console.log("- Key ID:", health[3].toString());
    console.log("- Frag ID:", health[4].toString());
    console.log("- Shard ID:", health[5].toString());
  } catch (error) {
    console.log("Health check failed:", error.message);
  }
  
  console.log("\nMAW V5 role system is now ready!");
  return MAW_PROXY;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });