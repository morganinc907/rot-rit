import { useState } from 'react';
import { useWriteContract, useChainId } from 'wagmi';
import { getMawAddress } from '../sdk/addresses';

const RITUALS_ABI = [
  {
    name: 'joinCult',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'raccoonId', type: 'uint256' }],
    outputs: []
  },
  {
    name: 'attemptAscension',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'raccoonId', type: 'uint256' },
      { name: 'relicIds', type: 'uint256[]' },
      { name: 'relicAmts', type: 'uint256[]' },
      { name: 'salt', type: 'uint256' }
    ],
    outputs: []
  }
];

export default function useRitualsContract() {
  const { writeContract } = useWriteContract();
  const chainId = useChainId();
  const RITUALS_ADDRESS = getMawAddress(chainId); // Note: Rituals and Maw are the same contract
  const [isLoading, setIsLoading] = useState(false);

  const joinCult = async (raccoonId) => {
    try {
      setIsLoading(true);
      const tx = await writeContract({
        address: RITUALS_ADDRESS,
        abi: RITUALS_ABI,
        functionName: 'joinCult',
        args: [raccoonId]
      });
      return { success: true, txHash: tx.hash };
    } catch (err) {
      console.error("Join cult failed:", err);
      return { success: false, error: err?.shortMessage || err?.message };
    } finally {
      setIsLoading(false);
    }
  };

  const attemptAscension = async (raccoonId, relics = []) => {
    try {
      setIsLoading(true);
      const relicIds = relics.map(r => r.id);
      const relicAmts = relics.map(r => r.amount || 1);
      const salt = Date.now();

      const tx = await writeContract({
        address: RITUALS_ADDRESS,
        abi: RITUALS_ABI,
        functionName: 'attemptAscension',
        args: [raccoonId, relicIds, relicAmts, salt]
      });
      return { success: true, txHash: tx.hash };
    } catch (err) {
      console.error("Ascension failed:", err);
      return { success: false, error: err?.shortMessage || err?.message };
    } finally {
      setIsLoading(false);
    }
  };

  return { joinCult, attemptAscension, isLoading };
}
