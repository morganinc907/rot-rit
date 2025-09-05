import React from "react";
import useNFTBalances from "../hooks/useNFTBalancesSDK";
import { useMawSacrificeSDK } from "../hooks/useMawSacrificeSDK";

export default function MawNewSimple() {
  const { relics, loading } = useNFTBalances();
  const { 
    approveContract, 
    isApproved, 
    isLoading 
  } = useMawSacrificeSDK(() => {});

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">
      Loading...
    </div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">The Maw</h1>
        
        {/* Approval Status */}
        <div className="mb-8 text-center">
          {isApproved ? (
            <div className="text-green-400">✅ Contract Approved</div>
          ) : (
            <button 
              onClick={approveContract}
              disabled={isLoading}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-semibold"
            >
              {isLoading ? "Approving..." : "Approve Contract"}
            </button>
          )}
        </div>

        {/* Inventory */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {relics.map(relic => (
            <div key={relic.id} className="bg-gray-800 p-4 rounded-lg">
              <div className="font-semibold">{relic.name}</div>
              <div className="text-sm text-gray-400">Qty: {relic.quantity}</div>
              <div className="text-xs text-gray-500 capitalize">{relic.rarity}</div>
            </div>
          ))}
        </div>

        {relics.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            No relics found in your inventory
          </div>
        )}
      </div>
    </div>
  );
}