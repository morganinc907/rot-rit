/**
 * ContractAddressGuard - Runtime validation that blocks the app if critical contract relationships are broken
 * 
 * Validates:
 * 1. Relics.mawSacrifice() matches our resolved MAW address
 * 2. capId/keyId are readable from MAW contract
 * 3. Basic contract health checks
 * 
 * This prevents the app from running with broken contract configurations.
 */

import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { CHAIN } from '@rot-ritual/addresses';
import { getRelicsAddress } from '../sdk/contracts';
import { useMawConfig } from '../hooks/useMawConfig';
import canonicalAbis from '../abis/canonical-abis.json';

interface GuardState {
  isValidating: boolean;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ContractAddressGuardProps {
  children: React.ReactNode;
  mawAddress?: string;
  relicsAddress?: string;
  chainId?: number;
}

export default function ContractAddressGuard({ 
  children, 
  mawAddress, 
  relicsAddress, 
  chainId = CHAIN.BASE_SEPOLIA 
}: ContractAddressGuardProps) {
  const publicClient = usePublicClient();
  const { capId, keyId, isLoaded: mawConfigLoaded } = useMawConfig();
  const [guardState, setGuardState] = useState<GuardState>({
    isValidating: true,
    isValid: false,
    errors: [],
    warnings: []
  });

  useEffect(() => {
    async function validateContracts() {
      if (!publicClient || !mawAddress || !relicsAddress) {
        setGuardState({
          isValidating: true,
          isValid: false,
          errors: ['Missing required contract addresses or public client'],
          warnings: []
        });
        return;
      }

      console.log('🛡️ [ContractAddressGuard] Starting validation...');
      
      const errors: string[] = [];
      const warnings: string[] = [];

      try {
        // 1. Validate Relics.mawSacrifice() matches our resolved MAW
        console.log('🔍 Validating Relics.mawSacrifice() relationship...');
        const chainMawAddress = await publicClient.readContract({
          address: relicsAddress as `0x${string}`,
          abi: canonicalAbis.Relics,
          functionName: 'mawSacrifice',
        }) as string;

        if (chainMawAddress.toLowerCase() !== mawAddress.toLowerCase()) {
          errors.push(`Critical: Relics.mawSacrifice() returns ${chainMawAddress} but we resolved ${mawAddress}`);
        } else {
          console.log('✅ Relics.mawSacrifice() relationship validated');
        }

        // 2. Validate capId/keyId are readable from MAW
        console.log('🔍 Validating MAW ID functions...');
        if (!mawConfigLoaded || !capId || !keyId) {
          errors.push('Critical: Cannot read capId/keyId from MAW contract');
        } else {
          console.log('✅ MAW ID functions validated', { capId: capId.toString(), keyId: keyId.toString() });
        }

        // 3. Additional health checks
        try {
          // Check if Relics contract is accessible
          const relicsCode = await publicClient.getCode({ address: relicsAddress as `0x${string}` });
          if (!relicsCode || relicsCode === '0x') {
            errors.push('Critical: Relics contract has no code at specified address');
          }

          // Check if MAW contract is accessible  
          const mawCode = await publicClient.getCode({ address: mawAddress as `0x${string}` });
          if (!mawCode || mawCode === '0x') {
            errors.push('Critical: MAW contract has no code at specified address');
          }

        } catch (codeError) {
          warnings.push(`Contract code validation failed: ${codeError}`);
        }

        // 4. Validate chain ID
        if (chainId !== CHAIN.BASE_SEPOLIA) {
          warnings.push(`Unsupported chain ID: ${chainId}. Expected ${CHAIN.BASE_SEPOLIA} (Base Sepolia)`);
        }

        setGuardState({
          isValidating: false,
          isValid: errors.length === 0,
          errors,
          warnings
        });

        if (errors.length === 0) {
          console.log('✅ [ContractAddressGuard] All validations passed');
        } else {
          console.error('❌ [ContractAddressGuard] Validation failed:', errors);
        }

      } catch (error) {
        console.error('❌ [ContractAddressGuard] Validation error:', error);
        setGuardState({
          isValidating: false,
          isValid: false,
          errors: [`Validation error: ${error}`],
          warnings
        });
      }
    }

    validateContracts();
  }, [publicClient, mawAddress, relicsAddress, chainId, mawConfigLoaded, capId, keyId]);

  // Show loading state
  if (guardState.isValidating) {
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
        <div style={{ fontSize: '24px', marginBottom: '20px' }}>🛡️</div>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>Contract Address Guard</div>
        <div style={{ color: '#666' }}>Validating contract relationships...</div>
        <div style={{ 
          width: '200px', 
          height: '4px', 
          backgroundColor: '#eee', 
          marginTop: '20px',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: '100%', 
            height: '100%', 
            backgroundColor: '#007bff',
            animation: 'loading 2s infinite ease-in-out'
          }} />
        </div>
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(0%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    );
  }

  // Show errors if validation failed
  if (!guardState.isValid) {
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
          Contract Validation Failed
        </div>
        <div style={{ fontSize: '16px', marginBottom: '30px', color: '#666', maxWidth: '600px', textAlign: 'center' }}>
          The application cannot start because critical contract relationships are broken.
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
            Critical Errors:
          </div>
          {guardState.errors.map((error, index) => (
            <div key={index} style={{ marginBottom: '5px', color: '#c53030' }}>
              • {error}
            </div>
          ))}
        </div>

        {guardState.warnings.length > 0 && (
          <div style={{ 
            background: '#fefcbf', 
            border: '1px solid #f6e05e',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            maxWidth: '700px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#975a16' }}>
              Warnings:
            </div>
            {guardState.warnings.map((warning, index) => (
              <div key={index} style={{ marginBottom: '5px', color: '#975a16' }}>
                • {warning}
              </div>
            ))}
          </div>
        )}

        <div style={{ 
          background: '#e6fffa', 
          border: '1px solid #81e6d9',
          borderRadius: '8px',
          padding: '20px',
          maxWidth: '700px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#234e52' }}>
            Possible Solutions:
          </div>
          <div style={{ color: '#234e52', lineHeight: '1.5' }}>
            • Check if you're connected to the correct network (Base Sepolia)<br/>
            • Verify contract addresses in packages/addresses/src/index.ts<br/>
            • Run npm run check:contract-health to diagnose issues<br/>
            • Check if contracts have been upgraded on-chain<br/>
            • Clear browser cache and reload the page
          </div>
        </div>
      </div>
    );
  }

  // Show warnings but allow app to continue
  if (guardState.warnings.length > 0) {
    console.warn('⚠️ [ContractAddressGuard] App starting with warnings:', guardState.warnings);
  }

  // All validations passed - render the app
  return <>{children}</>;
}