/**
 * ContractGuardWrapper - Integrates ContractAddressGuard with useContracts
 * This wrapper gets the contract addresses and passes them to the guard
 */

import { useChainId } from 'wagmi';
import { useContracts } from '../hooks/useContracts';
import ContractAddressGuard from './ContractAddressGuard';

interface ContractGuardWrapperProps {
  children: React.ReactNode;
}

export default function ContractGuardWrapper({ children }: ContractGuardWrapperProps) {
  const chainId = useChainId();
  const { contracts, loading, error } = useContracts();

  // Show loading while contracts are resolving
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        padding: '20px',
        fontFamily: 'monospace'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '20px' }}>🔗</div>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading Contracts</div>
        <div style={{ color: '#666' }}>Resolving chain-first addresses...</div>
      </div>
    );
  }

  // Show error if contracts failed to load
  if (error || !contracts) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        padding: '40px',
        fontFamily: 'monospace',
        backgroundColor: '#fff5f5'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🚨</div>
        <div style={{ fontSize: '24px', marginBottom: '20px', color: '#c53030' }}>
          Contract Loading Failed
        </div>
        <div style={{ fontSize: '16px', marginBottom: '30px', color: '#666', maxWidth: '600px', textAlign: 'center' }}>
          Failed to load contract addresses. This typically indicates a network issue or invalid configuration.
        </div>
        
        <div style={{ 
          background: '#fed7d7', 
          border: '1px solid #fc8181',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
          maxWidth: '700px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#c53030' }}>
            Error Details:
          </div>
          <div style={{ color: '#c53030' }}>
            {error || 'Unknown contract loading error'}
          </div>
        </div>
      </div>
    );
  }

  // Pass contract addresses to the guard
  return (
    <ContractAddressGuard
      mawAddress={contracts.MawSacrifice}
      relicsAddress={contracts.Relics}
      chainId={chainId}
    >
      {children}
    </ContractAddressGuard>
  );
}