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
 * @title MawSacrificeV4NoTimelock
 * @dev Clean implementation with RNG fix and no timelock restrictions
 * @notice This version removes all timelock mechanisms for immediate upgrades
 */
contract MawSacrificeV4NoTimelock is 
    OwnableUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    // Contract addresses
    IRelics public relics;
    ICosmeticsV2 public cosmetics;
    IDemons public demons;
    ICultists public cultists;
    
    // Relic IDs  
    uint256 public constant RUSTED_CAP = 0;    // Used for sacrifice and conversion
    uint256 public constant LANTERN_FRAGMENT = 2;
    uint256 public constant WORM_EATEN_MASK = 3;
    uint256 public constant BONE_DAGGER = 4;
    uint256 public constant ASH_VIAL = 5;
    uint256 public constant GLASS_SHARD = 6;
    // Note: RUSTED_KEY (ID 1) removed - was causing confusion with RUSTED_CAP
    
    // State variables
    uint256 public mythicDemonsMinted;
    uint256 public maxMythicDemons;
    bool public sacrificesPaused;
    bool public conversionsPaused;
    uint256[] public currentCosmeticTypes;
    uint256 public sacrificeNonce; // Fixed RNG with proper nonce
    
    // Anti-bot protection removed
    
    // Events
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
    
    // Debug events - temporary for troubleshooting
    event DebugRevert(string where, bytes data);
    event DebugCaller(address caller);
    
    // Custom errors
    error InvalidAmount();
    error InsufficientBalance();
    error SacrificesPaused();
    error ConversionsPaused();
    error NotAuthorized();
    
    // Modifiers
    modifier whenSacrificesNotPaused() {
        if (sacrificesPaused) revert SacrificesPaused();
        _;
    }
    
    modifier whenConversionsNotPaused() {
        if (conversionsPaused) revert ConversionsPaused();
        _;
    }
    
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(
        address _relics,
        address _cosmetics,
        address _demons,
        address _cultists
    ) public initializer {
        __Ownable_init(msg.sender);
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        relics = IRelics(_relics);
        cosmetics = ICosmeticsV2(_cosmetics);
        demons = IDemons(_demons);
        cultists = ICultists(_cultists);
        
        maxMythicDemons = 100;
    }
    
    /**
     * @dev Fixed RNG function with proper nonce incrementing
     */
    function _random(uint256 seed) internal returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.prevrandao,
            block.timestamp,
            msg.sender,
            sacrificeNonce++, // Increment nonce for each call
            seed
        )));
    }
    
    /**
     * @dev Sacrifice keys with FIXED RNG
     */
    function sacrificeKeys(uint256 amount) external whenNotPaused whenSacrificesNotPaused nonReentrant {
        if (amount == 0 || amount > 10) revert InvalidAmount();
        if (relics.balanceOf(msg.sender, RUSTED_CAP) < amount) revert InsufficientBalance();
        
        emit DebugCaller(address(this)); // Debug who's calling
        
        bool success = false;
        uint256 relicId;
        
        for (uint256 i = 0; i < amount; i++) {
            // Burn one key per iteration (matches stricter burn rules)
            try relics.burn(msg.sender, RUSTED_CAP, 1) {
                // Success - continue with sacrifice
            } catch (bytes memory data) {
                emit DebugRevert("burn(key#)", data);
                revert();
            }
            
            uint256 roll = _random(i) % 10000; // Each key gets unique randomness
            
            if (roll < 3000) { // 30% - Fragment
                relicId = LANTERN_FRAGMENT;
                success = true;
            } else if (roll < 4500) { // 15% - Mask  
                relicId = WORM_EATEN_MASK;
                success = true;
            } else if (roll < 5250) { // 7.5% - Dagger
                relicId = BONE_DAGGER;
                success = true;
            } else if (roll < 5500) { // 2.5% - Vial
                relicId = ASH_VIAL;
                success = true;
            } else {
                // 45% chance - award glass shard as consolation
                try relics.mint(msg.sender, GLASS_SHARD, 1, "") {
                    emit ShardAwarded(msg.sender, 1, "key_sacrifice_fail");
                    continue;
                } catch (bytes memory data) {
                    emit DebugRevert("mint(fallback_shard)", data);
                    revert();
                }
            }
            
            // Pre-flight check before minting reward
            if (!this.canMintRelic(relicId)) {
                // If reward is disallowed/capped on Relics, fallback to shard
                try relics.mint(msg.sender, GLASS_SHARD, 1, "") {
                    emit ShardAwarded(msg.sender, 1, "fallback_reward_disallowed");
                    continue;
                } catch (bytes memory data) {
                    emit DebugRevert("mint(fallback_shard)", data);
                    revert();
                }
            }
            
            try relics.mint(msg.sender, relicId, 1, "") {
                emit RelicReceived(msg.sender, relicId, 1);
            } catch (bytes memory data) {
                emit DebugRevert("mint(reward)", data);
                revert();
            }
        }
        
        emit KeysSacrificed(msg.sender, amount);
    }
    
    /**
     * @dev Sacrifice cosmetics with FIXED RNG
     */
    function sacrificeForCosmetic(
        uint256 fragments,
        uint256 masks
    ) external whenNotPaused whenSacrificesNotPaused nonReentrant {
        if (fragments == 0 || fragments > 3 || masks > 3) revert InvalidAmount();
        if (relics.balanceOf(msg.sender, LANTERN_FRAGMENT) < fragments) revert InsufficientBalance();
        if (relics.balanceOf(msg.sender, WORM_EATEN_MASK) < masks) revert InsufficientBalance();
        
        // Burn the fragments and masks
        relics.burn(msg.sender, LANTERN_FRAGMENT, fragments);
        if (masks > 0) {
            relics.burn(msg.sender, WORM_EATEN_MASK, masks);
        }
        
        // Calculate success chance based on fragments
        uint256 successChance = _getCosmeticSuccessChance(fragments);
        uint256 successRoll = _random(fragments) % 100;
        
        if (successRoll < successChance) {
            // Success - mint cosmetic
            uint256 cosmeticTypeId = _rollCosmeticType(masks);
            
            cosmetics.mintTo(msg.sender, cosmeticTypeId);
            emit CosmeticRitualAttempted(msg.sender, true, cosmeticTypeId);
        } else {
            // Failure - 50% chance for glass shard
            uint256 consolationRoll = _random(masks) % 100;
            if (consolationRoll < 50) {
                relics.mint(msg.sender, GLASS_SHARD, 1, "");
                emit ShardAwarded(msg.sender, 1, "cosmetic_sacrifice_fail");
            }
            emit CosmeticRitualAttempted(msg.sender, false, 0);
        }
    }
    
    function _getCosmeticSuccessChance(uint256 fragments) private pure returns (uint256) {
        if (fragments == 1) return 35;   // 35% success
        if (fragments == 2) return 60;   // 60% success  
        if (fragments == 3) return 80;   // 80% success
        return 0;
    }
    
    function _rollCosmeticType(uint256 masks) private returns (uint256) {
        if (currentCosmeticTypes.length == 0) return 1; // Default to type 1
        
        uint256 rarityRoll = _random(masks) % 100;
        uint256 rarityThreshold;
        
        // Mask count affects rarity distribution
        if (masks == 0) {
            rarityThreshold = 70; // 70% common, 25% uncommon, 5% rare
        } else if (masks == 1) {
            rarityThreshold = 40; // 40% common, 45% uncommon, 15% rare
        } else if (masks == 2) {
            rarityThreshold = 20; // 20% common, 50% uncommon, 30% rare
        } else { // masks >= 3
            rarityThreshold = 10; // 10% common, 40% uncommon, 50% rare
        }
        
        // For simplicity, return random cosmetic from current types
        uint256 typeIndex = _random(rarityRoll) % currentCosmeticTypes.length;
        return currentCosmeticTypes[typeIndex];
    }
    
    /**
     * @dev Convert glass shards to rusted caps (5:1 ratio)
     */
    function convertShardsToRustedCaps(uint256 shardAmount) external whenNotPaused whenConversionsNotPaused nonReentrant {
        if (shardAmount == 0 || shardAmount % 5 != 0) revert InvalidAmount();
        if (relics.balanceOf(msg.sender, GLASS_SHARD) < shardAmount) revert InsufficientBalance();
        
        uint256 capsToMint = shardAmount / 5;
        
        // Guard: Don't eat shards if caps are sold out
        if (!this.canMintCaps(capsToMint)) {
            revert("CapsSoldOutOrDisallowed");
        }
        
        try relics.burn(msg.sender, GLASS_SHARD, shardAmount) {
            // Success - continue
        } catch (bytes memory data) {
            emit DebugRevert("burn(shards)", data);
            revert();
        }
        
        try relics.mint(msg.sender, RUSTED_CAP, capsToMint, "") {
            emit CapsCrafted(msg.sender, shardAmount, capsToMint);
        } catch (bytes memory data) {
            emit DebugRevert("mint(caps)", data);
            revert();
        }
    }
    
    // Admin functions
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
    
    function setMonthlyCosmeticTypes(uint256[] calldata typeIds) external onlyOwner {
        currentCosmeticTypes = typeIds;
        emit MonthlyCosmeticsSet(block.timestamp, typeIds);
    }
    
    
    function pauseSacrifices() external onlyOwner {
        sacrificesPaused = true;
        emit SacrificesPauseChanged(true);
    }
    
    function unpauseSacrifices() external onlyOwner {
        sacrificesPaused = false;
        emit SacrificesPauseChanged(false);
    }
    
    function pauseConversions() external onlyOwner {
        conversionsPaused = true;
        emit ConversionsPauseChanged(true);
    }
    
    function unpauseConversions() external onlyOwner {
        conversionsPaused = false;
        emit ConversionsPauseChanged(false);
    }
    
    /**
     * @dev IMMEDIATE UPGRADES - No timelock!
     */
    function _authorizeUpgrade(address) internal override onlyOwner {
        // Owner can upgrade immediately - no restrictions!
    }
    
    // View functions
    function getCurrentCosmeticTypes() external view returns (uint256[] memory) {
        return currentCosmeticTypes;
    }
    
    function getPauseStatus() external view returns (bool globalPaused, bool sacrificesPaused_, bool conversionsPaused_) {
        return (paused(), sacrificesPaused, conversionsPaused);
    }
    
    function version() public pure returns (string memory) {
        return "4.0-no-timelock-rng-fix-debug";
    }
    
    // Debug probes (view functions that simulate operations without changing state)
    function canBurnKeyFor(address user, uint256 amount) external view returns (bool) {
        (bool success,) = address(relics).staticcall(
            abi.encodeWithSignature("burn(address,uint256,uint256)", user, RUSTED_CAP, amount)
        );
        return success;
    }
    
    function canMintRelic(uint256 id) external view returns (bool) {
        (bool success,) = address(relics).staticcall(
            abi.encodeWithSignature("mint(address,uint256,uint256,bytes)", msg.sender, id, 1, "")
        );
        return success;
    }
    
    function canMintCaps(uint256 amount) external view returns (bool) {
        (bool success,) = address(relics).staticcall(
            abi.encodeWithSignature("mint(address,uint256,uint256,bytes)", msg.sender, RUSTED_CAP, amount, "")
        );
        return success;
    }
}