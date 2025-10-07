import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, useConfig } from 'wagmi';
import { readContract } from '@wagmi/core';
import { toast } from 'react-hot-toast';
import { useContracts } from '../hooks/useContracts';
import '../styles/Mint.css';

// Simple Raccoons ABI for minting
const RACCOONS_ABI = [
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'quantity', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'totalMinted',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'MAX_SUPPLY',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'setState',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'newState', type: 'uint8' }
    ],
    outputs: [],
  },
  {
    name: 'joinCult',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: [],
  },
  {
    name: 'tokenOfOwnerByIndex',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
  }
];

export default function Mint() {
  const { address, isConnected } = useAccount();
  const { contracts, isSupported } = useContracts();
  const config = useConfig();
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [userRaccoons, setUserRaccoons] = useState([]);

  const RACCOONS_ADDRESS = contracts?.Raccoons;

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Read contract data
  const { data: totalMinted, refetch: refetchTotal } = useReadContract({
    address: RACCOONS_ADDRESS,
    abi: RACCOONS_ABI,
    functionName: 'totalMinted',
    query: { enabled: !!RACCOONS_ADDRESS && isSupported }
  });

  const { data: maxSupply } = useReadContract({
    address: RACCOONS_ADDRESS,
    abi: RACCOONS_ABI,
    functionName: 'MAX_SUPPLY',
    query: { enabled: !!RACCOONS_ADDRESS && isSupported }
  });

  const { data: userBalance, refetch: refetchBalance } = useReadContract({
    address: RACCOONS_ADDRESS,
    abi: RACCOONS_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!RACCOONS_ADDRESS && isSupported && !!address }
  });

  // Fetch user's raccoons - get actual token IDs
  const fetchUserRaccoons = async () => {
    if (!userBalance || !address || !RACCOONS_ADDRESS || userBalance === 0n) {
      setUserRaccoons([]);
      return;
    }

    try {
      console.log(`🦝 Fetching raccoons for user ${address}, balance: ${userBalance}`);
      
      // The contract doesn't implement ERC721Enumerable, so we need to check ownership
      // by iterating through all minted tokens. Get total minted first.
      const totalMinted = await readContract(config, {
        address: RACCOONS_ADDRESS,
        abi: RACCOONS_ABI,
        functionName: 'totalMinted',
      });
      
      console.log(`Total minted tokens: ${totalMinted}`);
      
      const ownedTokens = [];
      const expectedBalance = Number(userBalance);
      
      // Check each token from 1 to totalMinted to see if user owns it
      for (let tokenId = 1; tokenId <= Number(totalMinted) && ownedTokens.length < expectedBalance; tokenId++) {
        try {
          const owner = await readContract(config, {
            address: RACCOONS_ADDRESS,
            abi: [...RACCOONS_ABI, {
              name: 'ownerOf',
              type: 'function',
              stateMutability: 'view',
              inputs: [{ name: 'tokenId', type: 'uint256' }],
              outputs: [{ name: '', type: 'address' }],
            }],
            functionName: 'ownerOf',
            args: [BigInt(tokenId)]
          });
          
          if (owner.toLowerCase() === address.toLowerCase()) {
            ownedTokens.push(tokenId);
            console.log(`✅ User owns token #${tokenId}`);
          }
        } catch (error) {
          // Token might not exist or be burned
          continue;
        }
      }
      
      console.log(`Found ${ownedTokens.length} tokens: [${ownedTokens.join(', ')}]`);
      setUserRaccoons(ownedTokens);
      
    } catch (error) {
      console.error('Error fetching user raccoons:', error);
      setUserRaccoons([]);
    }
  };

  useEffect(() => {
    if (isConnected && userBalance) {
      fetchUserRaccoons();
    }
  }, [isConnected, userBalance, RACCOONS_ADDRESS]);

  const mintRaccoons = async () => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!RACCOONS_ADDRESS || !isSupported) {
      toast.error('Contracts not available on this network');
      return;
    }

    try {
      setIsLoading(true);
      
      writeContract({
        address: RACCOONS_ADDRESS,
        abi: RACCOONS_ABI,
        functionName: 'mint',
        args: [BigInt(quantity)],
        value: 0n, // Free minting
      });
    } catch (error) {
      console.error('Mint error:', error);
      toast.error(error?.message || 'Minting failed');
      setIsLoading(false);
    }
  };

  const joinCult = async (tokenId) => {
    if (!address || !isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      writeContract({
        address: RACCOONS_ADDRESS,
        abi: RACCOONS_ABI,
        functionName: 'joinCult',
        args: [BigInt(tokenId)],
      });
      
      toast.success(`Raccoon #${tokenId} is joining the cult...`);
      
      // Force metadata refresh after cult join
      setTimeout(() => {
        console.log('🔄 Forcing metadata refresh after cult join...');
        // Trigger a re-fetch of user raccoons
        fetchUserRaccoons();
      }, 2000);
      
    } catch (error) {
      console.error('Join cult error:', error);
      toast.error(error?.message || 'Failed to join cult');
    }
  };

  // Handle successful transactions
  useEffect(() => {
    if (isConfirmed) {
      toast.success('Transaction successful!');
      setIsLoading(false);
      
      // Refresh data after successful mint
      setTimeout(() => {
        refetchTotal();
        refetchBalance();
      }, 2000);
    }
  }, [isConfirmed]);

  const totalMintedNum = totalMinted ? Number(totalMinted) : 0;
  const maxSupplyNum = maxSupply ? Number(maxSupply) : 444;
  const userBalanceNum = userBalance ? Number(userBalance) : 0;

  if (!isSupported) {
    return (
      <div className="mint-page">
        <div className="mint-container">
          <h1>⚠️ Unsupported Network</h1>
          <p>Please connect to Base Sepolia to mint Raccoons.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mint-page">
      <div className="mint-container">
        <div className="mint-header">
          <h1>🦝 Mint Trash Raccoons</h1>
          <div className="mint-stats">
            <div className="stat">
              <span className="stat-label">Minted:</span>
              <span className="stat-value">{totalMintedNum} / {maxSupplyNum}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Your Raccoons:</span>
              <span className="stat-value">{userBalanceNum}</span>
            </div>
          </div>
        </div>

        {!isConnected ? (
          <div className="connect-wallet">
            <p>Connect your wallet to mint Raccoons</p>
          </div>
        ) : (
          <>
            {/* Minting Section */}
            <div className="mint-section">
              <h2>Mint New Raccoons</h2>
              <div className="mint-controls">
                <div className="quantity-control">
                  <label>Quantity:</label>
                  <select 
                    value={quantity} 
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    disabled={isLoading || isPending || isConfirming}
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mint-info">
                  <p>Price: <strong>FREE</strong> (testnet)</p>
                  <p>Max per transaction: 5</p>
                </div>
                
                <button 
                  onClick={mintRaccoons}
                  disabled={isLoading || isPending || isConfirming || totalMintedNum >= maxSupplyNum}
                  className="mint-button"
                >
                  {isLoading || isPending || isConfirming 
                    ? 'Minting...' 
                    : totalMintedNum >= maxSupplyNum 
                      ? 'Sold Out' 
                      : `Mint ${quantity} Raccoon${quantity > 1 ? 's' : ''}`
                  }
                </button>
              </div>
            </div>

            {/* User's Raccoons Section */}
            {userBalanceNum > 0 && (
              <div className="user-raccoons-section">
                <h2>Your Raccoons ({userBalanceNum})</h2>
                <div className="raccoons-grid">
                  {userRaccoons.map(tokenId => (
                    <div key={tokenId} className="raccoon-card">
                      <div className="raccoon-image">
                        <span className="raccoon-id">#{tokenId}</span>
                      </div>
                      <div className="raccoon-actions">
                        <button 
                          onClick={() => joinCult(tokenId)}
                          className="cult-button"
                          disabled={isPending || isConfirming}
                        >
                          Join Cult
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cult-info">
                  <p>💀 Click "Join Cult" to change your raccoon's state and unlock cult metadata!</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}