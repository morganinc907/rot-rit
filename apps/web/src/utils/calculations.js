// Success odds calculation matching your Rituals.sol logic
export function calculateAscensionOdds(raccoon, selectedRelics = []) {
  if (!raccoon) return null;

  // Base success rates by tier (matches your contract)
  const BASE_SUCCESS_BPS = [0, 1000, 1500, 2000, 2500, 3000]; // 10%, 15%, 20%, 25%, 30%
  const MAX_SUCCESS_BPS = 8000; // 80% cap

  // Relic boost values (matches your contract) 
  const RELIC_BOOSTS = {
    1: 500,   // Ember +5%
    2: 1000,  // Bone Charm +10%
    3: 2000,  // Lantern Shard +20%
    4: 0,     // Blood Vial (no success boost)
    5: 0,     // Cursed Coin (special double-roll)
    8: 1000,  // Maw's Tooth +10% (passive)
    12: 0,    // Web of Filth (amplifier)
    // Others are cosmetic/off-chain only
  };

  // Demon tier weights (matches your contract)
  let weights = {
    common: 8000,  // 80%
    rare: 1800,    // 18% 
    mythic: 200    // 2%
  };

  // Calculate success rate
  const raccoonTier = raccoon.tier || 1;
  let successBps = BASE_SUCCESS_BPS[raccoonTier] || BASE_SUCCESS_BPS[1];

  // Add relic bonuses
  const relicMap = new Map();
  selectedRelics.forEach(relic => {
    const id = Number(relic.id);
    const quantity = Number(relic.quantity || 1);
    relicMap.set(id, (relicMap.get(id) || 0) + quantity);
  });

  for (const [relicId, quantity] of relicMap) {
    const boost = RELIC_BOOSTS[relicId] || 0;
    if (boost > 0) {
      successBps += boost * quantity;
    }
  }

  // Handle special relics
  const hasWebOfFilth = relicMap.has(12);
  if (hasWebOfFilth) {
    // Web of Filth amplifies other boosts by 2x
    let otherBoosts = 0;
    for (const [relicId, quantity] of relicMap) {
      if (relicId !== 12) {
        const boost = RELIC_BOOSTS[relicId] || 0;
        otherBoosts += boost * quantity;
      }
    }
    successBps += otherBoosts; // Double the non-Web boosts
  }

  // Cap at max
  successBps = Math.min(successBps, MAX_SUCCESS_BPS);

  // Handle Lantern Shard tier bias
  const lanternShards = relicMap.get(3) || 0;
  if (lanternShards > 0) {
    const maxLanternEffect = 5;
    const effectiveShards = Math.min(lanternShards, maxLanternEffect);
    const rareBonusPerShard = 100;   // +1% per shard
    const mythicBonusPerShard = 50;  // +0.5% per shard
    
    const rareBonus = effectiveShards * rareBonusPerShard;
    const mythicBonus = effectiveShards * mythicBonusPerShard;
    const totalBonus = rareBonus + mythicBonus;
    
    if (weights.common > totalBonus) {
      weights.common -= totalBonus;
      weights.rare += rareBonus;
      weights.mythic += mythicBonus;
    } else {
      weights.common = 0;
      weights.rare += rareBonus;
      weights.mythic += mythicBonus;
    }
    
    // Normalize to 10000
    const sum = weights.common + weights.rare + weights.mythic;
    if (sum !== 10000) {
      if (sum > 10000) {
        weights.common -= (sum - 10000);
      } else {
        weights.common += (10000 - sum);
      }
    }
  }

  // Handle Lantern of Glimmer (ID 10) - guarantees Mythic
  const hasLanternOfGlimmer = relicMap.has(10);
  if (hasLanternOfGlimmer) {
    weights = { common: 0, rare: 0, mythic: 10000 };
  }

  // Handle Cursed Coin (ID 5) - double roll (just show base odds for UI)
  const hasCursedCoin = relicMap.has(5);
  
  return {
    successRate: successBps / 100, // Convert to percentage
    successBps,
    weights,
    commonChance: weights.common / 100,
    rareChance: weights.rare / 100, 
    mythicChance: weights.mythic / 100,
    specialEffects: {
      webOfFilth: hasWebOfFilth,
      cursedCoin: hasCursedCoin,
      lanternOfGlimmer: hasLanternOfGlimmer,
      lanternShards: lanternShards
    }
  };
}

// Moon phase calculation (matches your metadata server)
export function getCurrentMoonPhase() {
  const date = new Date();
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  let r = year % 100;
  r %= 19;
  if (r > 9) r -= 19;
  r = ((r * 11) % 30) + month + day;
  if (month < 3) r += 2;
  const phase = r < 0 ? r + 30 : r;
  const phaseDay = phase % 30;
  
  if (phaseDay <= 1 || phaseDay >= 29) return "New";
  if (phaseDay >= 14 && phaseDay <= 16) return "Full";
  if (phaseDay < 14) return "Waxing";
  return "Waning";
}

// Estimate sacrifice values for items
export function estimateSacrificeValue(item) {
  if (!item) return 0;

  switch (item.type) {
    case 'raccoon':
      return (item.tier || 1) * 0.005; // 0.005-0.025 ETH based on tier
    
    case 'demon':
      if (item.tier === 3) return 0.1;   // Mythic
      if (item.tier === 2) return 0.05;  // Rare  
      return 0.02;                       // Common
    
    case 'relic':
      const values = { 
        common: 0.001, 
        uncommon: 0.005, 
        rare: 0.01, 
        legendary: 0.05,
        cosmetic: 0.002,
        special: 0.008
      };
      return values[item.rarity] || 0.001;
    
    default:
      return 0;
  }
}

// Wheel probability calculation
export function calculateWheelOutcome(spinResult) {
  const WHEEL_SEGMENTS = [
    { id: 1, name: 'Ember', weight: 40, rarity: 'common' },
    { id: 2, name: 'Bone Charm', weight: 25, rarity: 'uncommon' },
    { id: 3, name: 'Lantern Shard', weight: 15, rarity: 'rare' },
    { id: 4, name: 'Blood Vial', weight: 10, rarity: 'rare' },
    { id: 5, name: 'Cursed Coin', weight: 7, rarity: 'rare' },
    { id: 12, name: 'Web of Filth', weight: 2, rarity: 'legendary' },
    { id: 14, name: 'Tongue of Ash', weight: 1, rarity: 'legendary' }
  ];

  const totalWeight = WHEEL_SEGMENTS.reduce((sum, seg) => sum + seg.weight, 0);
  
  // Normalize spin result (0-1) to weight range
  const target = spinResult * totalWeight;
  let cumulative = 0;
  
  for (const segment of WHEEL_SEGMENTS) {
    cumulative += segment.weight;
    if (target <= cumulative) {
      return segment;
    }
  }
  
  return WHEEL_SEGMENTS[0]; // Fallback
}