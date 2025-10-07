// Stub file for cosmetics inventory functionality
// This provides the basic exports needed by useCosmeticsV2Wardrobe

export const SLOT_NAMES = ['Hat', 'Eyes', 'Mouth', 'Body', 'Accessory'];

export const SLOT_INDICES = {
  HAT: 0,
  EYES: 1,
  MOUTH: 2,
  BODY: 3,
  ACCESSORY: 4,
};

export const COSMETICS_EVENTS_ABI = [
  {
    type: 'event',
    name: 'CosmeticEquipped',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'slot', type: 'uint8', indexed: false },
      { name: 'cosmeticId', type: 'uint256', indexed: false },
    ],
  },
];

export async function fetchAllWardrobePages({ cosmeticsReader, raccoonId, slotIndex, pageSize = 50 }) {
  // Stub implementation
  console.warn('fetchAllWardrobePages: stub implementation');
  return [];
}

export function getCosmeticsAddress(chainId) {
  // Return cosmetics address from addresses package
  const { ADDRS } = require('@rot-ritual/addresses');
  return ADDRS[chainId]?.Cosmetics;
}

export function getRarityColor(rarity) {
  const rarityColors = {
    common: '#999999',
    uncommon: '#4D9EFF',
    rare: '#BD4BFF',
    epic: '#FFD54F',
    legendary: '#FF8C00',
    mythic: 'linear-gradient(90deg, #FF00FF, #00FFFF, #FFFF00)',
  };
  return rarityColors[rarity?.toLowerCase()] || rarityColors.common;
}

export function getRarityName(rarity) {
  if (!rarity) return 'Common';
  const rarityStr = String(rarity);
  return rarityStr.charAt(0).toUpperCase() + rarityStr.slice(1).toLowerCase();
}
