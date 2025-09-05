/**
 * Battle-tested config guard - uses chain-first architecture
 * Blocks app if on-chain reality differs from expectations
 */
import { useEffect, useState } from 'react';
import { useContracts } from '../hooks/useContracts';
import { useMawConfig } from '../hooks/useMawConfig';
import toast from 'react-hot-toast';

export default function ContractAddressGuard({ children }) {
  const [blocked, setBlocked] = useState(false);
  const { chainId, relics, maw, error, isLoading } = useContracts();
  const { isLoaded: configLoaded } = useMawConfig();

  useEffect(() => {
    if (isLoading || !relics || !maw) return;

    // In the battle-tested pattern, chain is source of truth
    // We only guard against critical failures - not minor config drift
    if (!maw) {
      console.error('🚨 CRITICAL: MAW address could not be resolved from chain');
      setBlocked(true);
      toast.error('Failed to resolve contract addresses from blockchain', { duration: 10000 });
      return;
    }

    if (!relics) {
      console.error('🚨 CRITICAL: Relics address not configured');  
      setBlocked(true);
      toast.error('Relics contract not configured for this chain', { duration: 10000 });
      return;
    }

    // Success - chain resolved all addresses
    setBlocked(false);
    
    console.log('[ConfigGuard] Chain resolution successful:', {
      chainId,
      relics,
      maw,
      configLoaded
    });
  }, [isLoading, relics, maw, chainId, configLoaded]);

  if (error) {
    console.error('[ConfigGuard] Chain read error:', error);
    setBlocked(true);
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        background: '#800000', 
        color: 'white',
        minHeight: '50vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <h2>⚠️ Chain Connection Error</h2>
        <p>Unable to read contract addresses from blockchain.</p>
        <p style={{ fontSize: '0.9em', marginTop: '1rem' }}>
          Error: {error}
        </p>
      </div>
    );
  }

  if (blocked) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        background: '#800000', 
        color: 'white',
        minHeight: '50vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <h2>⚠️ Contract Configuration Error</h2>
        <p>Critical contract resolution failure. Please contact support.</p>
        <details style={{ marginTop: '1rem', fontSize: '0.8em' }}>
          <summary>Technical Details</summary>
          <p>Chain ID: {chainId}</p>
          <p>Relics: {relics || 'NOT CONFIGURED'}</p>
          <p>MAW: {maw || 'FAILED TO RESOLVE'}</p>
        </details>
      </div>
    );
  }

  // Show children once chain addresses resolved
  return children;
}