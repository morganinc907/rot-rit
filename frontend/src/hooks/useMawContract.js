import { useState } from 'react';
import { useWriteContract, useChainId } from 'wagmi';
import { parseEther } from 'viem';
import { getMawAddress } from '../sdk/addresses';

const MAW_ABI = [
  {
    name: 'sacrifice',
    type: 'function',
    inputs: [
      { name: 'tokenTypes', type: 'uint8[]' },
      { name: 'tokenIds', type: 'uint256[]' },
      { name: 'amounts', type: 'uint256[]' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    name: 'spinWheel',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'rewardId', type: 'uint256' }],
    stateMutability: 'payable'
  }
];

export default function useMawContract() {
  const [isLoading, setIsLoading] = useState(false);
  const { writeContract } = useWriteContract();
  const chainId = useChainId();
  const MAW_ADDRESS = getMawAddress(chainId);

  const sacrifice = async (items) => {
    try {
      setIsLoading(true);
      // Expect items in form { typeCode: 0|1|2, id: number, amount?: number }
      const tokenTypes = items.map(i => i.typeCode);
      const tokenIds   = items.map(i => i.id);
      const amounts    = items.map(i => i.amount || 1);

      const tx = await writeContract({
        address: MAW_ADDRESS,
        abi: MAW_ABI,
        functionName: 'sacrifice',
        args: [tokenTypes, tokenIds, amounts],
      });

      return { success: true, txHash: tx.hash };
    } catch (err) {
      console.error('Sacrifice failed:', err);
      return { success: false, error: err?.shortMessage || err?.message };
    } finally {
      setIsLoading(false);
    }
  };

  const spin = async (costEth = "0.01") => {
    try {
      setIsLoading(true);
      const tx = await writeContract({
        address: MAW_ADDRESS,
        abi: MAW_ABI,
        functionName: 'spinWheel',
        args: [],
        value: parseEther(costEth), // ETH to send with spin
      });

      return { success: true, txHash: tx.hash };
    } catch (err) {
      console.error('Wheel spin failed:', err);
      return { success: false, error: err?.shortMessage || err?.message };
    } finally {
      setIsLoading(false);
    }
  };

  return { sacrifice, spin, isLoading };
}
