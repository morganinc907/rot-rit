// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IRelics {
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function burn(address from, uint256 id, uint256 amount) external;
    function mint(address to, uint256 id, uint256 amount) external;
}

interface ICosmeticsV2 {
    function mint(address to, uint256 typeId, uint256 amount) external;
    function getCosmeticRarity(uint256 typeId) external view returns (uint8);
}

interface IDemons {
    function safeMint(address to, uint8 tier) external returns (uint256);
}

interface ICultists {
    function ownerOf(uint256 tokenId) external view returns (address);
    function burn(uint256 tokenId) external;
}

contract MawSacrificeV3 is Ownable, Pausable, ReentrancyGuard {
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
    uint256 public minBlocksBetweenSacrifices = 1;
    
    // Monthly cosmetic configuration
    uint256[] public currentCosmeticTypes;
    uint256 public currentMonthlySetId;
    
    // Mythic demon lifetime caps
    uint256 public constant MAX_MYTHIC_DEMONS = 100;
    uint256 public mythicDemonsMinted;
    mapping(address => uint256) public userMythicCount;
    
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
    
    // ========== Custom Errors ==========
    
    error InvalidAmount();
    error InsufficientBalance();
    error TooFast();
    error NoCosmetics();
    error NoCosmeticsOfRarity();
    error NotCultistOwner();
    
    // ========== Constructor ==========
    
    constructor(
        address _relics,
        address _cosmetics,
        address _demons,
        address _cultists
    ) Ownable(msg.sender) {
        relics = IRelics(_relics);
        cosmetics = ICosmeticsV2(_cosmetics);
        demons = IDemons(_demons);
        cultists = ICultists(_cultists);
    }
    
    // ========== Modifiers ==========
    
    modifier antiBot() {
        if (block.number < lastSacrificeBlock[msg.sender] + minBlocksBetweenSacrifices) {
            revert TooFast();
        }
        lastSacrificeBlock[msg.sender] = block.number;
        _;
    }
    
    // ========== Core Functions ==========
    
    function sacrificeKeys(uint256 amount) external whenNotPaused antiBot nonReentrant {
        if (amount == 0 || amount > 10) revert InvalidAmount();
        if (relics.balanceOf(msg.sender, RUSTED_KEY) < amount) revert InsufficientBalance();
        
        relics.burn(msg.sender, RUSTED_KEY, amount);
        emit KeysSacrificed(msg.sender, amount);
        
        uint256 totalAshes = 0;
        
        for (uint256 i = 0; i < amount; i++) {
            uint256 roll = _random(i) % 100;
            
            if (roll < 30) {
                relics.mint(msg.sender, LANTERN_FRAGMENT, 1);
                emit RelicReceived(msg.sender, LANTERN_FRAGMENT, 1);
            } else if (roll < 55) {
                relics.mint(msg.sender, WORM_EATEN_MASK, 1);
                emit RelicReceived(msg.sender, WORM_EATEN_MASK, 1);
            } else if (roll < 70) {
                relics.mint(msg.sender, BONE_DAGGER, 1);
                emit RelicReceived(msg.sender, BONE_DAGGER, 1);
            } else if (roll < 80) {
                relics.mint(msg.sender, ASH_VIAL, 1);
                emit RelicReceived(msg.sender, ASH_VIAL, 1);
            } else if (roll < 85) {
                relics.mint(msg.sender, BINDING_CONTRACT, 1);
                emit RelicReceived(msg.sender, BINDING_CONTRACT, 1);
            } else if (roll < 87) {
                relics.mint(msg.sender, SOUL_DEED, 1);
                emit RelicReceived(msg.sender, SOUL_DEED, 1);
            } else {
                totalAshes++;
            }
        }
        
        if (totalAshes > 0) {
            // 50% chance of Glass Shard on key sacrifice failure
            uint256 shardRoll = _random(amount + 100) % 100;
            if (shardRoll < 50) {
                relics.mint(msg.sender, ASHES, 1);
                emit AshesReceived(msg.sender, 1);
                emit ShardAwarded(msg.sender, 1, "key_failure");
            }
        }
    }
    
    function sacrificeForCosmetic(
        uint256 fragments,
        uint256 masks
    ) external whenNotPaused antiBot nonReentrant {
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
        uint256 successRoll = _random(1) % 100;
        
        if (successRoll < successChance) {
            uint256 cosmeticTypeId = _rollCosmeticType(masks);
            cosmetics.mint(msg.sender, cosmeticTypeId, 1);
            emit CosmeticRitualAttempted(msg.sender, true, cosmeticTypeId);
        } else {
            emit CosmeticRitualAttempted(msg.sender, false, 0);
            // 50% chance of Glass Shard on cosmetic failure
            uint256 shardRoll = _random(fragments + masks + 200) % 100;
            if (shardRoll < 50) {
                relics.mint(msg.sender, ASHES, 1);
                emit AshesReceived(msg.sender, 1);
                emit ShardAwarded(msg.sender, 1, "cosmetic_failure");
            }
        }
    }
    
    function sacrificeForDemon(
        uint256 daggers,
        uint256 vials,
        bool useBindingContract,
        bool useSoulDeed,
        uint256 cultistTokenId
    ) external whenNotPaused antiBot nonReentrant {
        // Validate cultist ownership first
        if (cultists.ownerOf(cultistTokenId) != msg.sender) revert NotCultistOwner();
        
        // Validate special items XOR (only one can be used)
        if (useBindingContract && useSoulDeed) {
            revert InvalidAmount(); // Can't use both special items
        }
        
        // Validate all balances BEFORE burning anything
        if (useBindingContract) {
            if (relics.balanceOf(msg.sender, BINDING_CONTRACT) < 1) {
                revert InsufficientBalance();
            }
        } else if (useSoulDeed) {
            if (relics.balanceOf(msg.sender, SOUL_DEED) < 1) {
                revert InsufficientBalance();
            }
        } else {
            // Normal sacrifice validation
            if (daggers == 0 || daggers > 3) revert InvalidAmount();
            if (vials > 100) revert InvalidAmount(); // Anti-griefing bound
            
            if (relics.balanceOf(msg.sender, BONE_DAGGER) < daggers) {
                revert InsufficientBalance();
            }
            if (vials > 0 && relics.balanceOf(msg.sender, ASH_VIAL) < vials) {
                revert InsufficientBalance();
            }
        }
        
        // Now burn the cultist (after all validations pass)
        cultists.burn(cultistTokenId);
        emit CultistsSacrificed(msg.sender, cultistTokenId);
        
        uint8 demonTier;
        
        // Execute the sacrifice based on type
        if (useBindingContract) {
            // Binding Contract guarantees rare demon (tier 2)
            relics.burn(msg.sender, BINDING_CONTRACT, 1);
            demonTier = 2; // Rare demon guaranteed
            demons.safeMint(msg.sender, demonTier);
            emit DemonRitualAttempted(msg.sender, true, demonTier);
            
        } else if (useSoulDeed) {
            // Soul Deed guarantees legendary demon (tier 3) - with cap check
            relics.burn(msg.sender, SOUL_DEED, 1);
            
            // Check mythic cap
            if (mythicDemonsMinted >= MAX_MYTHIC_DEMONS) {
                demonTier = 2; // Downgrade to rare if cap reached
            } else {
                demonTier = 3; // Legendary demon
                mythicDemonsMinted++;
                userMythicCount[msg.sender]++;
                emit MythicMinted(msg.sender, demonTier, "soul_deed");
            }
            
            demons.safeMint(msg.sender, demonTier);
            emit DemonRitualAttempted(msg.sender, true, demonTier);
            
        } else {
            // Normal sacrifice with daggers and vials
            
            // Burn relics
            relics.burn(msg.sender, BONE_DAGGER, daggers);
            if (vials > 0) {
                relics.burn(msg.sender, ASH_VIAL, vials);
            }
            
            // Calculate success chance
            uint256 successChance = _getDemonSuccessChance(daggers);
            uint256 successRoll = _random(2) % 100;
            
            if (successRoll < successChance) {
                // Determine demon tier based on vials
                if (vials == 3) {
                    // Check mythic cap for tier 3
                    if (mythicDemonsMinted >= MAX_MYTHIC_DEMONS) {
                        demonTier = 2; // Downgrade to rare if cap reached
                    } else {
                        demonTier = 3; // Legendary
                        mythicDemonsMinted++;
                        userMythicCount[msg.sender]++;
                        emit MythicMinted(msg.sender, demonTier, "rng_vials");
                    }
                } else if (vials == 2) {
                    demonTier = 2; // Rare
                } else {
                    demonTier = 1; // Common
                }
                
                demons.safeMint(msg.sender, demonTier);
                emit DemonRitualAttempted(msg.sender, true, demonTier);
            } else {
                // Failed - return ashes
                relics.mint(msg.sender, ASHES, 1);
                emit DemonRitualAttempted(msg.sender, false, 0);
                emit AshesReceived(msg.sender, 1);
                emit ShardAwarded(msg.sender, 1, "demon_failure");
            }
        }
    }
    
    function convertAshes() external whenNotPaused antiBot nonReentrant {
        uint256 ashBalance = relics.balanceOf(msg.sender, ASHES);
        if (ashBalance < 5) revert InsufficientBalance();
        if (ashBalance > 500) revert InvalidAmount(); // Anti-griefing bound
        
        uint256 capsToMint = ashBalance / 5;
        uint256 ashesToBurn = capsToMint * 5;
        
        relics.burn(msg.sender, ASHES, ashesToBurn);
        relics.mint(msg.sender, RUSTED_KEY, capsToMint);
        
        emit RelicReceived(msg.sender, RUSTED_KEY, capsToMint);
        emit CapsCrafted(msg.sender, ashesToBurn, capsToMint);
    }
    
    // ========== Internal Functions ==========
    
    function _getCosmeticSuccessChance(uint256 fragments) private pure returns (uint256) {
        if (fragments == 1) return 35;
        if (fragments == 2) return 60;
        if (fragments == 3) return 80;
        return 0;
    }
    
    function _getDemonSuccessChance(uint256 daggers) private pure returns (uint256) {
        if (daggers == 1) return 10;
        if (daggers == 2) return 20;
        if (daggers == 3) return 30;
        return 0;
    }
    
    function _rollCosmeticType(uint256 masks) private view returns (uint256) {
        if (currentCosmeticTypes.length == 0) revert NoCosmetics();
        
        uint256 roll = _random(3) % 100;
        uint8 targetRarity;
        
        if (masks == 0) {
            // No masks: 70% common, 25% uncommon, 5% rare
            if (roll < 70) targetRarity = 1;
            else if (roll < 95) targetRarity = 2;
            else targetRarity = 3;
        } else if (masks == 1) {
            // 1 mask: 50% common, 30% uncommon, 15% rare, 5% legendary
            if (roll < 50) targetRarity = 1;
            else if (roll < 80) targetRarity = 2;
            else if (roll < 95) targetRarity = 3;
            else targetRarity = 4;
        } else if (masks == 2) {
            // 2 masks: 30% common, 35% uncommon, 25% rare, 9% legendary, 1% mythic
            if (roll < 30) targetRarity = 1;
            else if (roll < 65) targetRarity = 2;
            else if (roll < 90) targetRarity = 3;
            else if (roll < 99) targetRarity = 4;
            else targetRarity = 5;
        } else { // masks == 3
            // 3 masks: 20% common, 30% uncommon, 30% rare, 17% legendary, 3% mythic
            if (roll < 20) targetRarity = 1;
            else if (roll < 50) targetRarity = 2;
            else if (roll < 80) targetRarity = 3;
            else if (roll < 97) targetRarity = 4;
            else targetRarity = 5;
        }
        
        // Find a cosmetic of the target rarity
        uint256[] memory validTypes = new uint256[](currentCosmeticTypes.length);
        uint256 validCount = 0;
        
        for (uint256 i = 0; i < currentCosmeticTypes.length; i++) {
            uint256 typeId = currentCosmeticTypes[i];
            uint8 rarity = cosmetics.getCosmeticRarity(typeId);
            if (rarity == targetRarity) {
                validTypes[validCount] = typeId;
                validCount++;
            }
        }
        
        if (validCount == 0) revert NoCosmeticsOfRarity();
        
        uint256 selectedIndex = _random(4) % validCount;
        return validTypes[selectedIndex];
    }
    
    function _random(uint256 nonce) private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            nonce
        )));
    }
    
    // ========== Admin Functions ==========
    
    function setMonthlyCosmetics(uint256 setId, uint256[] calldata cosmeticTypeIds) external onlyOwner {
        currentMonthlySetId = setId;
        currentCosmeticTypes = cosmeticTypeIds;
        emit MonthlyCosmeticsSet(setId, cosmeticTypeIds);
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
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ========== View Functions ==========
    
    function getCurrentCosmeticTypes() external view returns (uint256[] memory) {
        return currentCosmeticTypes;
    }
}