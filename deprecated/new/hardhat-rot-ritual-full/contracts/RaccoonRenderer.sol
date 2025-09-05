// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "./CosmeticsV2.sol";

/**
 * @title RaccoonRenderer
 * @notice Generates metadata and images for raccoons with equipped cosmetics
 */
contract RaccoonRenderer {
    using Strings for uint256;

    CosmeticsV2 public immutable cosmetics;
    address public immutable raccoons;
    
    // Base image URIs for different raccoon states
    mapping(uint8 => string) public baseImageURIs; // rarity => base image
    mapping(uint256 => string) public customBaseImages; // tokenId => custom image (overrides)
    
    // Rendering service URL (for off-chain composition)
    string public renderingServiceURL = "https://api.your-domain.com/render/";
    
    event BaseImageUpdated(uint8 indexed rarity, string imageURI);
    event CustomImageSet(uint256 indexed tokenId, string imageURI);
    event RenderingServiceUpdated(string url);
    
    constructor(address _cosmetics, address _raccoons) {
        cosmetics = CosmeticsV2(_cosmetics);
        raccoons = _raccoons;
    }
    
    // ========== Admin Functions ==========
    
    function setBaseImage(uint8 rarity, string memory imageURI) external {
        require(msg.sender == IOwnable(raccoons).owner(), "Only raccoons owner");
        baseImageURIs[rarity] = imageURI;
        emit BaseImageUpdated(rarity, imageURI);
    }
    
    function setCustomImage(uint256 tokenId, string memory imageURI) external {
        require(msg.sender == IOwnable(raccoons).owner(), "Only raccoons owner");
        customBaseImages[tokenId] = imageURI;
        emit CustomImageSet(tokenId, imageURI);
    }
    
    function setRenderingService(string memory url) external {
        require(msg.sender == IOwnable(raccoons).owner(), "Only raccoons owner");
        renderingServiceURL = url;
        emit RenderingServiceUpdated(url);
    }
    
    // ========== Metadata Generation ==========
    
    function tokenURI(uint256 tokenId) external view returns (string memory) {
        // Get raccoon's basic info
        (uint8 rarity, string memory name) = _getRaccoonInfo(tokenId);
        
        // Get equipped cosmetics
        (
            uint256 headId,
            uint256 bodyId, 
            uint256 eyesId,
            uint256 accessoryId
        ) = cosmetics.getEquippedCosmetics(tokenId);
        
        // Build traits array
        string memory traits = _buildTraits(rarity, headId, bodyId, eyesId, accessoryId);
        
        // Generate image URL
        string memory imageURL = _generateImageURL(tokenId, rarity, headId, bodyId, eyesId, accessoryId);
        
        // Build final JSON metadata
        string memory json = string(abi.encodePacked(
            '{'
                '"name": "', name, '",'
                '"description": "A Rot Ritual Raccoon with customizable cosmetics",'
                '"image": "', imageURL, '",'
                '"external_url": "https://your-website.com/raccoon/', tokenId.toString(), '",'
                '"attributes": [', traits, ']'
            '}'
        ));
        
        return string(abi.encodePacked(
            "data:application/json;base64,",
            Base64.encode(bytes(json))
        ));
    }
    
    // ========== Image Generation ==========
    
    function _generateImageURL(
        uint256 tokenId,
        uint8 rarity,
        uint256 headId,
        uint256 bodyId,
        uint256 eyesId,
        uint256 accessoryId
    ) internal view returns (string memory) {
        // Option 1: Off-chain rendering service
        if (bytes(renderingServiceURL).length > 0) {
            return string(abi.encodePacked(
                renderingServiceURL,
                tokenId.toString(),
                "?head=", headId.toString(),
                "&body=", bodyId.toString(),
                "&eyes=", eyesId.toString(),
                "&accessory=", accessoryId.toString()
            ));
        }
        
        // Option 2: Return base image if no cosmetics
        if (headId == 0 && bodyId == 0 && eyesId == 0 && accessoryId == 0) {
            // Check for custom image first
            if (bytes(customBaseImages[tokenId]).length > 0) {
                return customBaseImages[tokenId];
            }
            return baseImageURIs[rarity];
        }
        
        // Option 3: SVG composition (simplified example)
        return _generateSVGImage(tokenId, rarity, headId, bodyId, eyesId, accessoryId);
    }
    
    function _generateSVGImage(
        uint256 tokenId,
        uint8 rarity,
        uint256 headId,
        uint256 bodyId,
        uint256 eyesId,
        uint256 accessoryId
    ) internal view returns (string memory) {
        // This is a simplified example - in reality you'd want more sophisticated layering
        string memory baseImage = bytes(customBaseImages[tokenId]).length > 0 
            ? customBaseImages[tokenId] 
            : baseImageURIs[rarity];
            
        string memory svg = string(abi.encodePacked(
            '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">',
                '<image x="0" y="0" width="400" height="400" href="', baseImage, '"/>'
        ));
        
        // Add cosmetic layers
        if (bodyId > 0) {
            (, string memory bodyImageURI,,) = cosmetics.getCosmeticInfo(bodyId);
            svg = string(abi.encodePacked(
                svg,
                '<image x="0" y="0" width="400" height="400" href="', bodyImageURI, '"/>'
            ));
        }
        
        if (headId > 0) {
            (, string memory headImageURI,,) = cosmetics.getCosmeticInfo(headId);
            svg = string(abi.encodePacked(
                svg,
                '<image x="0" y="0" width="400" height="400" href="', headImageURI, '"/>'
            ));
        }
        
        if (eyesId > 0) {
            (, string memory eyesImageURI,,) = cosmetics.getCosmeticInfo(eyesId);
            svg = string(abi.encodePacked(
                svg,
                '<image x="0" y="0" width="400" height="400" href="', eyesImageURI, '"/>'
            ));
        }
        
        if (accessoryId > 0) {
            (, string memory accessoryImageURI,,) = cosmetics.getCosmeticInfo(accessoryId);
            svg = string(abi.encodePacked(
                svg,
                '<image x="0" y="0" width="400" height="400" href="', accessoryImageURI, '"/>'
            ));
        }
        
        svg = string(abi.encodePacked(svg, '</svg>'));
        
        return string(abi.encodePacked(
            "data:image/svg+xml;base64,",
            Base64.encode(bytes(svg))
        ));
    }
    
    // ========== Traits Generation ==========
    
    function _buildTraits(
        uint8 rarity,
        uint256 headId,
        uint256 bodyId,
        uint256 eyesId,
        uint256 accessoryId
    ) internal view returns (string memory) {
        string memory traits = string(abi.encodePacked(
            '{"trait_type": "Rarity", "value": "', _getRarityName(rarity), '"}'
        ));
        
        if (headId > 0) {
            (string memory name,, uint8 cosmeticRarity,) = cosmetics.getCosmeticInfo(headId);
            traits = string(abi.encodePacked(
                traits,
                ', {"trait_type": "Head", "value": "', name, '"}'
            ));
        }
        
        if (bodyId > 0) {
            (string memory name,, uint8 cosmeticRarity,) = cosmetics.getCosmeticInfo(bodyId);
            traits = string(abi.encodePacked(
                traits,
                ', {"trait_type": "Body", "value": "', name, '"}'
            ));
        }
        
        if (eyesId > 0) {
            (string memory name,, uint8 cosmeticRarity,) = cosmetics.getCosmeticInfo(eyesId);
            traits = string(abi.encodePacked(
                traits,
                ', {"trait_type": "Eyes", "value": "', name, '"}'
            ));
        }
        
        if (accessoryId > 0) {
            (string memory name,, uint8 cosmeticRarity,) = cosmetics.getCosmeticInfo(accessoryId);
            traits = string(abi.encodePacked(
                traits,
                ', {"trait_type": "Accessory", "value": "', name, '"}'
            ));
        }
        
        // Add cosmetic count
        uint256 cosmeticCount = 0;
        if (headId > 0) cosmeticCount++;
        if (bodyId > 0) cosmeticCount++;
        if (eyesId > 0) cosmeticCount++;
        if (accessoryId > 0) cosmeticCount++;
        
        traits = string(abi.encodePacked(
            traits,
            ', {"trait_type": "Cosmetics Applied", "value": ', cosmeticCount.toString(), '}'
        ));
        
        return traits;
    }
    
    function _getRarityName(uint8 rarity) internal pure returns (string memory) {
        if (rarity == 1) return "Common";
        if (rarity == 2) return "Uncommon"; 
        if (rarity == 3) return "Rare";
        if (rarity == 4) return "Legendary";
        if (rarity == 5) return "Mythic";
        return "Unknown";
    }
    
    function _getRaccoonInfo(uint256 tokenId) internal view returns (uint8 rarity, string memory name) {
        // This would call the actual Raccoons contract to get the raccoon's info
        // For now, return defaults
        rarity = 1;
        name = string(abi.encodePacked("Raccoon #", tokenId.toString()));
    }
    
    // ========== View Functions ==========
    
    function previewRaccoonWithCosmetic(
        uint256 tokenId,
        uint256 headId,
        uint256 bodyId,
        uint256 eyesId,
        uint256 accessoryId
    ) external view returns (string memory imageURL) {
        (uint8 rarity,) = _getRaccoonInfo(tokenId);
        return _generateImageURL(tokenId, rarity, headId, bodyId, eyesId, accessoryId);
    }
}

interface IOwnable {
    function owner() external view returns (address);
}