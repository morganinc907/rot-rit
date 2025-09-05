// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./MawSacrificeV4Upgradeable.sol";

interface ICosmeticsOwnable {
    function transferOwnership(address newOwner) external;
    function setContracts(address _raccoons, address _mawSacrifice) external;
}

/**
 * @title MawSacrificeV4CosmeticsFix
 * @dev Extension of V4 with cosmetics management functions
 */
contract MawSacrificeV4CosmeticsFix is MawSacrificeV4Upgradeable {
    
    /**
     * @dev Transfer cosmetics ownership (only owner can call)
     * @param newOwner Address to transfer cosmetics ownership to
     */
    function transferCosmeticsOwnership(address newOwner) external onlyOwner {
        ICosmeticsOwnable(address(cosmetics)).transferOwnership(newOwner);
    }
    
    /**
     * @dev Update cosmetics authorization (only owner can call)
     * @param raccoonsContract Address of raccoons contract
     * @param mawSacrificeContract Address of new MawSacrifice contract
     */
    function updateCosmeticsAuth(
        address raccoonsContract,
        address mawSacrificeContract
    ) external onlyOwner {
        ICosmeticsOwnable(address(cosmetics)).setContracts(raccoonsContract, mawSacrificeContract);
    }
}