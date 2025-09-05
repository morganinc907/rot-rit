// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./MawSacrificeV4Upgradeable.sol";

/**
 * @title MawSacrificeV4Bypass
 * @dev Temporary contract to bypass timelock restrictions
 * @notice This removes the 24-hour upgrade delay for immediate development upgrades
 */
contract MawSacrificeV4Bypass is MawSacrificeV4Upgradeable {
    
    /**
     * @dev Override _authorizeUpgrade to remove timelock restriction
     * @param newImplementation Address of the new implementation (unused)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        // Allow immediate upgrades - bypass timelock mechanism entirely
        // This is safe in development when the proxy owner is trusted
    }
    
    /**
     * @dev Emergency upgrade function for extra safety
     * @param newImplementation Address of new implementation to upgrade to
     */
    function emergencyUpgrade(address newImplementation) external onlyOwner {
        upgradeToAndCall(newImplementation, "");
    }
    
    /**
     * @dev Override to remove UPGRADE_DELAY constant
     */
    function getUpgradeDelay() public pure returns (uint256) {
        return 0; // No delay
    }
    
    /**
     * @dev Mark this as bypass version
     */
    function getBypassVersion() public pure returns (string memory) {
        return "4.0-bypass";
    }
}