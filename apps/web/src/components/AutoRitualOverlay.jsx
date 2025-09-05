import React, { useState, useEffect, useRef } from 'react';
import './DemonRitualOverlay.css';

const runes = [
  '/icons/rune_sacrifice.svg',
  '/icons/rune_binding.svg',
  '/icons/rune_demon.svg',
  '/icons/rune_relic.svg',
];

const WS_URL = import.meta.env.VITE_CODEX_WS || "ws://localhost:8080";

export default function AutoRitualOverlay() {
  const [isRitualActive, setIsRitualActive] = useState(false);
  const [ritualProgress, setRitualProgress] = useState(0);
  const ws = useRef(null);
  const progressInterval = useRef(null);

  // Connect to WebSocket to listen for demon summon events
  useEffect(() => {
    // Only try to connect if WebSocket URL is explicitly configured
    if (!import.meta.env.VITE_CODEX_WS) {
      console.log('🔮 AutoRitualOverlay: No WebSocket server configured, skipping connection');
      return;
    }
    
    console.log('🔮 AutoRitualOverlay connecting to WebSocket...');
    ws.current = new WebSocket(WS_URL);
    
    ws.current.onopen = () => {
      console.log('✅ AutoRitualOverlay connected to WebSocket');
    };
    
    ws.current.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        console.log('📡 AutoRitualOverlay received:', data.kind);
        
        if (data.kind === 'demon_summoned' && data.success) {
          console.log('🔥 TRIGGERING RITUAL OVERLAY!');
          startRitual();
        }
      } catch (e) {
        console.error("Error parsing ritual overlay WebSocket message:", e);
      }
    };

    ws.current.onerror = (err) => {
      console.warn("AutoRitualOverlay WebSocket error:", err);
    };

    ws.current.onclose = () => {
      console.log('❌ AutoRitualOverlay WebSocket closed');
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  const startRitual = () => {
    console.log('🎭 Starting ritual animation...');
    setIsRitualActive(true);
    setRitualProgress(0);
    
    // Animate progress over 4 seconds
    progressInterval.current = setInterval(() => {
      setRitualProgress(prev => {
        const newProgress = prev + 0.025; // 40 steps over 4 seconds
        if (newProgress >= 1) {
          endRitual();
          return 1;
        }
        return newProgress;
      });
    }, 100);
  };

  const endRitual = () => {
    console.log('✅ Ending ritual animation');
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    setIsRitualActive(false);
    setRitualProgress(0);
  };

  if (!isRitualActive) return null;

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
            style={{ transform: `scale(${0.6 + ritualProgress * 0.4})` }}
          />
        </div>
        <button className="cancel-btn" onClick={endRitual}>
          ABORT RITUAL
        </button>
      </div>
    </div>
  );
}