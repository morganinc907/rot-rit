const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🔧 Fixing deployment ABI drift...\n");
    
    // Load the correct artifact ABI
    const artifactPath = path.join(__dirname, '../artifacts/contracts/MawSacrificeV3Upgradeable.sol/MawSacrificeV3Upgradeable.json');
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    console.log("✅ Loaded fresh artifact ABI");
    console.log(`   Functions count: ${artifact.abi.length}`);
    
    // Check for key functions
    const hasVersion = artifact.abi.some(f => f.name === "version");
    const hasConvertShards = artifact.abi.some(f => f.name === "convertShardsToRustedCaps");
    const hasSacrificeKeys = artifact.abi.some(f => f.name === "sacrificeKeys");
    
    console.log(`   Has version(): ${hasVersion}`);
    console.log(`   Has convertShardsToRustedCaps(): ${hasConvertShards}`);
    console.log(`   Has sacrificeKeys(): ${hasSacrificeKeys}`);
    
    if (!hasVersion || !hasConvertShards || !hasSacrificeKeys) {
        throw new Error("❌ Artifact ABI is missing required functions!");
    }
    
    // Create the correct deployment JSON
    const deploymentJson = {
        address: "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456", // PROXY ADDRESS
        abi: artifact.abi,
        deployedAt: new Date().toISOString(),
        version: "1.0.0",
        chainId: 84532,
        contractName: "MawSacrificeV3Upgradeable"
    };
    
    // Write the corrected deployment file
    const deploymentDir = path.join(__dirname, '../deployments/baseSepolia');
    const deploymentPath = path.join(deploymentDir, 'MawSacrificeV3Upgradeable.json');
    
    // Ensure directory exists
    if (!fs.existsSync(deploymentDir)) {
        fs.mkdirSync(deploymentDir, { recursive: true });
    }
    
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentJson, null, 2));
    
    console.log("\n✅ Created correct deployment JSON:");
    console.log(`   Path: ${deploymentPath}`);
    console.log(`   Address: ${deploymentJson.address}`);
    console.log(`   ABI functions: ${deploymentJson.abi.length}`);
    
    // Also update the old MawSacrifice.json to avoid confusion
    const oldPath = path.join(deploymentDir, 'MawSacrifice.json');
    if (fs.existsSync(oldPath)) {
        const backupPath = path.join(deploymentDir, 'MawSacrifice.json.backup');
        fs.renameSync(oldPath, backupPath);
        console.log(`   Backed up old file to: MawSacrifice.json.backup`);
        
        // Write the corrected version to the old location too
        fs.writeFileSync(oldPath, JSON.stringify(deploymentJson, null, 2));
        console.log(`   Updated old MawSacrifice.json with correct ABI`);
    }
    
    console.log("\n🎉 ABI drift fixed!");
    console.log("Now all tests should use the correct ABI with version() and convertShardsToRustedCaps()");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Failed to fix deployment ABI:", error.message);
        process.exit(1);
    });