/**
 * Multicall hook for batching contract reads
 * Reduces RPC roundtrips by combining multiple calls into one
 */
import { useState, useEffect } from 'react';
import { usePublicClient, useAccount } from 'wagmi';
import { useContractSDK } from './useContractSDK';

export function useMulticall() {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { contracts, isSupported } = useContractSDK();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!publicClient || !contracts || !isSupported || !address || !contracts.KeyShop) {
      setLoading(false);
      return;
    }

    const fetchBatchedData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Define all the contract calls we want to batch
        const calls = [
          // MAW configuration calls
          {
            address: contracts.MawSacrifice,
            abi: [{ name: 'capId', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] }],
            functionName: 'capId',
          },
          {
            address: contracts.MawSacrifice,
            abi: [{ name: 'keyId', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] }],
            functionName: 'keyId',
          },
          // KeyShop configuration calls (keyPrice is on KeyShop, not MAW)
          {
            address: contracts.KeyShop,
            abi: [{ name: 'keyPrice', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] }],
            functionName: 'keyPrice',
          },
          // User balance calls
          {
            address: contracts.Relics,
            abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'uint256' }] }],
            functionName: 'balanceOf',
            args: [address, 1], // Rusted Caps - contract expects at ID 1
          },
          {
            address: contracts.Relics,
            abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'uint256' }] }],
            functionName: 'balanceOf',
            args: [address, 3], // Worm-eaten Masks
          },
          {
            address: contracts.Relics,
            abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'uint256' }] }],
            functionName: 'balanceOf',
            args: [address, 2], // Lantern Fragments
          },
          {
            address: contracts.Relics,
            abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'uint256' }] }],
            functionName: 'balanceOf',
            args: [address, 5], // Ash Vials
          },
          {
            address: contracts.Relics,
            abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'uint256' }] }],
            functionName: 'balanceOf',
            args: [address, 8], // Bone Daggers
          },
          {
            address: contracts.Relics,
            abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'uint256' }] }],
            functionName: 'balanceOf',
            args: [address, 7], // Soul Deed - contract expects at ID 7 ✅
          },
          {
            address: contracts.Relics,
            abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }, { type: 'uint256' }], outputs: [{ type: 'uint256' }] }],
            functionName: 'balanceOf',
            args: [address, 9], // Binding Contract - contract expects at ID 9 ✅
          },
        ];

        // Execute multicall
        const results = await publicClient.multicall({
          contracts: calls,
          allowFailure: true,
        });

        console.log('🔍 Multicall results:', results.map((result, i) => ({
          callIndex: i,
          contract: calls[i].address,
          function: calls[i].functionName,
          result: result?.result?.toString(),
          status: result?.status,
          error: result?.error?.message
        })));

        // Parse results
        const parsedData = {
          maw: {
            capId: results[0]?.status === 'success' && results[0]?.result ? Number(results[0].result) : null,
            keyId: results[1]?.status === 'success' && results[1]?.result ? Number(results[1].result) : null,
            keyPrice: results[2]?.status === 'success' && results[2]?.result ? results[2].result.toString() : null,
          },
          balances: {
            rustedCaps: results[3]?.status === 'success' && results[3]?.result ? Number(results[3].result) : 0,
            masks: results[4]?.status === 'success' && results[4]?.result ? Number(results[4].result) : 0,
            fragments: results[5]?.status === 'success' && results[5]?.result ? Number(results[5].result) : 0,
            vials: results[6]?.status === 'success' && results[6]?.result ? Number(results[6].result) : 0,
            daggers: results[7]?.status === 'success' && results[7]?.result ? Number(results[7].result) : 0,
            soulDeed: results[8]?.status === 'success' && results[8]?.result ? Number(results[8].result) : 0,
            bindingContract: results[9]?.status === 'success' && results[9]?.result ? Number(results[9].result) : 0,
          }
        };

        setData(parsedData);
        console.log('📦 Multicall batch loaded:', parsedData);
      } catch (err) {
        console.error('Multicall error:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBatchedData();
  }, [publicClient, contracts, isSupported, address]);

  const refetch = async () => {
    if (!publicClient || !contracts || !isSupported || !address || !contracts.KeyShop) return;
    
    // Re-run the batch fetch
    setLoading(true);
    setError(null);
    // The useEffect will handle the actual fetching
  };

  return {
    data,
    loading,
    error,
    refetch,
  };
}