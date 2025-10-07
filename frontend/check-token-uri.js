// Check the actual tokenURI from the blockchain
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

const client = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

const RACCOONS_ADDRESS = '0xYourRaccoonsAddress'; // Need to get this
const raccoonId = process.argv[2] || '1';

// First, let's find the Raccoons address from your contracts
const RELICS_ADDRESS = '0xYourRelicsAddress';

console.log(`\n🔍 Checking tokenURI for Raccoon #${raccoonId}...`);

// For now, let's just check if we can get the cosmetics address and see the equipped cosmetics
const COSMETICS_ADDRESS = '0x5D4E264c978860F2C73a689F414f302ad23dC5FB';

const equipped = await client.readContract({
  address: COSMETICS_ADDRESS,
  abi: [{
    name: 'getEquippedCosmetics',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'raccoonId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256[5]' }]
  }],
  functionName: 'getEquippedCosmetics',
  args: [BigInt(raccoonId)]
});

console.log(`✅ On-chain equipped cosmetics:`);
console.log(`   HEAD: ${equipped[0]}`);
console.log(`   FACE: ${equipped[1]}`);
console.log(`   BODY: ${equipped[2]}`);
console.log(`   FUR:  ${equipped[3]}`);
console.log(`   BG:   ${equipped[4]}`);

// Now let's check what the tokenURI looks like (if we can find the Raccoons contract)
console.log(`\n📝 The tokenURI on OpenSea/marketplaces will read these equipped values`);
console.log(`   and render them dynamically on top of the base raccoon image.`);
console.log(`\n   Your frontend preview should match what's on-chain!`);
