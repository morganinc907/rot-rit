
import React from "react";
import "../styles/Codex.css";

export default function CodexEvent({ event }) {
  const { kind, data, owner, borderColor } = event;
  
  const shortAddress = (addr) => addr ? addr.slice(0, 6) + "..." + addr.slice(-4) : "Unknown";

  let title = "";
  let subtitle = "";

  switch (kind) {
    case "sacrifice":
      title = "Sacrifice Ritual";
      subtitle = `${shortAddress(owner)} sacrificed ${data.tokenCount} offerings to the Maw`;
      break;
    case "equip":
      title = "Cosmetic Equipped";
      subtitle = `${shortAddress(owner)} equipped cosmetic on Raccoon #${event.raccoonId}`;
      break;
    case "unequip":
      title = "Cosmetic Unequipped";
      subtitle = `${shortAddress(owner)} unequipped cosmetic from Raccoon #${event.raccoonId}`;
      break;
    case "outfit":
      title = "Outfit Complete";
      subtitle = `${shortAddress(owner)} completed an outfit on Raccoon #${event.raccoonId}`;
      break;
    case "demon_summoned":
      title = "Demon Summoned";
      subtitle = `${shortAddress(owner)} summoned Demon #${data.demonId} with Raccoon #${event.raccoonId}`; 
      break;
    case "relic_reward":
      title = "Relic Discovered";
      subtitle = `${shortAddress(owner)} discovered Relic #${data.relicId}`; 
      break;
    case "cosmetic_reward":
      title = "Cosmetic Granted";
      subtitle = `${shortAddress(owner)} received Cosmetic #${data.cosmeticId}`;
      break;
    case "raccoon_minted":
      title = "Raccoon Summoned";
      subtitle = `${shortAddress(owner)} summoned a new Raccoon`;
      break;
    case "raccoon_transferred":
      title = "Raccoon Transferred";
      subtitle = `Raccoon transferred to ${shortAddress(owner)}`;
      break;
    default:
      title = "Ritual Activity";
      subtitle = `${shortAddress(owner)} performed ${kind} ritual`;
  }

  return (
    <div className="codex-event" style={{ borderColor: borderColor || "#6B7280", backgroundColor: `${borderColor || "#6B7280"}20` }}>
      <div className="codex-event-title">{title}</div>
      <div className="codex-event-subtitle">{subtitle}</div>
    </div>
  );
}
