import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { parseRaccoonTraits, generateLayerStack } from '../utils/traitMapping';
import '../styles/cosmetic-effects.css';

// Lottie for animated cosmetics (install with: npm install lottie-react)
// import Lottie from 'lottie-react';

const SLOT_CONFIG = {
  0: { name: "HEAD", icon: "👑", color: "text-blue-400", zIndex: 50 },
  1: { name: "FACE", icon: "👀", color: "text-green-400", zIndex: 40 },
  2: { name: "BODY", icon: "👕", color: "text-purple-400", zIndex: 30 },
  3: { name: "COLOR", icon: "🎨", color: "text-yellow-400", zIndex: 10 }, // Base layer
  4: { name: "BACKGROUND", icon: "🌟", color: "text-pink-400", zIndex: 5 }, // Furthest back
};

const RARITY_CONFIG = {
  1: { 
    name: "Common", 
    color: "text-gray-400", 
    glow: "",
    overlayGradient: "none",
    animation: null
  },
  2: { 
    name: "Uncommon", 
    color: "text-green-400", 
    glow: "shadow-green-400/20",
    overlayGradient: "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)",
    animation: "subtle-pulse"
  },
  3: { 
    name: "Rare", 
    color: "text-blue-400", 
    glow: "shadow-blue-400/30",
    overlayGradient: "radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)",
    animation: "gentle-glow"
  },
  4: { 
    name: "Legendary", 
    color: "text-purple-400", 
    glow: "shadow-purple-400/40",
    overlayGradient: "radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, transparent 70%)",
    animation: "mystical-aura"
  },
  5: { 
    name: "Mythic", 
    color: "text-yellow-300", 
    glow: "shadow-yellow-300/50",
    overlayGradient: "radial-gradient(circle, rgba(255, 215, 0, 0.5) 0%, transparent 80%)",
    animation: "divine-radiance"
  },
};

/**
 * CosmeticPreview component renders a raccoon with equipped cosmetics
 * using a trait replacement system where cosmetics replace the default raccoon traits
 * rather than being overlays.
 * 
 * @param {Object} raccoon - The base raccoon data
 * @param {Object} cosmetics - Object with cosmetics for each slot { HEAD: {...}, FACE: {...}, etc }
 * @param {Object} previewCosmetic - Optional cosmetic to preview (not yet equipped)
 * @param {string} size - Size variant: 'sm', 'md', 'lg', 'xl'
 * @param {boolean} showGlow - Whether to show rarity glow effects
 * @param {Function} onCosmeticClick - Callback when a cosmetic layer is clicked
 */
export default function CosmeticPreview({
  raccoon,
  cosmetics = {},
  previewCosmetic = null,
  size = 'md',
  showGlow = true,
  onCosmeticClick,
  className = '',
}) {
  const [imageErrors, setImageErrors] = useState(new Set());
  const [imagesLoaded, setImagesLoaded] = useState(new Set());

  // Size configurations - using w-h classes that are always available
  const sizeConfig = {
    sm: { container: 'w-16 h-16', text: 'text-xs' },
    md: { container: 'w-32 h-32', text: 'text-sm' },
    lg: { container: 'w-48 h-48', text: 'text-base' },
    xl: { container: 'w-64 h-64', text: 'text-lg' },
  };

  const currentSize = sizeConfig[size] || sizeConfig.md;

  // Create the final cosmetic configuration with preview override
  const displayedCosmetics = useMemo(() => {
    console.log('🎨 CosmeticPreview processing:', {
      inputCosmetics: cosmetics,
      previewCosmetic,
      SLOT_CONFIG: Object.keys(SLOT_CONFIG)
    });
    
    const result = { ...cosmetics };
    
    // If we have a preview cosmetic, temporarily replace the cosmetic in that slot
    if (previewCosmetic && previewCosmetic.slot !== undefined) {
      const slotName = Object.keys(SLOT_CONFIG)[previewCosmetic.slot];
      console.log('🎨 Adding preview cosmetic to slot:', slotName, previewCosmetic);
      result[slotName] = previewCosmetic;
    }
    
    console.log('🎨 Final displayed cosmetics:', result);
    return result;
  }, [cosmetics, previewCosmetic]);

  // Enhanced layering engine - uses individual trait files with cosmetic overlays
  const getLayeredImageStack = useMemo(() => {
    console.log('🏗️ Building trait-based layers for raccoon:', raccoon?.id);
    console.log('🏗️ Raccoon data:', raccoon);
    console.log('🏗️ Equipped cosmetics:', displayedCosmetics);
    
    if (!raccoon) {
      console.warn('🏗️ No raccoon data provided');
      return [];
    }
    
    // Parse raccoon traits from metadata
    const raccoonTraits = parseRaccoonTraits(raccoon);
    console.log('🏗️ Parsed raccoon traits:', raccoonTraits);
    
    // Convert displayedCosmetics to the format expected by generateLayerStack
    const cosmeticsForLayering = {};
    Object.entries(displayedCosmetics).forEach(([slotName, cosmetic]) => {
      if (cosmetic) {
        // Map slot names to COSMETIC_SLOTS format
        const slotMapping = {
          'head': 'HEAD',
          'face': 'FACE', 
          'body': 'BODY',
          'color': 'COLOR',
          'background': 'BACKGROUND'
        };
        const mappedSlot = slotMapping[slotName] || slotName.toUpperCase();
        cosmeticsForLayering[mappedSlot] = cosmetic;
      }
    });
    
    // Generate the layer stack using the trait mapping utility
    const layerStack = generateLayerStack(raccoonTraits, cosmeticsForLayering);
    console.log('🏗️ Generated layer stack:', layerStack);
    
    // Convert to format expected by the rendering engine
    const layers = layerStack.map(layer => ({
      type: layer.type,
      src: layer.src,
      zIndex: layer.layer * 10, // Multiply by 10 for clear z-index separation (10, 20, 30, 40, 50)
      isAnimated: layer.src?.endsWith('.json') || layer.cosmetic?.isAnimated,
      rarity: layer.rarity || 0,
      cosmetic: layer.cosmetic,
      slotName: layer.replaces || layer.slot,
      trait: layer.trait
    }));
    
    // Log each layer individually for easier reading
    layers.forEach((layer, index) => {
      console.log(`🏗️ Layer ${index + 1}:`, {
        type: layer.type,
        slot: layer.slotName, 
        zIndex: layer.zIndex,
        src: layer.src
      });
    });
    
    // Sort layers by z-index to ensure proper rendering order
    const sortedLayers = layers.sort((a, b) => a.zIndex - b.zIndex);
    
    console.log('🏗️ Final converted layers for rendering (sorted):', sortedLayers);
    return sortedLayers;
  }, [raccoon, displayedCosmetics]);

  // Render individual layer (supports both static images and animated content)
  const renderLayer = (layer, index) => {
    const key = `${layer.type}-${layer.cosmetic?.id || 'base'}-${index}`;
    
    if (layer.isAnimated && layer.src.endsWith('.json')) {
      // Animated Lottie layer (requires npm install lottie-react)
      return (
        <div key={key} className="absolute inset-0" style={{ zIndex: layer.zIndex }}>
          {/* <Lottie 
            animationData={layer.src}
            loop={true}
            autoplay={true}
            className="w-full h-full object-cover rounded-lg"
          /> */}
          {/* Fallback for now - replace with Lottie when installed */}
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg">
            <span className="text-2xl">✨</span>
          </div>
        </div>
      );
    }
    
    // Get rarity-based CSS class
    const getRarityClass = (rarity) => {
      switch(rarity) {
        case 1: return 'cosmetic-common';
        case 2: return 'cosmetic-uncommon';
        case 3: return 'cosmetic-rare';
        case 4: return 'cosmetic-legendary';
        case 5: return 'cosmetic-mythic';
        default: return '';
      }
    };

    const isPreviewActive = previewCosmetic && previewCosmetic.id === layer.cosmetic?.id;
    const rarityClass = getRarityClass(layer.rarity);
    
    // Static image layer with explicit absolute positioning
    return (
      <div
        key={key}
        className={`cursor-pointer ${rarityClass} ${isPreviewActive ? 'cosmetic-preview-active' : ''} ${layer.slotName === 'COLOR' ? 'cosmetic-color-slot' : ''}`}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: layer.zIndex
        }}
        onClick={() => onCosmeticClick?.(layer.cosmetic, layer.slotName)}
      >
        <img
          src={layer.src}
          alt={layer.cosmetic?.name || 'Base raccoon'}
          className={`block object-cover ${imagesLoaded.has(`${layer.type}-${layer.cosmetic?.id || 'base'}`) ? '' : 'cosmetic-loading'}`}
          style={{ 
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'cover',
            mixBlendMode: layer.slotName === 'COLOR' ? 'multiply' : 'normal',
            display: imageErrors.has(`${layer.type}-${layer.cosmetic?.id || 'base'}`) ? 'none' : 'block'
          }}
          onError={() => handleImageError(`${layer.type}-${layer.cosmetic?.id || 'base'}`, layer.src)}
          onLoad={() => handleImageLoad(`${layer.type}-${layer.cosmetic?.id || 'base'}`, layer.src)}
        />
        
        {/* Show error placeholder for failed images */}
        {imageErrors.has(`${layer.type}-${layer.cosmetic?.id || 'base'}`) && (
          <div className="w-full h-full flex items-center justify-center bg-red-900/20 border border-red-500/50 rounded-lg">
            <div className="text-center text-red-400 text-xs p-2">
              <div>❌ {layer.slotName}</div>
              <div className="text-xs opacity-70">Failed to load</div>
            </div>
          </div>
        )}
        
        {/* Enhanced cosmetic overlay info */}
        {layer.cosmetic && size !== 'sm' && (
          <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-center p-2">
            <div className={`${currentSize.text} font-semibold text-white mb-1`}>
              {layer.cosmetic.name}
            </div>
            <div className={`text-xs ${RARITY_CONFIG[layer.rarity]?.color || 'text-gray-400'}`}>
              {RARITY_CONFIG[layer.rarity]?.name || 'Unknown'}
            </div>
            <div className={`text-xs ${SLOT_CONFIG[Object.keys(SLOT_CONFIG).find(k => SLOT_CONFIG[k].name === layer.slotName)]?.color || 'text-gray-400'} mt-1`}>
              {SLOT_CONFIG[Object.keys(SLOT_CONFIG).find(k => SLOT_CONFIG[k].name === layer.slotName)]?.icon} {layer.slotName}
            </div>
            {previewCosmetic && previewCosmetic.id === layer.cosmetic.id && (
              <div className="text-xs text-yellow-400 mt-1 font-medium">
                PREVIEW
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Calculate the highest rarity for glow effect
  const highestRarity = useMemo(() => {
    const rarities = Object.values(displayedCosmetics)
      .filter(Boolean)
      .map(cosmetic => cosmetic.rarity || 1);
    return rarities.length > 0 ? Math.max(...rarities) : 0;
  }, [displayedCosmetics]);

  const handleImageError = (imageKey, src) => {
    console.error(`❌ Failed to load image: ${imageKey} from ${src}`);
    setImageErrors(prev => new Set([...prev, imageKey]));
  };

  const handleImageLoad = (imageKey, src) => {
    console.log(`✅ Successfully loaded image: ${imageKey} from ${src}`);
    setImagesLoaded(prev => new Set([...prev, imageKey]));
  };

  // Get the highest rarity cosmetic for overall glow effects
  const getHighestRarity = () => {
    const rarities = getLayeredImageStack
      .filter(layer => layer.rarity > 0)
      .map(layer => layer.rarity);
    return rarities.length > 0 ? Math.max(...rarities) : 0;
  };

  const glowClass = showGlow && highestRarity > 0 
    ? RARITY_CONFIG[highestRarity]?.glow 
    : '';

  return (
    <div className={`${className}`}>
      <div 
        className="cosmetic-preview rounded-lg overflow-hidden bg-black"
        style={{ position: 'relative', width: 320, height: 320 }}
      >
        {getLayeredImageStack.map((layer, index) => (
          <img
            key={layer.id ?? `${layer.type}-${layer.cosmetic?.id || 'base'}-${index}`}
            src={layer.src}
            alt={layer.cosmetic?.name || 'Base raccoon'}
            className="cursor-pointer"
            style={{
              position: 'absolute',
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              width: '100%', 
              height: '100%',
              objectFit: 'cover',
              zIndex: (index + 1) * 10,
              mixBlendMode: layer.slotName === 'COLOR' || layer.slot === 'fur' ? 'multiply' : 'normal',
              display: imageErrors.has(`${layer.type}-${layer.cosmetic?.id || 'base'}`) ? 'none' : 'block'
            }}
            onClick={() => onCosmeticClick?.(layer.cosmetic, layer.slotName)}
            onError={() => handleImageError(`${layer.type}-${layer.cosmetic?.id || 'base'}`, layer.src)}
            onLoad={() => handleImageLoad(`${layer.type}-${layer.cosmetic?.id || 'base'}`, layer.src)}
          />
        ))}
        
        {/* Enhanced rarity overlay effect */}
        {showGlow && highestRarity >= 3 && (
          <div 
            className={`absolute inset-0 pointer-events-none rounded-lg ${
              RARITY_CONFIG[highestRarity]?.animation === 'divine-radiance' 
                ? 'animate-pulse' 
                : RARITY_CONFIG[highestRarity]?.animation === 'mystical-aura'
                  ? 'animate-pulse'
                  : ''
            }`}
            style={{
              background: RARITY_CONFIG[highestRarity]?.overlayGradient,
              mixBlendMode: "screen",
              opacity: 0.6
            }}
          />
        )}
        
        {/* Fallback if no raccoon image */}
        {!raccoon && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">🦝</div>
              <div className="text-sm">No Raccoon</div>
            </div>
          </div>
        )}
        
        {/* Loading indicator */}
        {raccoon && imagesLoaded.size === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        )}
        
        {/* Preview indicator */}
        {previewCosmetic && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500/20 border border-yellow-500/50 rounded-full backdrop-blur-sm">
            <span className="text-xs text-yellow-300 font-medium">Preview</span>
          </div>
        )}
        
        {/* Equipped cosmetics count indicator */}
        {Object.values(displayedCosmetics).filter(Boolean).length > 0 && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded-full backdrop-blur-sm">
            <span className="text-xs text-gray-300">
              {Object.values(displayedCosmetics).filter(Boolean).length} equipped
            </span>
          </div>
        )}
        
        {/* Rarity glow ring */}
        {showGlow && highestRarity >= 4 && (
          <div 
            className={`absolute inset-0 rounded-lg pointer-events-none ${
              highestRarity === 5 
                ? 'ring-2 ring-yellow-300/50 animate-pulse' 
                : 'ring-1 ring-purple-400/50'
            }`} 
          />
        )}
      </div>
    </div>
  );
}