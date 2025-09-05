// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

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

contract MawSacrificeV4Upgradeable is 
    OwnableUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable,
    AccessControlUpgradeable
{
    // ========== Roles ==========
    
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    // ========== State Variables ==========
    
    IRelics public relics;
    ICosmeticsV2 public cosmetics;
    IDemons public demons;
    ICultists public cultists;
    
    // Relic IDs
    uint256 public constant RUSTED_KEY = 1;
    uint256 public constant LANTERN_FRAGMENT = 2;
    uint256 public constant WORM_EATEN_MASK = 3;
    uint256 public constant BONE_DAGGER = 4;
    uint256 public constant ASH_VIAL = 5;
    uint256 public constant BINDING_CONTRACT = 6;
    uint256 public constant SOUL_DEED = 7;
    uint256 public constant ASHES = 8;
    
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    mapping(address => uint256) public lastSacrificeBlock;
    uint256 public minBlocksBetweenSacrifices;
    
    // Monthly cosmetic configuration
    uint256[] public currentCosmeticTypes;
    uint256 public currentMonthlySetId;
    
    // Mythic demon lifetime caps
    uint256 public constant MAX_MYTHIC_DEMONS = 100;
    uint256 public mythicDemonsMinted;
    mapping(address => uint256) public userMythicCount;
    
    // Upgrade timelock system
    struct UpgradeAnnouncement {
        address newImplementation;
        uint256 announceTime;
        bool executed;
    }
    
    mapping(bytes32 => UpgradeAnnouncement) public announcements;
    uint256 public constant UPGRADE_DELAY = 24 hours;
    
    // Granular pause controls  
    bool public sacrificesPaused;
    bool public conversionsPaused;
    
    // Version tracking
    string private _version;
    
    // Sacrifice nonce for RNG (prevents deterministic results)
    uint256 public sacrificeNonce;
    
    // ========== Events ==========
    
    event KeysSacrificed(address indexed user, uint256 amount);
    event RelicReceived(address indexed user, uint256 relicId, uint256 amount);
    event AshesReceived(address indexed user, uint256 amount);
    event CosmeticRitualAttempted(address indexed user, bool success, uint256 cosmeticTypeId);
    event DemonRitualAttempted(address indexed user, bool success, uint8 tier);
    event CultistsSacrificed(address indexed user, uint256 indexed tokenId);
    event MonthlyCosmeticsSet(uint256 indexed setId, uint256[] cosmeticTypeIds);
    event ContractsUpdated(address indexed relics, address indexed cosmetics, address indexed demons, address cultists);
    event ShardAwarded(address indexed user, uint256 amount, string source);
    event CapsCrafted(address indexed user, uint256 shardsUsed, uint256 capsMinted);
    event MythicMinted(address indexed user, uint8 tier, string source);
    event MinBlocksSet(uint256 blocks);
    event UpgradeAnnounced(bytes32 indexed id, address newImplementation, uint256 executeTime);
    event UpgradeExecuted(bytes32 indexed id, address newImplementation);
    event UpgradeCancelled(bytes32 indexed id);
    event SacrificesPauseChanged(bool paused);
    event ConversionsPauseChanged(bool paused);
    event VersionUpdated(string oldVersion, string newVersion);
    
    // ========== Custom Errors ==========
    
    error InvalidAmount();
    error InsufficientBalance();
    error TooFast();
    error NoCosmetics();
    error NoCosmeticsOfRarity();
    error NotCultistOwner();
    error SacrificesPaused();
    error ConversionsPaused();
    error UpgradeNotAnnounced();
    error UpgradeDelayNotMet();
    error UpgradeAlreadyExecuted();
    error InvalidUpgradeId();
    
    // ========== Initializer (replaces constructor) ==========
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize(
        address _relics,
        address _cosmetics,
        address _demons,
        address _cultists,
        uint256 _minBlocksBetween
    ) public initializer {
        __Ownable_init(msg.sender);
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        __AccessControl_init();
        
        relics = IRelics(_relics);
        cosmetics = ICosmeticsV2(_cosmetics);
        demons = IDemons(_demons);
        cultists = ICultists(_cultists);
        minBlocksBetweenSacrifices = _minBlocksBetween;
        
        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        
        _version = "MawSacrificeV4Upgradeable-1.0.0";
    }
    
    // ========== Upgrade Timelock System ==========
    
    function announceUpgrade(address newImplementation) external onlyRole(UPGRADER_ROLE) {
        bytes32 upgradeId = keccak256(abi.encodePacked(newImplementation, block.timestamp));
        
        announcements[upgradeId] = UpgradeAnnouncement({
            newImplementation: newImplementation,
            announceTime: block.timestamp,
            executed: false
        });
        
        emit UpgradeAnnounced(upgradeId, newImplementation, block.timestamp + UPGRADE_DELAY);
    }
    
    function executeUpgrade(bytes32 upgradeId) external onlyRole(UPGRADER_ROLE) {
        UpgradeAnnouncement storage announcement = announcements[upgradeId];
        
        if (announcement.newImplementation == address(0)) revert UpgradeNotAnnounced();
        if (block.timestamp < announcement.announceTime + UPGRADE_DELAY) revert UpgradeDelayNotMet();
        if (announcement.executed) revert UpgradeAlreadyExecuted();
        
        announcement.executed = true;
        
        string memory oldVersion = _version;
        upgradeToAndCall(announcement.newImplementation, "");
        
        emit UpgradeExecuted(upgradeId, announcement.newImplementation);
        emit VersionUpdated(oldVersion, version());
    }
    
    function cancelUpgrade(bytes32 upgradeId) external onlyRole(UPGRADER_ROLE) {
        UpgradeAnnouncement storage announcement = announcements[upgradeId];
        
        if (announcement.newImplementation == address(0)) revert InvalidUpgradeId();
        if (announcement.executed) revert UpgradeAlreadyExecuted();
        
        delete announcements[upgradeId];
        emit UpgradeCancelled(upgradeId);
    }
    
    // ========== UUPS Upgrade Authorization ==========
    
    function _authorizeUpgrade(address newImplementation) internal virtual override {
        // This should never be called directly - only through timelock
        revert("Use announceUpgrade then executeUpgrade");
    }
    
    // ========== Granular Pause Controls ==========
    
    modifier whenSacrificesNotPaused() {
        if (sacrificesPaused) revert SacrificesPaused();
        _;
    }
    
    modifier whenConversionsNotPaused() {
        if (conversionsPaused) revert ConversionsPaused();
        _;
    }
    
    modifier antiBot() {
        if (block.number <= lastSacrificeBlock[msg.sender] + minBlocksBetweenSacrifices) {
            revert TooFast();
        }
        _;
        lastSacrificeBlock[msg.sender] = block.number;
    }
    
    function pauseSacrifices() external onlyRole(PAUSER_ROLE) {
        sacrificesPaused = true;
        emit SacrificesPauseChanged(true);
    }
    
    function unpauseSacrifices() external onlyRole(PAUSER_ROLE) {
        sacrificesPaused = false;
        emit SacrificesPauseChanged(false);
    }
    
    function pauseConversions() external onlyRole(PAUSER_ROLE) {
        conversionsPaused = true;
        emit ConversionsPauseChanged(true);
    }
    
    function unpaauseConversions() external onlyRole(PAUSER_ROLE) {
        conversionsPaused = false;
        emit ConversionsPauseChanged(false);
    }
    
    // ========== Key Sacrifice Functions ==========
    
    function sacrificeKeys(uint256 amount) external virtual whenNotPaused whenSacrificesNotPaused nonReentrant antiBot {
        if (amount == 0 || amount > 10) revert InvalidAmount();
        if (relics.balanceOf(msg.sender, RUSTED_KEY) < amount) revert InsufficientBalance();
        
        relics.burn(msg.sender, RUSTED_KEY, amount);
        
        uint256 seed = uint256(keccak256(abi.encodePacked(
            block.prevrandao,
            block.timestamp,
            msg.sender,
            amount
        )));
        
        bool success = false;
        uint256 relicId;
        
        for (uint256 i = 0; i < amount; i++) {
            uint256 roll = (seed >> (i * 8)) % 10000;
            
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
            } else if (roll < 5650) { // 1.5% - Contract
                relicId = BINDING_CONTRACT;
                success = true;
            } else if (roll < 5700) { // 0.5% - Deed
                relicId = SOUL_DEED;
                success = true;
            }
            
            if (success) {
                relics.mint(msg.sender, relicId, 1, "");
                emit RelicReceived(msg.sender, relicId, 1);
                success = false;
            } else {
                // 50% chance for Glass Shard on failure
                if ((seed >> (i * 8 + 4)) % 2 == 0) {
                    relics.mint(msg.sender, ASHES, 1, "");
                    emit ShardAwarded(msg.sender, 1, "key_failure");
                }
            }
        }
        
        emit KeysSacrificed(msg.sender, amount);
    }
    
    // ========== Glass Shard Conversion ==========
    
    function convertShardsToRustedCaps(uint256 shardAmount) external whenNotPaused whenConversionsNotPaused nonReentrant {
        if (shardAmount == 0 || shardAmount > 500) revert InvalidAmount();
        if (shardAmount % 5 != 0) revert InvalidAmount(); // Must be multiple of 5
        if (relics.balanceOf(msg.sender, ASHES) < shardAmount) revert InsufficientBalance();
        
        uint256 capsToMint = shardAmount / 5;
        
        relics.burn(msg.sender, ASHES, shardAmount);
        relics.mint(msg.sender, RUSTED_KEY, capsToMint, "");
        
        emit CapsCrafted(msg.sender, shardAmount, capsToMint);
    }
    
    // ========== Cosmetic Sacrifice Functions ==========
    
    function sacrificeForCosmetic(
        uint256 fragments,
        uint256 masks
    ) external whenNotPaused whenSacrificesNotPaused nonReentrant antiBot {
        if (fragments == 0 || fragments > 3) revert InvalidAmount();
        if (masks > 3) revert InvalidAmount();
        if (relics.balanceOf(msg.sender, LANTERN_FRAGMENT) < fragments) {
            revert InsufficientBalance();
        }
        if (masks > 0 && relics.balanceOf(msg.sender, WORM_EATEN_MASK) < masks) {
            revert InsufficientBalance();
        }
        
        relics.burn(msg.sender, LANTERN_FRAGMENT, fragments);
        if (masks > 0) {
            relics.burn(msg.sender, WORM_EATEN_MASK, masks);
        }
        
        uint256 successChance = _getCosmeticSuccessChance(fragments);
        sacrificeNonce++;
        uint256 successRoll = _random(sacrificeNonce) % 100;
        
        if (successRoll < successChance) {
            uint256 cosmeticTypeId = _rollCosmeticType(masks);
            cosmetics.mintTo(msg.sender, cosmeticTypeId);
            emit CosmeticRitualAttempted(msg.sender, true, cosmeticTypeId);
        } else {
            emit CosmeticRitualAttempted(msg.sender, false, 0);
            // 50% chance of Glass Shard on cosmetic failure
            uint256 shardRoll = _random(fragments + masks + 200) % 100;
            if (shardRoll < 50) {
                relics.mint(msg.sender, ASHES, 1, "");
                emit AshesReceived(msg.sender, 1);
                emit ShardAwarded(msg.sender, 1, "cosmetic_failure");
            }
        }
    }
    
    // ========== Demon Sacrifice Functions ==========
    
    function sacrificeDemons(uint256 amount, uint8 tier) external whenNotPaused whenSacrificesNotPaused nonReentrant antiBot {
        if (amount == 0 || amount > 3) revert InvalidAmount();
        if (tier < 1 || tier > 2) revert InvalidAmount();
        
        uint256 seed = uint256(keccak256(abi.encodePacked(
            block.prevrandao,
            block.timestamp,
            msg.sender,
            amount,
            tier
        )));
        
        for (uint256 i = 0; i < amount; i++) {
            uint256 roll = (seed >> (i * 16)) % 10000;
            bool success = false;
            uint8 targetTier = tier;
            
            // Apply mythic demon cap with downgrade
            if (targetTier == 2 && mythicDemonsMinted >= MAX_MYTHIC_DEMONS) {
                targetTier = 1; // Downgrade to rare
                emit MythicMinted(msg.sender, 2, "downgraded_to_rare");
            }
            
            uint256 successRate = targetTier == 1 ? 5000 : 2000; // 50% rare, 20% mythic
            
            if (roll < successRate) {
                try demons.mintTo(msg.sender, targetTier) returns (uint256) {
                    success = true;
                    if (targetTier == 2) {
                        mythicDemonsMinted++;
                        userMythicCount[msg.sender]++;
                        emit MythicMinted(msg.sender, 2, "demon_sacrifice");
                    }
                    emit DemonRitualAttempted(msg.sender, true, targetTier);
                } catch {
                    emit DemonRitualAttempted(msg.sender, false, targetTier);
                }
            }
            
            if (!success) {
                // 100% Glass Shard on demon failure
                relics.mint(msg.sender, ASHES, 1, "");
                emit ShardAwarded(msg.sender, 1, "demon_failure");
                emit DemonRitualAttempted(msg.sender, false, targetTier);
            }
        }
    }
    
    // ========== NFT Sacrifice Functions ==========
    
    function sacrificeCultist(uint256 tokenId) external whenNotPaused whenSacrificesNotPaused nonReentrant antiBot {
        if (cultists.ownerOf(tokenId) != msg.sender) revert NotCultistOwner();
        
        cultists.burn(tokenId);
        relics.mint(msg.sender, RUSTED_KEY, 3, "");
        
        emit CultistsSacrificed(msg.sender, tokenId);
        emit RelicReceived(msg.sender, RUSTED_KEY, 3);
    }
    
    // ========== Admin Functions ==========
    
    function setMonthlyCosmeticTypes(uint256[] calldata cosmeticTypeIds) external onlyOwner {
        currentCosmeticTypes = cosmeticTypeIds;
        currentMonthlySetId++;
        emit MonthlyCosmeticsSet(currentMonthlySetId, cosmeticTypeIds);
    }
    
    function updateContracts(
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
    
    function setMinBlocksBetweenSacrifices(uint256 blocks) external onlyOwner {
        minBlocksBetweenSacrifices = blocks;
        emit MinBlocksSet(blocks);
    }
    
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    function setVersion(string calldata newVersion) external onlyOwner {
        string memory oldVersion = _version;
        _version = newVersion;
        emit VersionUpdated(oldVersion, newVersion);
    }
    
    // ========== Helper Functions ==========
    
    function _getCosmeticSuccessChance(uint256 fragments) private pure returns (uint256) {
        if (fragments == 1) return 35;
        if (fragments == 2) return 60;
        if (fragments == 3) return 80;
        return 0;
    }
    
    function _rollCosmeticType(uint256 masks) private view returns (uint256) {
        if (currentCosmeticTypes.length == 0) revert NoCosmetics();
        
        uint256 roll = _random(sacrificeNonce + 100) % 100;
        uint8 targetRarity;
        
        if (masks == 0) {
            // No masks: 70% common, 25% uncommon, 5% rare
            if (roll < 70) targetRarity = 1;
            else if (roll < 95) targetRarity = 2;
            else targetRarity = 3;
        } else if (masks == 1) {
            // 1 mask: 40% common, 45% uncommon, 15% rare
            if (roll < 40) targetRarity = 1;
            else if (roll < 85) targetRarity = 2;
            else targetRarity = 3;
        } else if (masks == 2) {
            // 2 masks: 20% common, 50% uncommon, 30% rare
            if (roll < 20) targetRarity = 1;
            else if (roll < 70) targetRarity = 2;
            else targetRarity = 3;
        } else {
            // 3+ masks: 10% common, 40% uncommon, 50% rare
            if (roll < 10) targetRarity = 1;
            else if (roll < 50) targetRarity = 2;
            else targetRarity = 3;
        }
        
        // Find cosmetic types of target rarity
        uint256[] memory validTypes = new uint256[](currentCosmeticTypes.length);
        uint256 validCount = 0;
        
        for (uint256 i = 0; i < currentCosmeticTypes.length; i++) {
            (, , , , uint8 rarity, ,) = cosmetics.getCosmeticInfo(currentCosmeticTypes[i]);
            if (rarity == targetRarity) {
                validTypes[validCount] = currentCosmeticTypes[i];
                validCount++;
            }
        }
        
        if (validCount == 0) {
            // Fallback to common if no cosmetics of target rarity
            for (uint256 i = 0; i < currentCosmeticTypes.length; i++) {
                (, , , , uint8 rarity, ,) = cosmetics.getCosmeticInfo(currentCosmeticTypes[i]);
                if (rarity == 1) {
                    validTypes[validCount] = currentCosmeticTypes[i];
                    validCount++;
                }
            }
        }
        
        if (validCount == 0) revert NoCosmeticsOfRarity();
        
        uint256 typeIndex = _random(sacrificeNonce + 200) % validCount;
        return validTypes[typeIndex];
    }
    
    function _random(uint256 nonce) private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            nonce
        )));
    }
    
    // ========== View Functions ==========
    
    function getCurrentCosmeticTypes() external view returns (uint256[] memory) {
        return currentCosmeticTypes;
    }
    
    function getUserMythicCount(address user) external view returns (uint256) {
        return userMythicCount[user];
    }
    
    function version() public view returns (string memory) {
        return _version;
    }
    
    function getConfig() external view returns (
        uint256 rustedKeyId,
        uint256 glassShardId,
        uint256 lanternFragmentId,
        uint256 wormEatenMaskId,
        uint256 boneDaggerId,
        uint256 ashVialId,
        uint256 bindingContractId,
        uint256 soulDeedId,
        uint256 maxMythicDemons,
        uint256 minBlocksBetween,
        uint256 mythicDemonsMinted,
        uint256 currentCosmeticTypesCount
    ) {
        return (
            RUSTED_KEY,         // 1
            ASHES,              // 8 (Glass Shards)
            LANTERN_FRAGMENT,   // 2
            WORM_EATEN_MASK,    // 3
            BONE_DAGGER,        // 4
            ASH_VIAL,           // 5
            BINDING_CONTRACT,   // 6
            SOUL_DEED,          // 7
            MAX_MYTHIC_DEMONS,  // 100
            minBlocksBetweenSacrifices,
            mythicDemonsMinted,
            currentCosmeticTypes.length
        );
    }
    
    function getPauseStatus() external view returns (bool globalPaused, bool sacrificesPaused, bool conversionsPaused) {
        return (paused(), sacrificesPaused, conversionsPaused);
    }
    
    function roles() external pure returns (string[] memory roleNames, bytes32[] memory roleHashes) {
        roleNames = new string[](3);
        roleHashes = new bytes32[](3);
        
        roleNames[0] = "DEFAULT_ADMIN_ROLE";
        roleNames[1] = "UPGRADER_ROLE";  
        roleNames[2] = "PAUSER_ROLE";
        
        roleHashes[0] = DEFAULT_ADMIN_ROLE;
        roleHashes[1] = UPGRADER_ROLE;
        roleHashes[2] = PAUSER_ROLE;
    }
}