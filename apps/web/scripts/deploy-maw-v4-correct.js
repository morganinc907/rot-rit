const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("🚀 Deploying MawSacrificeV4NoTimelock implementation...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const proxyAddress = "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db";
  const relicsAddress = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const cosmeticsAddress = "0xb0e32d26f6b61cb71115576e6a8d7de072e6310a";
  
  console.log("Proxy address:", proxyAddress);
  console.log("Relics address:", relicsAddress);
  console.log("Cosmetics address:", cosmeticsAddress);
  
  // Deploy new implementation
  console.log("\n📦 Deploying new implementation...");
  const MawSacrificeV4NoTimelock = await ethers.getContractFactory("MawSacrificeV4NoTimelock");
  const newImplementation = await MawSacrificeV4NoTimelock.deploy();
  await newImplementation.waitForDeployment();
  
  const newImplAddress = await newImplementation.getAddress();
  console.log("New implementation deployed at:", newImplAddress);
  
  // Upgrade the proxy to point to new implementation
  console.log("\n🔄 Upgrading proxy...");
  try {
    // Get proxy admin
    const proxyAdmin = await upgrades.admin.getInstance();
    console.log("Proxy admin:", await proxyAdmin.getAddress());
    
    // Upgrade
    await upgrades.upgradeProxy(proxyAddress, MawSacrificeV4NoTimelock);
    console.log("✅ Proxy upgraded successfully!");
    
    // Verify the upgrade
    console.log("\n🔍 Verifying upgrade...");
    const proxy = MawSacrificeV4NoTimelock.attach(proxyAddress);
    
    // Test that sacrificeKeys function exists
    try {
      console.log("Testing sacrificeKeys function exists...");
      // This will fail if function doesn't exist
      const functionExists = proxy.interface.hasFunction("sacrificeKeys");
      console.log("sacrificeKeys function exists:", functionExists);
      
      // Check RUSTED_CAP constant
      const rustedCap = await proxy.RUSTED_CAP();
      console.log("RUSTED_CAP constant:", rustedCap.toString());
      
    } catch (error) {
      console.error("Function test failed:", error.message);
    }
    
  } catch (error) {
    console.error("Upgrade failed:", error.message);
    
    // Alternative: Direct upgrade via proxy admin
    console.log("\n🔄 Trying direct upgrade...");
    try {
      // Use cast to upgrade directly
      const upgradeData = newImplementation.interface.encodeFunctionData("upgradeTo", [newImplAddress]);
      console.log("Alternative: Use this cast command:");
      console.log(`cast send ${proxyAddress} "upgradeTo(address)" ${newImplAddress} --private-key $PRIVATE_KEY --rpc-url https://sepolia.base.org`);
    } catch (e) {
      console.error("Direct upgrade prep failed:", e.message);
    }
  }
}

main().catch(console.error);