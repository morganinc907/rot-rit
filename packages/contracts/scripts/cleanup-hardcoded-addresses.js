const fs = require('fs');
const path = require('path');
const addresses = require("../../addresses/addresses.json");

async function main() {
  console.log("🧹 Cleaning up hardcoded addresses in scripts...");
  console.log("");

  const scriptsDir = path.join(__dirname);
  const deprecatedDir = path.join(__dirname, '../deprecated/cleanup-scripts');
  
  // Create deprecated directory
  if (!fs.existsSync(deprecatedDir)) {
    fs.mkdirSync(deprecatedDir, { recursive: true });
  }

  // Scripts with hardcoded addresses to move to deprecated
  const scriptsToDeprecate = [
    'authorize-new-cosmetics.js',
    'simple-cosmetics-fix.js', 
    'auth-new-proxy-cosmetics.js',
    'fix-cosmetics-authorization.js',
    'fix-cosmetics-via-old-contract.js',
    'transfer-cosmetics-ownership.js',
    'direct-cosmetics-update.js',
    'update-contracts-authorization.js',
    'deploy-cosmetics-fix.js',
    'list-old-v4-functions.js',
    'debug-new-setup.js',
    'simple-monthly-setup.js',
    'check-new-cosmetics-auth.js'
  ];

  let movedCount = 0;
  
  console.log("📦 Moving debugging/temporary scripts to deprecated...");
  for (const scriptName of scriptsToDeprecate) {
    const scriptPath = path.join(scriptsDir, scriptName);
    const deprecatedPath = path.join(deprecatedDir, scriptName);
    
    if (fs.existsSync(scriptPath)) {
      fs.renameSync(scriptPath, deprecatedPath);
      console.log(`✅ Moved ${scriptName} to deprecated/`);
      movedCount++;
    }
  }

  console.log("");
  console.log(`📋 Summary:`);
  console.log(`- Moved ${movedCount} debugging scripts to deprecated/`);
  console.log(`- Kept production scripts with proper address imports`);
  console.log("");
  console.log("🎯 Remaining production scripts should use:");
  console.log("- addresses.baseSepolia.MawSacrifice:", addresses.baseSepolia.MawSacrifice);
  console.log("- addresses.baseSepolia.Cosmetics:", addresses.baseSepolia.Cosmetics);
  console.log("- addresses.baseSepolia.Relics:", addresses.baseSepolia.Relics);
  console.log("");
  console.log("✅ Cleanup complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});