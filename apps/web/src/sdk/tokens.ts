/**
 * Unified Token ID Constants
 * Single source of truth for all Relics token IDs
 * Matches MawSacrificeV4NoTimelock contract definitions
 */
export const TOKENS = {
  RUSTED_CAP:        0n, // What you sacrifice via sacrificeKeys()
  // Token ID 1 is NOT USED by contract (was RUSTED_KEY, removed to avoid confusion)
  LANTERN_FRAGMENT:  2n, // For cosmetic crafting
  WORM_EATEN_MASK:   3n, // Rarity booster for cosmetics
  BONE_DAGGER:       4n, // For demon summoning (not implemented)
  ASH_VIAL:          5n, // Rare drop
  GLASS_SHARD:       6n, // Convert 5 shards -> 1 cap
  // Token IDs 7-9 not defined in contract but exist in inventory
  BINDING_CONTRACT:  8n,
  DEMON_DEED:        9n,
} as const;

export type TokenId = typeof TOKENS[keyof typeof TOKENS];

// Human-readable names for UI (using bigint keys for direct lookup)
export const TOKEN_LABELS: Record<bigint, string> = {
  0n: "Rusted Caps",      // What you sacrifice
  // ID 1 OMITTED - Not used by contract to avoid confusion
  2n: "Lantern Fragments", 
  3n: "Worm-Eaten Masks",
  4n: "Bone Daggers",
  5n: "Ash Vials",
  6n: "Glass Shards",
  // IDs 7+ may exist in inventory but not in contract
  8n: "Binding Contracts",
  9n: "Demon Deeds",
} as const;

// Legacy string-based lookup (deprecated - use TOKEN_LABELS)
export const TOKEN_NAMES: Record<string, string> = {
  [TOKENS.RUSTED_CAP.toString()]: "Rusted Caps",
  [TOKENS.LANTERN_FRAGMENT.toString()]: "Lantern Fragments", 
  [TOKENS.WORM_EATEN_MASK.toString()]: "Worm-Eaten Masks",
  [TOKENS.BONE_DAGGER.toString()]: "Bone Daggers",
  [TOKENS.ASH_VIAL.toString()]: "Ash Vials",
  [TOKENS.GLASS_SHARD.toString()]: "Glass Shards",
  [TOKENS.BINDING_CONTRACT.toString()]: "Binding Contracts",
  [TOKENS.DEMON_DEED.toString()]: "Demon Deeds",
} as const;