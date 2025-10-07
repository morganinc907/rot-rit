// Unified useContracts hook - supports both shapes for backward compatibility
import { useMemo } from "react";
import { useChainId } from "wagmi";
import useContractsMap from "./useContracts.map";
import { useContracts as useContractsNamed } from "./useContracts.named";

type MapShape = ReturnType<typeof useContractsMap>;
type NamedShape = ReturnType<typeof useContractsNamed>;

export function useContracts() {
  const chainId = useChainId();

  // Prefer the "map" source of truth (addresses live in one object)
  const map: MapShape = useContractsMap();
  const named: NamedShape = useContractsNamed();

  // Normalize: expose BOTH shapes so legacy code keeps working
  const unified = useMemo(() => {
    const contracts = map?.contracts ?? {};
    return {
      // Always return the map + supported flag
      contracts,
      isSupported: map?.isSupported ?? named?.isSupported ?? true,
      loading: map?.loading ?? named?.isLoading ?? false,
      error: map?.error ?? named?.error,

      // Convenience named fields (fall back to what exists)
      maw: named?.maw ?? contracts?.MawSacrifice,
      relics: named?.relics ?? contracts?.Relics,
      raccoons: named?.raccoons ?? contracts?.Raccoons,
      cosmetics: named?.cosmetics ?? contracts?.Cosmetics,
      keyShop: named?.keyShop ?? contracts?.KeyShop,
      cultists: named?.cultists ?? contracts?.Cultists,
      demons: named?.demons ?? contracts?.Demons,
      chainId: named?.chainId ?? contracts?.chainId ?? chainId,
      allowedChains: named?.allowedChains ?? [],
      currentChainName: named?.currentChainName ?? "",
      onChainMaw: named?.onChainMaw ?? contracts?.MawSacrifice,
    };
  }, [map, named, chainId]);

  // Debug logging to catch mismatches
  if (!unified.maw && !unified.contracts?.MawSacrifice) {
    console.warn("[useContracts] Missing MAW address for chain", chainId);
  }

  return unified;
}

export type UseContractsReturn = ReturnType<typeof useContracts>;