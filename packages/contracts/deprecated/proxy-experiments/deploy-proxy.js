const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying MawSacrifice with UUPS Proxy...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Contract addresses (Base Sepolia)
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const COSMETICS_ADDRESS = "0x3B013fCF0E573f8bdA080E0B0d84393F3a23e67A";
  const DEMONS_ADDRESS = "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF";
  const CULTISTS_ADDRESS = "0xDD5E86C1E5b7603350aC372c92a0ABDe960aC464";
  const RACCOONS_ADDRESS = "0xF4fa5a9D2896c90DEac69af86e4D0deC86Ed09d0";
  const MIN_BLOCKS_BETWEEN = 1;

  console.log("📋 Configuration:");
  console.log("  Relics:", RELICS_ADDRESS);
  console.log("  Cosmetics:", COSMETICS_ADDRESS);
  console.log("  Demons:", DEMONS_ADDRESS);
  console.log("  Cultists:", CULTISTS_ADDRESS);
  console.log("  Raccoons:", RACCOONS_ADDRESS);
  console.log("  Min blocks between sacrifices:", MIN_BLOCKS_BETWEEN);
  console.log();

  try {
    // Step 1: Deploy the implementation contract (MawSacrificeV3Upgradeable)
    console.log("1️⃣ Deploying implementation contract...");
    const MawSacrificeV3Upgradeable = await hre.ethers.getContractFactory("MawSacrificeV3Upgradeable");
    const implementation = await MawSacrificeV3Upgradeable.deploy();
    await implementation.waitForDeployment();
    const implementationAddress = await implementation.getAddress();
    console.log("✅ Implementation deployed at:", implementationAddress);

    // Step 2: Encode the initialize function call
    console.log("2️⃣ Encoding initialize data...");
    const initData = implementation.interface.encodeFunctionData("initialize", [
      RELICS_ADDRESS,
      COSMETICS_ADDRESS,
      DEMONS_ADDRESS,
      CULTISTS_ADDRESS,
      RACCOONS_ADDRESS,
      MIN_BLOCKS_BETWEEN
    ]);
    console.log("✅ Initialize data encoded");

    // Step 3: Deploy the proxy
    console.log("3️⃣ Deploying proxy contract...");
    const MawSacrificeProxy = await hre.ethers.getContractFactory("MawSacrificeProxy");
    const proxy = await MawSacrificeProxy.deploy(implementationAddress, initData);
    await proxy.waitForDeployment();
    const proxyAddress = await proxy.getAddress();
    console.log("✅ Proxy deployed at:", proxyAddress);

    // Step 4: Verify the setup
    console.log("4️⃣ Verifying proxy setup...");
    const proxiedContract = await hre.ethers.getContractAt("MawSacrificeV3Upgradeable", proxyAddress);
    
    const version = await proxiedContract.version();
    const owner = await proxiedContract.owner();
    const relicsAddress = await proxiedContract.relics();
    
    console.log("✅ Proxy verification:");
    console.log("  Version:", version);
    console.log("  Owner:", owner);
    console.log("  Relics address:", relicsAddress);
    console.log("  Implementation address:", await proxy.getImplementation());

    console.log("\n🎉 Deployment Summary:");
    console.log("📄 Implementation:", implementationAddress);
    console.log("🔗 Proxy (Use this address):", proxyAddress);
    console.log("\n⚠️  IMPORTANT:");
    console.log("- Use the PROXY address for all frontend interactions");
    console.log("- The proxy address never changes, even during upgrades");
    console.log("- Update addresses.json with the proxy address");

    // Save deployment info
    const deploymentInfo = {
      network: hre.network.name,
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      implementation: implementationAddress,
      proxy: proxyAddress,
      configuration: {
        relics: RELICS_ADDRESS,
        cosmetics: COSMETICS_ADDRESS,
        demons: DEMONS_ADDRESS,
        cultists: CULTISTS_ADDRESS,
        raccoons: RACCOONS_ADDRESS,
        minBlocksBetween: MIN_BLOCKS_BETWEEN
      }
    };

    console.log("\n💾 Deployment info saved to deployments/proxy-deployment.json");

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });