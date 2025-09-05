/**
 * Deploy MawSacrifice as UUPS Proxy
 * 
 * This deploys the proxy pattern so the address never changes again!
 * Frontend keeps talking to the same address, we just upgrade the implementation.
 */

const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deploying MawSacrifice UUPS Proxy with account:", deployer.address);
  
  // Contract addresses on Base Sepolia
  const RELICS_ADDRESS = "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b";
  const COSMETICS_ADDRESS = "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A";
  const CULTISTS_ADDRESS = "0x2D7cD25A014429282062298d2F712FA7983154B9";
  const DEMONS_ADDRESS = "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF";
  
  console.log("📋 Using contract addresses:");
  console.log("   Relics:", RELICS_ADDRESS);
  console.log("   Cosmetics:", COSMETICS_ADDRESS);  
  console.log("   Cultists:", CULTISTS_ADDRESS);
  console.log("   Demons:", DEMONS_ADDRESS);
  
  try {
    // Deploy the proxy
    console.log("\n🔧 Deploying MawSacrificeProxy...");
    const MawSacrificeProxy = await ethers.getContractFactory("MawSacrificeProxy");
    
    const proxy = await upgrades.deployProxy(
      MawSacrificeProxy,
      [RELICS_ADDRESS, COSMETICS_ADDRESS, CULTISTS_ADDRESS, DEMONS_ADDRESS],
      { 
        kind: 'uups',
        initializer: 'initialize'
      }
    );
    
    await proxy.waitForDeployment();
    const proxyAddress = await proxy.getAddress();
    
    console.log("✅ MawSacrifice UUPS Proxy deployed!");
    console.log("📍 Proxy Address (STABLE FOREVER):", proxyAddress);
    
    // Get implementation address for verification
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log("🔧 Implementation Address:", implementationAddress);
    
    console.log("\n🔍 Verifying deployment...");
    
    // Test basic functionality
    const version = await proxy.version();
    console.log("📋 Contract Version:", version);
    
    const relicsAddr = await proxy.relics();
    console.log("🔗 Relics Address:", relicsAddr);
    
    const owner = await proxy.owner();
    console.log("👤 Owner:", owner);
    
    console.log("\n🎉 SUCCESS! MawSacrifice is now upgradeable!");
    console.log("🚨 IMPORTANT:");
    console.log(`   - Update frontend to use: ${proxyAddress}`);
    console.log(`   - This address will NEVER change again`);
    console.log(`   - Future upgrades will keep the same address`);
    console.log(`   - Run update-relics-maw-address.js with new proxy address`);
    
    // Save deployment info
    const deploymentInfo = {
      network: "baseSepolia",
      proxyAddress: proxyAddress,
      implementationAddress: implementationAddress,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      contractAddresses: {
        relics: RELICS_ADDRESS,
        cosmetics: COSMETICS_ADDRESS,
        cultists: CULTISTS_ADDRESS,
        demons: DEMONS_ADDRESS
      }
    };
    
    console.log("\n💾 Deployment Summary:");
    console.log(JSON.stringify(deploymentInfo, null, 2));
    
    return {
      proxy: proxyAddress,
      implementation: implementationAddress
    };
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };