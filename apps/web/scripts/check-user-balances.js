#!/usr/bin/env node

/**
 * Check actual user balances on-chain
 * This script will query the Relics contract directly to see token balances
 */

const { ethers } = require('ethers');

// Contract addresses (from your centralized system)
const RELICS_ADDRESS = '0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b';

// Token IDs
const TOKENS = {
  RUSTED_CAP: 0,        // What you sacrifice
  LANTERN_FRAGMENT: 2,  
  WORM_EATEN_MASK: 3,
  BONE_DAGGER: 4,
  ASH_VIAL: 5,
  GLASS_SHARD: 6,       // The one you're asking about
  BINDING_CONTRACT: 8,
  DEMON_DEED: 9,
};

const TOKEN_NAMES = {
  0: "Rusted Caps",
  2: "Lantern Fragments", 
  3: "Worm-Eaten Masks",
  4: "Bone Daggers",
  5: "Ash Vials",
  6: "Glass Shards",     // ← This one
  8: "Binding Contracts",
  9: "Demon Deeds",
};

// Minimal ERC1155 ABI for balance checking
const ERC1155_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOfBatch',
    type: 'function', 
    stateMutability: 'view',
    inputs: [
      { name: 'accounts', type: 'address[]' },
      { name: 'ids', type: 'uint256[]' }
    ],
    outputs: [{ name: '', type: 'uint256[]' }],
  }
];

async function checkUserBalances() {
  console.log('🔍 Checking your on-chain token balances...\n');
  
  // Setup provider for Base Sepolia
  const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
  const contract = new ethers.Contract(RELICS_ADDRESS, ERC1155_ABI, provider);
  
  // Your wallet address (you can change this)
  const userAddress = '0x52257934A41c55F4758b92F4D23b69f920c3652A'; // Update this to your address
  
  console.log('📋 User Info:');
  console.log(`Address: ${userAddress}`);
  console.log(`Relics Contract: ${RELICS_ADDRESS}`);
  console.log(`Network: Base Sepolia (Chain ID 84532)\n`);
  
  try {
    // Get all token balances in a batch
    const tokenIds = Object.values(TOKENS);
    const accounts = Array(tokenIds.length).fill(userAddress);
    
    console.log('⏳ Querying blockchain...\n');
    const balances = await contract.balanceOfBatch(accounts, tokenIds);
    
    console.log('📊 Your Token Balances:');
    console.log('─'.repeat(50));
    
    let hasAnyTokens = false;
    
    for (let i = 0; i < tokenIds.length; i++) {
      const tokenId = tokenIds[i];
      const balance = balances[i].toString();
      const name = TOKEN_NAMES[tokenId];
      
      if (balance !== '0') {
        hasAnyTokens = true;
        console.log(`${name.padEnd(20)} (ID ${tokenId}): ${balance}`);
        
        // Special note for Glass Shards
        if (tokenId === TOKENS.GLASS_SHARD) {
          console.log(`  💎 Glass Shards can be converted: ${balance} shards → ${Math.floor(balance / 5)} Rusted Caps`);
        }
        
        // Special note for Rusted Caps  
        if (tokenId === TOKENS.RUSTED_CAP) {
          console.log(`  🍾 These are what you sacrifice in the Maw`);
        }
      } else {
        console.log(`${name.padEnd(20)} (ID ${tokenId}): 0`);
      }
    }
    
    if (!hasAnyTokens) {
      console.log('\n❌ No tokens found in this wallet');
      console.log('💡 Make sure you\'re using the correct wallet address');
    } else {
      console.log('\n✅ Balance check complete!');
      
      const glassShards = balances[tokenIds.indexOf(TOKENS.GLASS_SHARD)].toString();
      if (glassShards !== '0') {
        console.log(`\n🎯 Answer: You have ${glassShards} Glass Shards`);
        console.log(`💰 Conversion value: ${Math.floor(glassShards / 5)} Rusted Caps`);
      } else {
        console.log('\n🎯 Answer: You have 0 Glass Shards');
      }
    }
    
  } catch (error) {
    console.error('❌ Error querying balances:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your internet connection');
    console.log('2. Verify the wallet address is correct');
    console.log('3. Make sure Base Sepolia RPC is working');
  }
}

// If you want to check a different address, pass it as an argument
const customAddress = process.argv[2];
if (customAddress) {
  // Update the userAddress in the function
  console.log(`Using custom address: ${customAddress}\n`);
}

checkUserBalances();