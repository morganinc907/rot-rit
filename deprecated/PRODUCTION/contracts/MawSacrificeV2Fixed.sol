// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MawSacrificeV2Fixed
 * @notice Working contract for sacrificing keys and relics to the Maw for rewards
 * @dev Testnet version without VRF - uses block-based randomness
 */
contract MawSacrificeV2Fixed is Ownable, ReentrancyGuard, Pausable {
    IRelics public relics;
    ICosmeticsV2 public cosmetics;
    IDemons public demons;
    ICultists public cultists;
    
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    // Relic IDs
    uint256 public constant RUSTED_KEY = 1;
    uint256 public constant LANTERN_FRAGMENT = 2;
    uint256 public constant WORM_EATEN_MASK = 3;
    uint256 public constant BONE_DAGGER = 4;
    uint256 public constant ASH_VIAL = 5;
    uint256 public constant BINDING_CONTRACT = 6;
    uint256 public constant SOUL_DEED = 7;
    uint256 public constant ASHES = 8;
    
    // Current monthly cosmetic set
    uint256 public currentMonthlySetId = 1;
    uint256[] public currentCosmeticTypes;
    
    // Anti-bot protection
    mapping(address => uint256) public lastSacrificeBlock;
    uint256 public minBlocksBetweenSacrifices = 1;
    
    // Custom errors for gas efficiency
    error InvalidAmount();
    error InsufficientBalance();
    error NoCosmetics();
    error TooFast();
    error NotCultistOwner();
    error NoCosmeticsOfRarity();
    
    event KeysSacrificed(address indexed user, uint256 amount);
    event RelicReceived(address indexed user, uint256 relicId, uint256 amount);
    event CosmeticRitualAttempted(address indexed user, bool success, uint256 cosmeticTypeId);
    event DemonRitualAttempted(address indexed user, bool success, uint8 tier);
    event AshesReceived(address indexed user, uint256 amount);
    event ContractsUpdated(address indexed relics, address indexed cosmetics, address indexed demons, address cultists);
    event MonthlyCosmeticsSet(uint256 indexed setId, uint256[] cosmeticTypeIds);
    event MinBlocksSet(uint256 blocks);
    event CultistsSacrificed(address indexed user, uint256 indexed tokenId);
    
    modifier antiBot() {
        if (block.number < lastSacrificeBlock[msg.sender] + minBlocksBetweenSacrifices) {
            revert TooFast();
        }
        lastSacrificeBlock[msg.sender] = block.number;
        _;
    }
    
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
    
    /**
     * @notice Sacrifice Rusted Keys for random relics
     * @dev Keys have 60% chance of no reward, decreasing odds for better relics
     * @param amount Number of keys to sacrifice (1-10 limit)
     */
    function sacrificeKeys(uint256 amount) external whenNotPaused antiBot nonReentrant {
        if (amount == 0 || amount > 10) revert InvalidAmount();
        if (relics.balanceOf(msg.sender, RUSTED_KEY) < amount) revert InsufficientBalance();
        
        // Burn keys
        relics.burn(msg.sender, RUSTED_KEY, amount);
        emit KeysSacrificed(msg.sender, amount);
        
        // Track failed keys to give ash
        uint256 failedKeys = 0;
        
        // Roll for each key
        for (uint256 i = 0; i < amount; i++) {
            uint256 roll = _random(i) % 10000;
            
            if (roll < 6000) {
                // 60% Nothing - count as failed
                failedKeys++;
                continue;
            } else if (roll < 8500) {
                // 25% Lantern Fragment
                relics.mint(msg.sender, LANTERN_FRAGMENT, 1, "");
                emit RelicReceived(msg.sender, LANTERN_FRAGMENT, 1);
            } else if (roll < 9500) {
                // 10% Worm-eaten Mask
                relics.mint(msg.sender, WORM_EATEN_MASK, 1, "");
                emit RelicReceived(msg.sender, WORM_EATEN_MASK, 1);
            } else if (roll < 9800) {
                // 3% Bone Dagger
                relics.mint(msg.sender, BONE_DAGGER, 1, "");
                emit RelicReceived(msg.sender, BONE_DAGGER, 1);
            } else if (roll < 9950) {
                // 1.5% Ash Vial
                relics.mint(msg.sender, ASH_VIAL, 1, "");
                emit RelicReceived(msg.sender, ASH_VIAL, 1);
            } else if (roll < 9990) {
                // 0.4% Binding Contract
                relics.mint(msg.sender, BINDING_CONTRACT, 1, "");
                emit RelicReceived(msg.sender, BINDING_CONTRACT, 1);
            } else {
                // 0.1% Soul Deed
                relics.mint(msg.sender, SOUL_DEED, 1, "");
                emit RelicReceived(msg.sender, SOUL_DEED, 1);
            }
        }
        
        // Give ashes for failed keys
        if (failedKeys > 0) {
            relics.mint(msg.sender, ASHES, failedKeys, "");
            emit AshesReceived(msg.sender, failedKeys);
        }
    }
    
    /**
     * @notice Sacrifice Lantern Fragments and optional Worm-eaten Masks for cosmetics
     * @dev Success rate increases with fragments, masks increase rarity if successful
     * @param fragments Number of Lantern Fragments (1-3)
     * @param masks Number of Worm-eaten Masks (0-3)
     */
    function sacrificeForCosmetic(
        uint256 fragments,
        uint256 masks
    ) external whenNotPaused antiBot nonReentrant {
        if (fragments + masks == 0 || fragments + masks > 3) revert InvalidAmount();
        if (fragments == 0) revert InvalidAmount(); // Need at least 1 Fragment
        if (currentCosmeticTypes.length == 0) revert NoCosmetics();
        
        // Check balances
        if (fragments > 0 && relics.balanceOf(msg.sender, LANTERN_FRAGMENT) < fragments) {
            revert InsufficientBalance();
        }
        if (masks > 0 && relics.balanceOf(msg.sender, WORM_EATEN_MASK) < masks) {
            revert InsufficientBalance();
        }
        
        // Burn relics
        if (fragments > 0) {
            relics.burn(msg.sender, LANTERN_FRAGMENT, fragments);
        }
        if (masks > 0) {
            relics.burn(msg.sender, WORM_EATEN_MASK, masks);
        }
        
        // Calculate success chance
        uint256 successChance = _getCosmeticSuccessChance(fragments);
        uint256 successRoll = _random(1) % 100;
        
        if (successRoll < successChance) {
            // Success! Roll for cosmetic
            uint256 cosmeticTypeId = _rollCosmeticType(masks);
            
            // Mint the cosmetic to the user
            cosmetics.mint(msg.sender, cosmeticTypeId, 1);
            emit CosmeticRitualAttempted(msg.sender, true, cosmeticTypeId);
        } else {
            // Failure - give ashes
            relics.mint(msg.sender, ASHES, 1, "");
            emit AshesReceived(msg.sender, 1);
            emit CosmeticRitualAttempted(msg.sender, false, 0);
        }
    }
    
    /**
     * @notice Sacrifice Cultist and Bone Daggers for demons
     * @dev Daggers increase success rate, Ash Vials improve tier if successful
     * @param cultistTokenId ID of cultist to sacrifice
     * @param daggers Number of Bone Daggers (1-3)
     * @param vials Number of Ash Vials (0-3)
     */
    function sacrificeForDemon(
        uint256 cultistTokenId,
        uint256 daggers,
        uint256 vials
    ) external whenNotPaused antiBot nonReentrant {
        if (daggers == 0 || daggers > 3) revert InvalidAmount();
        if (vials > 3) revert InvalidAmount();
        if (cultists.ownerOf(cultistTokenId) != msg.sender) revert NotCultistOwner();
        
        // Check balances
        if (relics.balanceOf(msg.sender, BONE_DAGGER) < daggers) {
            revert InsufficientBalance();
        }
        if (vials > 0 && relics.balanceOf(msg.sender, ASH_VIAL) < vials) {
            revert InsufficientBalance();
        }
        
        // Burn cultist and relics
        cultists.burn(cultistTokenId);
        relics.burn(msg.sender, BONE_DAGGER, daggers);
        if (vials > 0) {
            relics.burn(msg.sender, ASH_VIAL, vials);
        }
        
        emit CultistsSacrificed(msg.sender, cultistTokenId);
        
        // Calculate success chance
        uint256 successChance = _getDemonSuccessChance(daggers);
        uint256 successRoll = _random(2) % 100;
        
        if (successRoll < successChance) {
            // Success! Roll for demon tier
            uint8 tier = _getDemonTier(vials);
            demons.mintTo(msg.sender, tier);
            emit DemonRitualAttempted(msg.sender, true, tier);
        } else {
            // Failure - give ashes
            relics.mint(msg.sender, ASHES, 2, "");
            emit AshesReceived(msg.sender, 2);
            emit DemonRitualAttempted(msg.sender, false, 0);
        }
    }
    
    /**
     * @notice Use contracts/deeds for guaranteed demons
     */
    function useBindingContract() external whenNotPaused antiBot nonReentrant {
        if (relics.balanceOf(msg.sender, BINDING_CONTRACT) < 1) revert InsufficientBalance();
        
        relics.burn(msg.sender, BINDING_CONTRACT, 1);
        demons.mintTo(msg.sender, 1); // Guaranteed Rare demon
        emit DemonRitualAttempted(msg.sender, true, 1);
    }
    
    function useSoulDeed() external whenNotPaused antiBot nonReentrant {
        if (relics.balanceOf(msg.sender, SOUL_DEED) < 1) revert InsufficientBalance();
        
        relics.burn(msg.sender, SOUL_DEED, 1);
        demons.mintTo(msg.sender, 2); // Guaranteed Mythic demon
        emit DemonRitualAttempted(msg.sender, true, 2);
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
        
        // For testnet, just return a random cosmetic type (simplified)
        uint256 selectedIndex = _random(4) % currentCosmeticTypes.length;
        return currentCosmeticTypes[selectedIndex];
    }
    
    function _getDemonTier(uint256 vials) private view returns (uint8) {
        uint256 roll = _random(5) % 100;
        
        if (vials == 0) {
            // No vials: 95% tier 1 (rare), 5% tier 2 (mythic)
            if (roll < 95) return 1;
            else return 2;
        } else if (vials == 1) {
            // 1 vial: 85% tier 1 (rare), 15% tier 2 (mythic)
            if (roll < 85) return 1;
            else return 2;
        } else if (vials == 2) {
            // 2 vials: 70% tier 1 (rare), 30% tier 2 (mythic)
            if (roll < 70) return 1;
            else return 2;
        } else { // vials >= 3
            // 3+ vials: 50% tier 1 (rare), 50% tier 2 (mythic)
            if (roll < 50) return 1;
            else return 2;
        }
    }
    
    function _random(uint256 nonce) private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            nonce,
            blockhash(block.number - 1)
        )));
    }
    
    // ========== Admin Functions ==========
    
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
    
    function setMonthlyCosmetics(uint256 setId, uint256[] calldata cosmeticTypeIds) external onlyOwner {
        currentMonthlySetId = setId;
        currentCosmeticTypes = cosmeticTypeIds;
        emit MonthlyCosmeticsSet(setId, cosmeticTypeIds);
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

// Interfaces
interface IRelics {
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function burn(address from, uint256 id, uint256 amount) external;
    function mint(address to, uint256 id, uint256 amount, bytes memory data) external;
}

interface ICosmeticsV2 {
    function mint(address to, uint256 typeId, uint256 amount) external;
}

interface IDemons {
    function mintTo(address to, uint8 tier) external;
}

interface ICultists {
    function ownerOf(uint256 tokenId) external view returns (address);
    function burn(uint256 tokenId) external;
}