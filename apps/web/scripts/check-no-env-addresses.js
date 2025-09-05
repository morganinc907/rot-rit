#!/usr/bin/env node

/**
 * Lint script to prevent usage of environment variables for contract addresses
 * This ensures all contract addresses come from the centralized TypeScript system
 */

const fs = require('fs');
const path = require('path');

const FORBIDDEN_PATTERNS = [
  /import\.meta\.env\.VITE_.*_ADDRESS/g,
  /process\.env\.VITE_.*_ADDRESS/g,
];

const ALLOWED_EXCEPTIONS = [
  // Add any legitimate exceptions here if needed
];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const errors = [];

  FORBIDDEN_PATTERNS.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Check if this match is in the exceptions list
        const isException = ALLOWED_EXCEPTIONS.some(exception => 
          match.includes(exception)
        );
        
        if (!isException) {
          errors.push({
            file: filePath,
            pattern: match,
            message: `❌ Found environment variable usage: ${match}`,
            suggestion: 'Use centralized address system from ./sdk/addresses.ts instead'
          });
        }
      });
    }
  });

  return errors;
}

function scanDirectory(dirPath, extensions = ['.js', '.jsx', '.ts', '.tsx']) {
  const errors = [];
  
  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    items.forEach(item => {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && item !== 'node_modules' && item !== '.git') {
        walkDir(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(fullPath);
        if (extensions.includes(ext)) {
          const fileErrors = checkFile(fullPath);
          errors.push(...fileErrors);
        }
      }
    });
  }
  
  walkDir(dirPath);
  return errors;
}

function main() {
  console.log('🔍 Checking for forbidden environment variable usage in contract addresses...\n');
  
  const srcPath = path.join(__dirname, '../src');
  const errors = scanDirectory(srcPath);
  
  if (errors.length === 0) {
    console.log('✅ All good! No environment variable usage found for contract addresses.');
    console.log('📝 All contracts are using the centralized address system.\n');
    process.exit(0);
  } else {
    console.log(`❌ Found ${errors.length} violation(s):\n`);
    
    errors.forEach(error => {
      console.log(`File: ${error.file}`);
      console.log(`Issue: ${error.message}`);
      console.log(`Fix: ${error.suggestion}`);
      console.log('─'.repeat(60));
    });
    
    console.log('\n💡 How to fix:');
    console.log('1. Import from centralized addresses: import { getMawAddress } from "../sdk/addresses"');
    console.log('2. Use useChainId() hook to get current chain');
    console.log('3. Call getMawAddress(chainId) instead of import.meta.env.VITE_MAW_ADDRESS');
    console.log('\n📚 See existing components like contracts.ts for examples.');
    
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkFile, scanDirectory };