#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI colors
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[Step ${step}] ${message}`, "bright");
}

function exec(command, silent = false) {
  try {
    if (!silent) log(`  → ${command}`, "cyan");
    const output = execSync(command, { encoding: 'utf8' });
    if (!silent && output) console.log(output);
    return output;
  } catch (error) {
    log(`  ✗ Command failed: ${command}`, "red");
    if (error.stdout) console.log(error.stdout.toString());
    if (error.stderr) console.log(error.stderr.toString());
    throw error;
  }
}

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(`${colors.yellow}${question}${colors.reset} `, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

class DeploymentOrchestrator {
  constructor() {
    this.network = process.env.NETWORK || 'localhost';
    this.isTestnet = ['base-sepolia', 'sepolia', 'goerli'].includes(this.network);
    this.isMainnet = ['base', 'mainnet', 'base-mainnet'].includes(this.network);
    this.deploymentPath = './deploy.output.json';
    this.abisPath = './abis';
  }

  async checkPrerequisites() {
    logStep(1, "Checking Prerequisites");
    
    // Check Node version
    const nodeVersion = process.version;
    log(`  ✓ Node.js ${nodeVersion}`, "green");
    
    // Check if .env exists
    if (!fs.existsSync('.env')) {
      if (fs.existsSync('.env.example')) {
        log("  ⚠ .env not found, copying from .env.example", "yellow");
        fs.copyFileSync('.env.example', '.env');
        log("  ✓ Created .env file", "green");
        log("  ⚠ Please configure your .env file before continuing", "yellow");
        process.exit(1);
      } else {
        log("  ✗ No .env file found", "red");
        process.exit(1);
      }
    } else {
      log("  ✓ .env file exists", "green");
    }
    
    // Check required env variables
    require('dotenv').config();
    const required = ['RPC_URL', 'PRIVATE_KEY'];
    if (this.isTestnet || this.isMainnet) {
      required.push('ETHERSCAN_API_KEY');
    }
    
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      log(`  ✗ Missing environment variables: ${missing.join(', ')}`, "red");
      process.exit(1);
    }
    log("  ✓ All required environment variables set", "green");
    
    // Check network connectivity
    try {
      exec('npx hardhat accounts --network ' + this.network, true);
      log("  ✓ Network connectivity confirmed", "green");
    } catch {
      log("  ✗ Cannot connect to network", "red");
      process.exit(1);
    }
    
    return true;
  }

  async compile() {
    logStep(2, "Compiling Contracts");
    exec('npx hardhat clean');
    exec('npx hardhat compile');
    log("  ✓ Contracts compiled successfully", "green");
  }

  async runTests() {
    logStep(3, "Running Test Suite");
    
    if (this.network === 'localhost') {
      log("  → Running unit tests...", "cyan");
      try {
        exec('npx hardhat test', true);
        log("  ✓ All tests passed", "green");
      } catch {
        const answer = await prompt("Tests failed. Continue deployment? (y/N)");
        if (answer.toLowerCase() !== 'y') {
          log("  Deployment cancelled", "yellow");
          process.exit(1);
        }
      }
    } else {
      log("  → Skipping tests for non-local deployment", "yellow");
    }
  }

  async deploy() {
    logStep(4, `Deploying to ${this.network}`);
    
    // Backup existing deployment if it exists
    if (fs.existsSync(this.deploymentPath)) {
      const backup = `${this.deploymentPath}.backup.${Date.now()}`;
      fs.copyFileSync(this.deploymentPath, backup);
      log(`  → Backed up existing deployment to ${backup}`, "cyan");
    }
    
    // Run deployment
    exec(`NETWORK=${this.network} npx hardhat run scripts/deploy.js --network ${this.network}`);
    
    // Check deployment output
    if (!fs.existsSync(this.deploymentPath)) {
      log("  ✗ Deployment failed - no output file generated", "red");
      process.exit(1);
    }
    
    const deployment = JSON.parse(fs.readFileSync(this.deploymentPath, 'utf8'));
    log("  ✓ Deployment successful", "green");
    log("\n  Deployed contracts:", "bright");
    for (const [name, address] of Object.entries(deployment)) {
      log(`    ${name}: ${address}`, "blue");
    }
    
    return deployment;
  }

  async verify(deployment) {
    if (!this.isTestnet && !this.isMainnet) {
      log("\n  → Skipping verification for local network", "yellow");
      return;
    }
    
    logStep(5, "Verifying Contracts on Etherscan");
    
    try {
      exec(`NETWORK=${this.network} npx hardhat run scripts/verify.js --network ${this.network}`);
      log("  ✓ All contracts verified", "green");
    } catch (error) {
      log("  ⚠ Verification failed - contracts may already be verified", "yellow");
    }
  }

  async extractABIs() {
    logStep(6, "Extracting ABIs");
    
    // Create abis directory
    if (!fs.existsSync(this.abisPath)) {
      fs.mkdirSync(this.abisPath);
    }
    
    // Extract ABIs from artifacts
    const artifacts = './artifacts/contracts';
    const contracts = fs.readdirSync(artifacts);
    
    for (const contract of contracts) {
      if (contract.endsWith('.sol')) {
        const name = contract.replace('.sol', '');
        const artifactPath = path.join(artifacts, contract, `${name}.json`);
        
        if (fs.existsSync(artifactPath)) {
          const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
          const abiPath = path.join(this.abisPath, `${name}.abi.json`);
          fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
          log(`  ✓ Extracted ${name}.abi.json`, "green");
        }
      }
    }
    
    // Create index.json with timestamp
    const indexPath = path.join(this.abisPath, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify({ ts: Date.now() }, null, 2));
    log("  ✓ Created index.json for cache busting", "green");
  }

  async runSmokeTests(deployment) {
    logStep(7, "Running Smoke Tests");
    
    if (this.network === 'localhost') {
      try {
        exec('npx hardhat run scripts/smoke.js --network localhost');
        log("  ✓ Smoke tests passed", "green");
      } catch (error) {
        log("  ✗ Smoke tests failed", "red");
        const answer = await prompt("Continue anyway? (y/N)");
        if (answer.toLowerCase() !== 'y') {
          process.exit(1);
        }
      }
    } else {
      log("  → Running E2E tests...", "cyan");
      try {
        exec(`NETWORK=${this.network} npx hardhat run scripts/e2e-test.js --network ${this.network}`);
        log("  ✓ E2E tests passed", "green");
      } catch (error) {
        log("  ⚠ E2E tests failed - review report", "yellow");
      }
    }
  }

  async seedData(deployment) {
    if (this.isMainnet) {
      log("\n  → Skipping data seeding for mainnet", "yellow");
      return;
    }
    
    logStep(8, "Seeding Test Data");
    
    const answer = await prompt("Seed test data? (y/N)");
    if (answer.toLowerCase() === 'y') {
      try {
        exec(`NETWORK=${this.network} npx hardhat run scripts/seed.js --network ${this.network}`);
        log("  ✓ Test data seeded", "green");
      } catch (error) {
        log("  ⚠ Seeding failed", "yellow");
      }
    }
  }

  async publishArtifacts() {
    logStep(9, "Publishing Artifacts");
    
    if (!fs.existsSync('.github/workflows/pages.yml')) {
      log("  ⚠ GitHub Pages workflow not configured", "yellow");
      return;
    }
    
    // Check if we're in a git repo
    try {
      exec('git status', true);
      
      // Add and commit deployment artifacts
      exec('git add deploy.output.json abis/', true);
      exec(`git commit -m "Deploy to ${this.network} - ${new Date().toISOString()}"`, true);
      
      log("  ✓ Committed deployment artifacts", "green");
      
      const answer = await prompt("Push to GitHub to trigger Pages deployment? (y/N)");
      if (answer.toLowerCase() === 'y') {
        exec('git push');
        log("  ✓ Pushed to GitHub - Pages deployment will trigger", "green");
        log("  → Check https://github.com/<user>/<repo>/actions for status", "cyan");
      }
    } catch {
      log("  ⚠ Not in a git repository - skipping", "yellow");
    }
  }

  async generateReport(deployment) {
    logStep(10, "Generating Deployment Report");
    
    const report = {
      timestamp: new Date().toISOString(),
      network: this.network,
      contracts: deployment,
      gasUsed: {}, // Would need to track this during deployment
      configuration: {
        optimizer: true,
        runs: 200
      },
      artifacts: {
        deployment: this.deploymentPath,
        abis: this.abisPath
      }
    };
    
    const reportPath = `deployment-report-${this.network}-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`  ✓ Report saved to ${reportPath}`, "green");
    
    // Display summary
    log("\n" + "=".repeat(60), "cyan");
    log("  DEPLOYMENT COMPLETE", "bright");
    log("=".repeat(60), "cyan");
    log(`  Network: ${this.network}`, "blue");
    log(`  Contracts: ${Object.keys(deployment).length}`, "blue");
    log(`  Time: ${new Date().toLocaleString()}`, "blue");
    
    if (this.isTestnet || this.isMainnet) {
      const explorer = this.network.includes('base') ? 'basescan' : 'etherscan';
      const subdomain = this.isTestnet ? 'sepolia.' : '';
      log(`\n  View on ${explorer}:`, "yellow");
      log(`  https://${subdomain}${explorer}.org/address/${deployment.MawSacrificeV2}`, "cyan");
    }
  }

  async confirmProduction() {
    if (!this.isMainnet) return true;
    
    log("\n" + "=".repeat(60), "red");
    log("  ⚠️  MAINNET DEPLOYMENT WARNING ⚠️", "bright");
    log("=".repeat(60), "red");
    log("  You are about to deploy to MAINNET", "yellow");
    log("  This action is IRREVERSIBLE and will cost real ETH", "yellow");
    
    const answer = await prompt("\nType 'DEPLOY TO MAINNET' to confirm:");
    if (answer !== 'DEPLOY TO MAINNET') {
      log("\n  Deployment cancelled", "yellow");
      process.exit(0);
    }
    
    const doubleCheck = await prompt("Are you ABSOLUTELY sure? (yes/NO):");
    if (doubleCheck.toLowerCase() !== 'yes') {
      log("\n  Deployment cancelled", "yellow");
      process.exit(0);
    }
    
    return true;
  }

  async run() {
    log("\n" + "=".repeat(60), "cyan");
    log("  ROT RITUAL DEPLOYMENT ORCHESTRATOR", "bright");
    log("=".repeat(60), "cyan");
    log(`  Target Network: ${this.network}`, "yellow");
    
    try {
      await this.checkPrerequisites();
      await this.compile();
      await this.runTests();
      
      if (this.isMainnet) {
        await this.confirmProduction();
      }
      
      const deployment = await this.deploy();
      await this.verify(deployment);
      await this.extractABIs();
      await this.runSmokeTests(deployment);
      await this.seedData(deployment);
      await this.publishArtifacts();
      await this.generateReport(deployment);
      
      log("\n✨ Deployment orchestration complete! ✨", "green");
      process.exit(0);
      
    } catch (error) {
      log("\n💥 Deployment failed", "red");
      console.error(error);
      process.exit(1);
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.includes('--help')) {
  log("\nUsage: node deploy-orchestrator.js [options]");
  log("\nOptions:");
  log("  --help          Show this help message");
  log("  --network       Override NETWORK env variable");
  log("\nEnvironment variables:");
  log("  NETWORK         Target network (localhost, base-sepolia, base)");
  log("  RPC_URL         RPC endpoint for the network");
  log("  PRIVATE_KEY     Deployer private key");
  log("  ETHERSCAN_API_KEY   API key for contract verification");
  process.exit(0);
}

// Override network if provided
const networkIndex = args.indexOf('--network');
if (networkIndex !== -1 && args[networkIndex + 1]) {
  process.env.NETWORK = args[networkIndex + 1];
}

// Run orchestrator
const orchestrator = new DeploymentOrchestrator();
orchestrator.run();