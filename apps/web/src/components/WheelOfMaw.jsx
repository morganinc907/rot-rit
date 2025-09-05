import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WHEEL_SEGMENTS = [
  { id: 1, name: 'Ember', weight: 40, color: '#ff6b6b', rarity: 'common' },
  { id: 2, name: 'Bone Charm', weight: 25, color: '#f0f0f0', rarity: 'uncommon' },
  { id: 3, name: 'Lantern Shard', weight: 15, color: '#4ecdc4', rarity: 'rare' },
  { id: 4, name: 'Blood Vial', weight: 10, color: '#8b0000', rarity: 'rare' },
  { id: 5, name: 'Cursed Coin', weight: 7, color: '#ffd700', rarity: 'rare' },
  { id: 12, name: 'Web of Filth', weight: 2, color: '#8b008b', rarity: 'legendary' },
  { id: 14, name: 'Tongue of Ash', weight: 1, color: '#ff00ff', rarity: 'legendary' }
];

export default function WheelOfMaw({ onSpin, isSpinning, disabled }) {
  const [rotation, setRotation] = useState(0);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [spinCost, setSpinCost] = useState(0.01); // ETH

  // Calculate segment angles
  const totalWeight = WHEEL_SEGMENTS.reduce((sum, seg) => sum + seg.weight, 0);
  let currentAngle = 0;
  const segments = WHEEL_SEGMENTS.map(segment => {
    const angle = (segment.weight / totalWeight) * 360;
    const segmentData = {
      ...segment,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      centerAngle: currentAngle + angle / 2
    };
    currentAngle += angle;
    return segmentData;
  });

  const handleSpin = async () => {
    if (isSpinning || disabled) return;
    
    // Calculate winning segment (this would be determined by smart contract)
    const randomWeight = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    let winner = segments[0];
    
    for (const segment of segments) {
      cumulativeWeight += segment.weight;
      if (randomWeight <= cumulativeWeight) {
        winner = segment;
        break;
      }
    }
    
    // Calculate rotation to land on winner
    const targetAngle = 360 - winner.centerAngle + (Math.random() * 20 - 10); // Add some randomness
    const spins = 5 + Math.random() * 3; // 5-8 full rotations
    const finalRotation = rotation + (spins * 360) + targetAngle;
    
    setRotation(finalRotation);
    setSelectedSegment(winner);
    
    // Call the spin function
    await onSpin({ cost: spinCost, winner });
  };

  return (
    <div className="wheel-container">
      {/* Wheel Background */}
      <div className="wheel-backdrop">
        <div className="wheel-glow" />
      </div>
      
      {/* The Wheel */}
      <div className="wheel-wrapper">
        <motion.div 
          className="wheel"
          animate={{ rotate: rotation }}
          transition={{ 
            duration: isSpinning ? 3 : 0,
            ease: isSpinning ? [0.25, 0.46, 0.45, 0.94] : "linear"
          }}
        >
          {/* Wheel Segments */}
          <svg viewBox="0 0 200 200" className="wheel-svg">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/> 
                </feMerge>
              </filter>
            </defs>
            
            {segments.map((segment, index) => {
              const { startAngle, endAngle, color, name, rarity } = segment;
              const startRad = (startAngle - 90) * Math.PI / 180;
              const endRad = (endAngle - 90) * Math.PI / 180;
              const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
              
              const x1 = 100 + 90 * Math.cos(startRad);
              const y1 = 100 + 90 * Math.sin(startRad);
              const x2 = 100 + 90 * Math.cos(endRad);
              const y2 = 100 + 90 * Math.sin(endRad);
              
              const pathData = [
                `M 100 100`,
                `L ${x1} ${y1}`,
                `A 90 90 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                `Z`
              ].join(' ');

              const textAngle = (startAngle + endAngle) / 2;
              const textRad = (textAngle - 90) * Math.PI / 180;
              const textX = 100 + 60 * Math.cos(textRad);
              const textY = 100 + 60 * Math.sin(textRad);
              
              return (
                <g key={index}>
                  <path
                    d={pathData}
                    fill={color}
                    stroke="#000"
                    strokeWidth="1"
                    filter={rarity === 'legendary' ? 'url(#glow)' : 'none'}
                    className={`wheel-segment ${rarity}`}
                  />
                  <text
                    x={textX}
                    y={textY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="segment-text"
                    transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                    fontSize="8"
                    fill="#fff"
                    stroke="#000"
                    strokeWidth="0.5"
                  >
                    {name}
                  </text>
                </g>
              );
            })}
          </svg>
          
          {/* Center Hub */}
          <div className="wheel-center">
            <div className="center-skull">💀</div>
          </div>
        </motion.div>
        
        {/* Pointer */}
        <div className="wheel-pointer">
          <div className="pointer-triangle" />
        </div>
      </div>
      
      {/* Spin Controls */}
      <div className="spin-controls">
        <div className="spin-cost">
          <label>
            Spin Cost: 
            <input 
              type="number" 
              step="0.001"
              value={spinCost}
              onChange={(e) => setSpinCost(parseFloat(e.target.value))}
              disabled={isSpinning}
              min="0.001"
              max="1"
            />
            ETH
          </label>
        </div>
        
        <button 
          className={`spin-button ${isSpinning ? 'spinning' : ''}`}
          onClick={handleSpin}
          disabled={isSpinning || disabled}
        >
          {isSpinning ? (
            <span className="spin-text">SPINNING...</span>
          ) : (
            <span className="spin-text">SPIN THE WHEEL</span>
          )}
        </button>
        
        {selectedSegment && (
          <AnimatePresence>
            <motion.div
              className="last-result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              Last: <span className={selectedSegment.rarity}>{selectedSegment.name}</span>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <style jsx>{`
        .wheel-container {
          position: absolute;
          top: 50%;
          right: -100px;
          transform: translateY(-50%);
          width: 300px;
          height: 300px;
        }

        .wheel-backdrop {
          position: absolute;
          top: -20px;
          left: -20px;
          right: -20px;
          bottom: -20px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139, 0, 139, 0.1) 0%, transparent 70%);
        }

        .wheel-glow {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          box-shadow: 0 0 50px rgba(139, 0, 139, 0.3);
          animation: wheel-glow-pulse 2s ease-in-out infinite;
        }

        .wheel-wrapper {
          position: relative;
          width: 250px;
          height: 250px;
          margin: 25px auto;
        }

        .wheel {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          position: relative;
          overflow: hidden;
          box-shadow: 
            0 0 20px rgba(0, 0, 0, 0.5),
            inset 0 0 20px rgba(255, 255, 255, 0.1);
        }

        .wheel-svg {
          width: 100%;
          height: 100%;
        }

        .wheel-segment {
          transition: filter 0.2s;
        }

        .wheel-segment.legendary {
          animation: legendary-segment-glow 2s ease-in-out infinite;
        }

        .segment-text {
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
          pointer-events: none;
        }

        .wheel-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          background: radial-gradient(circle, #000 0%, #8b0000 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
        }

        .center-skull {
          font-size: 20px;
          filter: drop-shadow(0 0 5px rgba(255, 0, 0, 0.8));
        }

        .wheel-pointer {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
        }

        .pointer-triangle {
          width: 0;
          height: 0;
          border-left: 15px solid transparent;
          border-right: 15px solid transparent;
          border-top: 25px solid #ffd700;
          filter: drop-shadow(0 0 5px rgba(255, 215, 0, 0.8));
        }

        .spin-controls {
          position: absolute;
          bottom: -80px;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          width: 200px;
        }

        .spin-cost {
          margin-bottom: 12px;
          font-size: 12px;
          color: #a89bb0;
        }

        .spin-cost input {
          width: 60px;
          margin: 0 5px;
          padding: 4px;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid #4a3958;
          color: #fff;
          border-radius: 4px;
        }

        .spin-button {
          background: linear-gradient(135deg, #8b0000 0%, #ff0000 100%);
          border: 2px solid #ff0000;
          color: #fff;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
          text-transform: uppercase;
          letter-spacing: 1px;
          width: 100%;
        }

        .spin-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #ff0000 0%, #ff6b6b 100%);
          box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
          transform: translateY(-2px);
        }

        .spin-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spin-button.spinning {
          animation: spin-button-pulse 0.5s ease-in-out infinite;
        }

        .last-result {
          margin-top: 12px;
          font-size: 14px;
          color: #d4c5db;
        }

        .last-result .common { color: #808080; }
        .last-result .uncommon { color: #00ff00; }
        .last-result .rare { color: #0080ff; }
        .last-result .legendary { color: #ff8000; }

        @keyframes wheel-glow-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        @keyframes legendary-segment-glow {
          0%, 100% { filter: drop-shadow(0 0 5px rgba(255, 140, 0, 0.8)); }
          50% { filter: drop-shadow(0 0 15px rgba(255, 140, 0, 1)); }
        }

        @keyframes spin-button-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}