// Quick script to check what's equipped on-chain
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

const client = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

const COSMETICS_ADDRESS = '0x5D4E264c978860F2C73a689F414f302ad23dC5FB'; // Your CosmeticsV2 address

const raccoonId = process.argv[2] || '1';

const result = await client.readContract({
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

console.log(`\n🎭 Equipped cosmetics for Raccoon #${raccoonId}:`);
console.log(`   HEAD:       ${result[0]}`);
console.log(`   FACE:       ${result[1]}`);
console.log(`   BODY:       ${result[2]}`);
console.log(`   FUR:        ${result[3]}`);
console.log(`   BACKGROUND: ${result[4]}`);
console.log('');

if (result.every(id => id === 0n)) {
  console.log('⚠️  No cosmetics equipped!');
} else {
  console.log('✅ Cosmetics are equipped on-chain!');
}
