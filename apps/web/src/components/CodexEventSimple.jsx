// src/components/CodexEventSimple.jsx
import React from "react";
import { motion } from "framer-motion";

const EVENT_ICONS = {
  demon_summoned: "🩸",
  raccoon_sacrifice_failed: "💀", 
  sacrifice: "🩸",
  cosmetic_reward: "✨",
  relic_reward: "🪙",
  cosmetic_equipped: "🎭",
  equip: "🎭",
  cosmetic_unequipped: "⚡",
  unequip: "⚡",
  outfit: "🎭",
  join: "🕯️",
  ascend: "🔥",
  wheel: "🎡"
};

const CodexEventSimple = ({ event, index = 0 }) => {
  const { type, kind, owner, raccoonId, cosmeticId, relicId, demonId, success, data = {} } = event;
  const eventType = type || kind;
  
  const rarityGlow = {
    demon_summoned: "mythic",
    cosmetic_reward: "epic", 
    relic_reward: "rare",
    cosmetic_equipped: "uncommon",
    equip: data.rarity >= 3 ? "epic" : "uncommon",
    cosmetic_unequipped: "common",
    unequip: "common",
    raccoon_sacrifice_failed: "common",
    sacrifice: success ? "rare" : "common",
    outfit: "epic",
    ascend: success ? "mythic" : "rare",
    join: "uncommon",
    wheel: "rare"
  }[eventType] || "common";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        duration: 0.25,
        delay: index * 0.05,
        ease: "easeOut"
      }}
      className={`codex-event ${rarityGlow}`}
    >
      <div className="codex-icon">
        {EVENT_ICONS[eventType] || "❓"}
      </div>
      <div className="codex-content">
        <p>
          <strong>{shortAddr(owner)}</strong>{" "}
          {renderEventMessage(eventType, raccoonId, cosmeticId, relicId, demonId, success, data)}
        </p>
        <span className="codex-type">{formatType(eventType)}</span>
      </div>
    </motion.div>
  );
};

const renderEventMessage = (type, raccoonId, cosmeticId, relicId, demonId, success, data = {}) => {
  switch (type) {
    case "demon_summoned":
      return `summoned DEMON #${demonId || data.demonId}! 🔥`;
    case "raccoon_sacrifice_failed":
    case "sacrifice":
      if (success === false) {
        return `sacrificed raccoon #${raccoonId || data.raccoonId}, but the Maw rejected them.`;
      }
      return `sacrificed raccoon #${raccoonId || data.raccoonId} to the Maw`;
    case "cosmetic_reward":
      return `earned cosmetic #${cosmeticId || data.cosmeticId}`;
    case "relic_reward":
      return `discovered relic #${relicId || data.relicId}`;
    case "cosmetic_equipped":
    case "equip":
      const rarity = data.rarity >= 3 ? " (EPIC)" : "";
      return `equipped cosmetic #${cosmeticId || data.cosmeticId}${rarity}`;
    case "cosmetic_unequipped":
    case "unequip":
      return `unequipped cosmetic #${cosmeticId || data.cosmeticId}`;
    case "outfit":
      return `bound complete outfit to raccoon #${raccoonId || data.raccoonId}`;
    case "join":
      return `joined the cult with raccoon #${raccoonId}`;
    case "ascend":
      if (success) {
        return `successfully ascended raccoon #${raccoonId} to demon status!`;
      }
      return `attempted ascension for raccoon #${raccoonId} but failed`;
    case "wheel":
      return `spun the Wheel of Maw and received reward #${data.rewardId}`;
    default:
      return "performed a mysterious ritual...";
  }
};

const formatType = (type) =>
  type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const shortAddr = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : 'Unknown';

export default CodexEventSimple;