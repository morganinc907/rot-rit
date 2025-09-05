// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

interface IRelics {
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function burn(address from, uint256 id, uint256 amount) external;
    function mint(address to, uint256 id, uint256 amount, bytes memory data) external;
}

interface ICosmeticsV2 {
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function burn(address from, uint256 id, uint256 amount) external;
    function mintTo(address to, uint256 typeId) external;
}

/**
 * @title MawSacrificeV4Hardened
 * @dev Hardened implementation with configurable IDs and safe error handling
 */
contract MawSacrificeV4Hardened is 
    OwnableUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    // Contract addresses
    IRelics public relics;
    ICosmeticsV2 public cosmetics;
    
    // Configurable token IDs (PASS 1A)
    uint256 private _capId;        // rusted caps (canonical sacrifice currency)
    uint256 private _keyId;        // legacy keys
    uint256 private _fragId;       // lantern fragments (for cosmetic)
    uint256 private _shardId;      // shard fallback (safety)
    
    // State variables
    uint256 public sacrificeNonce;
    bool public sacrificesPaused;
    bool public conversionsPaused;
    uint256[] public currentCosmeticTypes;
    
    // Events for debugging (PASS 1B)
    event Step(bytes32 tag, uint256 a, uint256 b);
    event DebugRevert(string where, bytes data);
    event IdsSet(uint256 cap, uint256 key, uint256 frag, uint256 shard);
    event SacrificeCompleted(address indexed user, uint256 amount, uint256 nonce);
    event RewardMinted(address indexed user, uint256 rewardId, uint256 nonce);
    event FallbackShard(address indexed user, uint256 attemptedRewardId, uint256 nonce);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(address _relics, address _cosmetics) public reinitializer(4) {
        __Ownable_init(msg.sender);
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        relics = IRelics(_relics);
        cosmetics = ICosmeticsV2(_cosmetics);
        
        // Initialize with safe defaults
        _capId = 0;      // Rusted Caps
        _keyId = 1;      // Rusted Keys (legacy)
        _fragId = 2;     // Lantern Fragments
        _shardId = 6;    // Glass Shards (fallback)
        
        emit IdsSet(_capId, _keyId, _fragId, _shardId);
    }
    
    // PASS 1A: Configurable IDs
    function configureIds(uint256 cap, uint256 key, uint256 frag, uint256 shard)
        external onlyOwner reinitializer(5) {
        _capId = cap;
        _keyId = key;
        _fragId = frag;
        _shardId = shard;
        emit IdsSet(cap, key, frag, shard);
    }
    
    function capId() external view returns (uint256) { return _capId; }
    function keyId() external view returns (uint256) { return _keyId; }
    function fragId() external view returns (uint256) { return _fragId; }
    function shardId() external view returns (uint256) { return _shardId; }
    
    // PASS 1B: Safe core functions with error bubbling
    function _burnAsMaw(address user, uint256 id, uint256 amount) internal {
        try relics.burn(user, id, amount) {} catch (bytes memory data) {
            emit DebugRevert("burn", data);
            assembly { revert(add(data, 0x20), mload(data)) }
        }
    }
    
    function _mintAsMaw(address to, uint256 id, uint256 amount) internal {
        try relics.mint(to, id, amount, "") {} catch (bytes memory data) {
            emit DebugRevert("mint", data);
            assembly { revert(add(data, 0x20), mload(data)) }
        }
    }
    
    // RNG functions
    function _generateSeed(uint256 nonce) private view returns (bytes32) {
        return keccak256(abi.encodePacked(
            block.prevrandao,
            block.timestamp,
            block.number,
            msg.sender,
            nonce
        ));
    }
    
    function _drawReward(bytes32 seed, uint256 iteration) internal pure returns (uint256) {
        bytes32 hash = keccak256(abi.encodePacked(seed, iteration));
        uint256 rand = uint256(hash) % 1000;
        
        // Simple reward distribution
        if (rand < 500) return 1;  // 50% - Rusted Key
        if (rand < 750) return 2;  // 25% - Lantern Fragment  
        if (rand < 900) return 3;  // 15% - Worm-eaten Mask
        if (rand < 950) return 4;  // 5% - Bone Dagger
        if (rand < 980) return 5;  // 3% - Ash Vial
        if (rand < 995) return 6;  // 1.5% - Glass Shard
        if (rand < 999) return 7;  // 0.4% - Soul Deed
        return 8;                  // 0.1% - Ashes
    }
    
    // PASS 1B: RNG preview (pure/view) for off-chain branch checks
    function previewRewards(uint256 amount, bytes32 seed) external pure returns (uint256[] memory ids) {
        ids = new uint256[](amount);
        for (uint256 i = 0; i < amount; ++i) {
            ids[i] = _drawReward(seed, i);
        }
    }
    
    // PASS 1B: Safe sacrifice core - burn 1 per loop, mint with fallback
    function _sacrifice(uint256 burnId, uint256 amount) internal nonReentrant whenNotPaused {
        require(!sacrificesPaused, "Sacrifices paused");
        require(amount > 0 && amount <= 10, "Invalid amount");
        
        bytes32 seed = _generateSeed(sacrificeNonce);
        emit Step("sacrifice_start", amount, sacrificeNonce);
        
        for (uint256 i = 0; i < amount; ++i) {
            // Burn 1 token per iteration (safer)
            _burnAsMaw(msg.sender, burnId, 1);
            emit Step("after_burn", burnId, i);
            
            // Draw reward
            uint256 rewardId = _drawReward(seed, i);
            emit Step("before_mint", rewardId, i);
            
            // Try the reward; if it fails (cap/allowlist), mint a shard instead (no bricking)
            try relics.mint(msg.sender, rewardId, 1, "") {
                emit RewardMinted(msg.sender, rewardId, sacrificeNonce);
            } catch (bytes memory data) {
                emit DebugRevert("reward_mint", data);
                emit FallbackShard(msg.sender, rewardId, sacrificeNonce);
                _mintAsMaw(msg.sender, _shardId, 1);  // Fallback to shards
            }
            emit Step("after_mint", rewardId, i);
        }
        
        sacrificeNonce++;
        emit SacrificeCompleted(msg.sender, amount, sacrificeNonce - 1);
    }
    
    // Public entrypoints route to _sacrifice with configured IDs
    function sacrificeCaps(uint256 amount) external {
        _sacrifice(_capId, amount);
    }
    
    function sacrificeLegacyKeys(uint256 amount) external {
        _sacrifice(_keyId, amount);
    }
    
    function sacrificeForCosmetic(uint256 amount) external {
        _sacrifice(_fragId, amount);
    }
    
    // Legacy function names for compatibility
    function sacrificeKeys(uint256 amount) external {
        _sacrifice(_capId, amount);  // Route to caps
    }
    
    // Safe conversion function
    function convertShardsToRustedCaps(uint256 shardAmount) external nonReentrant whenNotPaused {
        require(!conversionsPaused, "Conversions paused");
        require(shardAmount >= 5, "Need at least 5 shards");
        require(shardAmount % 5 == 0, "Must be multiple of 5");
        
        uint256 capsToMint = shardAmount / 5;
        
        // Burn shards first
        _burnAsMaw(msg.sender, _shardId, shardAmount);
        
        // Mint caps
        _mintAsMaw(msg.sender, _capId, capsToMint);
        
        emit Step("conversion", shardAmount, capsToMint);
    }
    
    // Admin functions
    function setContracts(address _relics, address _cosmetics) external onlyOwner {
        relics = IRelics(_relics);
        cosmetics = ICosmeticsV2(_cosmetics);
    }
    
    function setSacrificesPaused(bool _paused) external onlyOwner {
        sacrificesPaused = _paused;
    }
    
    function setConversionsPaused(bool _paused) external onlyOwner {
        conversionsPaused = _paused;
    }
    
    function setCurrentCosmeticTypes(uint256[] calldata types) external onlyOwner {
        currentCosmeticTypes = types;
    }
    
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}