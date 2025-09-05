// Convert UI selection to contract format
export function formatItemsForSacrifice(selectedItems) {
  return selectedItems.map(item => {
    let typeCode;
    
    // Map item types to contract codes
    switch (item.type) {
      case 'raccoon':
        typeCode = 0;
        break;
      case 'demon':
        typeCode = 1;
        break;
      case 'relic':
        typeCode = 2;
        break;
      default:
        throw new Error(`Unknown item type: ${item.type}`);
    }

    const formatted = {
      typeCode,
      id: Number(item.id)
    };

    // Only add amount for relics (ERC1155)
    if (item.type === 'relic' && item.amount) {
      formatted.amount = Number(item.amount);
    }

    return formatted;
  });
}

// Convert contract response back to UI format
export function parseContractResult(result) {
  return {
    success: result.success,
    txHash: result.txHash,
    error: result.error,
    timestamp: new Date(),
    type: 'sacrifice'
  };
}

// Validate items before sacrifice
export function validateSacrificeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("No items selected for sacrifice");
  }

  for (const item of items) {
    if (!item.type || !item.id) {
      throw new Error("Invalid item format: missing type or id");
    }

    if (item.type === 'relic' && (!item.amount || item.amount < 1)) {
      throw new Error(`Invalid relic amount: ${item.amount}`);
    }

    if (typeof item.id !== 'number' && typeof item.id !== 'string') {
      throw new Error(`Invalid item id: ${item.id}`);
    }
  }

  return true;
}

// Helper to calculate total sacrifice value estimate
export function estimateTotalSacrificeValue(items) {
  return items.reduce((total, item) => {
    const baseValue = estimateItemValue(item);
    const quantity = item.type === 'relic' ? (item.amount || 1) : 1;
    return total + (baseValue * quantity);
  }, 0);
}

function estimateItemValue(item) {
  switch (item.type) {
    case 'raccoon':
      return (item.tier || 1) * 0.005; // 0.005-0.025 ETH based on tier
    case 'demon':
      if (item.tier === 3) return 0.1;   // Mythic
      if (item.tier === 2) return 0.05;  // Rare
      return 0.02;                       // Common
    case 'relic':
      const rarityValues = {
        common: 0.001,
        uncommon: 0.005,
        rare: 0.01,
        legendary: 0.05,
        cosmetic: 0.002,
        special: 0.008
      };
      return rarityValues[item.rarity] || 0.001;
    default:
      return 0;
  }
}