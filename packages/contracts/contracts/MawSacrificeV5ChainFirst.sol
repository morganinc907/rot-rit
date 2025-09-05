// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./MawSacrificeV5.sol";

/**
 * @title MawSacrificeV5ChainFirst
 * @dev Extends MawSacrificeV5 with chain-first address resolution for all ecosystem contracts
 * @notice Adds getters for KeyShop, Raccoons, RaccoonRenderer, and RitualReadAggregator
 */
contract MawSacrificeV5ChainFirst is MawSacrificeV5 {
    
    // UNSTRUCTURED STORAGE FOR CHAIN-FIRST ADDRESSES (no storage slot collision)
    bytes32 internal constant _CHAIN_FIRST_SLOT = 
        bytes32(uint256(keccak256("maw.chain.first.addresses.v1")) - 1);
    
    struct ChainFirstAddresses {
        address keyShop;                // KeyShop contract for buying caps
        address raccoons;               // Raccoons NFT contract  
        address raccoonRenderer;        // RaccoonRenderer for metadata
        address ritualReadAggregator;   // RitualReadAggregator for data
    }
    
    // Events
    event ChainFirstAddressesUpdated(
        address keyShop, 
        address raccoons, 
        address raccoonRenderer, 
        address ritualReadAggregator
    );
    
    // ============ NEW CHAIN-FIRST GETTERS ============
    
    /**
     * @dev Get KeyShop contract address
     */
    function keyShop() external view returns (address) {
        ChainFirstAddresses storage cf = _getChainFirstAddresses();
        return cf.keyShop;
    }
    
    /**
     * @dev Get Raccoons contract address  
     */
    function raccoons() external view returns (address) {
        ChainFirstAddresses storage cf = _getChainFirstAddresses();
        return cf.raccoons;
    }
    
    /**
     * @dev Get RaccoonRenderer contract address
     */
    function raccoonRenderer() external view returns (address) {
        ChainFirstAddresses storage cf = _getChainFirstAddresses();
        return cf.raccoonRenderer;
    }
    
    /**
     * @dev Get RitualReadAggregator contract address
     */
    function ritualReadAggregator() external view returns (address) {
        ChainFirstAddresses storage cf = _getChainFirstAddresses();
        return cf.ritualReadAggregator;
    }
    
    /**
     * @dev Enhanced health check - returns all contract dependencies including new chain-first ones
     */
    function chainFirstHealthcheck() external view returns (
        address _relics,
        address _cosmetics, 
        address _demons,
        address _cultists,
        address _keyShop,
        address _raccoons,
        address _raccoonRenderer,
        address _ritualReadAggregator,
        bool _allSet
    ) {
        ChainFirstAddresses storage cf = _getChainFirstAddresses();
        
        _relics = address(relics);
        _cosmetics = address(cosmetics);
        _demons = address(demons);
        _cultists = address(cultists);
        _keyShop = cf.keyShop;
        _raccoons = cf.raccoons;
        _raccoonRenderer = cf.raccoonRenderer;
        _ritualReadAggregator = cf.ritualReadAggregator;
        
        // Check if all addresses are set (non-zero)
        _allSet = _relics != address(0) && 
                  _cosmetics != address(0) &&
                  _demons != address(0) && 
                  _cultists != address(0) &&
                  _keyShop != address(0) &&
                  _raccoons != address(0) &&
                  _raccoonRenderer != address(0) &&
                  _ritualReadAggregator != address(0);
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Set chain-first contract addresses (only owner)
     */
    function setChainFirstAddresses(
        address _keyShop,
        address _raccoons,
        address _raccoonRenderer, 
        address _ritualReadAggregator
    ) external onlyOwner {
        require(_keyShop != address(0), "KeyShop address cannot be zero");
        require(_raccoons != address(0), "Raccoons address cannot be zero");
        require(_raccoonRenderer != address(0), "RaccoonRenderer address cannot be zero");
        require(_ritualReadAggregator != address(0), "RitualReadAggregator address cannot be zero");
        
        ChainFirstAddresses storage cf = _getChainFirstAddresses();
        cf.keyShop = _keyShop;
        cf.raccoons = _raccoons;
        cf.raccoonRenderer = _raccoonRenderer;
        cf.ritualReadAggregator = _ritualReadAggregator;
        
        emit ChainFirstAddressesUpdated(_keyShop, _raccoons, _raccoonRenderer, _ritualReadAggregator);
    }
    
    // ============ INTERNAL FUNCTIONS ============
    
    function _getChainFirstAddresses() internal pure returns (ChainFirstAddresses storage cf) {
        bytes32 slot = _CHAIN_FIRST_SLOT;
        assembly {
            cf.slot := slot
        }
    }
}