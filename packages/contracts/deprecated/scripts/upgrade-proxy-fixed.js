const { upgrades } = require("hardhat");

async function main() {
  console.log("🔄 Upgrading Proxy with Fixed Implementation...\n");

  const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  
  console.log("Proxy Address:", PROXY_ADDRESS);
  
  // Upgrade the proxy to the new implementation
  console.log("Upgrading to fixed MawSacrificeV4Upgradeable...");
  
  const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, await ethers.getContractFactory("MawSacrificeV4Upgradeable"));
  
  console.log("✅ Proxy upgraded successfully!");
  console.log("Proxy Address (unchanged):", upgraded.address);
  
  // Verify the upgrade worked
  const version = await upgraded.version();
  console.log("New Version:", version);
  
  // Test that the interface fix worked
  try {
    const ASHES = await upgraded.ASHES();
    const RUSTED_KEY = await upgraded.RUSTED_KEY();
    console.log("ASHES constant:", ASHES.toString());
    console.log("RUSTED_KEY constant:", RUSTED_KEY.toString());
    console.log("✅ Interface constants accessible");
  } catch (error) {
    console.log("❌ Interface issue:", error.message);
  }
  
  console.log("\n🎉 Upgrade complete!");
  console.log("The sacrificeForCosmetic(fragments, masks) function should now work correctly.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Upgrade failed:", error.message);
    process.exit(1);
  });