// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./MawSacrificeV4Upgradeable.sol";

/**
 * @title MawSacrificeV4Dev
 * @dev Development version of MawSacrificeV4Upgradeable with no timelock restrictions
 * @notice This contract removes the 24-hour upgrade delay for rapid iteration
 */
contract MawSacrificeV4Dev is MawSacrificeV4Upgradeable {
    
    /**
     * @dev Override _authorizeUpgrade to allow immediate upgrades during development
     * @param newImplementation Address of the new implementation
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        // Allow immediate upgrades in dev - no timelock required
        // In production, this would use the timelock mechanism
    }
    
    /**
     * @dev Add a dev-only function to directly test RNG
     * @param nonce The nonce to test with
     * @return The random value generated
     */
    function testRNG(uint256 nonce) external view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            nonce
        ))) % 100;
    }
    
    /**
     * @dev Dev function to manually increment sacrifice nonce for testing
     */
    function incrementNonce() external onlyOwner {
        sacrificeNonce++;
    }
}