/* auto-generated */
import CosmeticsABI from './Cosmetics.json';
import CultistsABI from './Cultists.json';
import DemonsABI from './Demons.json';
import KeyShopABI from './KeyShop.json';
import MawSacrificeABI from './MawSacrifice.json';
import MawSacrificeV3UpgradeableABI from './MawSacrificeV3Upgradeable.json';
import RaccoonRendererABI from './RaccoonRenderer.json';
import RaccoonsABI from './Raccoons.json';
import RelicsABI from './Relics.json';
import RitualReadAggregatorABI from './RitualReadAggregator.json';

export const abis = {
  Cosmetics: CosmeticsABI,
  Cultists: CultistsABI,
  Demons: DemonsABI,
  KeyShop: KeyShopABI,
  MawSacrifice: MawSacrificeABI,
  MawSacrificeV3Upgradeable: MawSacrificeV3UpgradeableABI,
  RaccoonRenderer: RaccoonRendererABI,
  Raccoons: RaccoonsABI,
  Relics: RelicsABI,
  RitualReadAggregator: RitualReadAggregatorABI,
} as const;

export type ContractName = keyof typeof abis;
export type ABI<T extends ContractName> = typeof abis[T];

// Individual exports
export { default as CosmeticsABI } from './Cosmetics.json';
export { default as CultistsABI } from './Cultists.json';
export { default as DemonsABI } from './Demons.json';
export { default as KeyShopABI } from './KeyShop.json';
export { default as MawSacrificeABI } from './MawSacrifice.json';
export { default as MawSacrificeV3UpgradeableABI } from './MawSacrificeV3Upgradeable.json';
export { default as RaccoonRendererABI } from './RaccoonRenderer.json';
export { default as RaccoonsABI } from './Raccoons.json';
export { default as RelicsABI } from './Relics.json';
export { default as RitualReadAggregatorABI } from './RitualReadAggregator.json';
