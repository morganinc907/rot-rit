// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

interface ICosmeticsV2 {
    function getEquippedCosmetics(uint256 raccoonId) external view returns (uint256 headTypeId, uint256 faceTypeId, uint256 bodyTypeId, uint256 furTypeId, uint256 backgroundTypeId);
    function getCosmeticInfo(uint256 typeId) external view returns (string memory name, string memory imageURI, string memory previewLayerURI, uint8 rarity, uint8 slot, uint256 monthlySetId, bool active);
    function isValidRaccoon(uint256 raccoonId) external view returns (bool);
}

contract Raccoons is ERC721, Ownable, ReentrancyGuard {
    using Strings for uint256;

    enum State { Normal, Cult, Dead }

    // Core contract settings
    uint256 public immutable MAX_SUPPLY;
    uint256 public totalMinted;
    uint256 private _nextId = 1;

    // Reveal settings
    bool public revealed = false;
    string public preRevealURI;
    string public baseImageURI; // Base URI for trait images
    bool public useIndividualPreReveal = false; // If true, append tokenId to preRevealURI

    // Trait definitions
    struct Traits {
        uint8 head;
        uint8 face;
        uint8 body;
        uint8 fur;
        uint8 background;
    }

    // Trait storage
    mapping(uint256 => Traits) private _traits;
    mapping(uint256 => uint8) private _rarityTier; // 1..5, default 1
    mapping(uint256 => State) private _state;

    // Trait metadata
    mapping(uint8 => string[]) public traitNames; // traitType => names array
    mapping(uint8 => uint16[]) public traitRarities; // traitType => rarity weights (out of 10000)
    
    // State-specific trait overlays
    mapping(uint8 => string[]) public cultTraitNames; // Cult-specific trait variations
    mapping(uint8 => string[]) public deadTraitNames; // Dead/memorial trait variations

    address public ritual;
    ICosmeticsV2 public cosmetics;

    uint256 public mintPrice;
    uint256 public maxPerTx;
    uint256 public maxPerWallet;
    bool    public publicMintOpen;
    bool    public allowlistMintOpen;
    bool    public freeMintOpen;

    bool    public paused;
    modifier whenNotPaused() { require(!paused, "paused"); _; }

    mapping(address => uint256) public publicMinted;

    mapping(address => uint32) public allowlistAllowance;
    mapping(address => uint32) public freeAllowance;
    mapping(address => uint32) public allowlistMinted;
    mapping(address => uint32) public freeMinted;

    bytes32 public allowlistRoot;
    bytes32 public freeRoot;

    event RitualSet(address ritual);
    event StateChanged(uint256 indexed tokenId, State state);
    event RaritySet(uint256 indexed tokenId, uint8 tier);
    event TraitsSet(uint256 indexed tokenId, Traits traits);
    event Revealed(bool revealed);
    event RaccoonSacrificed(uint256 indexed tokenId, address indexed owner);
    event MintConfigUpdated(
        uint256 price, uint256 maxPerTx, uint256 maxPerWallet,
        bool publicOpen, bool allowOpen, bool freeOpen
    );
    event RootsUpdated(bytes32 allowRoot, bytes32 freeRoot);
    event AllowancesSet(uint256 count);
    event Withdraw(address indexed to, uint256 amount);
    event Paused(bool paused);

    modifier onlyRitual() {
        require(msg.sender == ritual, "Not ritual");
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        string memory preRevealURI_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        MAX_SUPPLY = maxSupply_;
        preRevealURI = preRevealURI_;

        mintPrice = 0; // Free for testnet
        maxPerTx = 5;
        maxPerWallet = 10;
        publicMintOpen = false;
        allowlistMintOpen = false;
        freeMintOpen = false;
        paused = false;
        revealed = false;
    }

    // TRAIT MANAGEMENT
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

    function setStateTraitData(
        uint8 traitType,
        string[] calldata cultNames,
        string[] calldata deadNames
    ) external onlyOwner {
        require(traitType <= 4, "invalid trait type");
        
        // Clear and set cult trait names
        delete cultTraitNames[traitType];
        for (uint256 i = 0; i < cultNames.length; i++) {
            cultTraitNames[traitType].push(cultNames[i]);
        }
        
        // Clear and set dead trait names
        delete deadTraitNames[traitType];
        for (uint256 i = 0; i < deadNames.length; i++) {
            deadTraitNames[traitType].push(deadNames[i]);
        }
    }

    function setRevealSettings(bool revealed_, string calldata baseImageURI_) external onlyOwner {
        revealed = revealed_;
        baseImageURI = baseImageURI_;
        emit Revealed(revealed_);
    }

    function setPreRevealURI(string calldata uri) external onlyOwner {
        preRevealURI = uri;
    }

    function setUseIndividualPreReveal(bool useIndividual) external onlyOwner {
        useIndividualPreReveal = useIndividual;
    }

    // MINTING
    function mintPublic(uint256 qty) external payable nonReentrant whenNotPaused {
        require(publicMintOpen, "Public mint closed");
        require(qty > 0 && qty <= maxPerTx, "qty>maxPerTx");
        require(totalMinted + qty <= MAX_SUPPLY, "max supply");
        if (mintPrice > 0) {
            require(msg.value == mintPrice * qty, "Wrong ETH");
        }

        publicMinted[msg.sender] += qty;
        require(publicMinted[msg.sender] <= maxPerWallet, "max per wallet");
        _batchMintWithTraits(msg.sender, qty);
    }

    function mintAllowlistSimple(uint256 qty) external payable nonReentrant whenNotPaused {
        require(allowlistMintOpen, "Allowlist closed");
        require(qty > 0 && qty <= maxPerTx, "qty>maxPerTx");
        require(totalMinted + qty <= MAX_SUPPLY, "max supply");
        if (mintPrice > 0) {
            require(msg.value == mintPrice * qty, "Wrong ETH");
        }

        allowlistMinted[msg.sender] += uint32(qty);
        require(allowlistMinted[msg.sender] <= allowlistAllowance[msg.sender], "allowlist exceeded");
        _batchMintWithTraits(msg.sender, qty);
    }

    function mintAllowlistMerkle(uint256 qty, uint16 allowance, bytes32[] calldata proof) external payable nonReentrant whenNotPaused {
        require(allowlistMintOpen, "Allowlist closed");
        require(qty > 0 && qty <= maxPerTx, "qty>maxPerTx");
        require(totalMinted + qty <= MAX_SUPPLY, "max supply");
        if (mintPrice > 0) {
            require(msg.value == mintPrice * qty, "Wrong ETH");
        }
        require(allowlistRoot != bytes32(0), "root not set");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, allowance));
        require(MerkleProof.verify(proof, allowlistRoot, leaf), "bad proof");

        allowlistMinted[msg.sender] += uint32(qty);
        require(allowlistMinted[msg.sender] <= allowance, "allowlist exceeded");
        _batchMintWithTraits(msg.sender, qty);
    }

    function mintFreeSimple(uint256 qty) external nonReentrant whenNotPaused {
        require(freeMintOpen, "Free mint closed");
        require(qty > 0 && qty <= maxPerTx, "qty>maxPerTx");
        require(totalMinted + qty <= MAX_SUPPLY, "max supply");

        freeMinted[msg.sender] += uint32(qty);
        require(freeMinted[msg.sender] <= freeAllowance[msg.sender], "free exceeded");
        _batchMintWithTraits(msg.sender, qty);
    }

    function mintFreeMerkle(uint256 qty, uint16 allowance, bytes32[] calldata proof) external nonReentrant whenNotPaused {
        require(freeMintOpen, "Free mint closed");
        require(qty > 0 && qty <= maxPerTx, "qty>maxPerTx");
        require(totalMinted + qty <= MAX_SUPPLY, "max supply");
        require(freeRoot != bytes32(0), "root not set");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, allowance));
        require(MerkleProof.verify(proof, freeRoot, leaf), "bad proof");

        freeMinted[msg.sender] += uint32(qty);
        require(freeMinted[msg.sender] <= allowance, "free exceeded");
        _batchMintWithTraits(msg.sender, qty);
    }

    function _batchMintWithTraits(address to, uint256 qty) internal {
        for (uint256 i = 0; i < qty; i++) {
            require(totalMinted < MAX_SUPPLY, "max supply");
            uint256 id = _nextId++;
            _safeMint(to, id);
            totalMinted++;
            
            // Generate traits for this token
            _generateTraits(id);
            
            if (_rarityTier[id] == 0) _rarityTier[id] = 1;
        }
    }

    function _generateTraits(uint256 tokenId) internal {
        // Generate random seed based on token ID and block data
        uint256 seed = uint256(keccak256(abi.encodePacked(
            block.prevrandao,
            block.timestamp,
            tokenId,
            address(this)
        )));

        Traits memory newTraits;
        
        // Generate each trait based on rarity weights
        newTraits.head = _rollTrait(0, seed);
        newTraits.face = _rollTrait(1, seed >> 32);
        newTraits.body = _rollTrait(2, seed >> 64);
        newTraits.fur = _rollTrait(3, seed >> 96);
        newTraits.background = _rollTrait(4, seed >> 128);
        
        _traits[tokenId] = newTraits;
        emit TraitsSet(tokenId, newTraits);
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

    function ownerMint(address to, uint256 qty) external onlyOwner nonReentrant whenNotPaused {
        require(qty > 0 && qty <= maxPerTx, "qty>maxPerTx");
        require(totalMinted + qty <= MAX_SUPPLY, "max supply");
        _batchMintWithTraits(to, qty);
    }

    // ADMIN
    function setPaused(bool p) external onlyOwner { paused = p; emit Paused(p); }

    function setMintConfig(
        uint256 priceWei,
        uint256 _maxPerTx,
        uint256 _maxPerWallet,
        bool openPublic,
        bool openAllowlist,
        bool openFree
    ) external onlyOwner {
        mintPrice = priceWei;
        maxPerTx = _maxPerTx;
        maxPerWallet = _maxPerWallet;
        publicMintOpen = openPublic;
        allowlistMintOpen = openAllowlist;
        freeMintOpen = openFree;
        emit MintConfigUpdated(priceWei, _maxPerTx, _maxPerWallet, openPublic, openAllowlist, openFree);
    }

    function ownerBatchSetAllowances(
        address[] calldata wallets,
        uint32[] calldata paidAllow,
        uint32[] calldata freeAllow
    ) external onlyOwner {
        require(wallets.length == paidAllow.length && wallets.length == freeAllow.length, "len mismatch");
        for (uint256 i = 0; i < wallets.length; i++) {
            allowlistAllowance[wallets[i]] = paidAllow[i];
            freeAllowance[wallets[i]]      = freeAllow[i];
        }
        emit AllowancesSet(wallets.length);
    }

    function setMerkleRoots(bytes32 allowRoot, bytes32 freeRoot_) external onlyOwner {
        allowlistRoot = allowRoot;
        freeRoot = freeRoot_;
        emit RootsUpdated(allowRoot, freeRoot_);
    }

    function setRitual(address ritual_) external onlyOwner { ritual = ritual_; emit RitualSet(ritual_); }

    function setCosmetics(address cosmetics_) external onlyOwner { 
        cosmetics = ICosmeticsV2(cosmetics_); 
    }

    function setRarityBatch(uint256[] calldata ids, uint8 tier) external onlyOwner {
        require(tier >= 1 && tier <= 5, "tier 1..5");
        for (uint256 i = 0; i < ids.length; i++) {
            _rarityTier[ids[i]] = tier;
            emit RaritySet(ids[i], tier);
        }
    }

    function ownerSetTraits(uint256 tokenId, Traits calldata traits) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "bad id");
        _traits[tokenId] = traits;
        emit TraitsSet(tokenId, traits);
    }

    function markJoinedCult(uint256 tokenId) external onlyRitual {
        require(_ownerOf(tokenId) != address(0), "bad id");
        require(_state[tokenId] == State.Normal, "not normal");
        _state[tokenId] = State.Cult;
        emit StateChanged(tokenId, State.Cult);
    }

    function markDead(uint256 tokenId) external onlyRitual {
        require(_ownerOf(tokenId) != address(0), "bad id");
        require(_state[tokenId] != State.Dead, "already dead");
        address owner = ownerOf(tokenId);
        _state[tokenId] = State.Dead;
        emit StateChanged(tokenId, State.Dead);
        emit RaccoonSacrificed(tokenId, owner);
    }

    function withdraw(address payable to) external onlyOwner nonReentrant {
        uint256 bal = address(this).balance;
        (bool ok, ) = to.call{value: bal}("");
        require(ok, "withdraw failed");
        emit Withdraw(to, bal);
    }

    // VIEWS
    function tokenState(uint256 tokenId) external view returns (State) {
        require(_ownerOf(tokenId) != address(0), "bad id");
        return _state[tokenId];
    }

    function rarityTier(uint256 tokenId) external view returns (uint8) {
        require(_ownerOf(tokenId) != address(0), "bad id");
        uint8 t = _rarityTier[tokenId];
        return t == 0 ? 1 : t;
    }

    function exists(uint256 tokenId) external view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function getTraits(uint256 tokenId) external view returns (Traits memory) {
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

    /**
     * @notice Burn a raccoon NFT (ritual only)
     * @dev This is used when raccoons are permanently sacrificed/killed
     * @param tokenId The raccoon to burn
     */
    function burn(uint256 tokenId) external onlyRitual {
        require(_ownerOf(tokenId) != address(0), "Token doesn't exist");
        _burn(tokenId);
    }

    /**
     * @notice Burn raccoon from specific owner (ritual only)
     * @dev Used for owner-specific burns in rituals
     * @param owner The owner of the raccoon
     * @param tokenId The raccoon to burn
     */
    function burnFrom(address owner, uint256 tokenId) external onlyRitual {
        require(ownerOf(tokenId) == owner, "Wrong owner");
        _burn(tokenId);
    }

    /**
     * @notice Check if a raccoon has any equipped cosmetics
     * @param tokenId The raccoon to check
     * @return hasCosmetics True if any cosmetics are equipped
     */
    function hasEquippedCosmetics(uint256 tokenId) external view returns (bool hasCosmetics) {
        require(_ownerOf(tokenId) != address(0), "bad id");
        (uint256 head, uint256 face, uint256 body, uint256 fur, uint256 bg) = _getEquippedCosmetics(tokenId);
        return (head > 0 || face > 0 || body > 0 || fur > 0 || bg > 0);
    }

    /**
     * @notice Get equipped cosmetic details for external integrations
     * @param tokenId The raccoon to check
     * @return Equipped cosmetic type IDs for each slot
     */
    function getEquippedCosmetics(uint256 tokenId) external view returns (uint256 headTypeId, uint256 faceTypeId, uint256 bodyTypeId, uint256 furTypeId, uint256 backgroundTypeId) {
        require(_ownerOf(tokenId) != address(0), "bad id");
        return _getEquippedCosmetics(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "bad id");
        
        if (!revealed) {
            if (useIndividualPreReveal) {
                return string(abi.encodePacked(preRevealURI, tokenId.toString(), ".json"));
            } else {
                return preRevealURI;
            }
        }
        
        return _buildMetadata(tokenId);
    }

    function _buildMetadata(uint256 tokenId) internal view returns (string memory) {
        Traits memory traits = _traits[tokenId];
        State state = _state[tokenId];
        uint8 rarity = rarityTier(tokenId);
        
        string memory stateName = state == State.Cult ? "Cult" : (state == State.Dead ? "Dead" : "Normal");
        string memory rarityName = _getRarityName(rarity);
        
        // Get equipped cosmetics
        (uint256 headCosmetic, uint256 faceCosmetic, uint256 bodyCosmetic, uint256 furCosmetic, uint256 backgroundCosmetic) = _getEquippedCosmetics(tokenId);
        
        // Build base trait attributes
        string memory baseAttributes;
        
        if (state == State.Cult) {
            // Cult members lose all individual traits
            baseAttributes = string(abi.encodePacked(
                '{"trait_type":"State","value":"', stateName, '"},',
                '{"trait_type":"Rarity","value":"', rarityName, '"},',
                '{"trait_type":"Base Head","value":"Cult Member"},',
                '{"trait_type":"Base Face","value":"Cult Member"},',
                '{"trait_type":"Base Body","value":"Cult Member"},',
                '{"trait_type":"Base Fur","value":"Cult Member"},',
                '{"trait_type":"Base Background","value":"Cult Member"}'
            ));
        } else {
            // Normal/Dead state shows original traits
            baseAttributes = string(abi.encodePacked(
                '{"trait_type":"State","value":"', stateName, '"},',
                '{"trait_type":"Rarity","value":"', rarityName, '"},',
                '{"trait_type":"Base Head","value":"', _getTraitDisplayName(0, traits.head, state), '"},',
                '{"trait_type":"Base Face","value":"', _getTraitDisplayName(1, traits.face, state), '"},',
                '{"trait_type":"Base Body","value":"', _getTraitDisplayName(2, traits.body, state), '"},',
                '{"trait_type":"Base Fur","value":"', _getTraitDisplayName(3, traits.fur, state), '"},',
                '{"trait_type":"Base Background","value":"', _getTraitDisplayName(4, traits.background, state), '"}'
            ));
        }
        
        // Build cosmetic attributes if any equipped
        string memory cosmeticAttributes = _buildCosmeticAttributes(headCosmetic, faceCosmetic, bodyCosmetic, furCosmetic, backgroundCosmetic);
        
        string memory allAttributes = baseAttributes;
        if (bytes(cosmeticAttributes).length > 0) {
            allAttributes = string(abi.encodePacked(baseAttributes, ",", cosmeticAttributes));
        }
        
        // Build image URL (with cosmetics if equipped)
        string memory imageUrl = _buildImageURL(tokenId, traits, headCosmetic, faceCosmetic, bodyCosmetic, furCosmetic, backgroundCosmetic);
        
        // Build full metadata JSON
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name":"Raccoon #', tokenId.toString(), '",',
                        '"description":"A ritual raccoon with mysterious powers",',
                        '"image":"', imageUrl, '",',
                        '"attributes":[', allAttributes, ']}'
                    )
                )
            )
        );
        
        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function _getTraitDisplayName(uint8 traitType, uint8 traitIndex, State state) internal view returns (string memory) {
        if (state == State.Cult && cultTraitNames[traitType].length > traitIndex) {
            return cultTraitNames[traitType][traitIndex];
        } else if (state == State.Dead && deadTraitNames[traitType].length > traitIndex) {
            return deadTraitNames[traitType][traitIndex];
        } else if (traitIndex < traitNames[traitType].length) {
            return traitNames[traitType][traitIndex];
        }
        return "Unknown";
    }

    function _getRarityName(uint8 rarity) internal pure returns (string memory) {
        if (rarity == 1) return "Common";
        if (rarity == 2) return "Uncommon";
        if (rarity == 3) return "Rare";
        if (rarity == 4) return "Epic";
        if (rarity == 5) return "Legendary";
        return "Unknown";
    }

    function _getEquippedCosmetics(uint256 tokenId) internal view returns (uint256, uint256, uint256, uint256, uint256) {
        if (address(cosmetics) == address(0)) {
            return (0, 0, 0, 0, 0);
        }
        
        try cosmetics.getEquippedCosmetics(tokenId) returns (
            uint256 headTypeId, 
            uint256 faceTypeId, 
            uint256 bodyTypeId, 
            uint256 furTypeId, 
            uint256 backgroundTypeId
        ) {
            return (headTypeId, faceTypeId, bodyTypeId, furTypeId, backgroundTypeId);
        } catch {
            return (0, 0, 0, 0, 0);
        }
    }

    function _buildCosmeticAttributes(uint256 headCosmetic, uint256 faceCosmetic, uint256 bodyCosmetic, uint256 furCosmetic, uint256 backgroundCosmetic) internal view returns (string memory) {
        string memory attributes = "";
        
        if (headCosmetic > 0) {
            string memory name = _getCosmeticName(headCosmetic);
            if (bytes(name).length > 0) {
                attributes = string(abi.encodePacked(attributes, '{"trait_type":"Equipped Head","value":"', name, '"}'));
            }
        }
        
        if (faceCosmetic > 0) {
            string memory name = _getCosmeticName(faceCosmetic);
            if (bytes(name).length > 0) {
                if (bytes(attributes).length > 0) attributes = string(abi.encodePacked(attributes, ","));
                attributes = string(abi.encodePacked(attributes, '{"trait_type":"Equipped Face","value":"', name, '"}'));
            }
        }
        
        if (bodyCosmetic > 0) {
            string memory name = _getCosmeticName(bodyCosmetic);
            if (bytes(name).length > 0) {
                if (bytes(attributes).length > 0) attributes = string(abi.encodePacked(attributes, ","));
                attributes = string(abi.encodePacked(attributes, '{"trait_type":"Equipped Body","value":"', name, '"}'));
            }
        }
        
        if (furCosmetic > 0) {
            string memory name = _getCosmeticName(furCosmetic);
            if (bytes(name).length > 0) {
                if (bytes(attributes).length > 0) attributes = string(abi.encodePacked(attributes, ","));
                attributes = string(abi.encodePacked(attributes, '{"trait_type":"Equipped Fur","value":"', name, '"}'));
            }
        }
        
        if (backgroundCosmetic > 0) {
            string memory name = _getCosmeticName(backgroundCosmetic);
            if (bytes(name).length > 0) {
                if (bytes(attributes).length > 0) attributes = string(abi.encodePacked(attributes, ","));
                attributes = string(abi.encodePacked(attributes, '{"trait_type":"Equipped Background","value":"', name, '"}'));
            }
        }
        
        return attributes;
    }

    function _getCosmeticName(uint256 typeId) internal view returns (string memory) {
        if (address(cosmetics) == address(0) || typeId == 0) return "";
        
        try cosmetics.getCosmeticInfo(typeId) returns (
            string memory name, 
            string memory, 
            string memory, 
            uint8, 
            uint8, 
            uint256, 
            bool active
        ) {
            return active ? name : "";
        } catch {
            return "";
        }
    }

    function _buildImageURL(uint256 tokenId, Traits memory traits, uint256 headCosmetic, uint256 faceCosmetic, uint256 bodyCosmetic, uint256 furCosmetic, uint256 backgroundCosmetic) internal view returns (string memory) {
        State state = _state[tokenId];
        
        // Cult members all use the same artwork
        if (state == State.Cult) {
            return string(abi.encodePacked(baseImageURI, "cult.png"));
        }
        
        // Dead members all use the same artwork  
        if (state == State.Dead) {
            return string(abi.encodePacked(baseImageURI, "dead.png"));
        }
        
        // Normal state - check for cosmetics
        bool hasCosmetics = (headCosmetic > 0 || faceCosmetic > 0 || bodyCosmetic > 0 || furCosmetic > 0 || backgroundCosmetic > 0);
        
        if (hasCosmetics) {
            // Build cosmetic-enhanced image URL
            return string(abi.encodePacked(
                baseImageURI, 
                "cosmetic/",
                tokenId.toString(),
                "_h", headCosmetic.toString(),
                "_f", faceCosmetic.toString(), 
                "_b", bodyCosmetic.toString(),
                "_fur", furCosmetic.toString(),
                "_bg", backgroundCosmetic.toString(),
                ".png"
            ));
        } else {
            // Use base trait image
            return string(abi.encodePacked(baseImageURI, tokenId.toString(), ".png"));
        }
    }
}