// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract Relics is ERC1155, Ownable, Pausable {
    // Relic IDs: 1=Rusted Key, 2=Lantern Fragment, 3=Worm-eaten Mask, 4=Bone Dagger, 5=Ash Vial, 6=Binding Contract, 7=Soul Deed, 8=Ashes
    address public ritual;
    address public keyShop;
    address public mawSacrifice;
    
    // Supply tracking
    mapping(uint256 => uint256) public maxSupply;
    mapping(uint256 => uint256) public totalSupply;
    
    // Custom errors
    error MaxSupplyExceeded();
    error SupplyNotSet();

    event RitualSet(address indexed ritual);
    event KeyShopSet(address indexed keyShop);
    event MawSacrificeSet(address indexed mawSacrifice);
    event URISet(string newUri);
    event MaxSupplySet(uint256 indexed id, uint256 maxSupply);
    event Minted(address indexed to, uint256 indexed id, uint256 amount);

    modifier onlyRitual() { require(msg.sender == ritual, "Not ritual"); _; }
    modifier onlyAuthorizedMinter() { 
        require(
            msg.sender == owner() || 
            msg.sender == keyShop || 
            msg.sender == mawSacrifice, 
            "Not authorized"
        ); 
        _; 
    }
    modifier onlyAuthorizedBurner() { 
        require(
            msg.sender == ritual || 
            msg.sender == mawSacrifice, 
            "Not authorized to burn"
        ); 
        _; 
    }
    
    /**
     * @dev Check supply limits before minting
     */
    modifier supplyCheck(uint256 id, uint256 amount) {
        // Skip supply check for unlimited items (maxSupply = 0)
        if (maxSupply[id] != 0) {
            if (totalSupply[id] + amount > maxSupply[id]) {
                revert MaxSupplyExceeded();
            }
        }
        _;
    }

    constructor(string memory baseUri) ERC1155(baseUri) Ownable(msg.sender) {
        // Initialize supply caps for ultra-rare 1/1 items
        maxSupply[6] = 1; // Binding Contract - only 1 ever
        maxSupply[7] = 1; // Soul Deed - only 1 ever
        
        // Other relics have unlimited supply by default (maxSupply[id] = 0)
        // Can be updated later via setMaxSupply if needed
    }

    /**
     * @notice Set the base URI for token metadata
     * @param baseUri New base URI
     */
    function setURI(string memory baseUri) external onlyOwner { 
        _setURI(baseUri); 
        emit URISet(baseUri); 
    }
    
    /**
     * @notice Set the ritual contract address
     * @dev Can be set to address(0) to disable ritual permissions
     * @param ritual_ New ritual contract address
     */
    function setRitual(address ritual_) external onlyOwner { 
        ritual = ritual_; 
        emit RitualSet(ritual_); 
    }
    
    /**
     * @notice Set the key shop contract address
     * @dev Can be set to address(0) to disable key shop permissions
     * @param keyShop_ New key shop contract address
     */
    function setKeyShop(address keyShop_) external onlyOwner { 
        keyShop = keyShop_; 
        emit KeyShopSet(keyShop_); 
    }
    
    /**
     * @notice Set the maw sacrifice contract address
     * @dev Can be set to address(0) to disable maw sacrifice permissions
     * @param mawSacrifice_ New maw sacrifice contract address
     */
    function setMawSacrifice(address mawSacrifice_) external onlyOwner { 
        mawSacrifice = mawSacrifice_; 
        emit MawSacrificeSet(mawSacrifice_); 
    }
    
    /**
     * @notice Set maximum supply for a relic type
     * @dev Set to 0 for unlimited supply, non-zero for capped supply
     * @param id Token ID to set max supply for
     * @param _maxSupply Maximum supply (0 = unlimited)
     */
    function setMaxSupply(uint256 id, uint256 _maxSupply) external onlyOwner {
        maxSupply[id] = _maxSupply;
        emit MaxSupplySet(id, _maxSupply);
    }
    
    /**
     * @notice Set maximum supplies for multiple relic types
     * @dev Batch version of setMaxSupply
     * @param ids Array of token IDs
     * @param _maxSupplies Array of maximum supplies
     */
    function setMaxSupplyBatch(uint256[] calldata ids, uint256[] calldata _maxSupplies) external onlyOwner {
        require(ids.length == _maxSupplies.length, "Length mismatch");
        for (uint256 i = 0; i < ids.length; i++) {
            maxSupply[ids[i]] = _maxSupplies[i];
            emit MaxSupplySet(ids[i], _maxSupplies[i]);
        }
    }
    
    /**
     * @notice Pause the contract
     * @dev Prevents all minting and burning while paused
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause the contract
     * @dev Re-enables minting and burning
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Mint relics to a specified address
     * @dev Only authorized minters (owner, keyShop, mawSacrifice) can call this
     * @param to Address to mint relics to
     * @param id Token ID to mint
     * @param amount Amount to mint
     * @param data Additional data for the mint
     */
    function mint(address to, uint256 id, uint256 amount, bytes memory data) 
        external 
        onlyAuthorizedMinter 
        whenNotPaused 
        supplyCheck(id, amount)
    { 
        totalSupply[id] += amount;
        _mint(to, id, amount, data); 
        emit Minted(to, id, amount);
    }
    
    /**
     * @notice Mint multiple relic types to a specified address
     * @dev Only authorized minters can call this
     * @param to Address to mint relics to
     * @param ids Array of token IDs to mint
     * @param amounts Array of amounts to mint
     */
    function mintBatch(address to, uint256[] calldata ids, uint256[] calldata amounts) 
        external 
        onlyAuthorizedMinter 
        whenNotPaused 
    { 
        // Check supply limits for all tokens first
        for (uint256 i = 0; i < ids.length; i++) {
            if (maxSupply[ids[i]] != 0) {
                if (totalSupply[ids[i]] + amounts[i] > maxSupply[ids[i]]) {
                    revert MaxSupplyExceeded();
                }
            }
        }
        
        // Update total supply for all tokens
        for (uint256 i = 0; i < ids.length; i++) {
            totalSupply[ids[i]] += amounts[i];
        }
        
        _mintBatch(to, ids, amounts, "");
        
        // Emit individual Minted events for indexing
        for (uint256 i = 0; i < ids.length; i++) {
            emit Minted(to, ids[i], amounts[i]);
        }
    }

    /**
     * @notice Burn a single relic type from an address
     * @dev Only authorized burners (ritual, mawSacrifice) can call this
     * @param from Address to burn from
     * @param id Token ID to burn
     * @param amount Amount to burn
     */
    function burn(address from, uint256 id, uint256 amount) external onlyAuthorizedBurner whenNotPaused {
        totalSupply[id] -= amount; // Safe subtraction - ERC1155 will revert if balance insufficient
        _burn(from, id, amount);
    }

    /**
     * @notice Burn multiple relic types from an address
     * @dev Only authorized burners (ritual, mawSacrifice) can call this
     * @param from Address to burn from
     * @param ids Array of token IDs to burn
     * @param amounts Array of amounts to burn
     */
    function burnBatch(address from, uint256[] calldata ids, uint256[] calldata amounts) external onlyAuthorizedBurner whenNotPaused {
        // Update total supply for all tokens
        for (uint256 i = 0; i < ids.length; i++) {
            totalSupply[ids[i]] -= amounts[i]; // Safe subtraction
        }
        _burnBatch(from, ids, amounts);
    }
    
    /**
     * @notice Burn your own relics
     * @dev Anyone can burn their own relics directly
     * @param id Token ID to burn
     * @param amount Amount to burn
     */
    function burnSelf(uint256 id, uint256 amount) external whenNotPaused {
        totalSupply[id] -= amount;
        _burn(msg.sender, id, amount);
    }
    
    /**
     * @notice Burn multiple of your own relic types
     * @dev Anyone can burn their own relics directly
     * @param ids Array of token IDs to burn
     * @param amounts Array of amounts to burn
     */
    function burnSelfBatch(uint256[] calldata ids, uint256[] calldata amounts) external whenNotPaused {
        // Update total supply for all tokens
        for (uint256 i = 0; i < ids.length; i++) {
            totalSupply[ids[i]] -= amounts[i];
        }
        _burnBatch(msg.sender, ids, amounts);
    }
    
    // Legacy function name for compatibility
    function burnBatchFrom(address from, uint256[] calldata ids, uint256[] calldata amounts) external onlyAuthorizedBurner whenNotPaused {
        // Update total supply for all tokens
        for (uint256 i = 0; i < ids.length; i++) {
            totalSupply[ids[i]] -= amounts[i];
        }
        _burnBatch(from, ids, amounts);
    }
    
    /**
     * @notice Get supply information for a relic
     * @param id Token ID to query
     * @return current Current total supply
     * @return maximum Maximum supply (0 = unlimited)
     */
    function getSupplyInfo(uint256 id) external view returns (uint256 current, uint256 maximum) {
        return (totalSupply[id], maxSupply[id]);
    }
}
