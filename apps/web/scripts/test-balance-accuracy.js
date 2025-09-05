#!/usr/bin/env node

/**
 * Script to verify that balance fetching is working correctly
 * This script will check contract addresses and test balance queries
 */

const fs = require('fs');
const path = require('path');

// Read the addresses from the centralized system
function loadAddresses() {
  const addressesPath = path.join(__dirname, '../../../packages/addresses/addresses.json');
  if (!fs.existsSync(addressesPath)) {
    throw new Error(`Addresses file not found at ${addressesPath}`);
  }
  
  const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
  return addresses.baseSepolia;
}

// Read the TypeScript addresses
function loadTSAddresses() {
  const tsPath = path.join(__dirname, '../../../packages/addresses/src/index.ts');
  if (!fs.existsSync(tsPath)) {
    throw new Error(`TypeScript addresses not found at ${tsPath}`);
  }
  
  const content = fs.readFileSync(tsPath, 'utf8');
  
  // Parse the addresses from the TypeScript file
  const addresses = {};
  const addressPattern = /(\w+):\s*"(0x[a-fA-F0-9]{40})"/g;
  let match;
  
  while ((match = addressPattern.exec(content)) !== null) {
    addresses[match[1]] = match[2];
  }
  
  return addresses;
}

function main() {
  console.log('🔍 Testing Balance Accuracy\n');
  
  try {
    const jsonAddresses = loadAddresses();
    const tsAddresses = loadTSAddresses();
    
    console.log('📋 Current Contract Addresses:');
    console.log('─'.repeat(50));
    
    // Check for consistency between JSON and TypeScript addresses
    const inconsistencies = [];
    
    Object.keys(jsonAddresses).forEach(contractName => {
      const jsonAddr = jsonAddresses[contractName];
      const tsAddr = tsAddresses[contractName];
      
      console.log(`${contractName.padEnd(20)} ${jsonAddr}`);
      
      if (tsAddr && jsonAddr !== tsAddr) {
        inconsistencies.push({
          contract: contractName,
          json: jsonAddr,
          ts: tsAddr
        });
      }
    });
    
    console.log('\n🔧 Key Balance-Related Contracts:');
    console.log('─'.repeat(50));
    console.log(`Relics (ERC1155):     ${jsonAddresses.Relics || 'NOT FOUND'}`);
    console.log(`MawSacrifice:         ${jsonAddresses.MawSacrifice || 'NOT FOUND'}`);
    console.log(`Cosmetics:            ${jsonAddresses.Cosmetics || 'NOT FOUND'}`);
    console.log(`Raccoons:             ${jsonAddresses.Raccoons || 'NOT FOUND'}`);
    
    if (inconsistencies.length > 0) {
      console.log('\n❌ Address Inconsistencies Found:');
      console.log('─'.repeat(50));
      inconsistencies.forEach(inc => {
        console.log(`${inc.contract}:`);
        console.log(`  JSON: ${inc.json}`);
        console.log(`  TS:   ${inc.ts}`);
      });
      console.log('\n⚠️  Fix: Update addresses.json to match TypeScript addresses');
    } else {
      console.log('\n✅ All addresses are consistent between JSON and TypeScript files');
    }
    
    console.log('\n📝 Balance Fetching Components Status:');
    console.log('─'.repeat(50));
    
    // Check which components are using the correct address system
    const balanceComponents = [
      'useRelicBalances.ts',
      'useNFTBalancesSDK.js', 
      'useNFTBalances.js',
      'DebugBalances.tsx'
    ];
    
    balanceComponents.forEach(component => {
      const filePath = path.join(__dirname, '../src/hooks', component);
      const filePath2 = path.join(__dirname, '../src/components', component);
      const actualPath = fs.existsSync(filePath) ? filePath : filePath2;
      
      if (fs.existsSync(actualPath)) {
        const content = fs.readFileSync(actualPath, 'utf8');
        
        // Check if using centralized addresses
        const usesSDK = content.includes('sdk/contracts') || content.includes('sdk/addresses');
        const usesEnv = content.includes('import.meta.env.VITE');
        
        console.log(`${component.padEnd(22)} ${usesSDK ? '✅ SDK' : '❓ Unknown'} ${usesEnv ? '⚠️  ENV' : ''}`);
      } else {
        console.log(`${component.padEnd(22)} ❌ Not Found`);
      }
    });
    
    console.log('\n🧪 Testing Instructions:');
    console.log('─'.repeat(50));
    console.log('1. Run the frontend with `npm run dev`');
    console.log('2. Connect your wallet to Base Sepolia');
    console.log('3. Navigate to /maw-new-simple to see debug balances');
    console.log('4. Check browser console for address logging');
    console.log('5. Verify balances match what you see on block explorer');
    
    console.log('\n🔗 Verification Links:');
    console.log(`Relics Contract: https://sepolia.basescan.org/address/${jsonAddresses.Relics}`);
    console.log(`Maw Contract: https://sepolia.basescan.org/address/${jsonAddresses.MawSacrifice}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { loadAddresses, loadTSAddresses };