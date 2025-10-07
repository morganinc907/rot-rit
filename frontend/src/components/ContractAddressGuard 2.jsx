/**
 * Battle-tested config guard - uses chain-first architecture
 * Blocks app if on-chain reality differs from expectations
 * Shows exact fix command when MAW address mismatch detected
 */
import { useEffect, useState } from 'react';
import { useContracts } from '../hooks/useContracts';
import { useMawConfig } from '../hooks/useMawConfig';
import { usePauseStatus } from '../hooks/usePauseStatus';
import { usePublicClient, useChainId } from 'wagmi';
import { ADDRS } from '@rot-ritual/addresses';
import canonicalAbis from '../abis/canonical-abis.json';
import PauseStatusBanner from './PauseStatusBanner';
import toast from 'react-hot-toast';

export default function ContractAddressGuard({ children }) {
  const [blocked, setBlocked] = useState(false);
  const [mawMismatch, setMawMismatch] = useState(null);
  const { chainId: currentChainId, relics, maw, error, isLoading } = useContracts();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { isLoaded: configLoaded } = useMawConfig();
  const { pauseStatus, isCriticallyPaused } = usePauseStatus();

  useEffect(() => {
    if (isLoading || !relics || !maw) return;

    // Check for MAW address mismatch
    const checkMawAddress = async () => {
      try {
        if (!publicClient || !relics) return;
        
        // Get the actual MAW address from chain
        const actualMaw = await publicClient.readContract({
          address: relics,
          abi: canonicalAbis.Relics,
          functionName: 'mawSacrifice'
        });
        
        // Get expected MAW from static config
        const expectedMaw = ADDRS[chainId]?.MawSacrifice;
        
        if (expectedMaw && actualMaw && 
            actualMaw.toLowerCase() !== expectedMaw.toLowerCase()) {
          console.error('🚨 MAW ADDRESS MISMATCH DETECTED', {
            actual: actualMaw,
            expected: expectedMaw,
            relics
          });
          
          setMawMismatch({
            actual: actualMaw,
            expected: expectedMaw,
            relics
          });
          setBlocked(true);
          return;
        }
      } catch (err) {
        console.error('Error checking MAW address:', err);
      }
    };

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

    // Check for address mismatch
    checkMawAddress();

    // Success - chain resolved all addresses
    setBlocked(false);
    
    console.log('[ConfigGuard] Chain resolution successful:', {
      chainId,
      relics,
      maw,
      configLoaded
    });
  }, [isLoading, relics, maw, chainId, currentChainId, configLoaded, publicClient]);

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

  if (mawMismatch) {
    const network = chainId === 84532 ? 'baseSepolia' : 'base';
    const fixCommand = `cast send ${mawMismatch.relics} "setMawSacrifice(address)" ${mawMismatch.expected} --rpc-url https://sepolia.base.org --private-key YOUR_PRIVATE_KEY`;
    
    return (
      <div style={{ 
        padding: '2rem', 
        background: '#800000', 
        color: 'white',
        minHeight: '50vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <h2>⚠️ MAW Address Mismatch Detected</h2>
        <div style={{ 
          background: 'rgba(0,0,0,0.3)', 
          padding: '1.5rem', 
          borderRadius: '8px',
          margin: '1rem auto',
          maxWidth: '800px',
          textAlign: 'left'
        }}>
          <p><strong>Relics.mawSacrifice():</strong></p>
          <code style={{ 
            background: '#000', 
            padding: '0.5rem', 
            display: 'block',
            marginBottom: '1rem',
            wordBreak: 'break-all'
          }}>
            {mawMismatch.actual}
          </code>
          
          <p><strong>Expected MAW Address:</strong></p>
          <code style={{ 
            background: '#000', 
            padding: '0.5rem', 
            display: 'block',
            marginBottom: '1.5rem',
            wordBreak: 'break-all'
          }}>
            {mawMismatch.expected}
          </code>
          
          <p style={{ marginBottom: '0.5rem' }}><strong>🔧 Fix Command (requires admin):</strong></p>
          <div style={{ 
            background: '#000', 
            padding: '1rem', 
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.85em',
            overflowX: 'auto'
          }}>
            <code style={{ whiteSpace: 'pre', display: 'block' }}>
              {fixCommand}
            </code>
          </div>
          
          <p style={{ 
            marginTop: '1rem', 
            fontSize: '0.9em',
            opacity: 0.8
          }}>
            This command will update the Relics contract to point to the correct MAW address.
            Only the contract admin can execute this command.
          </p>
        </div>
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

  // Show children once chain addresses resolved, with pause status banner
  return (
    <>
      <PauseStatusBanner />
      {children}
    </>
  );
}