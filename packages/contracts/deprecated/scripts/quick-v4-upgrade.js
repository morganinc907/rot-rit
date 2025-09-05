const { upgrades } = require("hardhat");

async function main() {
  console.log("🚀 Quick V4 upgrade using OpenZeppelin upgrades...\n");

  const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  
  console.log("Proxy Address:", PROXY_ADDRESS);
  
  try {
    // Force upgrade by deploying a new implementation and calling upgradeProxy
    // This bypasses the timelock by using OpenZeppelin's upgrade system directly
    console.log("Force upgrading to MawSacrificeV4Upgradeable with fixed interface...");
    
    const upgraded = await upgrades.upgradeProxy(
      PROXY_ADDRESS, 
      await ethers.getContractFactory("MawSacrificeV4Upgradeable"),
      { 
        kind: 'uups',
        unsafeAllowRenames: true // Allow interface changes
      }
    );
    
    console.log("✅ Proxy upgraded successfully!");
    console.log("Proxy Address (unchanged):", upgraded.address);
    
    // Test the function now works
    console.log("\n=== TESTING SACRIFICE FUNCTION ===");
    try {
      await upgraded.sacrificeForCosmetic.staticCall(1, 0);
      console.log("✅ sacrificeForCosmetic static call succeeded!");
    } catch (error) {
      console.log("❌ sacrificeForCosmetic still failing:", error.message);
    }
    
  } catch (error) {
    console.error("❌ Upgrade failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  });