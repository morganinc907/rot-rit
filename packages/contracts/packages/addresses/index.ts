/* auto-generated */ 
export const addresses = {
  "baseSepolia": {
    "Cosmetics": "0xB0E32D26f6b61cB71115576e6a8d7De072e6310A",
    "Cultists": "0x2D7cD25A014429282062298d2F712FA7983154B9",
    "Demons": "0xf830dcC09ba6BB0Eb575aD06E369f3483A65c5bF",
    "KeyShop": "0xF2851E53bD86dff9fb7b9d67c19AF1CCe2Ce7076",
    "MawSacrificeV3Upgradeable": "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456",
    "RaccoonRenderer": "0x3eE467d8Dc8Fdf26dFC17dA8630EE1078aEd3A85",
    "Raccoons": "0x6DB1C2d60579679A82C3Ac39cf7097B442E1Aa9f",
    "Relics": "0x1933D91B6bf8D6bc4Eac03486DAcF4fFf1313f0b",
    "RitualReadAggregator": "0xe14830B91Bf666E51305a89C1196d0e88bad98a2"
  }
} as const;

export type Networks = keyof typeof addresses;
export type ContractsOf<N extends Networks> = keyof typeof addresses[N];

export function getAddress<N extends Networks>(network: N, name: ContractsOf<N>) {
  return addresses[network][name] as `0x${string}`;
}
