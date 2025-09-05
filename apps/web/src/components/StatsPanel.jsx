import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function StatsPanel({ raccoon, relics, stats }) {
  const [simulation, setSimulation] = useState(null);
  
  const runSimulation = () => {
    if (!stats) return;
    
    const results = { success: 0, common: 0, rare: 0, mythic: 0, fail: 0 };
    
    for (let i = 0; i < 1000; i++) {
      const roll = Math.random() * 100;
      if (roll < stats.successRate) {
        const tierRoll = Math.random() * 100;
        if (tierRoll < stats.mythicChance) {
          results.mythic++;
        } else if (tierRoll < stats.mythicChance + stats.rareChance) {
          results.rare++;
        } else {
          results.common++;
        }
        results.success++;
      } else {
        results.fail++;
      }
    }
    
    setSimulation(results);
  };

  return (
    <div className="stats-content">
      <h2 className="stats-title">Ascension Calculator</h2>
      
      {raccoon ? (
        <>
          {/* Selected Raccoon Info */}
          <div className="stats-section">
            <h3>Selected Raccoon</h3>
            <div className="stat-row">
              <span className="stat-label">Token ID:</span>
              <span className="stat-value">#{raccoon.id}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">State:</span>
              <span className={`stat-value state-${raccoon.state?.toLowerCase()}`}>
                {raccoon.state}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Rarity Tier:</span>
              <span className="stat-value tier">Tier {raccoon.tier || 1}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Base Success:</span>
              <span className="stat-value">{raccoon.baseSuccess || 10}%</span>
            </div>
          </div>

          {/* Selected Relics */}
          {relics.length > 0 && (
            <div className="stats-section">
              <h3>Active Relics</h3>
              {relics.map(relic => (
                <div key={relic.id} className="relic-stat">
                  <span className="relic-name">{relic.name}</span>
                  <span className="relic-bonus">+{relic.bonus}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Calculated Stats */}
          {stats && (
            <div className="stats-section highlighted">
              <h3>Ritual Odds</h3>
              <div className="stat-row large">
                <span className="stat-label">Success Rate:</span>
                <span className="stat-value success-rate">
                  {stats.successRate.toFixed(1)}%
                </span>
              </div>
              
              <div className="demon-odds">
                <h4>If Successful:</h4>
                <div className="stat-row">
                  <span className="stat-label">Common Demon:</span>
                  <span className="stat-value">{stats.commonChance.toFixed(1)}%</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Rare Demon:</span>
                  <span className="stat-value rare">{stats.rareChance.toFixed(1)}%</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Mythic Demon:</span>
                  <span className="stat-value mythic">{stats.mythicChance.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Simulation Results */}
          {simulation && (
            <motion.div 
              className="stats-section simulation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3>Simulation Results (1000x)</h3>
              <div className="simulation-results">
                <div className="result-bar">
                  <div 
                    className="bar-segment fail" 
                    style={{ width: `${simulation.fail / 10}%` }}
                  >
                    {simulation.fail}
                  </div>
                  <div 
                    className="bar-segment common" 
                    style={{ width: `${simulation.common / 10}%` }}
                  >
                    {simulation.common}
                  </div>
                  <div 
                    className="bar-segment rare" 
                    style={{ width: `${simulation.rare / 10}%` }}
                  >
                    {simulation.rare}
                  </div>
                  <div 
                    className="bar-segment mythic" 
                    style={{ width: `${simulation.mythic / 10}%` }}
                  >
                    {simulation.mythic}
                  </div>
                </div>
                <div className="result-legend">
                  <span className="legend-item fail">Fail: {(simulation.fail / 10).toFixed(1)}%</span>
                  <span className="legend-item common">Common: {(simulation.common / 10).toFixed(1)}%</span>
                  <span className="legend-item rare">Rare: {(simulation.rare / 10).toFixed(1)}%</span>
                  <span className="legend-item mythic">Mythic: {(simulation.mythic / 10).toFixed(1)}%</span>
                </div>
              </div>
            </motion.div>
          )}
        </>
      ) : (
        <div className="stats-empty">
          <p>Select a raccoon to view ascension odds</p>
        </div>
      )}

      <style jsx>{`
        .stats-content {
          color: #d4c5db;
        }

        .stats-title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #fff;
          text-align: center;
        }

        .stats-section {
          background: rgba(0, 0, 0, 0.5);
          padding: 16px;
          border-radius: 4px;
          margin-bottom: 16px;
          border: 1px solid #4a3958;
        }

        .stats-section.highlighted {
          background: linear-gradient(135deg, rgba(138, 43, 226, 0.1) 0%, rgba(74, 57, 88, 0.2) 100%);
          border-color: #8a2be2;
        }

        .stats-section h3 {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 12px;
          color: #8a2be2;
          text-transform: uppercase;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid rgba(74, 57, 88, 0.3);
        }

        .stat-row:last-child {
          border-bottom: none;
        }

        .stat-row.large {
          padding: 12px 0;
          font-size: 18px;
        }

        .stat-label {
          color: #a89bb0;
          font-size: 13px;
        }

        .stat-value {
          color: #fff;
          font-weight: bold;
          font-size: 13px;
        }

        .stat-value.success-rate {
          color: #00ff00;
          font-size: 20px;
        }

        .stat-value.rare {
          color: #0080ff;
        }

        .stat-value.mythic {
          color: #ff00ff;
        }

        .state-normal { color: #00ff00; }
        .state-cult { color: #ff00ff; }
        .state-dead { color: #ff0000; }

        .relic-stat {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          background: rgba(138, 43, 226, 0.1);
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .relic-name {
          color: #d4c5db;
        }

        .relic-bonus {
          color: #00ff00;
          font-weight: bold;
        }

        .demon-odds {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #4a3958;
        }

        .demon-odds h4 {
          font-size: 12px;
          color: #a89bb0;
          margin-bottom: 8px;
        }

        .simulation-results {
          margin-top: 12px;
        }

        .result-bar {
          display: flex;
          height: 40px;
          border-radius: 4px;
          overflow: hidden;
          background: #000;
          border: 1px solid #4a3958;
        }

        .bar-segment {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 11px;
          font-weight: bold;
          transition: all 0.3s;
        }

        .bar-segment.fail { background: #ff0000; }
        .bar-segment.common { background: #808080; }
        .bar-segment.rare { background: #0080ff; }
        .bar-segment.mythic { background: #ff00ff; }

        .result-legend {
          display: flex;
          justify-content: space-around;
          margin-top: 8px;
          font-size: 11px;
        }

        .legend-item {
          padding: 4px 8px;
          border-radius: 3px;
        }

        .legend-item.fail { background: rgba(255, 0, 0, 0.2); color: #ff0000; }
        .legend-item.common { background: rgba(128, 128, 128, 0.2); color: #808080; }
        .legend-item.rare { background: rgba(0, 128, 255, 0.2); color: #0080ff; }
        .legend-item.mythic { background: rgba(255, 0, 255, 0.2); color: #ff00ff; }

        .stats-empty {
          text-align: center;
          padding: 40px;
          color: #4a3958;
        }
      `}</style>
    </div>
  );
}