const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying MawSacrificeV3 with Complete Proxy System...\n");

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
    // Step 1: Deploy the implementation contract
    console.log("1️⃣ Deploying MawSacrificeV3 implementation...");
    const MawSacrificeV3 = await hre.ethers.getContractFactory("MawSacrificeV3");
    const implementation = await MawSacrificeV3.deploy(
      currentAddresses.Relics,
      currentAddresses.Cosmetics,
      currentAddresses.Demons,
      currentAddresses.Cultists
    );
    await implementation.waitForDeployment();
    const implementationAddress = await implementation.getAddress();
    console.log("✅ Implementation deployed at:", implementationAddress);

    // Step 2: Deploy the ProxyAdmin
    console.log("2️⃣ Deploying ProxyAdmin...");
    const ProxyAdmin = await hre.ethers.getContractFactory("MawSacrificeV3ProxyAdmin");
    const proxyAdmin = await ProxyAdmin.deploy();
    await proxyAdmin.waitForDeployment();
    const proxyAdminAddress = await proxyAdmin.getAddress();
    console.log("✅ ProxyAdmin deployed at:", proxyAdminAddress);

    // Step 3: Deploy the Proxy
    console.log("3️⃣ Deploying TransparentUpgradeableProxy...");
    const Proxy = await hre.ethers.getContractFactory("MawSacrificeV3Proxy");
    const proxy = await Proxy.deploy(
      implementationAddress,
      proxyAdminAddress
    );
    await proxy.waitForDeployment();
    const proxyAddress = await proxy.getAddress();
    console.log("✅ Proxy deployed at:", proxyAddress);

    // Step 4: Verify the proxy works
    console.log("4️⃣ Testing proxy functionality...");
    const proxiedContract = await hre.ethers.getContractAt("MawSacrificeV3", proxyAddress);
    
    const owner = await proxiedContract.owner();
    const relicsAddress = await proxiedContract.relics();
    const rustedKeyId = await proxiedContract.RUSTED_KEY();
    const maxMythic = await proxiedContract.MAX_MYTHIC_DEMONS();
    
    console.log("✅ Proxy verification:");
    console.log("  Owner:", owner);
    console.log("  Relics contract:", relicsAddress);
    console.log("  Rusted Key ID:", rustedKeyId.toString());
    console.log("  Max Mythic Demons:", maxMythic.toString());

    console.log("\n🎉 Complete Proxy System Deployed!");
    console.log("📄 Implementation:", implementationAddress);
    console.log("🛠️  ProxyAdmin:", proxyAdminAddress);
    console.log("🔗 Proxy (STABLE ADDRESS):", proxyAddress);
    
    console.log("\n⚠️  CRITICAL SETUP STEPS:");
    console.log("1. Use PROXY address everywhere (frontend, other contracts)");
    console.log("2. Authorize proxy as burner on Relics:");
    console.log(`   relics.addAuthorizedBurner('${proxyAddress}')`);
    console.log("3. Update Demons ritual address:");
    console.log(`   demons.setRitual('${proxyAddress}')`);
    console.log("4. Update addresses.json with proxy address");
    console.log("5. Update frontend to use proxy address");
    
    console.log("\n🔄 Future Upgrade Process:");
    console.log("1. Deploy new implementation (e.g., MawSacrificeV4)");
    console.log("2. Call: proxyAdmin.upgrade(proxyAddress, newImplementationAddress)");
    console.log("3. No frontend changes needed - same proxy address");
    console.log("4. No re-authorization needed - proxy keeps all permissions");

    console.log("\n💾 Saving deployment info...");
    const deploymentInfo = {
      network: network,
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        implementation: implementationAddress,
        proxyAdmin: proxyAdminAddress,
        proxy: proxyAddress // This is the address to use everywhere
      },
      configuration: {
        relics: currentAddresses.Relics,
        cosmetics: currentAddresses.Cosmetics,
        demons: currentAddresses.Demons,
        cultists: currentAddresses.Cultists
      }
    };

    // In a real deployment, you'd save this to a file
    console.log("📋 Deployment Summary:");
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