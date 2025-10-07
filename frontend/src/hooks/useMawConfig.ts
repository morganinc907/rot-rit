/**
 * Load IDs from MAW (source of truth) - Battle-tested pattern
 */
import { useReadContract } from "wagmi";
import { useContracts } from "./useContracts";

const mawAbi = [
  { name: "capId", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "keyId", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "fragId", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "shardId", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
] as const;

export function useMawConfig() {
  const { maw } = useContracts();
  
  const q = (fn: string) =>
    useReadContract({ 
      address: maw, 
      abi: mawAbi, 
      functionName: fn as any, 
      query: { enabled: !!maw } 
    });
  
  const { data: capId } = q("capId");
  const { data: keyId } = q("keyId");
  const { data: fragId } = q("fragId");
  const { data: shardId } = q("shardId");

  return { 
    capId: capId ?? 0n, 
    keyId: keyId ?? 0n, 
    fragId: fragId ?? 0n, 
    shardId: shardId ?? 0n,
    isLoaded: !!(capId && keyId && fragId && shardId)
  };
}