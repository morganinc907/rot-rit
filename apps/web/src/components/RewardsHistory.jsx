import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function RewardsHistory({ rewards }) {
  const [globalFeed, setGlobalFeed] = useState([]);

  // Simulate global feed updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Mock global activity
      const mockReward = {
        id: Date.now(),
        user: '0x' + Math.random().toString(16).slice(2, 8),
        reward: ['Ember', 'Bone Charm', 'Lantern Shard', 'Blood Vial'][Math.floor(Math.random() * 4)],
        type: 'wheel',
        timestamp: new Date(),
        rarity: Math.random() > 0.9 ? 'legendary' : Math.random() > 0.7 ? 'rare' : 'common'
      };
      
      setGlobalFeed(prev => [mockReward, ...prev.slice(0, 19)]);
    }, 5000 + Math.random() * 10000); // Random interval 5-15s

    return () => clearInterval(interval);
  }, []);

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const getRarityIcon = (rarity) => {
    switch(rarity) {
      case 'legendary': return '⭐';
      case 'mythic': return '💫';
      case 'rare': return '💎';
      case 'uncommon': return '🔷';
      default: return '⚫';
    }
  };

  return (
    <div className="rewards-history-container">
      <div className="rewards-header">
        <h2>🏆 REWARDS FEED</h2>
        <p>Recent Maw activity</p>
      </div>

      <div className="rewards-tabs">
        <div className="tab active">
          <span>🌍 Global</span>
        </div>
        <div className="tab">
          <span>👤 Your History</span>
        </div>
      </div>

      <div className="rewards-feed">
        <AnimatePresence>
          {/* Your recent rewards first */}
          {rewards.map((reward, index) => (
            <motion.div
              key={`user-${reward.id}-${index}`}
              className="reward-item user-reward"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="reward-icon">
                {getRarityIcon(reward.rarity)}
              </div>
              <div className="reward-details">
                <div className="reward-text">
                  <span className="reward-you">YOU</span> received{' '}
                  <span className={`reward-name ${reward.rarity}`}>
                    {reward.reward?.name || reward.reward}
                  </span>
                </div>
                <div className="reward-meta">
                  <span className="reward-type">
                    {reward.type === 'wheel' ? '🎰 Wheel' : '🔥 Sacrifice'}
                  </span>
                  <span className="reward-time">
                    {formatTimeAgo(reward.timestamp)}
                  </span>
                </div>
              </div>
              <div className="reward-glow" />
            </motion.div>
          ))}

          {/* Global feed */}
          {globalFeed.map((activity, index) => (
            <motion.div
              key={`global-${activity.id}`}
              className="reward-item global-reward"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="reward-icon">
                {getRarityIcon(activity.rarity)}
              </div>
              <div className="reward-details">
                <div className="reward-text">
                  <span className="reward-user">
                    {formatAddress(activity.user)}
                  </span>{' '}
                  received{' '}
                  <span className={`reward-name ${activity.rarity}`}>
                    {activity.reward}
                  </span>
                </div>
                <div className="reward-meta">
                  <span className="reward-type">
                    {activity.type === 'wheel' ? '🎰 Wheel' : '🔥 Sacrifice'}
                  </span>
                  <span className="reward-time">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {rewards.length === 0 && globalFeed.length === 0 && (
          <div className="empty-feed">
            <div className="empty-icon">👁️</div>
            <p>The Maw watches... waiting for offerings</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .rewards-history-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .rewards-header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #4a7c59;
          padding-bottom: 16px;
        }

        .rewards-header h2 {
          font-size: 18px;
          color: #51cf66;
          margin: 0 0 8px 0;
          text-shadow: 0 0 10px rgba(81, 207, 102, 0.5);
        }

        .rewards-header p {
          font-size: 12px;
          color: #69db7c;
          margin: 0;
        }

        .rewards-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 16px;
          background: rgba(0, 0, 0, 0.3);
          padding: 4px;
          border-radius: 6px;
        }

        .tab {
          flex: 1;
          padding: 8px 12px;
          text-align: center;
          background: rgba(74, 124, 89, 0.2);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 12px;
        }

        .tab.active {
          background: rgba(74, 124, 89, 0.5);
          color: #51cf66;
        }

        .tab:hover {
          background: rgba(74, 124, 89, 0.4);
        }

        .rewards-feed {
          flex: 1;
          overflow-y: auto;
          padding-right: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .rewards-feed::-webkit-scrollbar {
          width: 6px;
        }

        .rewards-feed::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
        }

        .rewards-feed::-webkit-scrollbar-thumb {
          background: #4a7c59;
          border-radius: 3px;
        }

        .reward-item {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(74, 124, 89, 0.3);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          transition: all 0.3s;
        }

        .reward-item.user-reward {
          border-color: rgba(81, 207, 102, 0.6);
          background: rgba(81, 207, 102, 0.1);
        }

        .reward-item.global-reward {
          opacity: 0.8;
        }

        .reward-item:hover {
          transform: translateX(4px);
          border-color: rgba(81, 207, 102, 0.8);
        }

        .reward-icon {
          font-size: 20px;
          min-width: 24px;
          text-align: center;
        }

        .reward-details {
          flex: 1;
          min-width: 0;
        }

        .reward-text {
          font-size: 13px;
          color: #d4c5db;
          margin-bottom: 4px;
          line-height: 1.3;
        }

        .reward-you {
          color: #51cf66;
          font-weight: bold;
        }

        .reward-user {
          color: #69db7c;
          font-weight: bold;
        }

        .reward-name {
          font-weight: bold;
        }

        .reward-name.common { color: #808080; }
        .reward-name.uncommon { color: #00ff00; }
        .reward-name.rare { color: #0080ff; }
        .reward-name.legendary { 
          color: #ff8c00; 
          text-shadow: 0 0 10px rgba(255, 140, 0, 0.6);
        }
        .reward-name.mythic { 
          color: #ff00ff; 
          text-shadow: 0 0 10px rgba(255, 0, 255, 0.6);
        }

        .reward-meta {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #69db7c;
          opacity: 0.8;
        }

        .reward-type {
          background: rgba(74, 124, 89, 0.3);
          padding: 2px 6px;
          border-radius: 3px;
        }

        .reward-time {
          font-style: italic;
        }

        .reward-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(81, 207, 102, 0.1) 50%, transparent 100%);
          border-radius: 8px;
          opacity: 0;
          animation: reward-glow 2s ease-in-out infinite;
        }

        .user-reward .reward-glow {
          opacity: 1;
        }

        .empty-feed {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #4a7c59;
          text-align: center;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-feed p {
          font-style: italic;
          opacity: 0.8;
        }

        @keyframes reward-glow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}