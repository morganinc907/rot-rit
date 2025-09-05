export const CHAIN = {
  BASE_MAINNET: 8453,
  BASE_SEPOLIA: 84532,
} as const;

type Address = `0x${string}`;
type PerChain<T> = Partial<Record<number, T>>;

export const ADDRS: PerChain<{
  MawSacrifice: Address;
  Relics: Address;
  Cosmetics?: Address;
  Cultists?: Address;
  Demons?: Address;
  KeyShop?: Address;
  Raccoons?: Address;
  RaccoonRenderer?: Address;
  RitualReadAggregator?: Address;
}> = Object.freeze({
  [CHAIN.BASE_SEPOLIA]: {
    MawSacrifice: "0xB2e77ce03BC688C993Ee31F03000c56c211AD7db",
    Relics:       "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b",
    Cosmetics:    "0x32640D260CeCD52581280e23B9DCc6F49D04Bdcb",
    Cultists:     "0x2D7cD25A014429282062298d2F712FA7983154B9",
    Demons:       "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF",
    KeyShop:      "0xF2851E53bD86dff9fb7b9d67c19AF1CCe2Ce7076",
    Raccoons:     "0x6DB1C2d60579679A82C3Ac39cf7097B442E1Aa9f",
    RaccoonRenderer: "0x3eE467d8Dc8Fdf26dFC17dA8630EE1078aEd3A85",
    RitualReadAggregator: "0xe14830B91Bf666E51305a89C1196d0e88bad98a2",
  },
  // [CHAIN.BASE_MAINNET]: { MawSacrifice: "0x...", Relics: "0x..." },
});