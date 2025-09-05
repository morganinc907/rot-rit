// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

/**
 * @title SimpleMawProxy  
 * @dev Simple transparent proxy for MawSacrifice that provides:
 * - Stable contract address forever
 * - Admin-controlled upgrades
 * - No complex initialization issues
 * 
 * This uses the battle-tested TransparentUpgradeableProxy pattern.
 */
contract SimpleMawProxy is TransparentUpgradeableProxy {
    
    /**
     * @notice Deploy the proxy pointing to an implementation
     * @param implementation Address of the MawSacrifice implementation contract
     * @param admin Address that can upgrade the proxy (should be deployer)
     * @param data Encoded initialization data to send to implementation
     */
    constructor(
        address implementation,
        address admin,
        bytes memory data
    ) TransparentUpgradeableProxy(implementation, admin, data) {
        // TransparentUpgradeableProxy handles all the proxy logic
    }
}