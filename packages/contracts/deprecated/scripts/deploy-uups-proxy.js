const hre = require("hardhat");
const { upgrades } = require("hardhat");

async function main() {
  console.log("🚀 Deploying MawSacrificeV3 with UUPS Proxy (Proper Implementation)...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get current addresses from addresses.json
  const addresses = require("../../addresses/addresses.json");
  const network = hre.network.name;
  const currentAddresses = addresses[network];

  if (!currentAddresses) {
    throw new Error(`No addresses found for network: ${network}`);
  }

  console.log("📋 Using current contract addresses:");
  console.log("  Relics:", currentAddresses.Relics);
  console.log("  Cosmetics:", currentAddresses.Cosmetics);
  console.log("  Demons:", currentAddresses.Demons);
  console.log("  Cultists:", currentAddresses.Cultists);
  console.log();

  try {
    // Deploy using OpenZeppelin upgrades plugin
    console.log("1️⃣ Deploying UUPS proxy with implementation...");
    
    const MawSacrificeV3Upgradeable = await hre.ethers.getContractFactory("MawSacrificeV3Upgradeable");
    
    const proxy = await upgrades.deployProxy(
      MawSacrificeV3Upgradeable,
      [
        currentAddresses.Relics,
        currentAddresses.Cosmetics,
        currentAddresses.Demons,
        currentAddresses.Cultists,
        1 // minBlocksBetweenSacrifices
      ],
      { 
        kind: 'uups',
        timeout: 0,
        pollingInterval: 5000
      }
    );

    await proxy.waitForDeployment();
    const proxyAddress = await proxy.getAddress();
    console.log("✅ UUPS Proxy deployed at:", proxyAddress);

    // Get implementation address
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log("✅ Implementation deployed at:", implementationAddress);

    // Test the proxy
    console.log("2️⃣ Testing proxy functionality...");
    const proxiedContract = await hre.ethers.getContractAt("MawSacrificeV3Upgradeable", proxyAddress);
    
    const owner = await proxiedContract.owner();
    const relicsAddress = await proxiedContract.relics();
    const rustedKeyId = await proxiedContract.RUSTED_KEY();
    const maxMythic = await proxiedContract.MAX_MYTHIC_DEMONS();
    const version = await proxiedContract.version();
    const implFromProxy = await proxiedContract.getImplementation();
    
    console.log("✅ Proxy verification:");
    console.log("  Owner:", owner);
    console.log("  Relics contract:", relicsAddress);
    console.log("  Rusted Key ID:", rustedKeyId.toString());
    console.log("  Max Mythic Demons:", maxMythic.toString());
    console.log("  Version:", version);
    console.log("  Implementation from proxy:", implFromProxy);

    // Validate all state is properly initialized
    const minBlocks = await proxiedContract.minBlocksBetweenSacrifices();
    const mythicMinted = await proxiedContract.mythicDemonsMinted();
    
    console.log("✅ State validation:");
    console.log("  Min blocks between sacrifices:", minBlocks.toString());
    console.log("  Mythic demons minted:", mythicMinted.toString());

    console.log("\n🎉 UUPS Proxy System Successfully Deployed!");
    console.log("📄 Implementation:", implementationAddress);
    console.log("🔗 Proxy (STABLE ADDRESS):", proxyAddress);
    
    console.log("\n⚠️  CRITICAL SETUP STEPS:");
    console.log("1. **Use PROXY address everywhere** (frontend, other contracts):");
    console.log(`   ${proxyAddress}`);
    console.log("2. Authorize proxy as burner on Relics:");
    console.log(`   relics.addAuthorizedBurner('${proxyAddress}')`);
    console.log("3. Update Demons ritual address:");
    console.log(`   demons.setRitual('${proxyAddress}')`);
    console.log("4. Update addresses.json with proxy address");
    console.log("5. Run postDeploy.js to update frontend addresses");
    
    console.log("\n🔄 Future Upgrade Process:");
    console.log("1. Create MawSacrificeV4Upgradeable.sol with improvements");
    console.log("2. Run: npx hardhat run scripts/upgrade-proxy.js --network baseSepolia");
    console.log("3. **No frontend changes needed** - same proxy address");
    console.log("4. **No re-authorization needed** - proxy keeps all permissions");
    console.log("5. **Zero downtime** - upgrade is atomic");

    console.log("\n💡 Proxy Benefits Achieved:");
    console.log("✅ Stable address that never changes");
    console.log("✅ Seamless upgrades without migration");
    console.log("✅ All permissions stay with proxy");
    console.log("✅ Frontend never needs address updates");
    console.log("✅ Other contracts never need updates");

    // Save deployment info for future upgrades
    const deploymentInfo = {
      network: network,
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      proxyAddress: proxyAddress,
      implementationAddress: implementationAddress,
      version: "V3Upgradeable-1.0.0",
      configuration: {
        relics: currentAddresses.Relics,
        cosmetics: currentAddresses.Cosmetics,
        demons: currentAddresses.Demons,
        cultists: currentAddresses.Cultists,
        minBlocksBetweenSacrifices: 1
      }
    };

    console.log("\n💾 Deployment Summary:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

    return deploymentInfo;

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    if (error.data) {
      console.error("Data:", error.data);
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