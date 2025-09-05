// /src/utils/mockAssets.js

// Generate a random rarity for cosmetics
const randomRarity = () => {
  const rarities = ["common", "rare", "epic", "legendary", "mythic"];
  return rarities[Math.floor(Math.random() * rarities.length)];
};

// Generate a random slot
const randomSlot = () => {
  const slots = ["head", "face", "body", "fur", "background"];
  return slots[Math.floor(Math.random() * slots.length)];
};

// Generate mock raccoons with decomposed traits
export const generateMockRaccoons = (count = 50) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Raccoon #${i + 1}`,
    // Individual trait layers instead of single image
    traits: {
      head: `/mock/traits/raccoon_${i + 1}_head_${(i % 3) + 1}.png`,
      face: `/mock/traits/raccoon_${i + 1}_face_${(i % 4) + 1}.png`, 
      body: `/mock/traits/raccoon_${i + 1}_body_${(i % 3) + 1}.png`,
      fur: `/mock/traits/raccoon_${i + 1}_fur_${(i % 5) + 1}.png`,
      background: `/mock/traits/raccoon_${i + 1}_bg_${(i % 4) + 1}.png`
    },
    // Fallback thumbnail for gallery
    thumbnail: `/mock/raccoon_${(i % 5) + 1}.png`
  }));
};

// Generate mock cosmetics
export const generateMockCosmetics = (count = 150) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Cosmetic #${i + 1}`,
    rarity: randomRarity(),
    slot: randomSlot(),
    image: `/mock/cosmetic_${(i % 8) + 1}.png`, // Recycled placeholder images
    description: `A mysterious trinket scavenged from the dumpster depths.`
  }));
};

// Generate mock demons
export const generateMockDemons = (count = 8) => {
  const demonNames = [
    "Malphas the Devourer", "Belphegor the Sloth", "Asmodeus the Wrathful",
    "Mammon the Greedy", "Leviathan the Envious", "Beelzebub the Gluttonous",
    "Lucifer the Prideful", "Lilith the Temptress"
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: demonNames[i] || `Demon #${i + 1}`,
    rarity: i < 3 ? "legendary" : i < 6 ? "epic" : "rare",
    image: `/mock/demon_${(i % 4) + 1}.png`,
    power: Math.floor(Math.random() * 1000) + 500,
    element: ["Fire", "Shadow", "Void", "Blood"][i % 4],
    description: `A powerful demon bound to serve in your rituals.`
  }));
};

// Generate mock cultists
export const generateMockCultists = (count = 12) => {
  const cultistTypes = [
    "High Priest", "Shadow Acolyte", "Blood Ritualist", "Void Walker",
    "Bone Collector", "Soul Tender", "Chaos Monk", "Death Whisperer"
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `${cultistTypes[i % cultistTypes.length]} #${i + 1}`,
    rarity: i < 2 ? "mythic" : i < 5 ? "legendary" : i < 8 ? "epic" : "rare",
    image: `/mock/cultist_${(i % 6) + 1}.png`,
    loyalty: Math.floor(Math.random() * 100) + 1,
    specialty: ["Summoning", "Sacrifice", "Protection", "Enchantment"][i % 4],
    description: `A devoted cultist who aids in your dark rituals.`
  }));
};

// Generate mock dead raccoons
export const generateMockDeadRaccoons = (count = 3) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Fallen Raccoon #${i + 1}`,
    rarity: "legendary", // All dead raccoons are legendary
    image: `/mock/dead_raccoon_${i + 1}.png`,
    deathDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    cause: ["Ritual Sacrifice", "Demonic Possession", "Shadow Curse"][i % 3],
    description: `A raccoon who made the ultimate sacrifice for the cause.`
  }));
};