// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title MawSacrificeProxy
 * @dev Simple ERC1967 Proxy that delegates all calls to MawSacrifice implementation.
 * This provides:
 * - Stable contract address forever
 * - Upgradeable implementation via admin functions
 * - No need to re-authorize or update references
 * 
 * The actual upgrade logic is handled by the implementation contract.
 */
contract MawSacrificeProxy is ERC1967Proxy {
    
    /**
     * @notice Deploy the proxy pointing to an implementation
     * @param implementation Address of the MawSacrifice implementation contract
     * @param data Encoded initialization data to send to implementation
     */
    constructor(address implementation, bytes memory data) ERC1967Proxy(implementation, data) {
        // ERC1967Proxy handles all the proxy logic
        // data should be the encoded call to initialize() on the implementation
    }

    /**
     * @notice Get current implementation address
     * @return Implementation contract address
     */
    function getImplementation() external view returns (address) {
        return _implementation();
    }
}