
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCosmeticsV2 } from "../hooks/useCosmeticsV2";
import CosmeticSelectorModal from "../components/CosmeticSelectorModal";
import CosmeticPreview from "../components/CosmeticPreview";
import WrongChainBanner from "../components/WrongChainBanner";
import BoundCosmeticsPanel from "../components/BoundCosmeticsPanel";
import CosmeticsBrowseTab from "../components/CosmeticsBrowseTab";
import "../styles/Rituals.css";

// ---------------------------
// Inline WardrobeSlot Component
// ---------------------------
const WardrobeSlot = ({
  slot,
  equippedCosmetic,
  rarity,
  onClick,
  onHover,
  onHoverOut,
}) => {
  const rarityColors = {
    common: "#999",
    rare: "#4D9EFF",
    epic: "#BD4BFF",
    legendary: "#FFD54F",
    mythic: "linear-gradient(90deg, #FF00FF, #00FFFF, #FFFF00)",
  };

  return (
    <motion.div
      className="wardrobe-slot"
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onHoverOut}
      whileHover={{ scale: 1.05 }}
      style={{
        border:
          rarity === "mythic"
            ? "3px solid transparent"
            : `2px solid ${rarityColors[rarity] || "#555"}`,
        background:
          rarity === "mythic" ? rarityColors["mythic"] : "rgba(20, 20, 20, 0.9)",
        backgroundClip: rarity === "mythic" ? "border-box" : undefined,
        boxShadow:
          rarity === "mythic"
            ? "0 0 12px rgba(255, 0, 255, 0.7), 0 0 20px rgba(0, 255, 255, 0.7)"
            : "none",
      }}
    >
      {equippedCosmetic ? (
        <img
          src={equippedCosmetic.image}
          alt={equippedCosmetic.name}
          className="equipped-cosmetic-img"
        />
      ) : (
        <div className="empty-slot">+</div>
      )}
    </motion.div>
  );
};

// ---------------------------
// Main Rituals Component
// ---------------------------
export default function Rituals() {
  const {
    raccoons,
    cosmetics,
    demons,
    cultists,
    deadRaccoons,
    loading,
    bindCosmetic,
    equipCosmetic,
    unequipCosmetic,
    getEquippedCosmetics,
    getWardrobeCosmetics,
  } = useCosmeticsV2();
  
  // Get IDs of cultists and dead raccoons to filter them from normal raccoons display
  const cultistIds = cultists.map(c => c.originalRaccoonId || c.id);
  const deadRaccoonIds = deadRaccoons.map(d => d.originalRaccoonId || d.id);

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [previewCosmetic, setPreviewCosmetic] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [equipped, setEquipped] = useState({}); // Actually equipped cosmetics
  const [previewEquipped, setPreviewEquipped] = useState({}); // Preview/trying on cosmetics
  const [availableCosmetics, setAvailableCosmetics] = useState({});
  const [allCosmetics, setAllCosmetics] = useState([]);

  // Selected raccoon state - will be updated when raccoons load
  const [selectedRaccoonId, setSelectedRaccoonId] = useState(null);
  
  // Gallery state
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('browse');
  
  // Cosmetics sub-tab state
  const [cosmeticsSubTab, setCosmeticsSubTab] = useState('wardrobe');
  
  // Bound cosmetics state
  const [showBoundCosmetics, setShowBoundCosmetics] = useState(false);
  
  // Collection state
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [collectionSearch, setCollectionSearch] = useState('');

  // Load cosmetics data on mount
  useEffect(() => {
    // Organize available cosmetics by slot for easier filtering
    const cosmeticsBySlot = {
      head: [],
      face: [],
      body: [],
      fur: [],
      background: []
    };
    
    if (cosmetics) {
      cosmetics.forEach(cosmetic => {
        const slotName = cosmetic.slot;
        if (slotName && cosmeticsBySlot[slotName]) {
          cosmeticsBySlot[slotName].push(cosmetic);
        }
      });
    }
    
    setAvailableCosmetics(cosmeticsBySlot);
    setAllCosmetics(cosmetics || []);
  }, [cosmetics]);

  // Try on cosmetics (preview only)
  const handleTryOn = (slot, cosmetic) => {
    setPreviewEquipped(prev => ({
      ...prev,
      [slot]: cosmetic
    }));
    setIsModalOpen(false);
  };

  // Apply all preview cosmetics to blockchain
  const handleApplyCosmetics = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure?\n\nEquipping cosmetics will permanently bond them to this NFT. This action cannot be undone."
    );
    
    if (!confirmed) {
      return; // User clicked "No" or canceled
    }
    
    try {
      console.log('Applying all preview cosmetics to blockchain...');
      
      for (const [slot, cosmetic] of Object.entries(previewEquipped)) {
        if (cosmetic && cosmetic !== equipped[slot]) {
          const slotIndex = ['head', 'face', 'body', 'fur', 'background'].indexOf(slot);
          if (selectedRaccoonId && slotIndex !== -1) {
            console.log(`Step 1: Binding cosmetic ${cosmetic.id} to raccoon ${selectedRaccoonId}`);
            // First bind the cosmetic to the raccoon's wardrobe
            await bindCosmetic(selectedRaccoonId, cosmetic.id);
            
            console.log(`Step 2: Equipping cosmetic to slot ${slotIndex}`);
            // After binding, the cosmetic should be at the end of the wardrobe
            // We need to get the wardrobe count to know the index
            // For now, let's try index 0 as a simple approach
            await equipCosmetic(selectedRaccoonId, slotIndex, 0);
          }
        }
      }
      
      // Update equipped state to match preview
      setEquipped({ ...previewEquipped });
      console.log('All cosmetics applied successfully!');
      
    } catch (error) {
      console.error('Error applying cosmetics:', error);
    }
  };

  // Reset preview to currently equipped
  const handleResetPreview = () => {
    setPreviewEquipped({ ...equipped });
  };

  const handleUnequip = async (slot) => {
    try {
      // Store previous cosmetic for potential revert
      const previousCosmetic = equipped[slot];
      
      // Update local state immediately for UI feedback
      setEquipped(prev => ({
        ...prev,
        [slot]: null
      }));
      setIsModalOpen(false);
      
      // Call the actual blockchain transaction to unequip the cosmetic
      const slotIndex = ['head', 'face', 'body', 'fur', 'background'].indexOf(slot);
      if (selectedRaccoon && slotIndex !== -1) {
        console.log(`Unequipping cosmetic from raccoon ${selectedRaccoon.id} slot ${slotIndex}`);
        await unequipCosmetic(selectedRaccoon.id, slotIndex);
        console.log('Cosmetic unequipped successfully!');
      }
    } catch (error) {
      console.error('Error unequipping cosmetic:', error);
      // Revert local state if blockchain call fails
      setEquipped(prev => ({
        ...prev,
        [slot]: previousCosmetic
      }));
    }
  };

  const handleOpenModal = (slot) => {
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  const handleHoverPreview = (cosmetic) => {
    setPreviewCosmetic(cosmetic);
  };

  const handleHoverOut = () => {
    setPreviewCosmetic(null);
  };

  // Filter raccoons - hide cult/dead/demon in cosmetics tab
  const filteredRaccoons = raccoons.filter(raccoon => {
    // In cosmetics tab, only show alive raccoons (exclude cult, dead, demon states)
    if (activeTab === 'cosmetics') {
      // Debug: log first raccoon to see structure
      if (raccoons.length > 0 && raccoons[0]) {
      }
      
      // Check if raccoon ID is in cultist or dead lists
      const isCultist = cultistIds.includes(raccoon.id);
      const isDead = deadRaccoonIds.includes(raccoon.id);
      
      // Only show if not in cult/dead lists
      return !isCultist && !isDead;
    }
    
    // In collection tab, show all raccoons
    return true;
  });

  const displayedRaccoons = showAll ? filteredRaccoons : filteredRaccoons.slice(0, 10);

  // Auto-select first available raccoon when data loads (only for cosmetics tab)
  React.useEffect(() => {
    if (activeTab === 'cosmetics' && filteredRaccoons.length > 0 && !selectedRaccoonId) {
      setSelectedRaccoonId(filteredRaccoons[0].id);
    }
  }, [filteredRaccoons, selectedRaccoonId, activeTab]);

  return (
    <div className="rituals-container">
      <WrongChainBanner />
      <h1 className="rituals-title" style={{ fontFamily: 'Kings Cross', fontWeight: 'normal', fontSize: '5rem', background: 'linear-gradient(45deg, #8a2be2, #ff00ff, #8a2be2)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>Ritual Chamber</h1>
      
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          Browse
        </button>
        <button
          className={`tab-button ${activeTab === 'collection' ? 'active' : ''}`}
          onClick={() => setActiveTab('collection')}
        >
          Collection
        </button>
        <button
          className={`tab-button ${activeTab === 'guide' ? 'active' : ''}`}
          onClick={() => setActiveTab('guide')}
        >
          Guide
        </button>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'browse' && (
        <CosmeticsBrowseTab
          raccoons={raccoons.filter(r => !cultistIds.includes(r.id) && !deadRaccoonIds.includes(r.id))}
          cosmetics={cosmetics}
          loading={loading}
          bindCosmetic={bindCosmetic}
          equipCosmetic={equipCosmetic}
          getWardrobeCosmetics={getWardrobeCosmetics}
        />
      )}

      {activeTab === 'cosmetics' && (
        <>
          {/* Cosmetics Sub-tabs */}
          <div className="cosmetics-sub-tabs" style={{ marginBottom: '20px' }}>
            <div className="flex gap-2 justify-center">
              <button 
                className={`px-4 py-2 rounded-lg transition-colors ${
                  cosmeticsSubTab === 'wardrobe' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={() => setCosmeticsSubTab('wardrobe')}
              >
                Try On Cosmetics
              </button>
              <button 
                className={`px-4 py-2 rounded-lg transition-colors ${
                  cosmeticsSubTab === 'bound' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={() => setCosmeticsSubTab('bound')}
              >
                💎 Bound Cosmetics
              </button>
            </div>
          </div>
          
          {cosmeticsSubTab === 'wardrobe' && (
            <>
      {/* Main Preview Section - Restructured */}
      <div className="preview-section-vertical">
        {/* Main Raccoon Preview - Now on top */}
        <div className="raccoon-preview-main">
          {(() => {
            const selectedRaccoon = raccoons.find(r => r.id === selectedRaccoonId);
            
            console.log('🎭 Raccoon structure:', {
              selectedRaccoon,
              traits: selectedRaccoon?.traits,
              metadata: selectedRaccoon?.metadata
            });
            
            return (
              <CosmeticPreview
                raccoon={selectedRaccoon || { 
                  id: selectedRaccoonId,
                  name: `Raccoon #${selectedRaccoonId}`,
                  image: "", 
                  traits: { head: null, face: null, body: null, fur: null, background: null }
                }}
                cosmetics={previewEquipped}
                previewCosmetic={previewCosmetic}
                size="xl"
                showGlow={true}
              />
            );
          })()}
        </div>
        
        {/* Raccoon Gallery - Now horizontal below preview */}
        <div className="raccoon-gallery-horizontal">
          <h3 className="gallery-title">Your Raccoons ({filteredRaccoons.length})</h3>
          
          {raccoons.length === 0 ? (
            <div className="wallet-connect-prompt">
              <p>Connect your wallet to view your raccoon collection</p>
            </div>
          ) : (
            <>
              {/* Search Input */}
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="raccoon-search"
                />
              </div>
              
              <div className="raccoon-scroll-horizontal">
                {displayedRaccoons.map((raccoon) => (
                  <motion.div
                    key={raccoon.id}
                    className={`raccoon-thumbnail ${selectedRaccoonId === raccoon.id ? 'selected' : ''}`}
                    onClick={() => setSelectedRaccoonId(raccoon.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img src={raccoon.thumbnail} alt={raccoon.name} />
                    <span className="raccoon-id">#{raccoon.id}</span>
                  </motion.div>
                ))}
                
                {/* Show More Button */}
                {!showAll && filteredRaccoons.length > 10 && (
                  <button 
                    className="show-more-btn"
                    onClick={() => setShowAll(true)}
                  >
                    +{filteredRaccoons.length - 10} more
                  </button>
                )}
                
                {/* Show Less Button */}
                {showAll && filteredRaccoons.length > 10 && (
                  <button 
                    className="show-less-btn"
                    onClick={() => setShowAll(false)}
                  >
                    Show less
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="wardrobe-section">
        <div className="wardrobe-header">
          <h2 className="wardrobe-title">Try On Cosmetics</h2>
          <div className="cosmetic-actions">
            <button 
              className="apply-cosmetics-btn"
              onClick={handleApplyCosmetics}
              disabled={Object.keys(previewEquipped).length === 0}
              style={{
                backgroundColor: Object.keys(previewEquipped).length === 0 ? '#6b7280' : '#dc2626',
                color: Object.keys(previewEquipped).length === 0 ? '#9ca3af' : 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: Object.keys(previewEquipped).length === 0 ? 'not-allowed' : 'pointer',
                marginRight: '10px',
                opacity: Object.keys(previewEquipped).length === 0 ? 0.5 : 1
              }}
            >
              Equip
            </button>
            <button 
              className="reset-cosmetics-btn"
              onClick={handleResetPreview}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Reset
            </button>
          </div>
        </div>
        <div className="wardrobe-grid">
          {[
            { slot: "head", label: "Head", description: "Hats & headwear" },
            { slot: "face", label: "Face", description: "Masks & expressions" },
            { slot: "body", label: "Body", description: "Clothing & armor" },
            { slot: "fur", label: "Fur", description: "Fur colors & patterns" },
            { slot: "background", label: "Background", description: "Scene backgrounds" }
          ].map(({ slot, label, description }) => {
            const previewCosmetic = previewEquipped[slot];
            const rarity = previewCosmetic?.rarity || "common";

            return (
              <div key={slot} className="wardrobe-slot-container">
                <div className="wardrobe-slot-header">
                  <div className="slot-info">
                    <span className="slot-label">{label}</span>
                    <span className="slot-description">{description}</span>
                  </div>
                </div>
                <WardrobeSlot
                  slot={slot}
                  equippedCosmetic={previewCosmetic}
                  rarity={rarity}
                  onClick={() => handleOpenModal(slot)}
                  onHover={() => handleHoverPreview(previewCosmetic)}
                  onHoverOut={handleHoverOut}
                />
              </div>
            );
          })}
        </div>
      </div>
            </>
          )}
          
          {cosmeticsSubTab === 'bound' && (
            <div className="bound-cosmetics-content">
              <h2 className="text-2xl font-bold text-red-400 mb-4 text-center">
                💎 Bound Cosmetics Management
              </h2>
              <p className="text-gray-400 text-center mb-6">
                View and equip cosmetics that are permanently bound to your raccoons
              </p>
              
              {selectedRaccoonId ? (
                <div>
                  <div className="text-center mb-4">
                    <p className="text-lg text-white">
                      Managing bound cosmetics for <span className="text-red-400">Raccoon #{selectedRaccoonId}</span>
                    </p>
                  </div>
                  <BoundCosmeticsPanel
                    raccoonId={selectedRaccoonId}
                    isOpen={true}
                    onClose={() => {}} // No close needed since it's embedded
                    embedded={true} // Add embedded prop to modify styling
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">Select a raccoon from the gallery to manage its bound cosmetics</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'collection' && (
        <div className="collection-content">
          <h2 className="section-title">Your Collection</h2>
          
          {/* Collection Overview */}
          <div className="collection-overview">
            <div className="stat-card">
              <span className="stat-number">{raccoons.filter(r => !cultistIds.includes(r.id) && !deadRaccoonIds.includes(r.id)).length}</span>
              <span className="stat-label">Raccoons</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{cultists.length}</span>
              <span className="stat-label">Cultists</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{demons.length}</span>
              <span className="stat-label">Demons</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{deadRaccoons.length}</span>
              <span className="stat-label">Memorial</span>
            </div>
          </div>

          {/* Collection Filters */}
          <div className="collection-filters">
            <div className="filter-buttons">
              {['all', 'raccoons', 'cultists', 'demons', 'memorial'].map(filter => (
                <button
                  key={filter}
                  className={`filter-button ${collectionFilter === filter ? 'active' : ''}`}
                  onClick={() => setCollectionFilter(filter)}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Search collection..."
              value={collectionSearch}
              onChange={(e) => setCollectionSearch(e.target.value)}
              className="collection-search"
            />
          </div>

          {/* Collection Grid */}
          <div className="collection-grid">
            {/* Render based on active filter */}
            {(collectionFilter === 'all' || collectionFilter === 'raccoons') && 
              raccoons
                .filter(item => item.name.toLowerCase().includes(collectionSearch.toLowerCase()))
                // Filter out raccoons that are cultists or dead (they appear in their own sections)
                .filter(raccoon => !cultistIds.includes(raccoon.id) && !deadRaccoonIds.includes(raccoon.id))
                .map(raccoon => (
                  <div key={`raccoon-${raccoon.id}`} className="collection-item">
                    <img src={raccoon.thumbnail} alt={raccoon.name} />
                    <div className="item-info">
                      <h3>{raccoon.name}</h3>
                      <p className="item-type">Raccoon</p>
                    </div>
                  </div>
                ))
            }
            
            {(collectionFilter === 'all' || collectionFilter === 'demons') && 
              demons
                .filter(item => item.name.toLowerCase().includes(collectionSearch.toLowerCase()))
                .map(demon => (
                  <div key={`demon-${demon.id}`} className={`collection-item rarity-${demon.rarity}`}>
                    <img src={demon.image} alt={demon.name} />
                    <div className="item-info">
                      <h3>{demon.name}</h3>
                      <p className="item-type">{demon.element} Demon</p>
                      <p className="item-stat">Power: {demon.power}</p>
                    </div>
                  </div>
                ))
            }
            
            {(collectionFilter === 'all' || collectionFilter === 'cultists') && 
              cultists
                .filter(item => item.name.toLowerCase().includes(collectionSearch.toLowerCase()))
                .map(cultist => (
                  <div key={`cultist-${cultist.id}`} className={`collection-item rarity-${cultist.rarity}`}>
                    <img src={cultist.image} alt={cultist.name} />
                    <div className="item-info">
                      <h3>{cultist.name}</h3>
                      <p className="item-type">Cultist</p>
                      {cultist.loyalty && <p className="item-stat">Loyalty: {cultist.loyalty}%</p>}
                    </div>
                  </div>
                ))
            }
            
            {(collectionFilter === 'all' || collectionFilter === 'memorial') && 
              deadRaccoons
                .filter(item => item.name.toLowerCase().includes(collectionSearch.toLowerCase()))
                .map(dead => (
                  <div key={`dead-${dead.id}`} className="collection-item memorial">
                    <img src={dead.image} alt={dead.name} />
                    <div className="item-info">
                      <h3>{dead.name}</h3>
                      <p className="item-type">Memorial</p>
                      <p className="item-stat">{dead.cause}</p>
                      <p className="death-date">{dead.deathDate}</p>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      )}

      {activeTab === 'guide' && (
        <div className="guide-content">
          <h2 className="section-title">How to Use</h2>
          
          <div className="guide-sections">
            <div className="guide-section">
              <h3>Cosmetics Tab</h3>
              <div className="guide-steps">
                <div className="step">
                  <span className="step-number">1</span>
                  <p>Select a raccoon from your gallery on the left to customize</p>
                </div>
                <div className="step">
                  <span className="step-number">2</span>
                  <p>Click on any wardrobe slot (Head, Face, Body, Fur, Background) to open the cosmetic selector</p>
                </div>
                <div className="step">
                  <span className="step-number">3</span>
                  <p>Preview cosmetics by hovering over them in the selector modal</p>
                </div>
                <div className="step">
                  <span className="step-number">4</span>
                  <p>Click "Equip" to apply the cosmetic to your raccoon</p>
                </div>
              </div>
            </div>

            <div className="guide-section">
              <h3>Collection Tab</h3>
              <div className="guide-steps">
                <div className="step">
                  <span className="step-number">1</span>
                  <p>View your complete inventory including Raccoons, Demons, Cultists, and Memorial items</p>
                </div>
                <div className="step">
                  <span className="step-number">2</span>
                  <p>Use filter buttons to show specific types of assets</p>
                </div>
                <div className="step">
                  <span className="step-number">3</span>
                  <p>Search by name to quickly find specific items in your collection</p>
                </div>
                <div className="step">
                  <span className="step-number">4</span>
                  <p>Items are displayed with rarity-based borders and colors</p>
                </div>
              </div>
            </div>

            <div className="guide-section">
              <h3>Rarity System</h3>
              <div className="rarity-guide">
                <div className="rarity-item">
                  <div className="rarity-preview common"></div>
                  <span>Common - Gray border</span>
                </div>
                <div className="rarity-item">
                  <div className="rarity-preview rare"></div>
                  <span>Rare - Blue border</span>
                </div>
                <div className="rarity-item">
                  <div className="rarity-preview epic"></div>
                  <span>Epic - Purple border</span>
                </div>
                <div className="rarity-item">
                  <div className="rarity-preview legendary"></div>
                  <span>Legendary - Gold border</span>
                </div>
                <div className="rarity-item">
                  <div className="rarity-preview mythic"></div>
                  <span>Mythic - Rainbow gradient with glow</span>
                </div>
              </div>
            </div>

            <div className="guide-section">
              <h3>Tips & Tricks</h3>
              <ul className="tips-list">
                <li>Use the search function in the raccoon gallery to quickly find specific raccoons by ID or name</li>
                <li>Hover over cosmetics to preview them on your selected raccoon before equipping</li>
                <li>The "Show more/less" buttons in the raccoon gallery help manage large collections</li>
                <li>Each asset type in your collection displays relevant stats (Power for demons, Loyalty for cultists)</li>
                <li>Memorial items commemorate raccoons that have passed in rituals</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <CosmeticSelectorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          availableCosmetics={allCosmetics}
          equippedCosmetics={Object.values(equipped).filter(Boolean)}
          onEquip={(cosmetic, targetSlot) => handleTryOn(targetSlot || selectedSlot, cosmetic)}
          selectedSlot={selectedSlot}
          selectedRaccoonId={selectedRaccoonId}
          previewCosmetic={previewCosmetic}
          setPreviewCosmetic={setPreviewCosmetic}
        />
      )}

      {previewCosmetic && (
        <div className="cosmetic-preview-overlay">
          <img
            src={previewCosmetic.image}
            alt={previewCosmetic.name}
            className="preview-cosmetic"
          />
        </div>
      )}
    </div>
  );
}
