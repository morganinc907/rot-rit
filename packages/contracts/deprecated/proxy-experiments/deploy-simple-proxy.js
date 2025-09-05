const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying MawSacrificeV3 with Simple Proxy...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Contract addresses (Base Sepolia - from addresses.json)
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const COSMETICS_ADDRESS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  const DEMONS_ADDRESS = "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF";
  const CULTISTS_ADDRESS = "0x2D7cD25A014429282062298d2F712FA7983154B9";
  const RACCOONS_ADDRESS = "0x6DB1C2d60579679A82C3Ac39cf7097B442E1Aa9f";

  console.log("📋 Configuration:");
  console.log("  Relics:", RELICS_ADDRESS);
  console.log("  Cosmetics:", COSMETICS_ADDRESS);
  console.log("  Demons:", DEMONS_ADDRESS);
  console.log("  Cultists:", CULTISTS_ADDRESS);
  console.log("  Raccoons:", RACCOONS_ADDRESS);
  console.log();

  try {
    // Step 1: Deploy the implementation contract (regular MawSacrificeV3)
    console.log("1️⃣ Deploying MawSacrificeV3 implementation...");
    const MawSacrificeV3 = await hre.ethers.getContractFactory("MawSacrificeV3");
    const implementation = await MawSacrificeV3.deploy(
      RELICS_ADDRESS,
      COSMETICS_ADDRESS,
      DEMONS_ADDRESS,
      CULTISTS_ADDRESS
    );
    await implementation.waitForDeployment();
    const implementationAddress = await implementation.getAddress();
    console.log("✅ Implementation deployed at:", implementationAddress);

    // Step 2: Deploy the proxy pointing to implementation
    console.log("2️⃣ Deploying transparent proxy...");
    const SimpleMawProxy = await hre.ethers.getContractFactory("SimpleMawProxy");
    const proxy = await SimpleMawProxy.deploy(
      implementationAddress,  // implementation
      deployer.address,       // admin (can upgrade)
      "0x"                    // no initialization data needed (constructor already called)
    );
    await proxy.waitForDeployment();
    const proxyAddress = await proxy.getAddress();
    console.log("✅ Proxy deployed at:", proxyAddress);

    // Step 3: Test the proxy works
    console.log("3️⃣ Testing proxy functionality...");
    const proxiedContract = await hre.ethers.getContractAt("MawSacrificeV3", proxyAddress);
    
    const owner = await proxiedContract.owner();
    const relicsAddress = await proxiedContract.relics();
    const rustedKeyId = await proxiedContract.RUSTED_KEY();
    
    console.log("✅ Proxy verification:");
    console.log("  Owner:", owner);
    console.log("  Relics address:", relicsAddress);
    console.log("  Rusted Key ID:", rustedKeyId.toString());

    console.log("\n🎉 Proxy Deployment Complete!");
    console.log("📄 Implementation:", implementationAddress);
    console.log("🔗 Proxy (STABLE ADDRESS):", proxyAddress);
    
    console.log("\n⚠️  CRITICAL NEXT STEPS:");
    console.log("1. Use PROXY address in all contracts and frontend");
    console.log("2. Authorize proxy as burner on Relics:");
    console.log("   relics.addAuthorizedBurner('" + proxyAddress + "')");
    console.log("3. Update Demons ritual address:");
    console.log("   demons.setRitual('" + proxyAddress + "')");
    console.log("4. Update addresses.json with proxy address");
    console.log("5. Future upgrades: just deploy new implementation and upgrade proxy");

    return {
      implementation: implementationAddress,
      proxy: proxyAddress,
      admin: deployer.address
    };

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