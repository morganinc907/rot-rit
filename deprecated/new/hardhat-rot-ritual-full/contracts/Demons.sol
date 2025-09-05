// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract Demons is ERC721, Ownable {
    using Strings for uint256;

    enum Rarity { Rare, Mythic }

    // Trait system for Rare demons
    struct DemonTraits {
        uint8 head;
        uint8 face;
        uint8 form;
        uint8 aura;
        uint8 background;
    }

    // Rarity mapping per demon token
    mapping(uint256 => Rarity) public rarityOf;

    // Trait storage for Rare demons
    mapping(uint256 => DemonTraits) private _traits;

    // Trait metadata
    mapping(uint8 => string[]) public traitNames; // traitType => names array
    mapping(uint8 => uint16[]) public traitRarities; // traitType => rarity weights (out of 10000)

    // Mythic demon ID tracking (prevents double minting)
    mapping(uint256 => bool) public mythicMinted;

    // Base URIs
    string private baseURI;
    string private mythicBaseURI;
    string public baseImageURI; // For trait-based image generation

    // Authorized summoning contract (Ritual)
    address public ritual;

    // Tracking supply
    uint256 public totalMinted;
    uint256 private _nextId = 1;

    // Events
    event RitualSet(address ritual);
    event BaseURISet(string uri);
    event MythicBaseURISet(string uri);
    event BaseImageURISet(string uri);
    event DemonMinted(uint256 indexed tokenId, address indexed to, Rarity rarity);
    event DemonTraitsSet(uint256 indexed tokenId, DemonTraits traits);

    modifier onlyRitual() {
        require(msg.sender == ritual, "Not authorized");
        _;
    }

    constructor(string memory baseURI_, string memory mythicBaseURI_) ERC721("Demon", "DEMON") Ownable(msg.sender) {
        baseURI = baseURI_;
        mythicBaseURI = mythicBaseURI_;
    }

    // -------------------------------
    // Admin Functions
    // -------------------------------

    function setRitual(address ritual_) external onlyOwner {
        ritual = ritual_;
        emit RitualSet(ritual_);
    }

    function setBaseURI(string calldata uri) external onlyOwner {
        baseURI = uri;
        emit BaseURISet(uri);
    }

    function setMythicBaseURI(string calldata uri) external onlyOwner {
        mythicBaseURI = uri;
        emit MythicBaseURISet(uri);
    }

    function setBaseImageURI(string calldata uri) external onlyOwner {
        baseImageURI = uri;
        emit BaseImageURISet(uri);
    }

    // -------------------------------
    // Trait Management
    // -------------------------------

    function setTraitData(
        uint8 traitType,
        string[] calldata names,
        uint16[] calldata rarities
    ) external onlyOwner {
        require(names.length == rarities.length, "length mismatch");
        require(traitType <= 4, "invalid trait type");
        
        // Clear existing data
        delete traitNames[traitType];
        delete traitRarities[traitType];
        
        // Set new data
        for (uint256 i = 0; i < names.length; i++) {
            traitNames[traitType].push(names[i]);
            traitRarities[traitType].push(rarities[i]);
        }
    }

    function ownerSetTraits(uint256 tokenId, DemonTraits calldata traits) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "bad id");
        require(rarityOf[tokenId] == Rarity.Rare, "only rare demons");
        _traits[tokenId] = traits;
        emit DemonTraitsSet(tokenId, traits);
    }

    // -------------------------------
    // Minting
    // -------------------------------

    /**
     * @notice Mint a demon NFT (MawSacrificeV2 compatibility).
     * @dev Only callable by Ritual contract. Maps tiers to rarities.
     * @param to Address receiving the demon.
     * @param tier 1 = Rare, 2 = Mythic.
     */
    function mintTo(address to, uint8 tier) external onlyRitual returns (uint256) {
        require(tier >= 1 && tier <= 2, "Invalid tier");
        
        uint8 rarity;
        uint256 tokenId = 0;
        
        if (tier == 1) {
            rarity = 0; // Rare
        } else { // tier == 2
            rarity = 1; // Mythic
            tokenId = 10000 + totalMinted; // Reserve high IDs for mythics
        }
        
        mintDemon(to, rarity, tokenId);
        return tokenId > 0 ? tokenId : (_nextId - 1); // Return the minted token ID
    }

    /**
     * @notice Mint a demon NFT.
     * @dev Only callable by Ritual contract after dApp determines outcome.
     * @param to Address receiving the demon.
     * @param rarity 0 = Rare, 1 = Mythic.
     * @param tokenId If minting a mythic, pass a reserved tokenId; else pass 0.
     */
    function mintDemon(address to, uint8 rarity, uint256 tokenId) external onlyRitual {
        require(rarity <= uint8(Rarity.Mythic), "Invalid rarity");

        if (Rarity(rarity) == Rarity.Mythic) {
            require(tokenId > 0, "Mythic requires tokenId");
            require(!mythicMinted[tokenId], "Mythic already minted");

            mythicMinted[tokenId] = true;
            rarityOf[tokenId] = Rarity.Mythic;
            _safeMint(to, tokenId);
            emit DemonMinted(tokenId, to, Rarity.Mythic);
        } else {
            uint256 newId = _nextId++;
            rarityOf[newId] = Rarity(rarity);
            _safeMint(to, newId);
            totalMinted++;
            
            // Generate traits for Rare demons (all non-mythic demons are rare)
            if (Rarity(rarity) == Rarity.Rare) {
                _generateDemonTraits(newId);
            }
            
            emit DemonMinted(newId, to, Rarity(rarity));
        }
    }

    function _generateDemonTraits(uint256 tokenId) internal {
        // Generate random seed based on token ID and block data
        uint256 seed = uint256(keccak256(abi.encodePacked(
            block.prevrandao,
            block.timestamp,
            tokenId,
            address(this),
            totalMinted
        )));

        DemonTraits memory newTraits;
        
        // Generate each trait based on rarity weights
        newTraits.head = _rollTrait(0, seed);
        newTraits.face = _rollTrait(1, seed >> 32);
        newTraits.form = _rollTrait(2, seed >> 64);
        newTraits.aura = _rollTrait(3, seed >> 96);
        newTraits.background = _rollTrait(4, seed >> 128);
        
        _traits[tokenId] = newTraits;
        emit DemonTraitsSet(tokenId, newTraits);
    }

    function _rollTrait(uint8 traitType, uint256 seed) internal view returns (uint8) {
        uint16[] memory rarities = traitRarities[traitType];
        if (rarities.length == 0) return 0;
        
        uint256 roll = seed % 10000;
        uint256 cumulative = 0;
        
        for (uint8 i = 0; i < rarities.length; i++) {
            cumulative += rarities[i];
            if (roll < cumulative) {
                return i;
            }
        }
        
        return uint8(rarities.length - 1); // Fallback to last trait
    }

    // -------------------------------
    // View Functions
    // -------------------------------

    function getDemonTraits(uint256 tokenId) external view returns (DemonTraits memory) {
        require(_ownerOf(tokenId) != address(0), "bad id");
        return _traits[tokenId];
    }

    function getTraitName(uint8 traitType, uint8 traitIndex) external view returns (string memory) {
        require(traitType <= 4, "invalid trait type");
        require(traitIndex < traitNames[traitType].length, "invalid trait index");
        return traitNames[traitType][traitIndex];
    }

    function getTraitCount(uint8 traitType) external view returns (uint256) {
        return traitNames[traitType].length;
    }

    // -------------------------------
    // Metadata
    // -------------------------------

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Invalid token");

        if (rarityOf[tokenId] == Rarity.Mythic) {
            return string(abi.encodePacked(mythicBaseURI, tokenId.toString(), ".json"));
        } else if (rarityOf[tokenId] == Rarity.Rare) {
            return _buildTraitMetadata(tokenId);
        }
        // All non-mythic demons are rare with traits
        return _buildTraitMetadata(tokenId);
    }

    function _buildTraitMetadata(uint256 tokenId) internal view returns (string memory) {
        DemonTraits memory traits = _traits[tokenId];
        
        // Build attributes array
        string memory attributes = string(abi.encodePacked(
            '{"trait_type":"Rarity","value":"Rare"},',
            '{"trait_type":"Head","value":"', _getTraitDisplayName(0, traits.head), '"},',
            '{"trait_type":"Face","value":"', _getTraitDisplayName(1, traits.face), '"},',
            '{"trait_type":"Form","value":"', _getTraitDisplayName(2, traits.form), '"},',
            '{"trait_type":"Aura","value":"', _getTraitDisplayName(3, traits.aura), '"},',
            '{"trait_type":"Background","value":"', _getTraitDisplayName(4, traits.background), '"}'
        ));
        
        // Build full metadata JSON
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name":"Demon #', tokenId.toString(), '",',
                        '"description":"A summoned demon with unique traits and dark powers",',
                        '"image":"', baseImageURI, tokenId.toString(), '.png",',
                        '"attributes":[', attributes, ']}'
                    )
                )
            )
        );
        
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function _getTraitDisplayName(uint8 traitType, uint8 traitIndex) internal view returns (string memory) {
        if (traitIndex < traitNames[traitType].length) {
            return traitNames[traitType][traitIndex];
        }
        return "Unknown";
    }
}
