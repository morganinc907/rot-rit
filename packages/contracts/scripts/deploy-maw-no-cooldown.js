const { ethers, upgrades } = require("hardhat");
const { ADDRS, CHAIN } = require("@rot-ritual/addresses");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Get current addresses
  const relicsAddress = ADDRS[CHAIN.BASE_SEPOLIA].Relics;
  const cosmeticsAddress = "0xb0e32d26f6b61cb71115576e6a8d7de072e6310a"; // V2 cosmetics
  console.log("Using Relics:", relicsAddress);
  console.log("Using Cosmetics:", cosmeticsAddress);

  // Deploy new implementation without cooldown
  console.log("\n📦 Deploying MawSacrificeV4NoTimelock without antiBot...");
  const MawSacrifice = await ethers.getContractFactory("MawSacrificeV4NoTimelock");
  
  // Get current proxy address
  const currentMawAddress = ADDRS[CHAIN.BASE_SEPOLIA].MawSacrifice;
  console.log("Current Maw Proxy:", currentMawAddress);

  try {
    // Upgrade the existing proxy to remove cooldown
    const upgraded = await upgrades.upgradeProxy(currentMawAddress, MawSacrifice);
    await upgraded.waitForDeployment();
    
    const newImplAddress = await upgrades.erc1967.getImplementationAddress(currentMawAddress);
    console.log("✅ Proxy upgraded successfully!");
    console.log("Proxy address:", currentMawAddress);
    console.log("New implementation:", newImplAddress);
    
    // Verify the upgrade worked
    const maw = await ethers.getContractAt("MawSacrificeV4NoTimelock", currentMawAddress);
    
    // Check if sacrifices are paused
    const sacrificesPaused = await maw.sacrificesPaused();
    console.log("Sacrifices paused:", sacrificesPaused);
    
    // Check relics contract connection
    const relicsAddr = await maw.relics();
    console.log("Connected to Relics:", relicsAddr);
    
    console.log("\n🎯 Contract upgraded! AntiBot cooldown removed.");
    console.log("Users can now sacrifice without cooldown restrictions.");
    
  } catch (error) {
    console.error("❌ Upgrade failed:", error.message);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});