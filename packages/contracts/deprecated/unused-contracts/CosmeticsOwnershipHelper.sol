// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

interface ICosmeticsOwnable {
    function transferOwnership(address newOwner) external;
    function setContracts(address _raccoons, address _mawSacrifice) external;
    function owner() external view returns (address);
    function mawSacrifice() external view returns (address);
}

/**
 * @title CosmeticsOwnershipHelper
 * @dev Helper contract to transfer cosmetics ownership and update authorization
 *      This is needed when the cosmetics contract is owned by another contract
 */
contract CosmeticsOwnershipHelper is Ownable {
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Transfer cosmetics ownership and update MawSacrifice authorization
     * @param cosmeticsContract Address of the cosmetics contract
     * @param newMawSacrifice Address of the new MawSacrifice contract
     * @param raccoonsContract Address of the raccoons contract
     */
    function fixCosmeticsAuthorization(
        address cosmeticsContract,
        address newMawSacrifice, 
        address raccoonsContract
    ) external onlyOwner {
        ICosmeticsOwnable cosmetics = ICosmeticsOwnable(cosmeticsContract);
        
        // Step 1: Transfer ownership to this contract (temporarily)
        cosmetics.transferOwnership(address(this));
        
        // Step 2: Update the MawSacrifice authorization
        cosmetics.setContracts(raccoonsContract, newMawSacrifice);
        
        // Step 3: Transfer ownership back to the original owner (msg.sender)
        cosmetics.transferOwnership(msg.sender);
    }
    
    /**
     * @dev Emergency function to just transfer ownership
     * @param cosmeticsContract Address of the cosmetics contract
     * @param newOwner New owner address
     */
    function transferCosmeticsOwnership(
        address cosmeticsContract,
        address newOwner
    ) external onlyOwner {
        ICosmeticsOwnable cosmetics = ICosmeticsOwnable(cosmeticsContract);
        cosmetics.transferOwnership(newOwner);
    }
}