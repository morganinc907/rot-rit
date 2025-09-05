#!/usr/bin/env node

/**
 * Frontend Integrity Check - CI script to prevent regressions
 * Validates that the frontend is properly configured and won't fail at runtime
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Running frontend integrity checks...');

let hasErrors = false;
let hasWarnings = false;

// Check 1: ABI Validation
console.log('\n📋 Checking ABI files...');

const abiPath = path.join(__dirname, '../apps/web/src/abis/canonical-abis.json');
if (!fs.existsSync(abiPath)) {
  console.error('❌ canonical-abis.json not found');
  hasErrors = true;
} else {
  try {
    const abis = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
    
    // Check MawSacrifice ABI
    if (!abis.MawSacrifice || !Array.isArray(abis.MawSacrifice)) {
      console.error('❌ MawSacrifice ABI missing or invalid');
      hasErrors = true;
    } else {
      const mawFunctions = abis.MawSacrifice
        .filter(item => item.type === 'function')
        .map(item => item.name);
      
      const requiredFunctions = ['sacrificeKeys', 'convertShardsToRustedCaps'];
      const missingFunctions = requiredFunctions.filter(fn => !mawFunctions.includes(fn));
      
      if (missingFunctions.length > 0) {
        console.error(`❌ Missing required MawSacrifice functions: ${missingFunctions.join(', ')}`);
        hasErrors = true;
      }
      
      // Check for V5 functions
      const v5Functions = ['capId', 'keyId', 'fragId', 'shardId'];
      const hasV5 = v5Functions.every(fn => mawFunctions.includes(fn));
      
      if (!hasV5) {
        console.warn('⚠️  Missing V5 configurable functions - using older contract version');
        hasWarnings = true;
      }
    }
    
    // Check Relics ABI
    if (!abis.Relics || !Array.isArray(abis.Relics)) {
      console.error('❌ Relics ABI missing or invalid');
      hasErrors = true;
    } else {
      const relicsFunctions = abis.Relics
        .filter(item => item.type === 'function')
        .map(item => item.name);
      
      const requiredRelicsFunctions = ['balanceOfBatch', 'mawSacrifice'];
      const missingRelicsFunctions = requiredRelicsFunctions.filter(fn => !relicsFunctions.includes(fn));
      
      if (missingRelicsFunctions.length > 0) {
        console.error(`❌ Missing required Relics functions: ${missingRelicsFunctions.join(', ')}`);
        hasErrors = true;
      }
    }
    
    if (!hasErrors) {
      console.log('✅ ABI validation passed');
    }
  } catch (error) {
    console.error(`❌ Failed to parse canonical-abis.json: ${error.message}`);
    hasErrors = true;
  }
}

// Check 2: Address Configuration
console.log('\n🏠 Checking address configuration...');

const addressIndexPath = path.join(__dirname, '../packages/addresses/src/index.ts');
if (!fs.existsSync(addressIndexPath)) {
  console.error('❌ Address index.ts not found');
  hasErrors = true;
} else {
  const indexContent = fs.readFileSync(addressIndexPath, 'utf8');
  
  // Check for old address
  const oldAddress = '0x32833358cc1f4eC6E05FF7014Abc1B6b09119625';
  if (indexContent.toLowerCase().includes(oldAddress.toLowerCase())) {
    console.error(`❌ Old MawSacrifice address found in index.ts: ${oldAddress}`);
    hasErrors = true;
  }
  
  // Check for required addresses
  const requiredAddresses = ['MawSacrifice', 'Relics', 'KeyShop'];
  for (const addr of requiredAddresses) {
    if (!indexContent.includes(`${addr}:`)) {
      console.error(`❌ Missing required address: ${addr}`);
      hasErrors = true;
    }
  }
  
  if (!hasErrors) {
    console.log('✅ Address configuration valid');
  }
}

// Check 3: Hook Dependencies
console.log('\n🎣 Checking hook structure...');

const hooksDir = path.join(__dirname, '../apps/web/src/hooks');
const requiredHooks = [
  'useContracts.ts',
  'useMawConfig.ts', 
  'useRelicBalances.ts',
  'useSacrifice.ts'
];

for (const hook of requiredHooks) {
  const hookPath = path.join(hooksDir, hook);
  if (!fs.existsSync(hookPath)) {
    console.error(`❌ Missing required hook: ${hook}`);
    hasErrors = true;
  } else {
    const hookContent = fs.readFileSync(hookPath, 'utf8');
    
    // Basic validation that hook exports something
    if (!hookContent.includes('export') && !hookContent.includes('module.exports')) {
      console.error(`❌ Hook ${hook} doesn't appear to export anything`);
      hasErrors = true;
    }
  }
}

if (!hasErrors) {
  console.log('✅ Hook structure valid');
}

// Check 4: No hardcoded addresses in components
console.log('\n🧱 Checking for hardcoded addresses...');

const componentsDir = path.join(__dirname, '../apps/web/src/components');
if (fs.existsSync(componentsDir)) {
  const checkForHardcodedAddresses = (dir) => {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        checkForHardcodedAddresses(filePath);
      } else if (file.name.match(/\.(tsx?|jsx?)$/)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Look for Ethereum address patterns
        const addressPattern = /0x[a-fA-F0-9]{40}/g;
        const matches = content.match(addressPattern);
        
        if (matches) {
          console.warn(`⚠️  Found potential hardcoded addresses in ${file.name}: ${matches.join(', ')}`);
          hasWarnings = true;
        }
      }
    }
  };
  
  checkForHardcodedAddresses(componentsDir);
}

console.log('✅ Hardcoded address check completed');

// Check 5: Package.json scripts
console.log('\n📦 Checking build configuration...');

const packageJsonPath = path.join(__dirname, '../package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Check for CI-related scripts
  if (!packageJson.scripts || !packageJson.scripts['check:noaddrs']) {
    console.warn('⚠️  No check:noaddrs script found in package.json');
    hasWarnings = true;
  }
  
  console.log('✅ Build configuration check completed');
}

// Final Results
console.log('\n🏁 Frontend Integrity Check Results:');

if (hasErrors) {
  console.error('\n❌ INTEGRITY CHECK FAILED');
  console.error('The following critical issues must be fixed:');
  console.error('- Check the error messages above');
  console.error('- Frontend may fail at runtime with current configuration');
  process.exit(1);
}

if (hasWarnings) {
  console.warn('\n⚠️  INTEGRITY CHECK PASSED WITH WARNINGS');
  console.warn('Some non-critical issues were found - review warnings above');
} else {
  console.log('\n✅ INTEGRITY CHECK PASSED');
  console.log('Frontend is properly configured and should work correctly');
}

console.log('\n🎉 All critical validations passed!');
process.exit(0);