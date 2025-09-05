// Import ABIs from the centralized @rot-ritual/abi package
// This ensures we're always using the latest compiled ABIs
import { maw as mawAbi, relics as relicsAbi, cosmetics as cosmeticsAbi } from "@rot-ritual/abi";

// Re-export with standardized names
export { mawAbi, relicsAbi, cosmeticsAbi };

// Legacy compatibility export (to be phased out)
export const canonicalAbis = {
  MawSacrifice: mawAbi,
  Relics: relicsAbi,
  Cosmetics: cosmeticsAbi,
  // These will need to be added to the ABI package when needed:
  Raccoons: [],
  Demons: [], 
  Cultists: [],
  KeyShop: [],
  RaccoonRenderer: []
};

// V4-specific function selectors for validation
export const REQUIRED_MAW_SELECTORS = {
  sacrificeForCosmetic: "0xd1a5b36f",
  sacrificeKeys: "0x4e71d92d",
  convertShardsToRustedCaps: "0x12345678", // Update with actual selector
  sacrificesPaused: "0x3456789a" // Update with actual selector
};