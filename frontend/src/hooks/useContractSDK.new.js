// useContractSDK.js
// A thin SDK that *consumes* chain-first addresses from useContracts()
// and returns viem read/write clients gated on readiness.

import { useEffect, useState } from 'react';
import { useChainId, usePublicClient, useWalletClient } from 'wagmi';
import { getContract } from 'viem';

// ⬇️ import your chain-first resolver (the one you just fixed)
import useContracts from './useContracts';
import canonicalAbis from '../abis/canonical-abis.json';

export function useContractSDK() {
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { contracts, configLoaded } = useContracts();

  const [sdk, setSdk] = useState(null);

  useEffect(() => {
    // ⛔ Gate: Wait until config is fully loaded
    if (!configLoaded || !contracts || !publicClient) {
      setSdk(null);
      return;
    }

    const built = {
      relics: getContract({
        address: contracts.Relics,
        abi: canonicalAbis.Relics,
        client: { public: publicClient, wallet: walletClient }
      }),
      maw: getContract({
        address: contracts.MawSacrifice,
        abi: canonicalAbis.MawSacrifice,
        client: { public: publicClient, wallet: walletClient }
      }),
      cosmetics: getContract({
        address: contracts.Cosmetics,
        abi: canonicalAbis.Cosmetics,
        client: { public: publicClient, wallet: walletClient }
      }),
      raccoons: contracts.Raccoons
        ? getContract({
            address: contracts.Raccoons,
            abi: canonicalAbis.Raccoons,
            client: { public: publicClient, wallet: walletClient }
          })
        : null,
      keyShop: contracts.KeyShop
        ? getContract({
            address: contracts.KeyShop,
            abi: canonicalAbis.KeyShop,
            client: { public: publicClient, wallet: walletClient }
          })
        : null,
    };

    setSdk(built);
  }, [configLoaded, contracts, publicClient, walletClient]);

  return {
    sdk,
    loading: !configLoaded || !sdk,
    chainId,
    configLoaded,
  };
}
