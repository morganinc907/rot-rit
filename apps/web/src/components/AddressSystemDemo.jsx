import React from 'react';
import { useAddressSystemHealth } from '../hooks/useAddress';

/**
 * Demo component showing chain-first address resolution
 * This visualizes the health of our address resolution system
 */
export default function AddressSystemDemo() {
  const { addresses, isLoading, errors, health } = useAddressSystemHealth();

  if (isLoading) {
    return (
      <div className="bg-gray-900/60 rounded-xl p-6 mb-8">
        <h3 className="text-xl font-bold mb-4 text-blue-400">🔗 Address Resolution System</h3>
        <div className="text-gray-400">Loading contract addresses...</div>
      </div>
    );
  }

  const contracts = [
    { key: 'RELICS', name: 'Relics (1155)' },
    { key: 'MAW_SACRIFICE', name: 'MAW Sacrifice' },
    { key: 'COSMETICS', name: 'Cosmetics V2' },
    { key: 'DEMONS', name: 'Demons (721)' },
    { key: 'CULTISTS', name: 'Cultists (721)' },
    { key: 'KEY_SHOP', name: 'Key Shop' },
    { key: 'RACCOONS', name: 'Raccoons (721)' },
    { key: 'RACCOON_RENDERER', name: 'Raccoon Renderer' },
    { key: 'RITUAL_READ_AGGREGATOR', name: 'Read Aggregator' },
  ];

  return (
    <div className="bg-gray-900/60 rounded-xl p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-blue-400">🔗 AddressRegistry (Fully Chain-First)</h3>
        <div className="text-right text-sm">
          <div className="text-green-400">✅ {health.chainFirst}/{health.total} chain-resolved</div>
          <div className="text-gray-400">📋 Registry: {health.registryAddress?.slice(0, 8)}...</div>
          {health.missing > 0 && <div className="text-red-400">❌ {health.missing} missing</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {contracts.map((contract) => {
          const address = addresses[contract.key];
          const hasAddress = !!address;
          
          return (
            <div 
              key={contract.key}
              className="bg-gray-800/50 p-3 rounded-lg border border-gray-700"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{hasAddress ? '🔗' : '❌'}</span>
                <span className="font-medium text-sm">{contract.name}</span>
              </div>
              
              <div className={`text-xs mb-1 ${hasAddress ? 'text-green-400' : 'text-red-400'}`}>
                {hasAddress ? '🔗 AddressRegistry.get()' : '❌ Not in registry'}
              </div>
              
              {hasAddress ? (
                <div className="font-mono text-xs text-gray-300 truncate">
                  {address}
                </div>
              ) : (
                <div className="text-xs text-red-400">❌ Not resolved</div>
              )}
            </div>
          );
        })}
      </div>

      {errors && errors.length > 0 && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mb-4">
          <h4 className="text-red-400 font-semibold mb-2">⚠️ Resolution Errors:</h4>
          <ul className="text-sm text-red-300">
            {errors.map((error, i) => (
              <li key={i}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
        <h4 className="text-blue-400 font-semibold mb-2">🎯 AddressRegistry Strategy:</h4>
        <div className="text-sm text-gray-300 space-y-1">
          <div>✅ <span className="text-green-400">Single source of truth</span>: All addresses in registry</div>
          <div>🔗 <span className="text-blue-400">Zero hardcoding</span>: Every useAddress() call hits chain</div>  
          <div>⚡ <span className="text-purple-400">Efficient batching</span>: registry.getAll() loads everything</div>
          <div>🔒 <span className="text-yellow-400">Address drift: IMPOSSIBLE</span></div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="text-xs text-gray-400">
            Registry: <span className="font-mono">{health.registryAddress}</span>
          </div>
        </div>
      </div>
    </div>
  );
}