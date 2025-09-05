const hre = require("hardhat");

async function main() {
  console.log("🔍 Debugging Proxy ABI Issue...\n");

  const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";

  try {
    // Method 1: Try with MawSacrificeV3 ABI (regular, not upgradeable)
    console.log("1️⃣ Testing with MawSacrificeV3 ABI...");
    try {
      const mawV3 = await hre.ethers.getContractAt("MawSacrificeV3", PROXY_ADDRESS);
      const version = await mawV3.RUSTED_KEY(); // This should work
      console.log("  ✅ MawSacrificeV3 ABI works - RUSTED_KEY:", version.toString());
    } catch (error) {
      console.log("  ❌ MawSacrificeV3 ABI failed:", error.message.slice(0, 50));
    }

    // Method 2: Try with MawSacrificeV3Upgradeable ABI  
    console.log("\n2️⃣ Testing with MawSacrificeV3Upgradeable ABI...");
    try {
      const mawUpgradeable = await hre.ethers.getContractAt("MawSacrificeV3Upgradeable", PROXY_ADDRESS);
      const version = await mawUpgradeable.version();
      console.log("  ✅ MawSacrificeV3Upgradeable ABI works - Version:", version);
    } catch (error) {
      console.log("  ❌ MawSacrificeV3Upgradeable ABI failed:", error.message.slice(0, 50));
    }

    // Method 3: Check which ABI was generated for MawSacrifice in deployments
    console.log("\n3️⃣ Checking deployment ABI...");
    const deploymentPath = "/Users/seanmorgan/Desktop/rot-ritual-web/packages/contracts/deployments/baseSepolia/MawSacrifice.json";
    const deploymentData = require(deploymentPath);
    console.log("  Deployment address:", deploymentData.address);
    console.log("  ABI functions count:", deploymentData.abi.length);
    
    // Look for specific functions
    const hasVersion = deploymentData.abi.some(f => f.name === "version");
    const hasSacrificeKeys = deploymentData.abi.some(f => f.name === "sacrificeKeys");
    const hasConvertShards = deploymentData.abi.some(f => f.name === "convertShardsToRustedCaps");
    
    console.log("  Has version():", hasVersion);
    console.log("  Has sacrificeKeys():", hasSacrificeKeys);
    console.log("  Has convertShardsToRustedCaps():", hasConvertShards);

    // Method 4: Use the deployment ABI directly
    console.log("\n4️⃣ Testing with deployment ABI...");
    try {
      const mawDeployment = new hre.ethers.Contract(PROXY_ADDRESS, deploymentData.abi, await hre.ethers.getSigner());
      const rustedKey = await mawDeployment.RUSTED_KEY();
      console.log("  ✅ Deployment ABI works - RUSTED_KEY:", rustedKey.toString());
      
      if (hasVersion) {
        const version = await mawDeployment.version();
        console.log("  ✅ Version:", version);
      }
    } catch (error) {
      console.log("  ❌ Deployment ABI failed:", error.message.slice(0, 50));
    }

  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });