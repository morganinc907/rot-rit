// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IMawSacrifice {
    function shopMintKeys(address to, uint256 amount) external;
    function keyId() external view returns (uint256);
    function relics() external view returns (address);
}

/**
 * @title KeyShop
 * @notice Contract for purchasing Rusted Caps with ETH
 */
contract KeyShop is Ownable, ReentrancyGuard, Pausable {
    IMawSacrifice public mawSacrifice;
    
    uint256 public constant RUSTED_KEY_ID = 0;
    uint256 public keyPrice = 0.002 ether;
    uint16 public maxKeysPerTx = 100;
    uint16 public constant MAX_KEYS_PER_TX_LIMIT = 500; // Hard cap to prevent gas bombs
    
    // Custom errors for gas efficiency
    error InvalidAmount();
    error InsufficientETH();
    error RefundFailed();
    error WithdrawalFailed();
    error ZeroAddress();
    error InvalidPrice();
    error MaxKeysExceeded();
    
    // Events
    event KeysPurchased(address indexed buyer, uint256 amount, uint256 totalCost);
    event KeyPriceUpdated(uint256 newPrice);
    event MaxKeysPerTxUpdated(uint256 newMax);
    event RelicsUpdated(address indexed newRelics);
    event ETHWithdrawn(uint256 amount);
    
    /**
     * @notice Constructor sets the initial MAW Sacrifice contract address
     * @param _mawSacrifice Address of the MAW Sacrifice contract
     */
    constructor(address _mawSacrifice) Ownable(msg.sender) {
        if (_mawSacrifice == address(0)) revert ZeroAddress();
        mawSacrifice = IMawSacrifice(_mawSacrifice);
    }
    
    /**
     * @notice Purchase Rusted Caps with ETH
     * @param amount Number of caps to purchase
     */
    function buyKeys(uint256 amount) external payable whenNotPaused nonReentrant {
        if (amount == 0 || amount > maxKeysPerTx) revert InvalidAmount();
        
        uint256 totalCost = amount * keyPrice;
        if (msg.value < totalCost) revert InsufficientETH();
        
        // Mint keys via MAW Sacrifice contract
        mawSacrifice.shopMintKeys(msg.sender, amount);
        
        // Refund excess ETH if any
        if (msg.value > totalCost) {
            (bool success, ) = msg.sender.call{value: msg.value - totalCost}("");
            if (!success) revert RefundFailed();
        }
        
        emit KeysPurchased(msg.sender, amount, totalCost);
    }
    
    /**
     * @notice Owner can mint free caps for testing/admin purposes
     * @param to Address to mint caps to
     * @param amount Number of caps to mint
     */
    function mintFreeKeys(address to, uint256 amount) external onlyOwner {
        if (amount == 0 || amount > maxKeysPerTx) revert InvalidAmount();
        if (to == address(0)) revert ZeroAddress();
        
        mawSacrifice.shopMintKeys(to, amount);
        emit KeysPurchased(to, amount, 0); // 0 cost for free caps
    }
    
    // Admin functions
    
    /**
     * @notice Update the price of keys
     * @param _newPrice New price per key in wei
     */
    function setKeyPrice(uint256 _newPrice) external onlyOwner {
        if (_newPrice == 0) revert InvalidPrice();
        keyPrice = _newPrice;
        emit KeyPriceUpdated(_newPrice);
    }
    
    /**
     * @notice Update maximum keys per transaction
     * @dev Cannot exceed MAX_KEYS_PER_TX_LIMIT to prevent gas bombs
     * @param _max New maximum keys per transaction
     */
    function setMaxKeysPerTx(uint16 _max) external onlyOwner {
        if (_max == 0 || _max > MAX_KEYS_PER_TX_LIMIT) revert MaxKeysExceeded();
        maxKeysPerTx = _max;
        emit MaxKeysPerTxUpdated(_max);
    }
    
    /**
     * @notice Update the MAW Sacrifice contract address
     * @dev Allows updating if MAW contract is upgraded
     * @param _mawSacrifice New MAW Sacrifice contract address
     */
    function setMawSacrifice(address _mawSacrifice) external onlyOwner {
        if (_mawSacrifice == address(0)) revert ZeroAddress();
        mawSacrifice = IMawSacrifice(_mawSacrifice);
        emit RelicsUpdated(_mawSacrifice); // Reuse event for compatibility
    }
    
    /**
     * @notice Pause the contract
     * @dev Prevents key purchases while paused
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause the contract
     * @dev Re-enables key purchases
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Withdraw collected ETH to owner
     */
    function withdrawETH() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        if (balance == 0) revert WithdrawalFailed();
        
        (bool success, ) = owner().call{value: balance}("");
        if (!success) revert WithdrawalFailed();
        
        emit ETHWithdrawn(balance);
    }
    
    /**
     * @notice Get current contract balance
     * @return Current ETH balance in wei
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @notice Health check for frontend/CI validation
     * @return relicsAddr Address of the Relics contract
     * @return mawAddr Address of the MAW contract
     * @return keyId Token ID for keys
     * @return price Price per key in wei
     * @return treasury Address that receives payments (owner)
     */
    function healthcheck() external view returns (
        address relicsAddr,
        address mawAddr, 
        uint256 keyId,
        uint256 price,
        address treasury
    ) {
        relicsAddr = mawSacrifice.relics();
        mawAddr = address(mawSacrifice);
        keyId = mawSacrifice.keyId();
        price = keyPrice;
        treasury = owner();
    }
}