import React from 'react';
import './DemonRitualOverlay.css';

export default function TestRitualButton({ onClick }) {
  return (
    <button className="test-ritual-btn" onClick={onClick}>
      INITIATE RITUAL
    </button>
  );
}
