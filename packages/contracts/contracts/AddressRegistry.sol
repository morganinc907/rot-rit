// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AddressRegistry
 * @dev Simple registry contract for chain-first address resolution
 * @notice Provides a single source of truth for all ecosystem contract addresses
 */
contract AddressRegistry is Ownable {
    
    // Events
    event AddressSet(bytes32 indexed key, address indexed oldAddress, address indexed newAddress);
    event ConfigHashUpdated(bytes32 oldHash, bytes32 newHash);
    
    // Storage
    mapping(bytes32 => address) private _addresses;
    bytes32 private _configHash;
    
    // Standard keys for all ecosystem contracts
    bytes32 public constant RELICS = keccak256("RELICS");
    bytes32 public constant MAW_SACRIFICE = keccak256("MAW_SACRIFICE");
    bytes32 public constant COSMETICS = keccak256("COSMETICS");
    bytes32 public constant DEMONS = keccak256("DEMONS");
    bytes32 public constant CULTISTS = keccak256("CULTISTS");
    bytes32 public constant KEY_SHOP = keccak256("KEY_SHOP");
    bytes32 public constant RACCOONS = keccak256("RACCOONS");
    bytes32 public constant RACCOON_RENDERER = keccak256("RACCOON_RENDERER");
    bytes32 public constant RITUAL_READ_AGGREGATOR = keccak256("RITUAL_READ_AGGREGATOR");
    
    constructor() Ownable(msg.sender) {
        _updateConfigHash();
    }
    
    // ============ GETTERS ============
    
    /**
     * @dev Get address by key
     */
    function get(bytes32 key) external view returns (address) {
        return _addresses[key];
    }
    
    /**
     * @dev Get all addresses at once
     */
    function getAll() external view returns (
        address relics,
        address mawSacrifice,
        address cosmetics,
        address demons,
        address cultists,
        address keyShop,
        address raccoons,
        address raccoonRenderer,
        address ritualReadAggregator
    ) {
        relics = _addresses[RELICS];
        mawSacrifice = _addresses[MAW_SACRIFICE];
        cosmetics = _addresses[COSMETICS];
        demons = _addresses[DEMONS];
        cultists = _addresses[CULTISTS];
        keyShop = _addresses[KEY_SHOP];
        raccoons = _addresses[RACCOONS];
        raccoonRenderer = _addresses[RACCOON_RENDERER];
        ritualReadAggregator = _addresses[RITUAL_READ_AGGREGATOR];
    }
    
    /**
     * @dev Get configuration hash
     */
    function configHash() external view returns (bytes32) {
        return _configHash;
    }
    
    /**
     * @dev Health check - returns count of set addresses
     */
    function healthcheck() external view returns (
        uint256 totalKeys,
        uint256 setAddresses,
        bool allSet,
        bytes32 currentConfigHash
    ) {
        bytes32[] memory keys = _getAllKeys();
        totalKeys = keys.length;
        
        uint256 count = 0;
        for (uint256 i = 0; i < keys.length; i++) {
            if (_addresses[keys[i]] != address(0)) {
                count++;
            }
        }
        
        setAddresses = count;
        allSet = count == totalKeys;
        currentConfigHash = _configHash;
    }
    
    // ============ SETTERS (Owner Only) ============
    
    /**
     * @dev Set single address
     */
    function set(bytes32 key, address addr) external onlyOwner {
        require(addr != address(0), "Address cannot be zero");
        address oldAddress = _addresses[key];
        _addresses[key] = addr;
        _updateConfigHash();
        emit AddressSet(key, oldAddress, addr);
    }
    
    /**
     * @dev Set multiple addresses at once
     */
    function setMultiple(bytes32[] calldata keys, address[] calldata addrs) external onlyOwner {
        require(keys.length == addrs.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < keys.length; i++) {
            require(addrs[i] != address(0), "Address cannot be zero");
            address oldAddress = _addresses[keys[i]];
            _addresses[keys[i]] = addrs[i];
            emit AddressSet(keys[i], oldAddress, addrs[i]);
        }
        
        _updateConfigHash();
    }
    
    /**
     * @dev Set all ecosystem addresses
     */
    function setAll(
        address _relics,
        address _mawSacrifice,
        address _cosmetics,
        address _demons,
        address _cultists,
        address _keyShop,
        address _raccoons,
        address _raccoonRenderer,
        address _ritualReadAggregator
    ) external onlyOwner {
        require(_relics != address(0), "Relics address cannot be zero");
        require(_mawSacrifice != address(0), "MawSacrifice address cannot be zero");
        require(_cosmetics != address(0), "Cosmetics address cannot be zero");
        require(_demons != address(0), "Demons address cannot be zero");
        require(_cultists != address(0), "Cultists address cannot be zero");
        require(_keyShop != address(0), "KeyShop address cannot be zero");
        require(_raccoons != address(0), "Raccoons address cannot be zero");
        require(_raccoonRenderer != address(0), "RaccoonRenderer address cannot be zero");
        require(_ritualReadAggregator != address(0), "RitualReadAggregator address cannot be zero");
        
        address oldRelics = _addresses[RELICS];
        address oldMaw = _addresses[MAW_SACRIFICE];
        address oldCosmetics = _addresses[COSMETICS];
        address oldDemons = _addresses[DEMONS];
        address oldCultists = _addresses[CULTISTS];
        address oldKeyShop = _addresses[KEY_SHOP];
        address oldRaccoons = _addresses[RACCOONS];
        address oldRenderer = _addresses[RACCOON_RENDERER];
        address oldAggregator = _addresses[RITUAL_READ_AGGREGATOR];
        
        _addresses[RELICS] = _relics;
        _addresses[MAW_SACRIFICE] = _mawSacrifice;
        _addresses[COSMETICS] = _cosmetics;
        _addresses[DEMONS] = _demons;
        _addresses[CULTISTS] = _cultists;
        _addresses[KEY_SHOP] = _keyShop;
        _addresses[RACCOONS] = _raccoons;
        _addresses[RACCOON_RENDERER] = _raccoonRenderer;
        _addresses[RITUAL_READ_AGGREGATOR] = _ritualReadAggregator;
        
        _updateConfigHash();
        
        emit AddressSet(RELICS, oldRelics, _relics);
        emit AddressSet(MAW_SACRIFICE, oldMaw, _mawSacrifice);
        emit AddressSet(COSMETICS, oldCosmetics, _cosmetics);
        emit AddressSet(DEMONS, oldDemons, _demons);
        emit AddressSet(CULTISTS, oldCultists, _cultists);
        emit AddressSet(KEY_SHOP, oldKeyShop, _keyShop);
        emit AddressSet(RACCOONS, oldRaccoons, _raccoons);
        emit AddressSet(RACCOON_RENDERER, oldRenderer, _raccoonRenderer);
        emit AddressSet(RITUAL_READ_AGGREGATOR, oldAggregator, _ritualReadAggregator);
    }
    
    // ============ INTERNAL FUNCTIONS ============
    
    function _getAllKeys() internal pure returns (bytes32[] memory) {
        bytes32[] memory keys = new bytes32[](9);
        keys[0] = RELICS;
        keys[1] = MAW_SACRIFICE;
        keys[2] = COSMETICS;
        keys[3] = DEMONS;
        keys[4] = CULTISTS;
        keys[5] = KEY_SHOP;
        keys[6] = RACCOONS;
        keys[7] = RACCOON_RENDERER;
        keys[8] = RITUAL_READ_AGGREGATOR;
        return keys;
    }
    
    function _updateConfigHash() internal {
        bytes32 oldHash = _configHash;
        
        _configHash = keccak256(abi.encode(
            _addresses[RELICS],
            _addresses[MAW_SACRIFICE],
            _addresses[COSMETICS],
            _addresses[DEMONS],
            _addresses[CULTISTS],
            _addresses[KEY_SHOP],
            _addresses[RACCOONS],
            _addresses[RACCOON_RENDERER],
            _addresses[RITUAL_READ_AGGREGATOR],
            block.chainid,
            block.timestamp / 86400 // Daily rotation
        ));
        
        emit ConfigHashUpdated(oldHash, _configHash);
    }
}