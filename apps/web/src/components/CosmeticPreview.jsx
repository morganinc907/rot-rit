import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
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

  // Size configurations
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

  // Enhanced layering engine - generates proper trait-based image stack
  const getLayeredImageStack = useMemo(() => {
    const layers = [];
    
    console.log('🏗️ Building trait-based layers for raccoon:', raccoon?.id);
    console.log('🏗️ Raccoon traits:', raccoon?.traits);
    console.log('🏗️ Equipped cosmetics:', displayedCosmetics);
    
    // Add layers in z-index order (background to foreground) - only cosmetics
    const sortedSlots = Object.entries(SLOT_CONFIG).sort((a, b) => a[1].zIndex - b[1].zIndex);
    
    // Map trait names to slot names for proper layering
    const TRAIT_TO_SLOT = {
      'bg': 'background',
      'fur': 'color', // fur color goes in COLOR slot
      'body': 'body',
      'face': 'face', 
      'head': 'head'
    };
    
    sortedSlots.forEach(([slotIndex, slotConfig]) => {
      const slotName = slotConfig.name.toLowerCase(); // "FACE" -> "face"
      const cosmetic = displayedCosmetics[slotName];
      
      // Check if we have a cosmetic for this slot, otherwise use original trait
      if (cosmetic) {
        // Use cosmetic instead of trait
        const imageUrl = cosmetic.previewLayerURI || cosmetic.image || cosmetic.imageURI;
        if (imageUrl) {
          layers.push({
            type: 'cosmetic',
            src: imageUrl,
            zIndex: slotConfig.zIndex,
            isAnimated: imageUrl.endsWith('.json') || cosmetic?.isAnimated,
            rarity: cosmetic.rarity || 1,
            cosmetic,
            slotName
          });
          console.log(`✅ Added COSMETIC layer ${slotName}:`, imageUrl);
        }
      }
    });
    
    // Since individual trait layers don't exist separately, use the complete raccoon image as base
    // Only add the base raccoon if no cosmetics are equipped
    const hasCosmetics = Object.values(displayedCosmetics).some(Boolean);
    if (raccoon?.image && !hasCosmetics) {
      layers.push({
        type: 'base-raccoon',
        src: raccoon.image.replace('ipfs://', 'https://ipfs.io/ipfs/'),
        zIndex: 1, // Lowest layer
        isAnimated: false,
        rarity: 0,
        cosmetic: null,
        slotName: 'base',
        raccoonId: raccoon.id
      });
      console.log(`✅ Added BASE RACCOON layer:`, raccoon.image);
    }
    
    const sortedLayers = layers.sort((a, b) => a.zIndex - b.zIndex);
    console.log('🏗️ Final layer stack:', sortedLayers);
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
    
    // Static image layer
    return (
      <motion.div
        key={key}
        className={`absolute inset-0 cursor-pointer ${rarityClass} ${isPreviewActive ? 'cosmetic-preview-active' : ''} ${layer.slotName === 'COLOR' ? 'cosmetic-color-slot' : ''}`}
        style={{ zIndex: layer.zIndex }}
        onClick={() => onCosmeticClick?.(layer.cosmetic, layer.slotName)}
        whileHover={{ scale: onCosmeticClick ? 1.02 : 1 }}
        initial={isPreviewActive ? { opacity: 0, scale: 0.9 } : false}
        animate={isPreviewActive ? { opacity: 1, scale: 1 } : false}
        transition={{ duration: 0.2 }}
      >
        <img
          src={layer.src}
          alt={layer.cosmetic?.name || 'Base raccoon'}
          className={`w-full h-full object-cover rounded-lg ${imagesLoaded.has(`${layer.type}-${layer.cosmetic?.id || 'base'}`) ? '' : 'cosmetic-loading'}`}
          style={{ 
            mixBlendMode: layer.slotName === 'COLOR' ? 'multiply' : 'normal'
          }}
          onError={() => handleImageError(`${layer.type}-${layer.cosmetic?.id || 'base'}`)}
          onLoad={() => handleImageLoad(`${layer.type}-${layer.cosmetic?.id || 'base'}`)}
        />
        
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
      </motion.div>
    );
  };

  // Calculate the highest rarity for glow effect
  const highestRarity = useMemo(() => {
    const rarities = Object.values(displayedCosmetics)
      .filter(Boolean)
      .map(cosmetic => cosmetic.rarity || 1);
    return rarities.length > 0 ? Math.max(...rarities) : 0;
  }, [displayedCosmetics]);

  const handleImageError = (imageKey) => {
    setImageErrors(prev => new Set([...prev, imageKey]));
  };

  const handleImageLoad = (imageKey) => {
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
    <div 
      className={`relative cosmetic-preview ${currentSize.container} ${glowClass ? `shadow-lg ${glowClass}` : ''} ${className}`}
    >
      {/* Container with rounded corners and enhanced glow */}
      <div className="relative w-full h-full rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
        {/* Render all layers using enhanced layering engine */}
        {getLayeredImageStack.map((layer, index) => renderLayer(layer, index))}
        
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
              <div className={currentSize.text}>No Raccoon</div>
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
        {Object.values(displayedCosmetics).filter(Boolean).length > 0 && size !== 'sm' && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded-full backdrop-blur-sm">
            <span className="text-xs text-gray-300">
              {Object.values(displayedCosmetics).filter(Boolean).length} equipped
            </span>
          </div>
        )}
      </div>
      
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
  );
}