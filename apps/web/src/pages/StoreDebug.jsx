import { useState } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'react-hot-toast';
import useSimpleKeyShop from '../hooks/useSimpleKeyShop';

export default function StoreDebug() {
  const { isConnected, address } = useAccount();
  const { keyPrice, keyBalance, buyKeys, isLoading, isSupported, hasContract, keyShopAddress, chainId } = useSimpleKeyShop();
  const [keyAmount, setKeyAmount] = useState(1);

  console.log('StoreDebug render:', {
    isConnected,
    address,
    keyPrice,
    keyBalance,
    isLoading,
    keyAmount
  });

  const handleBuyKeys = async () => {
    console.log('Buy keys clicked!', keyAmount);
    try {
      await buyKeys(keyAmount);
      toast.success(`Successfully purchased ${keyAmount} keys!`);
    } catch (error) {
      console.error('Buy keys error:', error);
      toast.error('Failed to buy keys');
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <h1 className="text-4xl mb-4">🗝️ Store Debug</h1>
        <p>Please connect your wallet to test purchasing.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl mb-8 text-center">🗝️ Store Debug Mode</h1>
        
        <div className="bg-gray-900 p-6 rounded-lg mb-6">
          <h2 className="text-2xl mb-4">Debug Info:</h2>
          <div className="space-y-2 text-sm font-mono">
            <p>Connected: {isConnected ? '✅' : '❌'}</p>
            <p>Address: {address || 'None'}</p>
            <p>Key Price: {keyPrice} ETH</p>
            <p>Key Balance: {keyBalance}</p>
            <p>Loading: {isLoading ? '✅' : '❌'}</p>
            <p>Key Amount: {keyAmount}</p>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl mb-4">Purchase Keys</h2>
          
          <div className="mb-4">
            <label className="block mb-2">Amount:</label>
            <input
              type="number"
              min="1"
              max="10"
              value={keyAmount}
              onChange={(e) => setKeyAmount(parseInt(e.target.value) || 1)}
              className="w-full p-2 bg-gray-700 text-white rounded border"
            />
          </div>

          <div className="mb-4">
            <p>Total Cost: {(keyAmount * keyPrice).toFixed(4)} ETH</p>
          </div>

          {/* Simple button with debugging */}
          <button
            onClick={handleBuyKeys}
            disabled={isLoading || !keyAmount}
            className="w-full p-4 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded-lg font-bold text-lg"
            style={{ minHeight: '60px' }} // Force minimum height
          >
            {isLoading ? 'Purchasing...' : `Buy ${keyAmount} Keys - ${(keyAmount * keyPrice).toFixed(4)} ETH`}
          </button>

          <div className="mt-4 text-sm text-gray-400">
            Button disabled: {isLoading || !keyAmount ? 'Yes' : 'No'}
          </div>
        </div>

        <div className="mt-6 bg-red-900 p-4 rounded-lg">
          <h3 className="text-xl mb-2">Manual Test</h3>
          <button
            onClick={() => {
              console.log('Manual test button clicked!');
              toast.success('Manual test button works!');
            }}
            className="w-full p-2 bg-red-600 text-white rounded"
          >
            Test Button (Should Always Work)
          </button>
        </div>
      </div>
    </div>
  );
}