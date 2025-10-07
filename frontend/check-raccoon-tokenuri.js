// Check the actual tokenURI from the Raccoons contract
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

const client = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

// Raccoons contract address from your codebase
const RACCOONS_ADDRESS = '0xYourRaccoonsAddress'; // Need to find this
const raccoonId = process.argv[2] || '1';

console.log(`\n🔍 Checking tokenURI for Raccoon #${raccoonId}...`);

const RACCOONS_ABI = [{
  name: 'tokenURI',
  type: 'function',
  stateMutability: 'view',
  inputs: [{ name: 'tokenId', type: 'uint256' }],
  outputs: [{ name: '', type: 'string' }]
}];

try {
  const tokenURI = await client.readContract({
    address: RACCOONS_ADDRESS,
    abi: RACCOONS_ABI,
    functionName: 'tokenURI',
    args: [BigInt(raccoonId)]
  });

  console.log(`\n📝 TokenURI:`, tokenURI);

  // Try to fetch it
  console.log(`\n🌐 Fetching metadata from tokenURI...`);
  const response = await fetch(tokenURI);
  const metadata = await response.json();

  console.log(`\n✅ Metadata:`, JSON.stringify(metadata, null, 2));
  console.log(`\n🎨 Attributes:`, metadata.attributes);

} catch (error) {
  console.error('❌ Error:', error.message);
}
