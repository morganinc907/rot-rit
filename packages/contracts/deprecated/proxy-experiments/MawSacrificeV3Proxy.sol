// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

/**
 * @title MawSacrificeV3Proxy
 * @dev This is a complete proxy setup for MawSacrifice that includes:
 * - TransparentUpgradeableProxy for the actual proxy
 * - ProxyAdmin for managing upgrades
 * - Proper deployment pattern for non-initializable contracts
 * 
 * Benefits:
 * - Stable address forever (no more address updates)
 * - Admin-controlled upgrades (secure)
 * - Compatible with existing MawSacrificeV3 constructor pattern
 */

contract MawSacrificeV3ProxyAdmin is ProxyAdmin {
    constructor() ProxyAdmin(msg.sender) {}
}

contract MawSacrificeV3Proxy is TransparentUpgradeableProxy {
    /**
     * @notice Deploy the proxy with a pre-deployed implementation
     * @param implementation Address of deployed MawSacrificeV3 contract
     * @param admin Address of ProxyAdmin contract
     */
    constructor(
        address implementation,
        address admin
    ) TransparentUpgradeableProxy(
        implementation,
        admin,
        "" // No initialization data needed - constructor was already called
    ) {
        // The implementation contract is already constructed with its parameters
        // This proxy just delegates calls to it
    }
}