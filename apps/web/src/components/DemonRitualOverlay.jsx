import React from 'react';
import './DemonRitualOverlay.css';

const runes = [
  '/icons/rune_sacrifice.svg',
  '/icons/rune_binding.svg',
  '/icons/rune_demon.svg',
  '/icons/rune_relic.svg',
];

export default function DemonRitualOverlay({ isActive, onCancel, progress }) {
  if (!isActive) return null;

  return (
    <div className="demon-overlay">
      <div className="ritual-backdrop" />
      <div className="ritual-container">
        <div className="ritual-circle">
          {runes.map((rune, idx) => (
            <img
              key={idx}
              src={rune}
              alt="rune"
              className={`ritual-rune rune-${idx}`}
              draggable="false"
            />
          ))}
          <div
            className="ritual-progress"
            style={{ transform: `scale(${0.6 + progress * 0.4})` }}
          />
        </div>
        <button className="cancel-btn" onClick={onCancel}>
          ABORT RITUAL
        </button>
      </div>
    </div>
  );
}
