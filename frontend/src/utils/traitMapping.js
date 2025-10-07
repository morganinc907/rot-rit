/**
 * Trait mapping utility for raccoon trait decomposition and cosmetic layering
 * Maps blockchain metadata traits to local trait image files
 */

// Directory structure mapping
const TRAIT_DIRECTORIES = {
  bg: '5bg',           // Background traits
  fur: '4fur',         // Fur color traits  
  body: '3body',       // Body/clothing traits
  face: '2face',       // Face expression traits
  head: '1head',       // Head accessory traits
};

// Layer order for proper rendering (bottom to top)
const LAYER_ORDER = {
  bg: 1,        // Background - furthest back
  fur: 2,       // Fur color - base layer
  body: 3,      // Body - middle layer
  face: 4,      // Face - front layer
  head: 5,      // Head accessories - topmost
};

// Slot mapping for cosmetic compatibility
const COSMETIC_SLOTS = {
  bg: 'BACKGROUND',
  fur: 'COLOR', 
  body: 'BODY',
  face: 'FACE',
  head: 'HEAD'
};

/**
 * Parse raccoon metadata and extract trait information
 * @param {Object} raccoonData - Raccoon metadata from blockchain
 * @returns {Object} Parsed trait data with file paths
 */
export function parseRaccoonTraits(raccoonData) {
  console.log('🦝 Parsing raccoon traits:', raccoonData);
  
  if (!raccoonData) {
    console.warn('⚠️ No raccoon data provided');
    return {};
  }
  
  let traitArray = [];
  
  // Handle different possible data structures
  if (raccoonData.attributes && Array.isArray(raccoonData.attributes)) {
    traitArray = raccoonData.attributes;
  } else if (raccoonData.traits && Array.isArray(raccoonData.traits)) {
    traitArray = raccoonData.traits;
  } else if (raccoonData.metadata && raccoonData.metadata.attributes && Array.isArray(raccoonData.metadata.attributes)) {
    traitArray = raccoonData.metadata.attributes;
  } else if (typeof raccoonData.traits === 'object' && raccoonData.traits !== null) {
    // Handle object format: { head: 'value', face: 'value', etc }
    console.log('🦝 Converting traits object to array format');
    traitArray = Object.entries(raccoonData.traits).map(([key, value]) => ({
      trait_type: key,
      value: value
    }));
  } else {
    console.warn('⚠️ No valid traits found in raccoon data. Expected attributes array or traits object.');
    console.warn('🦝 Raccoon data structure:', Object.keys(raccoonData));
    return {};
  }
  
  console.log('🦝 Found trait array:', traitArray);
  const traits = {};
  
  if (!Array.isArray(traitArray)) {
    console.warn('⚠️ traitArray is not an array:', traitArray);
    return {};
  }
  
  traitArray.forEach(trait => {
    if (!trait || typeof trait !== 'object') {
      console.warn('⚠️ Invalid trait object:', trait);
      return;
    }
    
    const traitType = trait.trait_type;
    const traitValue = trait.value;
    
    if (TRAIT_DIRECTORIES[traitType] && traitValue && traitValue !== null) {
      // Map trait to local file path
      const directory = TRAIT_DIRECTORIES[traitType];
      const filename = traitValue.endsWith('.png') ? traitValue : `${traitValue}.png`;
      const filePath = `/traits/${directory}/${filename}`;
      
      traits[traitType] = {
        type: traitType,
        value: traitValue,
        filename: filename,
        filePath: filePath,
        layer: LAYER_ORDER[traitType],
        slot: COSMETIC_SLOTS[traitType]
      };
      
      console.log(`✅ Mapped ${traitType}: ${traitValue} → ${filePath}`);
    } else {
      console.warn(`⚠️ Unknown trait type or missing value:`, { traitType, traitValue, trait });
    }
  });
  
  console.log('🦝 Final parsed traits:', traits);
  return traits;
}

/**
 * Generate layered image stack for canvas rendering
 * @param {Object} raccoonTraits - Parsed raccoon traits
 * @param {Object} cosmetics - Applied cosmetics by slot
 * @returns {Array} Ordered array of layers to render
 */
export function generateLayerStack(raccoonTraits, cosmetics = {}) {
  console.log('🏗️ Generating layer stack:', { raccoonTraits, cosmetics });
  
  const layers = [];
  
  // Process each trait type in layer order
  Object.keys(LAYER_ORDER)
    .sort((a, b) => LAYER_ORDER[a] - LAYER_ORDER[b])
    .forEach(traitType => {
      const cosmetic = cosmetics[COSMETIC_SLOTS[traitType]];
      
      if (cosmetic) {
        // Use cosmetic instead of trait
        layers.push({
          type: 'cosmetic',
          slot: COSMETIC_SLOTS[traitType],
          src: cosmetic.previewLayerURI || cosmetic.imageURI || cosmetic.image,
          layer: LAYER_ORDER[traitType],
          rarity: cosmetic.rarity || 1,
          cosmetic: cosmetic,
          replaces: traitType
        });
        console.log(`🎨 Using COSMETIC for ${traitType}:`, cosmetic.name);
      } else if (raccoonTraits[traitType]) {
        // Use original trait
        layers.push({
          type: 'trait',
          slot: traitType,
          src: raccoonTraits[traitType].filePath,
          layer: LAYER_ORDER[traitType],
          rarity: 0,
          cosmetic: null,
          trait: raccoonTraits[traitType]
        });
        console.log(`🦝 Using TRAIT for ${traitType}:`, raccoonTraits[traitType].value);
      }
    });
  
  console.log('🏗️ Final layer stack:', layers);
  return layers;
}

/**
 * Check if a trait file exists (for fallback handling)
 * @param {string} traitType - Type of trait (bg, fur, body, face, head)
 * @param {string} traitValue - Value/filename of trait
 * @returns {string} Full path to trait file
 */
export function getTraitPath(traitType, traitValue) {
  if (!TRAIT_DIRECTORIES[traitType]) {
    console.warn(`Unknown trait type: ${traitType}`);
    return null;
  }
  
  const directory = TRAIT_DIRECTORIES[traitType];
  const filename = traitValue.endsWith('.png') ? traitValue : `${traitValue}.png`;
  return `/traits/${directory}/${filename}`;
}

/**
 * Get all available trait files for a specific type
 * @param {string} traitType - Type of trait to list
 * @returns {Array} Array of available trait files
 */
export function getAvailableTraits(traitType) {
  // Note: This would need to be populated with actual file lists
  // For now, return empty array - could be enhanced with build-time generation
  return [];
}

/**
 * Validate that required traits exist for a raccoon
 * @param {Object} traits - Parsed traits object
 * @returns {Object} Validation result
 */
export function validateTraits(traits) {
  const requiredTraits = ['bg', 'fur', 'body', 'face', 'head'];
  const missing = requiredTraits.filter(type => !traits[type]);
  
  return {
    isValid: missing.length === 0,
    missing: missing,
    present: Object.keys(traits)
  };
}

export default {
  parseRaccoonTraits,
  generateLayerStack,
  getTraitPath,
  getAvailableTraits,
  validateTraits,
  TRAIT_DIRECTORIES,
  LAYER_ORDER,
  COSMETIC_SLOTS
};