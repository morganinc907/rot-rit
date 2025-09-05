import React, { useState, useEffect } from "react";
import "./CosmeticSelectorModal.css";

export default function CosmeticSelectorModal({
  isOpen,
  onClose,
  availableCosmetics = [],
  equippedCosmetics = [],
  onEquip,
  selectedSlot,
  previewCosmetic,
  setPreviewCosmetic
}) {
  const SLOT_MAPPING = {
    'head': 0,
    'face': 1, 
    'body': 2,
    'fur': 3,
    'background': 4
  };

  const REVERSE_SLOT_MAPPING = {
    0: 'head',
    1: 'face', 
    2: 'body',
    3: 'fur',
    4: 'background'
  };

  const [activeSlot, setActiveSlot] = useState(null);

  const handleEquip = (cosmetic) => {
    const targetSlot = activeSlot !== null ? REVERSE_SLOT_MAPPING[activeSlot] : selectedSlot;
    onEquip(cosmetic, targetSlot);
  };

  useEffect(() => {
    if (!isOpen) {
      setPreviewCosmetic(null);
      setActiveSlot(null);
    } else if (selectedSlot) {
      const slotNumber = SLOT_MAPPING[selectedSlot];
      setActiveSlot(slotNumber);
    }
  }, [isOpen, selectedSlot, setPreviewCosmetic]);

  if (!isOpen) return null;

  return (
    <div className="cosmetic-modal-overlay" onClick={onClose}>
      <div
        className="cosmetic-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cosmetic-modal-header">
          <h2>Choose a Cosmetic</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="cosmetic-slot-buttons">
          <button
            className={`slot-button ${activeSlot === null ? "active" : ""}`}
            onClick={() => setActiveSlot(null)}
          >
            All
          </button>
          {["Head", "Face", "Body", "Fur", "Background"].map((slotName, index) => (
            <button
              key={slotName}
              className={`slot-button ${activeSlot === index ? "active" : ""}`}
              onClick={() => setActiveSlot(index)}
            >
              {slotName}
            </button>
          ))}
        </div>

        <div className="cosmetic-grid">
          {activeSlot !== null && (
            <div
              className="cosmetic-item unequip-option"
              onClick={() => handleEquip(null)}
            >
              <div className="unequip-icon">✕</div>
              <span className="cosmetic-name">Remove</span>
              <span className="cosmetic-rarity">unequip</span>
            </div>
          )}
          
          {availableCosmetics
            .filter((c) => activeSlot === null || c.slot === activeSlot)
            .map((cosmetic) => {
              const isEquipped = equippedCosmetics.some(
                (eq) => eq.id === cosmetic.id
              );

              return (
                <div
                  key={cosmetic.id}
                  className={`cosmetic-item ${
                    isEquipped ? "equipped" : ""
                  } rarity-${cosmetic.rarity || "common"}`}
                  onMouseEnter={() => setPreviewCosmetic(cosmetic)}
                  onMouseLeave={() => setPreviewCosmetic(null)}
                  onClick={() => handleEquip(cosmetic)}
                >
                  <img
                    src={cosmetic.image}
                    alt={cosmetic.name}
                    className="cosmetic-thumbnail"
                    draggable={false}
                  />
                  <span className="cosmetic-name">{cosmetic.name}</span>
                  <span className="cosmetic-rarity">
                    {cosmetic.rarity || "common"}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}