const hre = require("hardhat");

async function main() {
  console.log("🔍 Testing deployed proxy...\n");

  const PROXY_ADDRESS = "0x46cbaeb5f2d114A3b5da2d34EdcEEd69ae97343d";
  const IMPLEMENTATION_ADDRESS = "0x2725fa0DFfA30711Fe852cDD99a9EBFfAE8c54fb";
  const PROXY_ADMIN_ADDRESS = "0x957678723025298bAF225d65CEb654703968997f";

  try {
    // Test implementation directly
    console.log("1️⃣ Testing implementation contract directly...");
    const implementation = await hre.ethers.getContractAt("MawSacrificeV3", IMPLEMENTATION_ADDRESS);
    const implOwner = await implementation.owner();
    const implRustedKey = await implementation.RUSTED_KEY();
    console.log("✅ Implementation working:");
    console.log("  Owner:", implOwner);
    console.log("  Rusted Key ID:", implRustedKey.toString());

    // Test proxy admin
    console.log("\n2️⃣ Testing proxy admin...");
    const proxyAdmin = await hre.ethers.getContractAt("MawSacrificeV3ProxyAdmin", PROXY_ADMIN_ADDRESS);
    const adminOwner = await proxyAdmin.owner();
    console.log("✅ ProxyAdmin working:");
    console.log("  Owner:", adminOwner);

    // Test proxy basic functions
    console.log("\n3️⃣ Testing proxy calls...");
    
    // Try to get implementation from proxy
    const proxy = await hre.ethers.getContractAt("TransparentUpgradeableProxy", PROXY_ADDRESS);
    
    // The proxy should delegate calls to implementation
    const proxiedContract = await hre.ethers.getContractAt("MawSacrificeV3", PROXY_ADDRESS);
    
    console.log("Testing RUSTED_KEY constant...");
    const proxyRustedKey = await proxiedContract.RUSTED_KEY();
    console.log("✅ RUSTED_KEY through proxy:", proxyRustedKey.toString());

    console.log("Testing relics address...");
    const proxyRelics = await proxiedContract.relics();
    console.log("✅ Relics through proxy:", proxyRelics);

    // This might fail but let's try owner
    try {
      console.log("Testing owner...");
      const proxyOwner = await proxiedContract.owner();
      console.log("✅ Owner through proxy:", proxyOwner);
    } catch (error) {
      console.log("⚠️  Owner call failed (expected for proxy):", error.message);
    }

    console.log("\n🎉 Proxy appears to be working!");
    console.log("📋 Summary:");
    console.log("  Implementation:", IMPLEMENTATION_ADDRESS);
    console.log("  ProxyAdmin:", PROXY_ADMIN_ADDRESS);
    console.log("  Proxy:", PROXY_ADDRESS);

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });