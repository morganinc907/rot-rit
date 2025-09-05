# Economy Design Document

This document defines the economic mechanics and ratios for the Rot Ritual sacrifice system.

## Core Economic Ratios

### Glass Shard → Rusted Cap Conversion
- **Ratio**: 5:1 (5 Glass Shards → 1 Rusted Cap)
- **Purpose**: Provides guaranteed progression path from failures
- **Implementation**: `convertShardsToRustedCaps()` enforces multiple-of-5 requirement

### Key Sacrifice Outcomes
| Outcome | Probability | Reward |
|---------|------------|--------|
| Lantern Fragment | 30% | 1x Fragment |
| Worm-eaten Mask | 15% | 1x Mask |
| Bone Dagger | 7.5% | 1x Dagger |
| Ash Vial | 2.5% | 1x Vial |
| Binding Contract | 1.5% | 1x Contract (ultra-rare) |
| Soul Deed | 0.5% | 1x Deed (ultra-rare) |
| **Failure** | 43% | 50% chance of 1x Glass Shard |

**Total Success Rate**: 57%  
**Glass Shard on Failure**: 50% (21.5% overall Glass Shard rate)

### Cosmetic Sacrifice Outcomes
- **Input**: 1-10 Cosmetics (any current monthly types)
- **Success Rate**: 70% → 1x Rare Demon
- **Failure Rate**: 30% → 50% chance of 1x Glass Shard
- **Glass Shard Rate**: 15% overall

### Demon Sacrifice Outcomes
| Input Tier | Success Rate | Output | Failure Reward |
|------------|-------------|---------|----------------|
| Rare (Tier 1) | 50% | 1x Rare Demon | 100% Glass Shard |
| Mythic (Tier 2) | 20% | 1x Mythic Demon* | 100% Glass Shard |

*Subject to global mythic cap

## Supply Constraints

### Mythic Demons
- **Global Lifetime Cap**: 100 total across all users
- **Auto-downgrade**: When cap reached, mythic attempts auto-downgrade to rare
- **Per-user Tracking**: `userMythicCount[address]` tracks individual mythic ownership
- **Implementation**: `mythicDemonsMinted` counter enforces cap

### Ultra-Rare 1/1 Items
| Item | Total Supply | Purpose |
|------|-------------|----------|
| Binding Contract | 1 | Ultra-rare achievement |
| Soul Deed | 1 | Ultimate rare achievement |

### Cosmetic System
- **Monthly Rotation**: `currentCosmeticTypes[]` updated monthly
- **Flexible Input**: Users can sacrifice any combination of current types
- **Burn Priority**: Sacrifices burn from first available type by balance

## Failure Compensation System

### Glass Shard Award Rates
| Activity | Success Rate | Failure Shard Rate | Overall Shard Rate |
|----------|-------------|-------------------|-------------------|
| Key Sacrifice | 57% | 50% (of 43% failures) | 21.5% |
| Cosmetic Sacrifice | 70% | 50% (of 30% failures) | 15% |
| Demon Sacrifice | 20-50% | 100% (of failures) | 50-80% |

**Design Philosophy**: Higher-risk activities provide better failure compensation

### Conversion Economics
- **5:1 Ratio**: Balances progression vs. scarcity
- **Guaranteed Progress**: No RNG in conversion, always succeeds
- **Failure Recovery**: ~5 failed key sacrifices → 1 guaranteed cap

## Economic Balance Goals

### Progression Pacing
1. **Casual Players**: Can progress through failures → shards → caps
2. **Active Players**: Higher volume = more rare items through probability
3. **Collectors**: Ultra-rares (1/1 items, mythic demons) for dedicated players

### Mythic Demon Economics
- **Scarcity Value**: Only 100 ever created
- **Fair Distribution**: No per-wallet limits (first-come, first-served)
- **Attempt Cost**: Requires rare demons + significant gas
- **Risk/Reward**: 80% failure rate with guaranteed shard compensation

### Anti-Inflation Measures
1. **Burn Mechanics**: All inputs are burned (deflationary)
2. **Supply Caps**: Hard limits on ultra-rares
3. **Progressive Difficulty**: Higher tiers require more resources

## Rate Limiting & Anti-Bot

### Block Throttling
- **Default**: 1 block between sacrifices per address
- **Purpose**: Prevents MEV extraction and spam
- **Tunable**: Can adjust `minBlocksBetweenSacrifices` per network

### Granular Pause Controls
- **Sacrifices**: Can pause all sacrifice operations independently  
- **Conversions**: Can pause shard conversion independently
- **Use Cases**: Emergency response, maintenance, economic adjustments

## Economic Monitoring

### Key Metrics to Track
1. **Mythic Demon Minted**: Should approach 100 over time
2. **Glass Shard Circulation**: Monitor inflation vs. conversion burn
3. **Ultra-rare Distribution**: Ensure fair access to 1/1 items
4. **Success Rate Variance**: Monitor if actual rates match expected

### Adjustment Levers
1. **Conversion Ratio**: Currently 5:1, could adjust if needed
2. **Success Rates**: Probability tables in contract code
3. **Failure Compensation**: Glass shard award rates
4. **Throttle Speed**: Block delays between actions

## Future Economic Expansions

### Potential Additions
1. **Seasonal Events**: Temporary rate bonuses
2. **Achievement Multipliers**: Boost rates for specific milestones  
3. **Cross-Collection Synergy**: Benefits for holding multiple NFT types
4. **Staking Rewards**: Time-locked benefits

### Upgrade Considerations
- **Backward Compatibility**: Preserve existing token values
- **Migration Path**: Smooth transition for holders
- **Emergency Controls**: Maintain pause and adjustment capabilities

## Economic Security

### Attack Vectors
1. **MEV Extraction**: Mitigated by block throttling + randomness
2. **Flash Loan Manipulation**: Not applicable (NFT-based, not price-based)
3. **Spam Attacks**: Rate limited by block throttling
4. **Economic Exploits**: Carefully audited probability math

### Fail-safes
1. **Circuit Breakers**: Pause functionality for emergencies
2. **Supply Caps**: Hard limits prevent infinite inflation
3. **Upgrade Path**: Can adjust economics via timelock upgrades
4. **Role-based Access**: Granular permissions for different operations

## Implementation Details

### Randomness Source
- **Method**: `block.prevrandao + timestamp + user + amount`
- **Deterministic**: Same inputs produce same results (testable)
- **Unpredictable**: Cannot be manipulated by users
- **No Oracles**: Self-contained, no external dependencies

### Gas Optimization
- **Batch Operations**: Single transaction handles multiple items
- **Loop Efficiency**: Early termination where possible
- **Storage Packing**: Efficient data structures

### Error Handling
- **Graceful Failures**: Failed demon mints still award compensation
- **Clear Errors**: Custom error types for better UX
- **State Recovery**: Operations are atomic (succeed or revert completely)

---

## Change Log

**Version 4.0** (Current)
- Added 24-hour upgrade timelock
- Implemented granular pause controls
- Added role-based access control
- Introduced mythic demon auto-downgrade

**Version 3.0**
- Added glass shard conversion system (5:1 ratio)
- Implemented mythic demon lifetime cap (100 max)
- Added anti-bot block throttling

**Version 2.0** 
- Separated cosmetic and demon sacrifice mechanics
- Added monthly cosmetic rotation system

**Version 1.0**
- Basic key sacrifice with probability table
- Ultra-rare 1/1 item implementation