// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Cultists is ERC721, Ownable {
    address public ritual;
    address public mawSacrifice;

    error NotAuthorized();
    error Soulbound();

    modifier onlyRitual() {
        if (msg.sender != ritual) revert NotAuthorized();
        _;
    }
    
    modifier onlyAuthorizedBurner() {
        if (msg.sender != ritual && msg.sender != mawSacrifice) revert NotAuthorized();
        _;
    }

    constructor() ERC721("Cult Member", "CULT") Ownable(msg.sender) {}

    /**
     * @notice Set the ritual contract address
     * @param ritual_ New ritual contract address
     */
    function setRitual(address ritual_) external onlyOwner { 
        ritual = ritual_; 
    }
    
    /**
     * @notice Set the maw sacrifice contract address
     * @param mawSacrifice_ New maw sacrifice contract address
     */
    function setMawSacrifice(address mawSacrifice_) external onlyOwner { 
        mawSacrifice = mawSacrifice_; 
    }

    /**
     * @notice Mint a cultist NFT (ritual only)
     * @param to Address to mint to
     * @param raccoonId Raccoon ID that became a cultist
     */
    function mintTo(address to, uint256 raccoonId) external onlyRitual {
        require(_ownerOf(raccoonId) == address(0), "already cultist");
        _safeMint(to, raccoonId);
    }

    /**
     * @notice Burn a cultist from address (ritual only, for ascension)
     * @param owner_ Owner of the cultist
     * @param raccoonId Cultist token ID to burn
     */
    function burnFrom(address owner_, uint256 raccoonId) external onlyRitual {
        require(ownerOf(raccoonId) == owner_, "wrong owner");
        _burn(raccoonId);
    }
    
    /**
     * @notice Burn a cultist NFT (for demon sacrifice)
     * @dev Can be called by ritual or mawSacrifice contracts
     * @param tokenId Cultist token ID to burn
     */
    function burn(uint256 tokenId) external onlyAuthorizedBurner {
        _burn(tokenId);
    }

    // Soulbound (no transfers except mint/burn or to burn address)
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        // Allow minting (from == 0) and burning (to == 0) and transfers to burn address
        if (from != address(0) && to != address(0) && to != 0x000000000000000000000000000000000000dEaD) {
            revert Soulbound();
        }
        return super._update(to, tokenId, auth);
    }
}
