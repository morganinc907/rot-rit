// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IRelics {
    function mint(address to, uint256 id, uint256 amount, bytes memory data) external;
}

/**
 * @title KeyShop
 * @notice Contract for purchasing Rusted Keys with ETH
 */
contract KeyShop is Ownable, ReentrancyGuard, Pausable {
    IRelics public relics;
    
    uint256 public constant RUSTED_KEY_ID = 1;
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
     * @notice Constructor sets the initial relics contract address
     * @param _relics Address of the Relics ERC1155 contract
     */
    constructor(address _relics) Ownable(msg.sender) {
        if (_relics == address(0)) revert ZeroAddress();
        relics = IRelics(_relics);
    }
    
    /**
     * @notice Purchase Rusted Keys with ETH
     * @param amount Number of keys to purchase
     */
    function buyKeys(uint256 amount) external payable whenNotPaused nonReentrant {
        if (amount == 0 || amount > maxKeysPerTx) revert InvalidAmount();
        
        uint256 totalCost = amount * keyPrice;
        if (msg.value < totalCost) revert InsufficientETH();
        
        // Mint keys to buyer (using empty bytes data)
        relics.mint(msg.sender, RUSTED_KEY_ID, amount, "");
        
        // Refund excess ETH if any
        if (msg.value > totalCost) {
            (bool success, ) = msg.sender.call{value: msg.value - totalCost}("");
            if (!success) revert RefundFailed();
        }
        
        emit KeysPurchased(msg.sender, amount, totalCost);
    }
    
    /**
     * @notice Owner can mint free keys for testing/admin purposes
     * @param to Address to mint keys to
     * @param amount Number of keys to mint
     */
    function mintFreeKeys(address to, uint256 amount) external onlyOwner {
        if (amount == 0 || amount > maxKeysPerTx) revert InvalidAmount();
        if (to == address(0)) revert ZeroAddress();
        
        relics.mint(to, RUSTED_KEY_ID, amount, "");
        emit KeysPurchased(to, amount, 0); // 0 cost for free keys
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
     * @notice Update the relics contract address
     * @dev Allows updating if Relics contract is redeployed
     * @param _relics New relics contract address
     */
    function setRelics(address _relics) external onlyOwner {
        if (_relics == address(0)) revert ZeroAddress();
        relics = IRelics(_relics);
        emit RelicsUpdated(_relics);
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
}