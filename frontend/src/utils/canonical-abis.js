// Canonical ABIs from contracts package
import canonicalAbis from '../abis/canonical-abis.json';

export const getABI = (contractName) => {
  return canonicalAbis[contractName] || [];
};

export const CONTRACT_NAMES = {
  MAW_SACRIFICE: 'MawSacrificeV3Upgradeable', // Will update to V4 when deployed
  RELICS: 'Relics',
  DEMONS: 'Demons', 
  COSMETICS: 'Cosmetics',
  RACCOONS: 'Raccoons',
  CULTISTS: 'Cultists',
  KEY_SHOP: 'KeyShop'
};

// V4-specific function selectors for future upgrade detection
export const V4_SELECTORS = {
  announceUpgrade: '0x123abc45', // Will update with real selectors
  executeUpgrade: '0x456def78',
  pauseSacrifices: '0x789ghi90', 
  pauseConversions: '0xabcjkl12',
  getPauseStatus: '0xdefmno34',
  roles: '0x567pqr78'
};

export { canonicalAbis };