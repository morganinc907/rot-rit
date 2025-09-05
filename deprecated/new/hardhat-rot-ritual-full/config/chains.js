// Chain configurations for Rot Ritual
const chains = {
  baseSepolia: {
    id: 84532,
    name: 'Base Sepolia',
    network: 'base-sepolia',
    nativeCurrency: {
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH'
    },
    rpcUrls: {
      default: {
        http: ['https://sepolia.base.org']
      },
      fallback: {
        http: ['https://base-sepolia.gateway.tenderly.co']
      }
    },
    blockExplorers: {
      default: {
        name: 'BaseScan',
        url: 'https://sepolia.basescan.org'
      }
    },
    testnet: true
  },
  baseMainnet: {
    id: 8453,
    name: 'Base',
    network: 'base',
    nativeCurrency: {
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH'
    },
    rpcUrls: {
      default: {
        http: ['https://mainnet.base.org']
      },
      fallback: {
        http: ['https://base.gateway.tenderly.co']
      }
    },
    blockExplorers: {
      default: {
        name: 'BaseScan',
        url: 'https://basescan.org'
      }
    },
    testnet: false
  }
};

module.exports = { chains };