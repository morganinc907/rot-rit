import React, { useState } from 'react';
import { useChainId, useAccount } from 'wagmi';
import { useRelicBalances } from '../hooks/useRelicBalances';
import { TOKENS, TOKEN_LABELS } from '../sdk/tokens';
import { getRelicsAddress, getMawAddress } from '../sdk/contracts';

/**
 * Quick Balance Check Component
 * Add this to any page to debug balance issues
 * Usage: <QuickBalanceCheck />
 */
export function QuickBalanceCheck() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { address } = useAccount();
  const chainId = useChainId();
  
  // Get all token balances
  const allIds = Object.values(TOKENS);
  const { balances, rawData, relicsAddress } = useRelicBalances(allIds);

  if (!address) return null;

  const relicsAddr = getRelicsAddress(chainId);
  const mawAddr = getMawAddress(chainId);

  return (
    <div 
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '10px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '12px',
        minWidth: '200px',
        maxWidth: '400px',
        border: '1px solid #444'
      }}
    >
      <div 
        style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        🔍 Balance Check {isExpanded ? '▼' : '▶'}
      </div>
      
      {isExpanded && (
        <>
          <div style={{ marginBottom: '8px', fontSize: '10px', color: '#888' }}>
            <div>Chain: {chainId} (Base Sepolia: 84532)</div>
            <div>Account: {address.slice(0, 6)}...{address.slice(-4)}</div>
            <div>Relics: {relicsAddr?.slice(0, 6)}...{relicsAddr?.slice(-4)}</div>
            <div>Maw: {mawAddr?.slice(0, 6)}...{mawAddr?.slice(-4)}</div>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontWeight: 'bold', color: '#4ade80' }}>Token Balances:</div>
            {allIds.map(tokenId => {
              const balance = balances.get(tokenId) ?? 0n;
              const label = TOKEN_LABELS[tokenId] || `Token ${tokenId}`;
              const hasBalance = balance > 0n;
              
              return (
                <div 
                  key={tokenId.toString()}
                  style={{ 
                    color: hasBalance ? '#4ade80' : '#6b7280',
                    fontWeight: hasBalance ? 'bold' : 'normal',
                    marginLeft: '8px'
                  }}
                >
                  {label} (ID {tokenId.toString()}): {balance.toString()}
                  {tokenId === TOKENS.RUSTED_CAP && hasBalance && ' ← SACRIFICE'}
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: '10px', color: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.1)', padding: '4px' }}>
            💡 Rusted Caps (ID 0) are what you sacrifice in the Maw
          </div>

          {rawData && (
            <details style={{ marginTop: '8px', fontSize: '10px' }}>
              <summary style={{ cursor: 'pointer', color: '#6b7280' }}>Raw Data</summary>
              <pre style={{ color: '#4b5563', marginTop: '4px', fontSize: '10px' }}>
                {JSON.stringify(rawData.map(bn => bn.toString()), null, 2)}
              </pre>
            </details>
          )}

          <div style={{ marginTop: '8px', textAlign: 'center' }}>
            <button 
              onClick={() => window.dispatchEvent(new Event('forceBalanceRefresh'))}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🔄 Force Refresh
            </button>
          </div>
        </>
      )}
    </div>
  );
}