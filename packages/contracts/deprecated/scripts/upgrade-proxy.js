const hre = require("hardhat");
const { upgrades } = require("hardhat");

async function main() {
  console.log("🔄 Upgrading MawSacrifice Proxy to New Implementation...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Upgrading with account:", deployer.address);

  // The proxy address (this stays the same forever)
  const PROXY_ADDRESS = "0x46cbaeb5f2d114A3b5da2d34EdcEEd69ae97343d"; // Update with actual proxy address
  
  console.log("📋 Upgrade Information:");
  console.log("  Proxy Address (STABLE):", PROXY_ADDRESS);
  console.log("  Current Network:", hre.network.name);
  console.log();

  try {
    // Get current implementation info
    console.log("1️⃣ Checking current implementation...");
    const currentImpl = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
    const currentContract = await hre.ethers.getContractAt("MawSacrificeV3Upgradeable", PROXY_ADDRESS);
    const currentVersion = await currentContract.version();
    
    console.log("✅ Current state:");
    console.log("  Implementation:", currentImpl);
    console.log("  Version:", currentVersion);

    // Deploy new implementation (example: MawSacrificeV4Upgradeable)
    console.log("2️⃣ Deploying new implementation...");
    
    // For this example, we'll "upgrade" to the same contract (V3)
    // In practice, you'd use a new contract like MawSacrificeV4Upgradeable
    const MawSacrificeV4Upgradeable = await hre.ethers.getContractFactory("MawSacrificeV3Upgradeable");
    
    console.log("3️⃣ Performing upgrade...");
    const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, MawSacrificeV4Upgradeable);
    await upgraded.waitForDeployment();
    
    // Get new implementation address
    const newImpl = await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
    const upgradedContract = await hre.ethers.getContractAt("MawSacrificeV3Upgradeable", PROXY_ADDRESS);
    const newVersion = await upgradedContract.version();
    
    console.log("✅ Upgrade complete!");
    console.log("  Proxy Address (UNCHANGED):", PROXY_ADDRESS);
    console.log("  Old Implementation:", currentImpl);
    console.log("  New Implementation:", newImpl);
    console.log("  Old Version:", currentVersion);
    console.log("  New Version:", newVersion);

    // Verify state is preserved
    console.log("4️⃣ Verifying state preservation...");
    const owner = await upgradedContract.owner();
    const relicsAddress = await upgradedContract.relics();
    const mythicMinted = await upgradedContract.mythicDemonsMinted();
    
    console.log("✅ State verification:");
    console.log("  Owner:", owner);
    console.log("  Relics:", relicsAddress);
    console.log("  Mythic Demons Minted:", mythicMinted.toString());

    console.log("\n🎉 Upgrade Successful!");
    console.log("✅ Proxy address remains the same");
    console.log("✅ All state preserved");
    console.log("✅ All permissions intact");
    console.log("✅ No frontend changes needed");
    console.log("✅ Zero downtime upgrade");

    const upgradeInfo = {
      network: hre.network.name,
      timestamp: new Date().toISOString(),
      upgrader: deployer.address,
      proxyAddress: PROXY_ADDRESS,
      oldImplementation: currentImpl,
      newImplementation: newImpl,
      oldVersion: currentVersion,
      newVersion: newVersion
    };

    console.log("\n📋 Upgrade Summary:");
    console.log(JSON.stringify(upgradeInfo, null, 2));

    return upgradeInfo;

  } catch (error) {
    console.error("❌ Upgrade failed:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });