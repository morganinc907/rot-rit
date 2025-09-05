const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🧹 Final Cleanup - Moving Unused Files");
  console.log("======================================");
  console.log("");

  const scriptsDir = path.join(__dirname);
  const deprecatedDir = path.join(__dirname, '../deprecated');
  const deprecatedScriptsDir = path.join(deprecatedDir, 'unused-scripts');
  const deprecatedContractsDir = path.join(deprecatedDir, 'unused-contracts');

  // Create deprecated directories
  if (!fs.existsSync(deprecatedScriptsDir)) {
    fs.mkdirSync(deprecatedScriptsDir, { recursive: true });
  }
  if (!fs.existsSync(deprecatedContractsDir)) {
    fs.mkdirSync(deprecatedContractsDir, { recursive: true });
  }

  // Production scripts to KEEP
  const productionScripts = [
    'deploy-cosmetics-v2-complete.js',
    'verify-system-health.js', 
    'test-cosmetic-sacrifice-final.js',
    'mint-fragments.js', // For development
    'deploy-maw-v4-dev.js', // For development
    'setup-dev-contract.js', // For development
    'final-cleanup.js', // This script
    'cleanup-hardcoded-addresses.js' // Cleanup utility
  ];

  // Production contracts to KEEP  
  const productionContracts = [
    'MawSacrificeV4NoTimelock.sol',
    'CosmeticsV2.sol',
    'Relics.sol',
    'Demons.sol',
    'Cultists.sol',
    'KeyShop.sol',
    'Raccoons.sol',
    'RaccoonRenderer.sol',
    'RitualReadAggregator.sol'
  ];

  let movedScripts = 0;
  let movedContracts = 0;

  // Move unused scripts
  console.log("📦 Moving unused scripts...");
  const allScripts = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.js'));
  
  for (const script of allScripts) {
    if (!productionScripts.includes(script) && !script.includes('deprecated')) {
      const scriptPath = path.join(scriptsDir, script);
      const deprecatedPath = path.join(deprecatedScriptsDir, script);
      
      try {
        fs.renameSync(scriptPath, deprecatedPath);
        console.log(`✅ Moved ${script}`);
        movedScripts++;
      } catch (error) {
        console.log(`❌ Failed to move ${script}: ${error.message}`);
      }
    }
  }

  // Move unused contracts
  console.log("");
  console.log("📦 Moving unused contracts...");
  const contractsDir = path.join(__dirname, '../contracts');
  
  if (fs.existsSync(contractsDir)) {
    const allContracts = fs.readdirSync(contractsDir).filter(f => f.endsWith('.sol'));
    
    for (const contract of allContracts) {
      if (!productionContracts.includes(contract)) {
        const contractPath = path.join(contractsDir, contract);
        const deprecatedPath = path.join(deprecatedContractsDir, contract);
        
        try {
          fs.renameSync(contractPath, deprecatedPath);
          console.log(`✅ Moved ${contract}`);
          movedContracts++;
        } catch (error) {
          console.log(`❌ Failed to move ${contract}: ${error.message}`);
        }
      }
    }
  }

  console.log("");
  console.log("📋 CLEANUP SUMMARY");
  console.log("==================");
  console.log(`Scripts moved: ${movedScripts}`);
  console.log(`Contracts moved: ${movedContracts}`);
  console.log("");

  console.log("🎯 PRODUCTION FILES REMAINING:");
  console.log("");
  console.log("📜 Scripts:");
  productionScripts.forEach(script => {
    if (fs.existsSync(path.join(scriptsDir, script))) {
      console.log(`  ✅ ${script}`);
    }
  });
  
  console.log("");
  console.log("📄 Contracts:");
  productionContracts.forEach(contract => {
    if (fs.existsSync(path.join(contractsDir, contract))) {
      console.log(`  ✅ ${contract}`);
    }
  });

  console.log("");
  console.log("🎉 FINAL CLEANUP COMPLETE!");
  console.log("📁 Deprecated files moved to:");
  console.log(`   - ${deprecatedScriptsDir}`);
  console.log(`   - ${deprecatedContractsDir}`);
  console.log("");
  console.log("🚀 Codebase is now production-ready!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});