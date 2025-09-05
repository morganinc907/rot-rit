// scripts/check-no-raw-addresses.js
// Prevents hardcoded addresses in codebase - forces use of canonical packages

const fs = require("fs");
const path = require("path");

const roots = [
  "scripts",
  "lib", 
  "../frontend/src", // Adjust paths as needed
  "../sdk/src"
];

// Regex for Ethereum addresses
const addressRegex = /\b0x[a-fA-F0-9]{40}\b/g;

// Allow-list for specific contexts where addresses are OK
const allowedFiles = [
  "genProxyDeployment.js", // This script needs to work with addresses
  "check-no-raw-addresses.js", // This script itself
  "hardhat.config.js", // Network configs
  ".env", // Environment files
  "addresses.json", // Our canonical addresses
  "deployments" // Deployment artifacts
];

function isAllowed(filePath) {
  return allowedFiles.some(allowed => filePath.includes(allowed));
}

let violations = [];

function scanFile(filePath) {
  if (isAllowed(filePath)) {
    return;
  }
  
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const matches = content.match(addressRegex);
    
    if (matches) {
      violations.push({
        file: filePath,
        addresses: [...new Set(matches)] // dedupe
      });
    }
  } catch (error) {
    // Ignore files we can't read
  }
}

function scanDirectory(dir) {
  try {
    const entries = fs.readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      
      try {
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules and other build dirs
          if (!["node_modules", "artifacts", "cache", "coverage", ".git"].includes(entry)) {
            scanDirectory(fullPath);
          }
        } else if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
          scanFile(fullPath);
        }
      } catch (e) {
        // Skip files we can't access
      }
    }
  } catch (error) {
    // Directory doesn't exist or not accessible
  }
}

console.log("🔍 Checking for hardcoded addresses...");

// Scan all specified roots
for (const root of roots) {
  const rootPath = path.resolve(root);
  if (fs.existsSync(rootPath)) {
    console.log(`   Scanning: ${rootPath}`);
    scanDirectory(rootPath);
  }
}

if (violations.length > 0) {
  console.error("\n❌ Found hardcoded addresses (use canonical packages instead):");
  console.error("   Import from: const addresses = require('../packages/addresses/addresses.json');");
  console.error("   Or use: import { getAddress } from '@rot-ritual/addresses';\n");
  
  for (const violation of violations) {
    console.error(`📁 ${violation.file}`);
    for (const addr of violation.addresses) {
      console.error(`   ${addr}`);
    }
    console.error();
  }
  
  process.exit(1);
} else {
  console.log("✅ No hardcoded addresses found!");
  console.log("   All address usage goes through canonical packages 🎉");
}