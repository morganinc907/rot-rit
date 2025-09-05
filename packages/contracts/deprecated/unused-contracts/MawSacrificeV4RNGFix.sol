// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./MawSacrificeV4Upgradeable.sol";

/**
 * @title MawSacrificeV4RNGFix
 * @dev Fixed version with proper RNG for multiple sacrifices
 * @notice Fixes the RNG issue where multiple keys in a single transaction had correlated results
 */
contract MawSacrificeV4RNGFix is MawSacrificeV4Upgradeable {
    
    // Override the sacrificeNonce from parent (it's already declared there)
    
    /**
     * @dev Override sacrificeKeys with fixed RNG
     */
    function sacrificeKeys(uint256 amount) external override whenNotPaused whenSacrificesNotPaused nonReentrant antiBot {
        if (amount == 0 || amount > 10) revert InvalidAmount();
        if (relics.balanceOf(msg.sender, RUSTED_KEY) < amount) revert InsufficientBalance();
        
        relics.burn(msg.sender, RUSTED_KEY, amount);
        
        bool success = false;
        uint256 relicId;
        
        for (uint256 i = 0; i < amount; i++) {
            // Generate unique seed for each key using nonce
            uint256 seed = uint256(keccak256(abi.encodePacked(
                block.prevrandao,
                block.timestamp,
                msg.sender,
                sacrificeNonce++,  // Increment nonce for each sacrifice
                i  // Also include loop index for extra entropy
            )));
            
            uint256 roll = seed % 10000;
            
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
                continue;
            }
            
            relics.mint(msg.sender, relicId, 1, "");
            
            emit RelicReceived(msg.sender, relicId, 1);
        }
        
        // Always emit the keys sacrificed event
        emit KeysSacrificed(msg.sender, amount);
    }
    
    /**
     * @dev Override _authorizeUpgrade to allow immediate upgrades (dev version)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        // Allow immediate upgrades - no timelock for dev
    }
}