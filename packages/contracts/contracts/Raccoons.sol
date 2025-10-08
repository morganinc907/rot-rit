// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

// Interface for cosmetics contract
interface ICosmeticsV2 {
    function getEquippedCosmetics(uint256 raccoonId) external view returns (
        uint256 headTypeId, uint256 faceTypeId, uint256 bodyTypeId, uint256 furTypeId, uint256 backgroundTypeId
    );
}

/**
 * @title Raccoons
 * @notice Simple NFT contract using pre-generated IPFS metadata and images
 */
contract Raccoons is ERC721, ERC721Enumerable, ERC2981, Ownable, ReentrancyGuard {
    enum State { Normal, Cult, Dead }

    // Collection configuration
    uint256 public MAX_SUPPLY;
    uint256 public mintPrice = 0; // Free for testnet
    uint256 public maxPerTx = 5;
    
    // IPFS URIs
    string public baseTokenURI; // Points to IPFS metadata folder
    string public preRevealURI;
    string public dynamicMetadataURI; // Base URL for dynamic metadata service
    
    // Contract state
    uint256 public totalMinted;
    bool public revealed = false;
    bool public mintingEnabled = true;
    
    // Allowlist state
    bytes32 public allowlistRoot;
    bool public allowlistMintOpen = false;
    mapping(address => uint32) public allowlistMinted;
    
    // NFT states and cosmetics
    mapping(uint256 => State) private _state;
    mapping(uint256 => bool) private _exists;
    
    // Cosmetics integration
    address public cosmetics;
    
    // Events
    event RaccoonMinted(uint256 indexed tokenId, address indexed to);
    event Minted(address indexed to, uint256 indexed fromId, uint256 qty);
    event StateChanged(uint256 indexed tokenId, State newState);
    event CosmeticsSet(address indexed cosmetics);

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
    }

    // ========== Minting ==========

    function mint(uint256 quantity) external payable nonReentrant {
        require(mintingEnabled, "Minting disabled");
        require(quantity > 0 && quantity <= maxPerTx, "Invalid quantity");
        require(totalMinted + quantity <= MAX_SUPPLY, "Would exceed max supply");
        require(msg.value >= mintPrice * quantity, "Insufficient payment");

        uint256 startingId = totalMinted;
        for (uint256 i = 0; i < quantity;) {
            uint256 tokenId = startingId + i + 1;
            _safeMint(msg.sender, tokenId);
            _exists[tokenId] = true;
            _state[tokenId] = State.Normal;
            totalMinted++;
            emit RaccoonMinted(tokenId, msg.sender);
            unchecked { ++i; }
        }
        emit Minted(msg.sender, startingId + 1, quantity);
    }

    function mintAllowlistMerkle(
        uint256 qty,
        uint16 allowance,
        bytes32[] calldata proof
    ) external payable nonReentrant {
        require(allowlistMintOpen, "Allowlist closed");
        require(qty > 0 && qty <= maxPerTx, "qty>maxPerTx");
        require(totalMinted + qty <= MAX_SUPPLY, "max supply");
        require(msg.value == mintPrice * qty, "Wrong ETH");
        require(allowlistRoot != bytes32(0), "root not set");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, allowance));
        require(MerkleProof.verify(proof, allowlistRoot, leaf), "bad proof");

        allowlistMinted[msg.sender] += uint32(qty);
        require(allowlistMinted[msg.sender] <= allowance, "allowlist exceeded");

        uint256 startingId = totalMinted;
        for (uint256 i = 0; i < qty;) {
            uint256 tokenId = startingId + i + 1;
            _safeMint(msg.sender, tokenId);
            _exists[tokenId] = true;
            _state[tokenId] = State.Normal;
            totalMinted++;
            emit RaccoonMinted(tokenId, msg.sender);
            unchecked { ++i; }
        }
        emit Minted(msg.sender, startingId + 1, qty);
    }

    function ownerMint(address to, uint256 quantity) external onlyOwner {
        require(totalMinted + quantity <= MAX_SUPPLY, "Would exceed max supply");
        
        uint256 startingId = totalMinted;
        for (uint256 i = 0; i < quantity;) {
            uint256 tokenId = startingId + i + 1;
            _safeMint(to, tokenId);
            _exists[tokenId] = true;
            _state[tokenId] = State.Normal;
            totalMinted++;
            emit RaccoonMinted(tokenId, to);
            unchecked { ++i; }
        }
        emit Minted(to, startingId + 1, quantity);
    }

    // ========== State Management ==========

    function setState(uint256 tokenId, uint8 newState) external {
        require(_ownerOf(tokenId) != address(0), "Invalid token");
        require(msg.sender == owner() || msg.sender == cosmetics, "Not authorized");
        require(newState <= uint8(State.Dead), "Invalid state");
        
        _state[tokenId] = State(newState);
        emit StateChanged(tokenId, State(newState));
    }

    function joinCult(uint256 tokenId) external {
        require(_ownerOf(tokenId) != address(0), "Invalid token");
        require(_ownerOf(tokenId) == msg.sender, "Not token owner");
        require(_state[tokenId] == State.Normal, "Already in cult or dead");
        
        _state[tokenId] = State.Cult;
        emit StateChanged(tokenId, State.Cult);
    }

    function getState(uint256 tokenId) external view returns (uint8) {
        require(_ownerOf(tokenId) != address(0), "Invalid token");
        return uint8(_state[tokenId]);
    }

    // ========== Metadata ==========

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Invalid token");
        
        if (!revealed) {
            return preRevealURI;
        }

        // For special states, return specific metadata
        State state = _state[tokenId];
        if (state == State.Cult) {
            return string(abi.encodePacked(baseTokenURI, "cult.json"));
        }
        if (state == State.Dead) {
            return string(abi.encodePacked(baseTokenURI, "dead.json"));
        }

        // Normal state - check if cosmetics are equipped (with safety)
        if (cosmetics != address(0) && bytes(dynamicMetadataURI).length > 0) {
            // Safely check for equipped cosmetics
            if (_hasEquippedCosmetics(tokenId)) {
                // Return dynamic metadata URL (metadata API reads equipped cosmetics from chain)
                return string(abi.encodePacked(
                    dynamicMetadataURI,
                    _toString(tokenId)
                ));
            }
        }

        // No cosmetics - return original static metadata
        return string(abi.encodePacked(baseTokenURI, _toString(tokenId), ".json"));
    }

    // ========== Configuration ==========

    function setBaseTokenURI(string calldata uri) external onlyOwner {
        baseTokenURI = uri;
    }

    function setPreRevealURI(string calldata uri) external onlyOwner {
        preRevealURI = uri;
    }

    function setRevealed(bool _revealed) external onlyOwner {
        revealed = _revealed;
    }

    function setMintingEnabled(bool enabled) external onlyOwner {
        mintingEnabled = enabled;
    }

    function setMintPrice(uint256 price) external onlyOwner {
        mintPrice = price;
    }

    function setMaxPerTx(uint256 max) external onlyOwner {
        maxPerTx = max;
    }

    function setCosmeticsContract(address _cosmetics) external onlyOwner {
        cosmetics = _cosmetics;
        emit CosmeticsSet(_cosmetics);
    }
    
    function setDynamicMetadataURI(string calldata uri) external onlyOwner {
        dynamicMetadataURI = uri;
    }

    function setAllowlistRoot(bytes32 _allowlistRoot) external onlyOwner {
        allowlistRoot = _allowlistRoot;
    }

    function setAllowlistMintOpen(bool open) external onlyOwner {
        allowlistMintOpen = open;
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function deleteDefaultRoyalty() external onlyOwner {
        _deleteDefaultRoyalty();
    }

    // ========== Cosmetics Integration ==========

    function hasCosmetics(uint256 tokenId) external view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "Invalid token");
        return _hasEquippedCosmetics(tokenId);
    }
    
    function _hasEquippedCosmetics(uint256 tokenId) internal view returns (bool) {
        if (cosmetics == address(0)) return false;
        
        try ICosmeticsV2(cosmetics).getEquippedCosmetics(tokenId) returns (
            uint256 head, uint256 face, uint256 body, uint256 fur, uint256 bg
        ) {
            return (head > 0 || face > 0 || body > 0 || fur > 0 || bg > 0);
        } catch {
            return false;
        }
    }

    // ========== Owner Functions ==========

    function withdraw() external onlyOwner nonReentrant {
        uint256 bal = address(this).balance;
        (bool ok, ) = payable(msg.sender).call{value: bal}("");
        require(ok, "withdraw failed");
    }

    // ========== View Functions ==========

    function exists(uint256 tokenId) external view returns (bool) {
        return _exists[tokenId];
    }

    function totalSupply() public view override returns (uint256) {
        return totalMinted;
    }

    // ========== Internal ==========

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    function _toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = _HEX_SYMBOLS[value & 0xf];
            value >>= 4;
        }
        require(value == 0, "Strings: hex length insufficient");
        return string(buffer);
    }
    
    bytes16 private constant _HEX_SYMBOLS = "0123456789abcdef";

    // ========== Overrides ==========

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC721Enumerable, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth) internal virtual override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal virtual override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }
}