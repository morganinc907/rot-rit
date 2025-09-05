const { ethers, upgrades } = require("hardhat");
const addresses = require("../packages/addresses/addresses.json");

async function main() {
  console.log("🚀 Deploying fixed MawSacrifice implementation...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Deploy new implementation
  console.log("📦 Deploying new implementation...");
  const MawSacrifice = await ethers.getContractFactory("MawSacrificeV4NoTimelock");
  const newImpl = await MawSacrifice.deploy();
  await newImpl.waitForDeployment();
  
  const newImplAddress = await newImpl.getAddress();
  console.log("✅ New implementation deployed at:", newImplAddress);
  
  // Upgrade the proxy
  console.log("🔄 Upgrading proxy to new implementation...");
  const proxyAddress = addresses.baseSepolia.MawSacrifice;
  
  const proxy = await ethers.getContractAt("MawSacrificeV4NoTimelock", proxyAddress);
  
  try {
    const tx = await proxy.upgradeToAndCall(newImplAddress, "0x");
    console.log("Upgrade transaction hash:", tx.hash);
    await tx.wait();
    console.log("✅ Proxy upgraded successfully");
    
    // Test the fix
    console.log("🧪 Testing canMintCaps fix...");
    const canMint = await proxy.canMintCaps(1);
    console.log("canMintCaps(1) now returns:", canMint);
    
    if (canMint) {
      console.log("🎉 Fix successful! Conversion should work now.");
    } else {
      console.log("❌ Fix may not have worked, or there are other issues");
    }
    
  } catch (error) {
    console.error("❌ Upgrade failed:", error.message);
    
    if (error.message.includes("Only the admin can upgrade")) {
      console.log("💡 Try using the owner address to upgrade");
    }
  }
}

main().catch(console.error);