import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import useKeyShop from '../hooks/useKeyShop';
import useContracts from '../hooks/useContracts.tsx';
import { useAddress } from '../hooks/useAddress';
import AddressSystemDemo from '../components/AddressSystemDemo';

// CosmeticsV2 ABI for fetching data
const COSMETICS_V2_ABI = [
  {
    name: 'getCosmeticInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'typeId', type: 'uint256' }],
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'imageURI', type: 'string' },
      { name: 'previewLayerURI', type: 'string' },
      { name: 'rarity', type: 'uint8' },
      { name: 'slot', type: 'uint8' },
      { name: 'monthlySetId', type: 'uint256' },
      { name: 'active', type: 'bool' }
    ],
  },
];

// CosmeticsV2 ABI for getting seasonal catalog  
const COSMETICS_SEASON_ABI = [
  {
    name: 'getCurrentCosmeticTypes',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
];

export default function Store() {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { contracts: contractAddresses } = useContracts();
  const { keyPrice, keyBalance, buyKeys, isLoading, isSupported, contracts } = useKeyShop();
  const { address: cosmeticsAddress, isLoading: cosmeticsAddressLoading, error: cosmeticsAddressError } = useAddress('COSMETICS');
  
  const [keyAmount, setKeyAmount] = useState(1);
  const [showCosmeticDetails, setShowCosmeticDetails] = useState(null);
  const [cosmetics, setCosmetics] = useState([]);
  const [cosmeticsLoading, setCosmeticsLoading] = useState(true);
  const [currentMonthlySet, setCurrentMonthlySet] = useState({ name: 'January Collection', id: 1 });

  // Calculate total cost
  const totalCost = keyAmount * (keyPrice || 0);

  const handleBuyKeys = async () => {
    console.log("🛒 Buy Caps button clicked!", { keyAmount, totalCost, isLoading });
    
    if (!keyAmount || keyAmount < 1) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      console.log("🛒 Calling buyKeys function...");
      await buyKeys(keyAmount);
      setKeyAmount(1);
    } catch (error) {
      console.error("Failed to buy caps:", error);
      // Don't show error toast here since useKeyShop handles it
    }
  };

  const getRarityColor = (rarity) => {
    switch(rarity) {
      case 1: return 'text-gray-400 border-gray-400';
      case 2: return 'text-green-400 border-green-400';
      case 3: return 'text-blue-400 border-blue-400';
      case 4: return 'text-purple-400 border-purple-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getRarityName = (rarity) => {
    switch(rarity) {
      case 1: return 'Common';
      case 2: return 'Uncommon';
      case 3: return 'Rare';
      case 4: return 'Epic';
      case 5: return 'Legendary';
      default: return 'Unknown';
    }
  };

  // Fetch cosmetics from contract
  useEffect(() => {
    const fetchCosmetics = async () => {
      console.log('🎨 Store useEffect - cosmeticsAddress:', cosmeticsAddress);
      console.log('🎨 Store useEffect - publicClient:', publicClient);
      console.log('🎨 Store useEffect - cosmeticsAddressLoading:', cosmeticsAddressLoading);
      console.log('🎨 Store useEffect - cosmeticsAddressError:', cosmeticsAddressError);
      
      // Block UI if cosmetics address is undefined or still loading
      if (cosmeticsAddressLoading || !cosmeticsAddress || !publicClient) {
        console.log('🎨 Missing requirements - skipping fetch');
        return;
      }
      
      // Show error if cosmetics address resolution failed
      if (cosmeticsAddressError) {
        console.error('🎨 Cosmetics address error:', cosmeticsAddressError);
        setCosmetics([]);
        setCurrentMonthlySet({ name: 'Address Resolution Error', id: 0 });
        setCosmeticsLoading(false);
        return;
      }
      
      setCosmeticsLoading(true);
      try {
        console.log('🎨 Fetching seasonal cosmetics from chain-resolved address:', cosmeticsAddress);
        
        // Get current seasonal cosmetic types from CosmeticsV2 contract
        const availableTypes = await publicClient.readContract({
          address: cosmeticsAddress,
          abi: COSMETICS_SEASON_ABI,
          functionName: 'getCurrentCosmeticTypes',
        });
        
        console.log('🎨 Available cosmetic types:', availableTypes.map(t => Number(t)));
        
        // Handle empty season (no cosmetics configured yet)
        if (availableTypes.length === 0) {
          console.log('🎨 No cosmetics configured for current season');
          setCosmetics([]);
          setCurrentMonthlySet({ name: 'Season Not Configured', id: 0 });
          setCosmeticsLoading(false);
          return;
        }
        
        // Fetch cosmetic info for each available type
        const cosmeticsData = [];
        for (const typeId of availableTypes) {
          try {
            const typeData = await publicClient.readContract({
              address: cosmeticsAddress,
              abi: COSMETICS_V2_ABI,
              functionName: 'getCosmeticInfo',
              args: [typeId],
            });
            
            // Convert IPFS URLs to HTTPS
            let imageURL = typeData[1];
            if (imageURL.startsWith('ipfs://')) {
              imageURL = imageURL.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }
            
            cosmeticsData.push({
              id: Number(typeId),
              name: typeData[0],
              imageURI: imageURL,
              previewLayerURI: typeData[2],
              rarity: typeData[3],
              slot: typeData[4],
              monthlySetId: Number(typeData[5]),
              active: typeData[6],
            });
          } catch (err) {
            console.error(`Error fetching cosmetic ${typeId}:`, err);
          }
        }
        
        console.log('🎨 Fetched cosmetics:', cosmeticsData);
        setCosmetics(cosmeticsData);
        setCurrentMonthlySet({ name: 'Current Collection', id: 1 });
      } catch (error) {
        console.error('🎨 Error fetching cosmetics:', error);
        // Handle contract not upgraded yet or other errors
        setCosmetics([]);
        setCurrentMonthlySet({ 
          name: error.message.includes('getCurrentCosmeticTypes') 
            ? 'Contract Update Required' 
            : 'Season Loading Error', 
          id: 0 
        });
      } finally {
        setCosmeticsLoading(false);
      }
    };

    fetchCosmetics();
  }, [cosmeticsAddress, cosmeticsAddressLoading, cosmeticsAddressError, publicClient]);

  const getDaysRemaining = () => {
    // Mock calculation - in real app, get from contract or backend
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const diffTime = endOfMonth - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black to-red-950 text-gray-200">
        <h1 className="text-4xl mb-4" style={{ fontFamily: 'Kings Cross', fontSize: '4rem', fontWeight: 'normal', background: 'linear-gradient(45deg, #8a2be2, #ff00ff, #8a2be2)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>The Cap Shop</h1>
        <p>Please connect your wallet to access the store.</p>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black to-red-950 text-gray-200">
        <h1 className="text-4xl mb-4" style={{ fontFamily: 'Kings Cross', fontSize: '4rem', fontWeight: 'normal', background: 'linear-gradient(45deg, #8a2be2, #ff00ff, #8a2be2)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>The Cap Shop</h1>
        <p className="mb-4">Contracts not available on this network.</p>
        <p className="text-gray-400">Please switch to Base Sepolia (Chain ID 84532) network.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-red-950 text-gray-200 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl text-center mb-4" style={{ fontFamily: 'Kings Cross', fontWeight: 'normal', fontSize: '5rem', background: 'linear-gradient(45deg, #8a2be2, #ff00ff, #8a2be2)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>The Cap Shop</h1>
        <p className="text-center text-gray-300 mb-8">
          Purchase Rusted Caps to sacrifice at the Maw for rare relics and rewards
        </p>
        
        {/* Address System Demo */}
        <AddressSystemDemo />
        

        {/* Cap Purchase Section */}
        <div className="bg-gray-900/60 rounded-xl p-8 mb-12 max-w-2xl mx-auto">
          <h2 className="text-3xl mb-6 text-center" style={{ fontFamily: 'Kings Cross', fontWeight: 'normal', fontSize: '3.5rem', background: 'linear-gradient(45deg, #8a2be2, #ff00ff, #8a2be2)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>Rusted Caps</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Cap Info */}
            <div className="space-y-4">
              <div className="bg-gray-800/50 p-4 rounded-lg">
                <h3 className="text-xl text-yellow-300 mb-2">Cap Details</h3>
                <p className="text-gray-300 mb-2">
                  Price: <span className="text-white font-bold">{keyPrice?.toFixed(4) || '0.002'} ETH</span>
                </p>
                <p className="text-gray-300 mb-2">
                  Your Balance: <span className="text-yellow-400 font-bold">{keyBalance || 0} caps</span>
                </p>
                <p className="text-sm text-gray-400">
                  Sacrifice caps at the Maw to receive random relics, or nothing at all...
                </p>
              </div>
            </div>

            {/* Purchase Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount to Buy</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={keyAmount}
                  onChange={(e) => setKeyAmount(parseInt(e.target.value) || 1)}
                  className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                  disabled={isLoading}
                />
              </div>

              <div className="bg-gray-800/30 p-4 rounded-lg">
                <p className="text-lg">
                  Total Cost: <span className="text-yellow-400 font-bold">{totalCost.toFixed(4)} ETH</span>
                </p>
              </div>

              <button
                onClick={handleBuyKeys}
                disabled={isLoading || !keyAmount}
                style={{ 
                  display: 'block', 
                  visibility: 'visible',
                  width: '100%',
                  padding: '16px 24px',
                  backgroundColor: '#ff00ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  minHeight: '56px'
                }}
              >
                {isLoading ? 'Purchasing...' : `Buy ${keyAmount} Cap${keyAmount > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>

        {/* Current Monthly Cosmetics */}
        <div className="bg-gray-900/60 rounded-xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl" style={{ fontFamily: 'Kings Cross', fontWeight: 'normal', fontSize: '3.5rem', background: 'linear-gradient(45deg, #8a2be2, #ff00ff, #8a2be2)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>
              Ritual Cosmetics Collection
            </h2>
            <div className="text-right">
              <p className="text-yellow-400 font-bold text-xl">
                {getDaysRemaining()} days remaining
              </p>
            </div>
          </div>

          {(cosmeticsLoading || cosmeticsAddressLoading) ? (
            <div className="text-center py-8">
              <p className="text-gray-400">
                {cosmeticsAddressLoading ? 'Resolving cosmetics address...' : 'Loading cosmetics...'}
              </p>
            </div>
          ) : cosmeticsAddressError ? (
            <div className="text-center py-8">
              <p className="text-red-400">
                ❌ Error loading cosmetics: {cosmeticsAddressError}
              </p>
              <p className="text-gray-400 mt-2">
                Unable to resolve cosmetics address from MAW contract
              </p>
            </div>
          ) : !cosmeticsAddress ? (
            <div className="text-center py-8">
              <p className="text-yellow-400">
                ⚠️ Cosmetics address not available
              </p>
              <p className="text-gray-400 mt-2">
                MAW contract may not be properly configured
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
              {/* All cosmetics in one grid */}
              {cosmetics.map((cosmetic) => {
                // Get glow color based on rarity
                const glowColor = {
                  5: 'rgba(255, 215, 0, 0.6)',  // Legendary - gold glow
                  4: 'rgba(147, 51, 234, 0.6)',  // Epic - purple glow
                  3: 'rgba(59, 130, 246, 0.6)',  // Rare - blue glow
                  2: 'rgba(34, 197, 94, 0.6)',   // Uncommon - green glow
                  1: 'rgba(156, 163, 175, 0.3)'  // Common - gray glow
                }[cosmetic.rarity] || 'rgba(156, 163, 175, 0.3)';

                return (
                  <div
                    key={cosmetic.id}
                    className="bg-gray-800/50 p-3 rounded-lg cursor-pointer hover:scale-105 transition-transform"
                    style={{
                      boxShadow: `0 0 20px ${glowColor}`,
                      border: `2px solid ${glowColor}`
                    }}
                    onClick={() => setShowCosmeticDetails(cosmetic)}
                  >
                    <div className="w-full aspect-square bg-gray-700 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                      {cosmetic.imageURI ? (
                        <img src={cosmetic.imageURI} alt={cosmetic.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">?</span>
                      )}
                    </div>
                    <h4 className="font-semibold text-center text-sm truncate px-1">{cosmetic.name}</h4>
                    <p className="text-xs text-center text-gray-400">
                      {cosmetic.currentSupply}/{cosmetic.maxSupply} minted
                    </p>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* Cosmetic Detail Modal */}
      <AnimatePresence>
        {showCosmeticDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCosmeticDetails(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className={`bg-gray-900 p-6 rounded-xl max-w-md w-full border-2 ${getRarityColor(showCosmeticDetails.rarity)}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-32 h-32 bg-gray-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  {showCosmeticDetails.imageURI ? (
                    <img 
                      src={showCosmeticDetails.imageURI} 
                      alt={showCosmeticDetails.name} 
                      className="w-full h-full object-cover rounded-lg" 
                    />
                  ) : (
                    <span className="text-6xl">👑</span>
                  )}
                </div>
                <h3 className="text-2xl font-bold mb-2">{showCosmeticDetails.name}</h3>
                <p className={`text-lg mb-4 ${getRarityColor(showCosmeticDetails.rarity)}`}>
                  {getRarityName(showCosmeticDetails.rarity)}
                </p>
                <p className="text-gray-400 mb-4">
                  Supply: {showCosmeticDetails.currentSupply || 0} of {showCosmeticDetails.maxSupply} minted
                </p>
                <p className="text-sm text-gray-300 mb-6">
                  This cosmetic can be applied to any Raccoon you own. Once applied, it becomes permanently attached to that Raccoon.
                </p>
                <button
                  onClick={() => setShowCosmeticDetails(null)}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}