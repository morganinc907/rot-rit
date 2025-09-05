const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking What Functions Proxy Actually Has...\n");

  const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
  
  // Get the actual implementation address
  const proxyCode = await hre.ethers.provider.getCode(PROXY_ADDRESS);
  console.log("Proxy has code:", proxyCode !== "0x");
  
  // Load both ABIs to compare
  const v3Artifact = await hre.artifacts.readArtifact("MawSacrificeV3");
  const v3UpgradeableArtifact = await hre.artifacts.readArtifact("MawSacrificeV3Upgradeable");
  
  console.log("V3 functions:", v3Artifact.abi.filter(f => f.type === 'function').length);
  console.log("V3Upgradeable functions:", v3UpgradeableArtifact.abi.filter(f => f.type === 'function').length);
  
  // Check for specific functions we need
  const v3Functions = v3Artifact.abi.filter(f => f.type === 'function').map(f => f.name);
  const v3UpgradeableFunctions = v3UpgradeableArtifact.abi.filter(f => f.type === 'function').map(f => f.name);
  
  console.log("\n🔍 Function Availability:");
  console.log("convertShardsToRustedCaps in V3:", v3Functions.includes('convertShardsToRustedCaps'));
  console.log("convertShardsToRustedCaps in V3Upgradeable:", v3UpgradeableFunctions.includes('convertShardsToRustedCaps'));
  console.log("version in V3:", v3Functions.includes('version'));
  console.log("version in V3Upgradeable:", v3UpgradeableFunctions.includes('version'));
  
  // Try to get the implementation address from the proxy
  try {
    const maw = await hre.ethers.getContractAt("MawSacrificeV3Upgradeable", PROXY_ADDRESS);
    
    console.log("\n📋 Proxy Status:");
    const version = await maw.version();
    console.log("Version:", version);
    
    // Check if the function exists in the ABI
    const hasConvertFunction = maw.interface.hasFunction('convertShardsToRustedCaps');
    console.log("convertShardsToRustedCaps in interface:", hasConvertFunction);
    
    if (hasConvertFunction) {
      const functionFragment = maw.interface.getFunction('convertShardsToRustedCaps');
      console.log("Function signature:", functionFragment.format());
    }
    
    // Try a simple balance check first
    const [deployer] = await hre.ethers.getSigners();
    const balance = await maw.RUSTED_KEY(); // This should work
    console.log("RUSTED_KEY constant:", balance.toString());
    
  } catch (error) {
    console.log("❌ Error checking proxy:", error.message);
  }
  
  // Let's also check the deployment logs to see what was actually deployed
  console.log("\n🏗️ Checking Recent Deployment...");
  try {
    // Look for the most recent proxy deployment
    const deployments = require('../deployments/baseSepolia/MawSacrificeV3Upgradeable.json');
    console.log("Deployment address matches:", deployments.address === PROXY_ADDRESS);
    console.log("Deployment ABI functions:", deployments.abi.filter(f => f.type === 'function').length);
    
    const hasConvertInDeployment = deployments.abi.some(f => f.name === 'convertShardsToRustedCaps');
    console.log("convertShardsToRustedCaps in deployment ABI:", hasConvertInDeployment);
    
  } catch (error) {
    console.log("Could not read deployment file:", error.message);
  }
}

main().catch(console.error);