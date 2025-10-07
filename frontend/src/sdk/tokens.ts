/**
 * Unified Token ID Constants
 * Single source of truth for all Relics token IDs
 * UPDATED TO MATCH CONTRACT CONFIGURATION:
 * - RUSTED_CAP: 1 (contract expects RUSTED_KEY at ID 1)
 * - BINDING_CONTRACT: 9 (contract expects at ID 9)
 * - SOUL_DEED: 7 (contract expects SOUL_DEED at ID 7)
 */
export const TOKENS = {
  RUSTED_CAP:        1n, // Contract expects RUSTED_KEY at ID 1
  LANTERN_FRAGMENT:  2n, // For cosmetic crafting
  WORM_EATEN_MASK:   3n, // Rarity booster for cosmetics
  BONE_DAGGER:       4n, // For demon summoning (not implemented)
  ASH_VIAL:          5n, // Rare drop
  GLASS_SHARD:       6n, // Convert 5 shards -> 1 cap
  SOUL_DEED:         7n, // Contract expects SOUL_DEED at ID 7
  BINDING_CONTRACT:  9n, // Contract expects BINDING_CONTRACT at ID 9
} as const;

export type TokenId = typeof TOKENS[keyof typeof TOKENS];

// Human-readable names for UI (using bigint keys for direct lookup)
export const TOKEN_LABELS: Record<bigint, string> = {
  1n: "Rusted Caps",       // Contract expects at ID 1
  2n: "Lantern Fragments",
  3n: "Worm-Eaten Masks",
  4n: "Bone Daggers",
  5n: "Ash Vials",
  6n: "Glass Shards",
  7n: "Soul Deeds",        // Contract expects at ID 7
  9n: "Binding Contracts", // Contract expects at ID 9
} as const;

// Legacy string-based lookup (deprecated - use TOKEN_LABELS)
export const TOKEN_NAMES: Record<string, string> = {
  [TOKENS.RUSTED_CAP.toString()]: "Rusted Caps",
  [TOKENS.LANTERN_FRAGMENT.toString()]: "Lantern Fragments",
  [TOKENS.WORM_EATEN_MASK.toString()]: "Worm-Eaten Masks",
  [TOKENS.BONE_DAGGER.toString()]: "Bone Daggers",
  [TOKENS.ASH_VIAL.toString()]: "Ash Vials",
  [TOKENS.GLASS_SHARD.toString()]: "Glass Shards",
  [TOKENS.SOUL_DEED.toString()]: "Soul Deeds",
  [TOKENS.BINDING_CONTRACT.toString()]: "Binding Contracts",
} as const;