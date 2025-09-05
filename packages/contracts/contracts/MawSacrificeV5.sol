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
    function mawSacrifice() external view returns (address);
}

interface ICosmeticsV2 {
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function burn(address from, uint256 id, uint256 amount) external;
    function mintTo(address to, uint256 typeId) external;
    function getCosmeticInfo(uint256 typeId) external view returns (
        string memory name,
        string memory description, 
        string memory imageURI,
        uint8 slot,
        uint8 rarity,
        uint256 supply,
        bool unlimited
    );
}

interface IDemons {
    function mintTo(address to, uint8 tier) external returns (uint256);
}

interface ICultists {
    function ownerOf(uint256 tokenId) external view returns (address);
    function burn(uint256 tokenId) external;
}

/**
 * @title MawSacrificeV5
 * @dev Storage-compatible hardened implementation with unstructured config storage
 * @notice Fixes arithmetic underflow and adds safe burn loops + revert bubbling
 */
contract MawSacrificeV5 is 
    OwnableUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    // KEEP EXACT SAME STORAGE LAYOUT AS V4NoTimelock - DO NOT CHANGE ORDER!
    
    // Contract addresses
    IRelics public relics;
    ICosmeticsV2 public cosmetics;
    IDemons public demons;
    ICultists public cultists;
    
    // Relic IDs (keep constants exactly as before)
    uint256 public constant RUSTED_CAP = 0;
    uint256 public constant LANTERN_FRAGMENT = 2;
    uint256 public constant WORM_EATEN_MASK = 3;
    uint256 public constant BONE_DAGGER = 4;
    uint256 public constant ASH_VIAL = 5;
    uint256 public constant GLASS_SHARD = 6;
    
    // State variables (keep exactly as before)
    uint256 public mythicDemonsMinted;
    uint256 public maxMythicDemons;
    bool public sacrificesPaused;
    bool public conversionsPaused;
    uint256[] public currentCosmeticTypes;
    uint256 public sacrificeNonce;
    
    // UNSTRUCTURED STORAGE FOR NEW CONFIG (no storage slot collision)
    bytes32 internal constant _CFG_SLOT = 
        bytes32(uint256(keccak256("maw.sacrifice.config.v5")) - 1);
    
    // UNSTRUCTURED STORAGE FOR ROLES (ecosystem integration)
    bytes32 internal constant _ROLES_SLOT = 
        bytes32(uint256(keccak256("maw.sacrifice.roles.v5")) - 1);
    
    // UNSTRUCTURED STORAGE FOR REWARD POOL (configurable rewards)
    bytes32 internal constant _REWARDS_SLOT = 
        bytes32(uint256(keccak256("maw.sacrifice.rewards.v5")) - 1);
    
    // UNSTRUCTURED STORAGE FOR COSMETIC POOL (configurable cosmetic rewards)
    bytes32 internal constant _COS_POOL_SLOT = 
        bytes32(uint256(keccak256("maw.cosmetics.pool.v1")) - 1);
    
    // UNSTRUCTURED STORAGE FOR COSMETIC SACRIFICE CONFIG (configurable requirements)
    bytes32 internal constant _COS_SACRIFICE_SLOT = 
        bytes32(uint256(keccak256("maw.cosmetics.sacrifice.v1")) - 1);
    
    struct MawConfig {
        uint256 capId;    // configurable rusted caps ID
        uint256 keyId;    // configurable rusted keys ID (legacy)
        uint256 fragId;   // configurable lantern fragment ID
        uint256 shardId;  // configurable shard ID (fallback)
    }
    
    struct RewardPool {
        uint256[] tokenIds;      // Reward token IDs
        uint256[] probabilities; // Probabilities (out of 1000)
        uint256 totalWeight;     // Sum of probabilities (should be 1000)
    }
    
    struct CosmeticPool {
        uint256[] ids;           // Cosmetic token IDs
        uint256[] weights;       // Weights for RNG
        uint256 total;           // Sum of weights
    }
    
    struct CosmeticSacrificeConfig {
        uint256 primaryTokenId;  // What to burn for cosmetics (fragId)
        uint256 primaryMin;      // Minimum primary tokens per sacrifice
        uint256 primaryMax;      // Maximum primary tokens per sacrifice
        uint256 bonusTokenId;    // Optional bonus token (masks, etc.)
        bool bonusEnabled;       // Whether bonus token is accepted
        uint256 bonusMax;        // Maximum bonus tokens allowed
    }
    
    function _cfg() internal pure returns (MawConfig storage s) {
        bytes32 slot = _CFG_SLOT;
        assembly { s.slot := slot }
    }
    
    function _roles() internal pure returns (mapping(bytes32 => address) storage s) {
        bytes32 slot = _ROLES_SLOT;
        assembly { s.slot := slot }
    }
    
    function _rewardPool() internal pure returns (RewardPool storage s) {
        bytes32 slot = _REWARDS_SLOT;
        assembly { s.slot := slot }
    }
    
    function _cosmeticPool() internal pure returns (CosmeticPool storage s) {
        bytes32 slot = _COS_POOL_SLOT;
        assembly { s.slot := slot }
    }
    
    function _cosmeticSacrificeConfig() internal pure returns (CosmeticSacrificeConfig storage s) {
        bytes32 slot = _COS_SACRIFICE_SLOT;
        assembly { s.slot := slot }
    }
    
    // Events (keep existing + add new ones)
    event KeysSacrificed(address indexed user, uint256 amount);
    event RelicReceived(address indexed user, uint256 relicId, uint256 amount);
    event CosmeticRitualAttempted(address indexed user, bool success, uint256 cosmeticTypeId);
    event DemonRitualAttempted(address indexed user, bool success, uint8 tier);
    event CultistsSacrificed(address indexed user, uint256 indexed tokenId);
    event MonthlyCosmeticsSet(uint256 indexed setId, uint256[] cosmeticTypeIds);
    event ContractsUpdated(address indexed relics, address indexed cosmetics, address indexed demons, address cultists);
    event ShardAwarded(address indexed user, uint256 amount, string source);
    event CapsCrafted(address indexed user, uint256 shardsUsed, uint256 capsMinted);
    event MythicMinted(address indexed user, uint8 tier, string source);
    event SacrificesPauseChanged(bool paused);
    event ConversionsPauseChanged(bool paused);
    event DebugRevert(string where, bytes data);
    event DebugCaller(address caller);
    
    // New V5 events
    event ConfigUpdated(uint256 capId, uint256 keyId, uint256 fragId, uint256 shardId);
    event SafeBurn(address indexed user, uint256 tokenId, uint256 amount);
    event SafeMint(address indexed user, uint256 tokenId, uint256 amount);
    event FallbackShard(address indexed user, uint256 attemptedRewardId);
    event RewardPoolUpdated(uint256[] tokenIds, uint256[] probabilities, uint256 totalWeight);
    event CosmeticPoolUpdated(uint256[] ids, uint256[] weights, uint256 total);
    event CosmeticSacrificeConfigUpdated(uint256 primaryTokenId, uint256 primaryMin, uint256 primaryMax, uint256 bonusTokenId, bool bonusEnabled, uint256 bonusMax);
    
    // Role system events
    event RoleSet(bytes32 indexed role, address indexed who);
    event EcosystemMint(address indexed to, uint256 tokenId, uint256 amount, string source);
    
    // Custom errors
    error InvalidAmount();
    error InsufficientBalance();
    error SacrificesPaused();
    error ConversionsPaused();
    error NotAuthorized();
    error InvalidConfiguration();
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    // V5 initialization - configures the token IDs
    function initializeV5(
        uint256 cap, 
        uint256 key, 
        uint256 frag, 
        uint256 shard
    ) external reinitializer(5) onlyOwner {
        _cfg().capId = cap;
        _cfg().keyId = key;
        _cfg().fragId = frag;
        _cfg().shardId = shard;
        emit ConfigUpdated(cap, key, frag, shard);
    }
    
    // Configurable ID getters
    function capId() external view returns (uint256) { return _cfg().capId; }
    function keyId() external view returns (uint256) { return _cfg().keyId; }
    function fragId() external view returns (uint256) { return _cfg().fragId; }
    function shardId() external view returns (uint256) { return _cfg().shardId; }
    
    // Config hash for version tracking
    function configHash() external view returns (bytes32) {
        return keccak256(abi.encode(
            address(relics),
            _cfg().capId, _cfg().keyId, _cfg().fragId, _cfg().shardId
        ));
    }
    
    // Comprehensive health check for frontend validation
    function healthcheck()
        external
        view
        returns (
            address relicsAddr,
            address mawTrustedOnRelics,
            uint256 cap, uint256 key, uint256 frag, uint256 shard,
            bool rewardPoolConfigured
        )
    {
        relicsAddr = address(relics);
        mawTrustedOnRelics = relics.mawSacrifice();
        cap = _cfg().capId; 
        key = _cfg().keyId; 
        frag = _cfg().fragId; 
        shard = _cfg().shardId;
        rewardPoolConfigured = _rewardPool().tokenIds.length > 0;
    }
    
    // Human-readable labels for IDs
    function idLabel(uint256 id) external view returns (string memory) {
        if (id == _cfg().capId) return "RUSTED_CAP";
        if (id == _cfg().keyId) return "RUSTED_KEY";
        if (id == _cfg().fragId) return "LANTERN_FRAGMENT";
        if (id == _cfg().shardId) return "GLASS_SHARD";
        return "";
    }
    
    // HARDENED CORE FUNCTIONS with safe burn loops + revert bubbling
    
    function _safeBurn(address from, uint256 id, uint256 amount) internal {
        try relics.burn(from, id, amount) {
            emit SafeBurn(from, id, amount);
        } catch (bytes memory data) {
            emit DebugRevert("burn", data);
            assembly { revert(add(data, 0x20), mload(data)) }
        }
    }
    
    function _safeMint(address to, uint256 id, uint256 amount) internal {
        try relics.mint(to, id, amount, "") {
            emit SafeMint(to, id, amount);
        } catch (bytes memory data) {
            emit DebugRevert("mint", data);
            assembly { revert(add(data, 0x20), mload(data)) }
        }
    }
    
    function _safeMintWithFallback(address to, uint256 rewardId) internal {
        try relics.mint(to, rewardId, 1, "") {
            emit SafeMint(to, rewardId, 1);
        } catch (bytes memory) {
            // Graceful fallback to shards
            emit FallbackShard(to, rewardId);
            _safeMint(to, _cfg().shardId, 1);
        }
    }
    
    // Authorization modifier - enforces Relics trusts this proxy
    modifier requireMawBound() {
        if (relics.mawSacrifice() != address(this)) {
            revert NotAuthorized();
        }
        _;
    }
    
    // Defensive check at entry (legacy)
    function _checkAuthorization() internal view {
        if (relics.mawSacrifice() != address(this)) {
            revert NotAuthorized();
        }
    }
    
    // RNG functions (keep existing logic)
    function _generateRNG(uint256 nonce) private view returns (bytes32) {
        return keccak256(abi.encodePacked(
            block.prevrandao,
            block.timestamp,
            block.number,
            msg.sender,
            nonce
        ));
    }
    
    function _drawReward(bytes32 rngHash, uint256 iteration) internal view returns (uint256) {
        RewardPool storage pool = _rewardPool();
        
        // Fallback to hardcoded distribution if pool not configured
        if (pool.tokenIds.length == 0) {
            bytes32 fallbackHash = keccak256(abi.encodePacked(rngHash, iteration));
            uint256 fallbackRand = uint256(fallbackHash) % 1000;
            
            if (fallbackRand < 750) return _cfg().fragId;  // 75% - Lantern Fragment
            if (fallbackRand < 900) return 3;   // 15% - Worm-eaten Mask
            if (fallbackRand < 950) return 8;   // 5% - Bone Dagger
            if (fallbackRand < 980) return 5;   // 3% - Ash Vial
            if (fallbackRand < 995) return 6;   // 1.5% - Glass Shard
            if (fallbackRand < 999) return 7;   // 0.4% - Soul Deed
            return 9;                   // 0.1% - Binding Contract
        }
        
        // Use configurable reward pool
        bytes32 hash = keccak256(abi.encodePacked(rngHash, iteration));
        uint256 rand = uint256(hash) % pool.totalWeight;
        
        uint256 cumulative = 0;
        for (uint256 i = 0; i < pool.probabilities.length; i++) {
            cumulative += pool.probabilities[i];
            if (rand < cumulative) {
                return pool.tokenIds[i];
            }
        }
        
        // Fallback to last token (should never reach here)
        return pool.tokenIds[pool.tokenIds.length - 1];
    }
    
    // RNG preview for off-chain testing
    function previewRewards(uint256 amount, bytes32 seed) external view returns (uint256[] memory ids) {
        ids = new uint256[](amount);
        for (uint256 i = 0; i < amount; ++i) {
            ids[i] = _drawReward(seed, i);
        }
    }
    
    // SAFE SACRIFICE IMPLEMENTATION - burn 1 per loop
    function _sacrificeCore(uint256 burnId, uint256 amount) internal nonReentrant whenNotPaused {
        if (sacrificesPaused) revert SacrificesPaused();
        if (amount == 0 || amount > 10) revert InvalidAmount();
        
        bytes32 rngHash = _generateRNG(sacrificeNonce);
        
        // Safe loop: burn 1 per iteration (prevents gas bombs)
        for (uint256 i = 0; i < amount; ++i) {
            _safeBurn(msg.sender, burnId, 1);
            
            uint256 rewardId = _drawReward(rngHash, i);
            _safeMintWithFallback(msg.sender, rewardId);
        }
        
        sacrificeNonce++;
        emit KeysSacrificed(msg.sender, amount);
    }
    
    // Public entrypoints with authorization
    function sacrificeKeys(uint256 amount) external requireMawBound {
        _sacrificeCore(_cfg().capId, amount);  // Use configured cap ID
    }
    
    function sacrificeCaps(uint256 amount) external requireMawBound {
        _sacrificeCore(_cfg().capId, amount);
    }
    
    function sacrificeLegacyKeys(uint256 amount) external requireMawBound {
        _sacrificeCore(_cfg().keyId, amount);
    }
    
    // SAFE CONVERSION
    function convertShardsToRustedCaps(uint256 shardAmount) external requireMawBound nonReentrant whenNotPaused {
        if (conversionsPaused) revert ConversionsPaused();
        if (shardAmount < 5 || shardAmount % 5 != 0) revert InvalidAmount();
        
        uint256 capsToMint = shardAmount / 5;
        
        _safeBurn(msg.sender, _cfg().shardId, shardAmount);
        _safeMint(msg.sender, _cfg().capId, capsToMint);
        
        emit CapsCrafted(msg.sender, shardAmount, capsToMint);
    }
    
    // Admin functions (keep existing interface)
    function setContracts(
        address _relics,
        address _cosmetics,
        address _demons,
        address _cultists
    ) external onlyOwner {
        relics = IRelics(_relics);
        cosmetics = ICosmeticsV2(_cosmetics);
        demons = IDemons(_demons);
        cultists = ICultists(_cultists);
        emit ContractsUpdated(_relics, _cosmetics, _demons, _cultists);
    }
    
    function setSacrificesPaused(bool _paused) external onlyOwner {
        sacrificesPaused = _paused;
        emit SacrificesPauseChanged(_paused);
    }
    
    function setConversionsPaused(bool _paused) external onlyOwner {
        conversionsPaused = _paused;
        emit ConversionsPauseChanged(_paused);
    }
    
    function setCurrentCosmeticTypes(uint256[] calldata types) external onlyOwner {
        currentCosmeticTypes = types;
    }
    
    function updateConfig(
        uint256 cap,
        uint256 key, 
        uint256 frag,
        uint256 shard
    ) external onlyOwner {
        _cfg().capId = cap;
        _cfg().keyId = key;
        _cfg().fragId = frag;
        _cfg().shardId = shard;
        emit ConfigUpdated(cap, key, frag, shard);
    }
    
    // REWARD POOL MANAGEMENT
    function setRewardPool(
        uint256[] calldata tokenIds, 
        uint256[] calldata probabilities
    ) external onlyOwner {
        if (tokenIds.length != probabilities.length) revert InvalidConfiguration();
        if (tokenIds.length == 0) revert InvalidConfiguration();
        
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < probabilities.length; i++) {
            totalWeight += probabilities[i];
        }
        if (totalWeight != 1000) revert InvalidConfiguration();
        
        RewardPool storage pool = _rewardPool();
        pool.tokenIds = tokenIds;
        pool.probabilities = probabilities;
        pool.totalWeight = totalWeight;
        
        emit RewardPoolUpdated(tokenIds, probabilities, totalWeight);
    }
    
    function getRewardPool() external view returns (
        uint256[] memory tokenIds, 
        uint256[] memory probabilities,
        uint256 totalWeight
    ) {
        RewardPool storage pool = _rewardPool();
        return (pool.tokenIds, pool.probabilities, pool.totalWeight);
    }
    
    // COSMETIC POOL MANAGEMENT
    function setCosmeticPool(
        uint256[] calldata ids, 
        uint256[] calldata weights
    ) external onlyOwner {
        if (ids.length != weights.length) revert InvalidConfiguration();
        if (ids.length == 0) revert InvalidConfiguration();
        
        uint256 total = 0;
        for (uint256 i = 0; i < weights.length; i++) {
            total += weights[i];
        }
        if (total == 0) revert InvalidConfiguration();
        
        CosmeticPool storage pool = _cosmeticPool();
        pool.ids = ids;
        pool.weights = weights;
        pool.total = total;
        
        emit CosmeticPoolUpdated(ids, weights, total);
    }
    
    function getCosmeticPool() external view returns (
        uint256[] memory ids, 
        uint256[] memory weights,
        uint256 total
    ) {
        CosmeticPool storage pool = _cosmeticPool();
        return (pool.ids, pool.weights, pool.total);
    }
    
    // COSMETIC SACRIFICE CONFIG MANAGEMENT
    function setCosmeticSacrificeConfig(
        uint256 primaryTokenId,
        uint256 primaryMin,
        uint256 primaryMax,
        uint256 bonusTokenId,
        bool bonusEnabled,
        uint256 bonusMax
    ) external onlyOwner {
        if (primaryMin == 0 || primaryMax == 0 || primaryMin > primaryMax) revert InvalidConfiguration();
        if (primaryMax > 10) revert InvalidConfiguration(); // Reasonable limit
        if (bonusEnabled && bonusMax > 10) revert InvalidConfiguration(); // Reasonable limit
        
        CosmeticSacrificeConfig storage config = _cosmeticSacrificeConfig();
        config.primaryTokenId = primaryTokenId;
        config.primaryMin = primaryMin;
        config.primaryMax = primaryMax;
        config.bonusTokenId = bonusTokenId;
        config.bonusEnabled = bonusEnabled;
        config.bonusMax = bonusMax;
        
        emit CosmeticSacrificeConfigUpdated(primaryTokenId, primaryMin, primaryMax, bonusTokenId, bonusEnabled, bonusMax);
    }
    
    function getCosmeticSacrificeConfig() external view returns (
        uint256 primaryTokenId,
        uint256 primaryMin,
        uint256 primaryMax,
        uint256 bonusTokenId,
        bool bonusEnabled,
        uint256 bonusMax
    ) {
        CosmeticSacrificeConfig storage config = _cosmeticSacrificeConfig();
        return (
            config.primaryTokenId,
            config.primaryMin,
            config.primaryMax,
            config.bonusTokenId,
            config.bonusEnabled,
            config.bonusMax
        );
    }
    
    function _drawCosmetic(bytes32 seed) internal view returns (uint256 id) {
        CosmeticPool storage pool = _cosmeticPool();
        if (pool.total == 0) revert InvalidConfiguration();
        
        uint256 rand = uint256(seed) % pool.total;
        uint256 cumulative = 0;
        for (uint256 i = 0; i < pool.ids.length; i++) {
            cumulative += pool.weights[i];
            if (rand < cumulative) {
                return pool.ids[i];
            }
        }
        return pool.ids[pool.ids.length - 1];
    }
    
    // CONFIGURABLE COSMETIC SACRIFICE
    function sacrificeForCosmetic(uint256 primary, uint256 bonus) 
        external 
        requireMawBound 
        nonReentrant 
        whenNotPaused
    {
        if (sacrificesPaused) revert SacrificesPaused();
        
        CosmeticSacrificeConfig storage config = _cosmeticSacrificeConfig();
        
        // Validate primary token requirements
        if (config.primaryTokenId == 0) revert InvalidConfiguration(); // Config not set
        if (primary < config.primaryMin || primary > config.primaryMax) revert InvalidAmount();
        
        // Validate bonus token requirements
        if (bonus > 0) {
            if (!config.bonusEnabled) revert InvalidAmount(); // Bonus not allowed
            if (bonus > config.bonusMax) revert InvalidAmount();
        }
        
        // Burn primary tokens (safe loop)
        for (uint256 i = 0; i < primary; i++) {
            _safeBurn(msg.sender, config.primaryTokenId, 1);
            
            // Draw cosmetic from configurable pool (bonus affects seed)
            bytes32 seed = keccak256(abi.encode(
                block.prevrandao, 
                block.number, 
                msg.sender, 
                i,
                bonus
            ));
            uint256 rewardId = _drawCosmetic(seed);
            
            // Try to mint cosmetic via CosmeticsV2 contract, fallback to shard if blocked
            try cosmetics.mintTo(msg.sender, rewardId) {
                emit SafeMint(msg.sender, rewardId, 1);
            } catch (bytes memory) {
                // Fallback to shard if cosmetic minting fails
                emit FallbackShard(msg.sender, rewardId);
                _safeMint(msg.sender, _cfg().shardId, 1);
            }
        }
        
        // Burn bonus tokens if provided (affects RNG seed)
        if (bonus > 0 && config.bonusEnabled) {
            _safeBurn(msg.sender, config.bonusTokenId, bonus);
        }
        
        emit CosmeticRitualAttempted(msg.sender, true, primary);
    }
    
    // ECOSYSTEM ROLE MANAGEMENT
    function setRole(bytes32 role, address who) external onlyOwner {
        _roles()[role] = who;
        emit RoleSet(role, who);
    }
    
    function role(bytes32 role) external view returns (address) {
        return _roles()[role];
    }
    
    modifier onlyRole(bytes32 role_) {
        if (msg.sender != _roles()[role_]) {
            revert NotAuthorized();
        }
        _;
    }
    
    // ECOSYSTEM INTEGRATION FUNCTIONS
    
    // KeyShop calls this to mint caps for buyers (despite the legacy name)
    function shopMintKeys(address to, uint256 amount) external onlyRole(keccak256("KEY_SHOP")) requireMawBound {
        if (amount == 0 || amount > 50) revert InvalidAmount(); // Reasonable limit
        
        for (uint256 i = 0; i < amount; ++i) {
            _safeMint(to, _cfg().capId, 1);  // Mint caps (ID 0), not keys
        }
        
        emit EcosystemMint(to, _cfg().capId, amount, "KeyShop");
    }
    
    // Cosmetics calls this to mint cosmetic items
    function cosmeticsMint(address to, uint256 id, uint256 amount) external onlyRole(keccak256("COSMETICS")) requireMawBound {
        if (amount == 0 || amount > 100) revert InvalidAmount(); // Reasonable limit
        
        _safeMint(to, id, amount);
        emit EcosystemMint(to, id, amount, "Cosmetics");
    }
    
    // Generic ecosystem burn (for burning requirements)  
    function ecosystemBurn(address from, uint256 id, uint256 amount, string calldata source) external onlyRole(keccak256("ECOSYSTEM")) requireMawBound {
        _safeBurn(from, id, amount);
        emit SafeBurn(from, id, amount);
    }
    
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}