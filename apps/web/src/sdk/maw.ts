// Wagmi hooks that include the address in the query key
import { useChainId, useReadContract, useWriteContract } from "wagmi";
import { getMawAddress, getRelicsAddress } from "./addresses";
import relicsAbi from "../../public/abis/Relics.abi.json";
import canonicalAbis from "../abis/canonical-abis.json";

// Use the full ABIs from canonical files
const mawAbi = canonicalAbis.MawSacrifice;

export function useMawAddress() {
  const chainId = useChainId();
  const addr = getMawAddress(chainId);
  console.log("[MawSacrifice address]", addr, { chainId });
  return addr;
}

// Block the UI if Relics->mawSacrifice() doesn't match our config.
export function useAddressSanityCheck() {
  const chainId = useChainId();
  const maw = getMawAddress(chainId);
  const relics = getRelicsAddress(chainId);
  const { data: onChainMaw } = useReadContract({
    address: relics,
    abi: relicsAbi,
    functionName: "mawSacrifice",
    query: { refetchOnWindowFocus: false },
  });
  const mismatch =
    typeof onChainMaw === "string" &&
    onChainMaw.toLowerCase() !== maw.toLowerCase();
  return { mismatch, maw, relics, onChainMaw };
}

export function useSacrificeKeys() {
  const address = useMawAddress();
  const { writeContract, isPending, data, error } = useWriteContract();
  return {
    isPending,
    data,
    error,
    mutate: (amount: bigint) =>
      writeContract({
        address,
        abi: mawAbi,
        functionName: "sacrificeKeys",
        args: [amount],
        value: 0n,
      }),
  };
}

export function useSacrificeForCosmetic() {
  const address = useMawAddress();
  const { writeContract, isPending, data, error } = useWriteContract();
  return {
    isPending,
    data,
    error,
    mutate: (fragments: bigint, masks: bigint) =>
      writeContract({
        address,
        abi: mawAbi,
        functionName: "sacrificeForCosmetic",
        args: [fragments, masks],
        value: 0n,
      }),
  };
}