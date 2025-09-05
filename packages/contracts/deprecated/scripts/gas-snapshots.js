// scripts/gas-snapshots.js
// Generate and compare gas snapshots for hot paths

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SNAPSHOTS_DIR = "./gas-snapshots";
const TOLERANCE = 0.20; // 20% increase tolerance

async function main() {
  console.log("📊 Running gas snapshot tests...\n");
  
  // Ensure snapshots directory exists
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  }
  
  try {
    // Run Foundry gas tests
    console.log("🔥 Running Foundry gas tests...");
    const output = execSync("forge test --match-test testGas_ -vv --gas-report", { 
      encoding: "utf8",
      stdio: "pipe" 
    });
    
    console.log("✅ Gas tests completed");
    
    // Parse and display results
    const snapshots = readSnapshots();
    if (Object.keys(snapshots).length > 0) {
      displaySnapshots(snapshots);
    }
    
    // Check for regressions
    checkRegressions();
    
  } catch (error) {
    console.error("❌ Gas tests failed:", error.message);
    process.exit(1);
  }
}

function readSnapshots() {
  const snapshots = {};
  
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    return snapshots;
  }
  
  const files = fs.readdirSync(SNAPSHOTS_DIR);
  for (const file of files) {
    if (file.endsWith('.txt')) {
      const name = file.replace('.txt', '');
      const gasUsed = parseInt(fs.readFileSync(path.join(SNAPSHOTS_DIR, file), 'utf8').trim());
      snapshots[name] = gasUsed;
    }
  }
  
  return snapshots;
}

function displaySnapshots(snapshots) {
  console.log("\n📈 Gas Usage Snapshots:");
  console.log("=".repeat(50));
  
  const entries = Object.entries(snapshots).sort();
  for (const [name, gas] of entries) {
    const formatted = gas.toLocaleString();
    const category = categorizeGasUsage(gas);
    console.log(`   ${category} ${name.padEnd(25)} ${formatted.padStart(8)} gas`);
  }
}

function categorizeGasUsage(gas) {
  if (gas < 50000) return "🟢";
  if (gas < 150000) return "🟡";
  if (gas < 300000) return "🟠";
  return "🔴";
}

function checkRegressions() {
  console.log("\n🔍 Checking for regressions...");
  
  const historyFile = path.join(SNAPSHOTS_DIR, "history.json");
  let history = {};
  
  if (fs.existsSync(historyFile)) {
    history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
  }
  
  const current = readSnapshots();
  const timestamp = new Date().toISOString();
  
  let regressions = 0;
  let improvements = 0;
  
  for (const [test, currentGas] of Object.entries(current)) {
    if (history[test]) {
      const previousGas = history[test].gas;
      const change = (currentGas - previousGas) / previousGas;
      
      if (change > TOLERANCE) {
        console.log(`   🚨 REGRESSION: ${test} increased by ${(change * 100).toFixed(1)}% (${previousGas.toLocaleString()} → ${currentGas.toLocaleString()})`);
        regressions++;
      } else if (change < -0.05) { // 5% improvement
        console.log(`   ✨ IMPROVEMENT: ${test} decreased by ${(Math.abs(change) * 100).toFixed(1)}% (${previousGas.toLocaleString()} → ${currentGas.toLocaleString()})`);
        improvements++;
      }
    } else {
      console.log(`   🆕 NEW: ${test} baseline set at ${currentGas.toLocaleString()} gas`);
    }
    
    // Update history
    history[test] = {
      gas: currentGas,
      timestamp: timestamp
    };
  }
  
  // Save updated history
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  
  // Summary
  console.log(`\n📊 Summary:`);
  console.log(`   Tests: ${Object.keys(current).length}`);
  console.log(`   Regressions: ${regressions}`);
  console.log(`   Improvements: ${improvements}`);
  
  if (regressions > 0) {
    console.log(`\n❌ Found ${regressions} gas regression(s)!`);
    console.log(`   Consider optimizing or updating baselines if intentional.`);
    process.exit(1);
  } else {
    console.log(`\n✅ No gas regressions detected!`);
  }
}

main().catch(console.error);