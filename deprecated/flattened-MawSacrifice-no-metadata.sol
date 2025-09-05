// Sources flattened with hardhat v2.26.3 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/utils/Context.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File @openzeppelin/contracts/access/Ownable.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File @openzeppelin/contracts/utils/Pausable.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (utils/Pausable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract Pausable is Context {
    bool private _paused;

    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    /**
     * @dev The operation failed because the contract is paused.
     */
    error EnforcedPause();

    /**
     * @dev The operation failed because the contract is not paused.
     */
    error ExpectedPause();

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Throws if the contract is paused.
     */
    function _requireNotPaused() internal view virtual {
        if (paused()) {
            revert EnforcedPause();
        }
    }

    /**
     * @dev Throws if the contract is not paused.
     */
    function _requirePaused() internal view virtual {
        if (!paused()) {
            revert ExpectedPause();
        }
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}


// File @openzeppelin/contracts/utils/ReentrancyGuard.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/ReentrancyGuard.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}


// File contracts/interfaces/ISharedInterfaces.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.24;

interface IRaccoons {
    function ownerOf(uint256 tokenId) external view returns (address);
    function exists(uint256 tokenId) external view returns (bool);
    function markJoinedCult(uint256 tokenId) external;
    function markDead(uint256 tokenId) external;
    function burn(uint256 tokenId) external;
    function burnFrom(address owner, uint256 tokenId) external;
}

interface ICultists {
    function ownerOf(uint256 tokenId) external view returns (address);
    function burn(uint256 tokenId) external;
    function burnFrom(address owner, uint256 tokenId) external;
    function mintTo(address to, uint256 raccoonId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
}

interface IRelics {
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function burn(address from, uint256 id, uint256 amount) external;
    function burnBatch(address from, uint256[] calldata ids, uint256[] calldata amounts) external;
    function burnBatchFrom(address from, uint256[] calldata ids, uint256[] calldata amounts) external;
    function mint(address to, uint256 id, uint256 amount, bytes memory data) external;
}

interface IDemons {
    function mintTo(address to, uint8 tier) external returns (uint256);
}

interface ICosmetics {
    function ownerOf(uint256 tokenId) external view returns (address);
    function burn(uint256 tokenId) external;
    function mintTo(address to, uint256 cosmeticId) external returns (uint256);
    function getCosmeticInfo(uint256 cosmeticId) external view returns (uint8 rarity, uint256 monthlySetId);
    function getCosmeticTokenInfo(uint256 tokenId) external view returns (
        string memory name,
        string memory imageURI,
        string memory previewLayerURI,
        uint8 rarity,
        uint8 slot,
        uint256 monthlySetId
    );
}


// File contracts/MawSacrifice.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.24;




/**
 * @title MawSacrifice
 * @notice Contract for sacrificing keys and relics to the Maw for rewards
 */
contract MawSacrifice is Ownable, ReentrancyGuard, Pausable {
    IRelics public relics;
    ICosmetics public cosmetics;
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
    uint256 public constant ASHES = 9;
    
    // Current monthly cosmetic set
    uint256 public currentMonthlySetId = 1;
    uint256[] public currentCosmeticIds;
    
    // Anti-bot protection
    mapping(address => uint256) public lastSacrificeBlock;
    uint256 public minBlocksBetweenSacrifices = 1;
    
    // Configurable ashes conversion
    uint256 public ashesPerVial = 25;
    
    // Custom errors for gas efficiency
    error InvalidAmount();
    error InsufficientBalance();
    error NoCosmetics();
    error TooFast();
    error NotCultistOwner();
    error NoCosmeticsOfRarity();
    
    event KeysSacrificed(address indexed user, uint256 amount);
    event RelicReceived(address indexed user, uint256 relicId, uint256 amount);
    event CosmeticRitualAttempted(address indexed user, bool success, uint256 cosmeticId);
    event DemonRitualAttempted(address indexed user, bool success, uint8 tier);
    event AshesReceived(address indexed user, uint256 amount);
    event AshesConverted(address indexed user, uint256 ashesUsed);
    event ContractsUpdated(address indexed relics, address indexed cosmetics, address indexed demons, address cultists);
    event MonthlyCosmeticsSet(uint256 indexed setId, uint256[] cosmeticIds);
    event MinBlocksSet(uint256 blocks);
    event AshesPerVialSet(uint256 value);
    event CultistsSacrificed(address indexed user, uint256 indexed tokenId);
    
    modifier antiBot() {
        if (block.number < lastSacrificeBlock[msg.sender] + minBlocksBetweenSacrifices) {
            revert TooFast();
        }
        lastSacrificeBlock[msg.sender] = block.number;
        _;
    }
    
    constructor(address _relics, address _cosmetics, address _demons, address _cultists) Ownable(msg.sender) {
        relics = IRelics(_relics);
        cosmetics = ICosmetics(_cosmetics);
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
            } else if (roll < 8000) {
                // 20% Lantern Fragment
                relics.mint(msg.sender, LANTERN_FRAGMENT, 1, "");
                emit RelicReceived(msg.sender, LANTERN_FRAGMENT, 1);
            } else if (roll < 9500) {
                // 15% Bone Dagger
                relics.mint(msg.sender, BONE_DAGGER, 1, "");
                emit RelicReceived(msg.sender, BONE_DAGGER, 1);
            } else if (roll < 9900) {
                // 4% Worm-eaten Mask
                relics.mint(msg.sender, WORM_EATEN_MASK, 1, "");
                emit RelicReceived(msg.sender, WORM_EATEN_MASK, 1);
            } else if (roll < 9990) {
                // 0.9% Ash Vial
                relics.mint(msg.sender, ASH_VIAL, 1, "");
                emit RelicReceived(msg.sender, ASH_VIAL, 1);
            } else if (roll < 9998) {
                // 0.08% Binding Contract
                relics.mint(msg.sender, BINDING_CONTRACT, 1, "");
                emit RelicReceived(msg.sender, BINDING_CONTRACT, 1);
            } else {
                // 0.02% Soul Deed
                relics.mint(msg.sender, SOUL_DEED, 1, "");
                emit RelicReceived(msg.sender, SOUL_DEED, 1);
            }
        }
        
        // Give ash for failed keys
        if (failedKeys > 0) {
            relics.mint(msg.sender, ASHES, failedKeys, "");
            emit AshesReceived(msg.sender, failedKeys);
        }
    }
    
    /**
     * @notice Sacrifice relics for cosmetic rewards
     * @dev Fragments determine success chance, masks boost rarity. Requires at least 1 fragment.
     * @param fragments Number of Lantern Fragments to sacrifice (tickets, 1-3)
     * @param masks Number of Worm-eaten Masks to sacrifice (boosters, 0-3)
     */
    function sacrificeForCosmetic(
        uint256 fragments,
        uint256 masks
    ) external whenNotPaused antiBot nonReentrant {
        if (fragments + masks == 0 || fragments + masks > 3) revert InvalidAmount();
        if (fragments == 0) revert InvalidAmount(); // Need at least 1 Fragment
        if (currentCosmeticIds.length == 0) revert NoCosmetics();
        
        // Check balances
        if (fragments > 0 && relics.balanceOf(msg.sender, LANTERN_FRAGMENT) < fragments) {
            revert InsufficientBalance();
        }
        if (masks > 0 && relics.balanceOf(msg.sender, WORM_EATEN_MASK) < masks) {
            revert InsufficientBalance();
        }
        
        // Batch burn relics for gas efficiency
        if (fragments > 0 && masks > 0) {
            uint256[] memory ids = new uint256[](2);
            uint256[] memory amounts = new uint256[](2);
            ids[0] = LANTERN_FRAGMENT;
            ids[1] = WORM_EATEN_MASK;
            amounts[0] = fragments;
            amounts[1] = masks;
            relics.burnBatch(msg.sender, ids, amounts);
        } else if (fragments > 0) {
            relics.burn(msg.sender, LANTERN_FRAGMENT, fragments);
        } else {
            relics.burn(msg.sender, WORM_EATEN_MASK, masks);
        }
        
        // Calculate success chance based on fragments (tickets)
        uint256 successChance = _getCosmeticSuccessChance(fragments);
        uint256 roll = _random(0) % 100;
        
        if (roll < successChance) {
            // Success! Determine rarity based on masks (boosters)
            uint256 cosmeticId = _rollCosmetic(masks);
            cosmetics.mintTo(msg.sender, cosmeticId);
            emit CosmeticRitualAttempted(msg.sender, true, cosmeticId);
        } else {
            // Failed - give ashes
            uint256 ashAmount = fragments + masks;
            relics.mint(msg.sender, ASHES, ashAmount, "");
            emit CosmeticRitualAttempted(msg.sender, false, 0);
            emit AshesReceived(msg.sender, ashAmount);
        }
    }
    
    /**
     * @notice Sacrifice cultist and relics for demon summoning
     * @dev ALL demon rituals require cultist sacrifice. Daggers determine success, vials boost tier.
     * @param daggers Number of Bone Daggers to sacrifice (tickets, 1-3 for normal ritual)
     * @param vials Number of Ash Vials to sacrifice (boosters, 0-3)
     * @param useBindingContract Use guaranteed rare demon (still burns cultist)
     * @param useSoulDeed Use guaranteed legendary demon (still burns cultist)
     * @param cultistTokenId The cultist NFT to sacrifice (burned forever)
     */
    function sacrificeForDemon(
        uint256 daggers,
        uint256 vials,
        bool useBindingContract,
        bool useSoulDeed,
        uint256 cultistTokenId
    ) external whenNotPaused antiBot nonReentrant {
        // Verify cultist ownership for ALL demon sacrifices
        if (cultists.ownerOf(cultistTokenId) != msg.sender) {
            revert NotCultistOwner();
        }
        
        // Handle guaranteed contracts (still require cultist sacrifice)
        if (useBindingContract) {
            if (relics.balanceOf(msg.sender, BINDING_CONTRACT) < 1) revert InsufficientBalance();
            
            // Burn cultist first (true sacrifice)
            _burnCultist(cultistTokenId);
            
            // Burn contract
            relics.burn(msg.sender, BINDING_CONTRACT, 1);
            demons.mintTo(msg.sender, 2); // Tier 2 = Rare
            emit DemonRitualAttempted(msg.sender, true, 2);
            return;
        }
        
        if (useSoulDeed) {
            if (relics.balanceOf(msg.sender, SOUL_DEED) < 1) revert InsufficientBalance();
            
            // Burn cultist first (true sacrifice)
            _burnCultist(cultistTokenId);
            
            // Burn deed
            relics.burn(msg.sender, SOUL_DEED, 1);
            demons.mintTo(msg.sender, 3); // Tier 3 = Legendary
            emit DemonRitualAttempted(msg.sender, true, 3);
            return;
        }
        
        // Normal sacrifice
        if (daggers + vials == 0 || daggers + vials > 3) revert InvalidAmount();
        if (daggers == 0) revert InvalidAmount(); // Need at least 1 dagger
        
        // Check balances
        if (daggers > 0 && relics.balanceOf(msg.sender, BONE_DAGGER) < daggers) {
            revert InsufficientBalance();
        }
        if (vials > 0 && relics.balanceOf(msg.sender, ASH_VIAL) < vials) {
            revert InsufficientBalance();
        }
        
        // Burn cultist first (true sacrifice)
        _burnCultist(cultistTokenId);
        
        // Batch burn relics for gas efficiency
        if (daggers > 0 && vials > 0) {
            uint256[] memory ids = new uint256[](2);
            uint256[] memory amounts = new uint256[](2);
            ids[0] = BONE_DAGGER;
            ids[1] = ASH_VIAL;
            amounts[0] = daggers;
            amounts[1] = vials;
            relics.burnBatch(msg.sender, ids, amounts);
        } else if (daggers > 0) {
            relics.burn(msg.sender, BONE_DAGGER, daggers);
        } else {
            relics.burn(msg.sender, ASH_VIAL, vials);
        }
        
        // Calculate success chance based on daggers (tickets)
        uint256 successChance = _getDemonSuccessChance(daggers);
        uint256 roll = _random(1) % 100;
        
        if (roll < successChance) {
            // Success! Determine tier based on vials (boosters)
            uint8 tier = _rollDemonTier(vials);
            demons.mintTo(msg.sender, tier);
            emit DemonRitualAttempted(msg.sender, true, tier);
        } else {
            // Failed - give ashes
            uint256 ashAmount = _calculateDemonAshes(daggers, vials);
            relics.mint(msg.sender, ASHES, ashAmount, "");
            emit DemonRitualAttempted(msg.sender, false, 0);
            emit AshesReceived(msg.sender, ashAmount);
        }
    }
    
    /**
     * @notice Convert ashes to Ash Vials
     * @dev Conversion rate is configurable by owner (default 50 ashes = 1 vial)
     */
    function convertAshes() external whenNotPaused nonReentrant {
        if (relics.balanceOf(msg.sender, ASHES) < ashesPerVial) revert InsufficientBalance();
        
        relics.burn(msg.sender, ASHES, ashesPerVial);
        relics.mint(msg.sender, ASH_VIAL, 1, "");
        
        emit AshesConverted(msg.sender, ashesPerVial);
        emit RelicReceived(msg.sender, ASH_VIAL, 1);
    }
    
    /**
     * @dev Internal function to burn a cultist NFT
     * @param tokenId Cultist token ID to burn
     */
    function _burnCultist(uint256 tokenId) internal {
        try cultists.burn(tokenId) {
            // Success - cultist was burned via burn function
        } catch {
            // Fallback - transfer to burn address
            cultists.transferFrom(msg.sender, BURN_ADDRESS, tokenId);
        }
        emit CultistsSacrificed(msg.sender, tokenId);
    }
    
    // Helper functions
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
    
    function _rollCosmetic(uint256 masks) private view returns (uint256) {
        if (currentCosmeticIds.length == 0) revert NoCosmetics();
        
        uint256 roll = _random(2) % 100;
        uint8 targetRarity;
        
        if (masks == 0) {
            // No masks: 70% common, 25% uncommon, 5% rare, 0% legendary
            if (roll < 70) targetRarity = 1;
            else if (roll < 95) targetRarity = 2;
            else targetRarity = 3;
        } else if (masks == 1) {
            // 1 mask: 40% common, 40% uncommon, 17% rare, 3% legendary
            if (roll < 40) targetRarity = 1;
            else if (roll < 80) targetRarity = 2;
            else if (roll < 97) targetRarity = 3;
            else targetRarity = 4;
        } else if (masks == 2) {
            // 2 masks: 15% common, 35% uncommon, 35% rare, 15% legendary
            if (roll < 15) targetRarity = 1;
            else if (roll < 50) targetRarity = 2;
            else if (roll < 85) targetRarity = 3;
            else targetRarity = 4;
        } else {
            // 3 masks: 5% common, 20% uncommon, 45% rare, 30% legendary
            if (roll < 5) targetRarity = 1;
            else if (roll < 25) targetRarity = 2;
            else if (roll < 70) targetRarity = 3;
            else targetRarity = 4;
        }
        
        // Filter cosmetics by target rarity
        uint256[] memory candidates = new uint256[](currentCosmeticIds.length);
        uint256 candidateCount = 0;
        
        for (uint256 i = 0; i < currentCosmeticIds.length; i++) {
            (uint8 cosmeticRarity, uint256 setId) = cosmetics.getCosmeticInfo(currentCosmeticIds[i]);
            if (cosmeticRarity == targetRarity && setId == currentMonthlySetId) {
                candidates[candidateCount] = currentCosmeticIds[i];
                candidateCount++;
            }
        }
        
        if (candidateCount == 0) revert NoCosmeticsOfRarity();
        
        // Pick random candidate of correct rarity
        return candidates[_random(22) % candidateCount];
    }
    
    function _rollDemonTier(uint256 vials) private view returns (uint8) {
        uint256 roll = _random(3) % 100;
        
        if (vials == 0) {
            // No vials: 90% rare, 10% legendary
            return roll < 90 ? 2 : 3;
        } else if (vials == 1) {
            // 1 vial: 75% rare, 25% legendary
            return roll < 75 ? 2 : 3;
        } else if (vials == 2) {
            // 2 vials: 50% rare, 50% legendary
            return roll < 50 ? 2 : 3;
        } else {
            // 3 vials: 20% rare, 80% legendary
            return roll < 20 ? 2 : 3;
        }
    }
    
    function _calculateDemonAshes(uint256 daggers, uint256 vials) private pure returns (uint256) {
        uint256 ashAmount = 0;
        if (daggers == 1) ashAmount = 1;
        else if (daggers == 2) ashAmount = 3;
        else if (daggers == 3) ashAmount = 5;
        
        ashAmount += vials * 2; // Each vial adds 2 ashes on fail
        return ashAmount;
    }
    
    function _random(uint256 nonce) private view returns (uint256) {
        // TESTNET ONLY - Use Chainlink VRF for mainnet
        return uint256(keccak256(abi.encodePacked(
            block.prevrandao,
            block.timestamp,
            msg.sender,
            nonce,
            address(this)
        )));
    }
    
    // Admin functions
    
    /**
     * @notice Set the current monthly cosmetic collection
     * @param setId Monthly set identifier
     * @param cosmeticIds Array of cosmetic IDs available this month
     */
    function setMonthlyCosmetics(uint256 setId, uint256[] calldata cosmeticIds) external onlyOwner {
        currentMonthlySetId = setId;
        currentCosmeticIds = cosmeticIds;
        emit MonthlyCosmeticsSet(setId, cosmeticIds);
    }
    
    /**
     * @notice Pause the contract
     * @dev Prevents all sacrifices while paused
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause the contract  
     * @dev Re-enables all sacrifices
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Set minimum blocks between sacrifices (anti-bot)
     * @param blocks Number of blocks users must wait between sacrifices
     */
    function setMinBlocksBetweenSacrifices(uint256 blocks) external onlyOwner {
        minBlocksBetweenSacrifices = blocks;
        emit MinBlocksSet(blocks);
    }
    
    /**
     * @notice Set ashes required per vial conversion
     * @param _ashesPerVial Number of ashes needed to get 1 vial
     */
    function setAshesPerVial(uint256 _ashesPerVial) external onlyOwner {
        if (_ashesPerVial == 0) revert InvalidAmount();
        ashesPerVial = _ashesPerVial;
        emit AshesPerVialSet(_ashesPerVial);
    }
    
    /**
     * @notice Update contract addresses if needed
     * @param _relics New relics contract address (address(0) = no change)
     * @param _cosmetics New cosmetics contract address (address(0) = no change)
     * @param _demons New demons contract address (address(0) = no change)
     * @param _cultists New cultists contract address (address(0) = no change)
     */
    function updateContracts(
        address _relics,
        address _cosmetics, 
        address _demons,
        address _cultists
    ) external onlyOwner {
        if (_relics != address(0)) relics = IRelics(_relics);
        if (_cosmetics != address(0)) cosmetics = ICosmetics(_cosmetics);
        if (_demons != address(0)) demons = IDemons(_demons);
        if (_cultists != address(0)) cultists = ICultists(_cultists);
        
        emit ContractsUpdated(
            address(relics), 
            address(cosmetics), 
            address(demons), 
            address(cultists)
        );
    }
}
