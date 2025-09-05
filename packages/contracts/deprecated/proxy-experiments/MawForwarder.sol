// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MawForwarder
 * @dev A simple forwarder that provides a stable address while allowing
 * the underlying implementation to be swapped out.
 * 
 * This is simpler than a full proxy but gives us the main benefit:
 * - Stable address that never changes
 * - Can point to different MawSacrifice implementations
 * - All other contracts reference this address
 */
contract MawForwarder {
    address public implementation;
    address public admin;

    event ImplementationUpdated(address indexed oldImplementation, address indexed newImplementation);
    event AdminUpdated(address indexed oldAdmin, address indexed newAdmin);

    constructor(address _implementation, address _admin) {
        implementation = _implementation;
        admin = _admin;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    /**
     * @notice Update the implementation contract
     * @param newImplementation Address of new MawSacrifice contract
     */
    function updateImplementation(address newImplementation) external onlyAdmin {
        require(newImplementation != address(0), "Invalid implementation");
        address oldImplementation = implementation;
        implementation = newImplementation;
        emit ImplementationUpdated(oldImplementation, newImplementation);
    }

    /**
     * @notice Update the admin
     * @param newAdmin Address of new admin
     */
    function updateAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin");
        address oldAdmin = admin;
        admin = newAdmin;
        emit AdminUpdated(oldAdmin, newAdmin);
    }

    /**
     * @notice Fallback function that delegates all calls to implementation
     */
    fallback() external payable {
        address impl = implementation;
        require(impl != address(0), "No implementation");

        assembly {
            // Copy msg.data to memory
            calldatacopy(0, 0, calldatasize())

            // Delegate call to implementation
            let result := delegatecall(gas(), impl, 0, calldatasize(), 0, 0)

            // Copy returned data
            returndatacopy(0, 0, returndatasize())

            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    /**
     * @notice Receive function for ETH transfers
     */
    receive() external payable {
        // Forward to implementation if it can receive ETH
        address impl = implementation;
        require(impl != address(0), "No implementation");

        (bool success, ) = impl.delegatecall("");
        require(success, "Receive failed");
    }
}