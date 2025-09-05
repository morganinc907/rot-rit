// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./MawSacrificeV4Dev.sol";

/**
 * @title MawSacrificeV4DevRNGFix
 * @dev Dev version with fixed RNG for multiple sacrifices
 */
contract MawSacrificeV4DevRNGFix is MawSacrificeV4Dev {
    
    /**
     * @dev Override sacrificeKeys with fixed RNG that uses sacrificeNonce
     */
    function sacrificeKeys(uint256 amount) external override whenNotPaused whenSacrificesNotPaused nonReentrant antiBot {
        if (amount == 0 || amount > 10) revert InvalidAmount();
        if (relics.balanceOf(msg.sender, RUSTED_KEY) < amount) revert InsufficientBalance();
        
        relics.burn(msg.sender, RUSTED_KEY, amount);
        
        bool success = false;
        uint256 relicId;
        
        for (uint256 i = 0; i < amount; i++) {
            // Generate unique seed for EACH key using sacrificeNonce
            uint256 seed = uint256(keccak256(abi.encodePacked(
                block.prevrandao,
                block.timestamp,
                msg.sender,
                sacrificeNonce++,  // Increment nonce for each key
                i  // Also include loop index
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
        
        emit KeysSacrificed(msg.sender, amount);
    }
    
}