// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

// Interface for raccoons contract
interface IRaccoons {
    function getState(uint256 tokenId) external view returns (uint8);
}

contract CosmeticsV2 is ERC1155, Ownable, ReentrancyGuard {
    using Strings for uint256;

    enum Slot { HEAD, FACE, BODY, FUR, BACKGROUND }

    struct EquippedSummary {
        uint256[5] boundIds;
        uint256[5] baseTypeIds;
        uint256[5] equippedIndexPlus1;
    }

    struct CosmeticType {
        string name;
        string imageURI;
        string previewLayerURI;
        uint8 rarity;
        Slot slot;
        uint256 monthlySetId;
        uint256 maxSupply;
        uint256 currentSupply;
        bool active;
    }

    struct WardrobeItem { uint256 baseTypeId; uint256 boundId; uint256 boundAt; }
    struct SlotWardrobe { WardrobeItem[] items; uint256 equippedIndex; }

    uint256 private constant BOUND_ID_OFFSET = 1_000_000_000;

    mapping(uint256 => CosmeticType) public cosmeticTypes;
    mapping(uint256 => bool) public typeExists;
    mapping(uint256 => mapping(Slot => SlotWardrobe)) public wardrobe;
    mapping(uint256 => bool) public isBound;
    mapping(uint256 => uint256) public boundToRaccoon;
    mapping(uint256 => uint256) public boundBaseType;

    address public raccoons;
    address public mawSacrifice;
    mapping(uint256 => uint256[]) public monthlySetCosmetics;
    uint256 public currentMonthlySetId = 1;
    uint256 private _nextTypeId = 1;
    string public baseTypeURI;
    string public boundBaseURI;
    
    // Season Catalog - cosmetic types available in the store
    uint256[] private currentCosmeticTypes;

    event CosmeticTypeCreated(uint256 indexed typeId, string name, uint8 rarity, Slot slot);
    event CosmeticMinted(uint256 indexed typeId, address to, uint256 amount);
    event CosmeticBound(uint256 indexed raccoonId, Slot slot, uint256 baseTypeId, uint256 boundId);
    event CosmeticEquipped(uint256 indexed raccoonId, Slot slot, uint256 boundId);
    event CosmeticUnequipped(uint256 indexed raccoonId, Slot slot, uint256 boundId);

    modifier onlyMawSacrifice() { require(msg.sender == mawSacrifice, "Only MawSacrifice"); _; }
    modifier onlyRaccoonOwner(uint256 raccoonId) { require(IERC721(raccoons).ownerOf(raccoonId) == msg.sender, "Not raccoon owner"); _; }

    constructor(string memory _baseTypeURI, string memory _boundBaseURI) ERC1155("") Ownable(msg.sender) {
        baseTypeURI = _baseTypeURI; boundBaseURI = _boundBaseURI;
    }

    function setContracts(address _raccoons, address _mawSacrifice) external onlyOwner { raccoons = _raccoons; mawSacrifice = _mawSacrifice; }
    function setURIs(string calldata _baseTypeURI, string calldata _boundBaseURI) external onlyOwner { baseTypeURI = _baseTypeURI; boundBaseURI = _boundBaseURI; }
    function setCurrentMonthlySet(uint256 setId) external onlyOwner { currentMonthlySetId = setId; }

    function createCosmeticType(string calldata name, string calldata imageURI, string calldata previewLayerURI, uint8 rarity, Slot slot, uint256 monthlySetId, uint256 maxSupply) external onlyOwner returns (uint256 typeId) {
        require(rarity >= 1 && rarity <= 5, "Invalid rarity"); require(maxSupply > 0, "Invalid max supply");
        typeId = _nextTypeId++; require(!typeExists[typeId], "Type exists");
        cosmeticTypes[typeId] = CosmeticType({ name: name, imageURI: imageURI, previewLayerURI: previewLayerURI, rarity: rarity, slot: slot, monthlySetId: monthlySetId, maxSupply: maxSupply, currentSupply: 0, active: true });
        typeExists[typeId] = true; monthlySetCosmetics[monthlySetId].push(typeId);
        emit CosmeticTypeCreated(typeId, name, rarity, slot);
    }

    function setTypeActive(uint256 typeId, bool active) external onlyOwner { require(typeExists[typeId], "Type missing"); cosmeticTypes[typeId].active = active; }

    function mintTo(address to, uint256 typeId) external onlyMawSacrifice returns (uint256) {
        require(typeExists[typeId], "Type missing"); CosmeticType storage t = cosmeticTypes[typeId];
        require(t.active, "Type inactive"); require(t.currentSupply < t.maxSupply, "Max supply reached");
        t.currentSupply += 1; _mint(to, typeId, 1, ""); emit CosmeticMinted(typeId, to, 1); return typeId;
    }

    function bindToRaccoon(uint256 raccoonId, uint256 typeId) external nonReentrant onlyRaccoonOwner(raccoonId) {
        require(typeExists[typeId], "Invalid type"); require(balanceOf(msg.sender, typeId) > 0, "Not owner"); require(typeId < BOUND_ID_OFFSET, "Already bound");
        
        // Only allow binding to Normal raccoons (State = 0)
        require(IRaccoons(raccoons).getState(raccoonId) == 0, "Can only bind to Normal raccoons");
        
        CosmeticType memory t = cosmeticTypes[typeId]; require(t.active, "Type inactive");
        _burn(msg.sender, typeId, 1);
        uint256 boundId = _generateBoundId(typeId, raccoonId); _mint(address(this), boundId, 1, "");
        isBound[boundId] = true; boundToRaccoon[boundId] = raccoonId; boundBaseType[boundId] = typeId;
        wardrobe[raccoonId][t.slot].items.push(WardrobeItem({ baseTypeId: typeId, boundId: boundId, boundAt: block.timestamp }));
        emit CosmeticBound(raccoonId, t.slot, typeId, boundId);
    }

    function equipCosmetic(uint256 raccoonId, Slot slot, uint256 itemIndex) external onlyRaccoonOwner(raccoonId) {
        SlotWardrobe storage w = wardrobe[raccoonId][slot]; require(itemIndex < w.items.length, "Bad index");
        uint256 boundId = w.items[itemIndex].boundId; w.equippedIndex = itemIndex + 1; emit CosmeticEquipped(raccoonId, slot, boundId);
    }

    function equipCosmeticById(uint256 raccoonId, Slot slot, uint256 boundId) external onlyRaccoonOwner(raccoonId) {
        SlotWardrobe storage w = wardrobe[raccoonId][slot]; uint256 idx = _indexOfBoundId(w.items, boundId); require(idx != type(uint256).max, "Not owned");
        w.equippedIndex = idx + 1; emit CosmeticEquipped(raccoonId, slot, boundId);
    }

    function unequipSlot(uint256 raccoonId, Slot slot) external onlyRaccoonOwner(raccoonId) {
        SlotWardrobe storage w = wardrobe[raccoonId][slot]; if (w.equippedIndex > 0) { uint256 boundId = w.items[w.equippedIndex - 1].boundId; w.equippedIndex = 0; emit CosmeticUnequipped(raccoonId, slot, boundId); }
    }

    // Views (5 slots)
    function getEquippedCosmetics(uint256 raccoonId) external view returns (uint256 headTypeId, uint256 faceTypeId, uint256 bodyTypeId, uint256 furTypeId, uint256 backgroundTypeId) {
        SlotWardrobe storage h = wardrobe[raccoonId][Slot.HEAD]; SlotWardrobe storage f = wardrobe[raccoonId][Slot.FACE]; SlotWardrobe storage b = wardrobe[raccoonId][Slot.BODY]; SlotWardrobe storage fur = wardrobe[raccoonId][Slot.FUR]; SlotWardrobe storage bg = wardrobe[raccoonId][Slot.BACKGROUND];
        headTypeId = h.equippedIndex > 0 ? h.items[h.equippedIndex - 1].baseTypeId : 0;
        faceTypeId = f.equippedIndex > 0 ? f.items[f.equippedIndex - 1].baseTypeId : 0;
        bodyTypeId = b.equippedIndex > 0 ? b.items[b.equippedIndex - 1].baseTypeId : 0;
        furTypeId = fur.equippedIndex > 0 ? fur.items[fur.equippedIndex - 1].baseTypeId : 0;
        backgroundTypeId = bg.equippedIndex > 0 ? bg.items[bg.equippedIndex - 1].baseTypeId : 0;
    }

    function getEquippedBoundIds(uint256 raccoonId) external view returns (uint256 head, uint256 face, uint256 body, uint256 fur, uint256 background) {
        SlotWardrobe storage h = wardrobe[raccoonId][Slot.HEAD]; SlotWardrobe storage f = wardrobe[raccoonId][Slot.FACE]; SlotWardrobe storage b = wardrobe[raccoonId][Slot.BODY]; SlotWardrobe storage furSlot = wardrobe[raccoonId][Slot.FUR]; SlotWardrobe storage bg = wardrobe[raccoonId][Slot.BACKGROUND];
        head = h.equippedIndex > 0 ? h.items[h.equippedIndex - 1].boundId : 0;
        face = f.equippedIndex > 0 ? f.items[f.equippedIndex - 1].boundId : 0;
        body = b.equippedIndex > 0 ? b.items[b.equippedIndex - 1].boundId : 0;
        fur = furSlot.equippedIndex > 0 ? furSlot.items[furSlot.equippedIndex - 1].boundId : 0;
        background = bg.equippedIndex > 0 ? bg.items[bg.equippedIndex - 1].boundId : 0;
    }

    function getEquippedForSlot(uint256 raccoonId, Slot slot) external view returns (uint256 boundId, uint256 baseTypeId, uint256 equippedIndexPlus1) {
        SlotWardrobe storage w = wardrobe[raccoonId][slot]; equippedIndexPlus1 = w.equippedIndex;
        if (equippedIndexPlus1 > 0) { WardrobeItem storage it = w.items[equippedIndexPlus1 - 1]; boundId = it.boundId; baseTypeId = it.baseTypeId; }
    }

    function getEquippedSummary(uint256 raccoonId) external view returns (uint256[5] memory boundIds, uint256[5] memory baseTypeIds, uint256[5] memory equippedIndexPlus1) {
        Slot[5] memory slots = [Slot.HEAD, Slot.FACE, Slot.BODY, Slot.FUR, Slot.BACKGROUND];
        for (uint256 i = 0; i < 5; i++) { SlotWardrobe storage w = wardrobe[raccoonId][slots[i]]; equippedIndexPlus1[i] = w.equippedIndex;
            if (w.equippedIndex > 0) { WardrobeItem storage it = w.items[w.equippedIndex - 1]; boundIds[i] = it.boundId; baseTypeIds[i] = it.baseTypeId; } }
    }

    function getWardrobeCounts(uint256 raccoonId) external view returns (uint256[5] memory counts) {
        counts[0] = wardrobe[raccoonId][Slot.HEAD].items.length; counts[1] = wardrobe[raccoonId][Slot.FACE].items.length; counts[2] = wardrobe[raccoonId][Slot.BODY].items.length; counts[3] = wardrobe[raccoonId][Slot.FUR].items.length; counts[4] = wardrobe[raccoonId][Slot.BACKGROUND].items.length;
    }

    function getEquippedSummaryStruct(uint256 raccoonId) external view returns (EquippedSummary memory s) {
        Slot[5] memory slots = [Slot.HEAD, Slot.FACE, Slot.BODY, Slot.FUR, Slot.BACKGROUND];
        for (uint256 i = 0; i < 5; i++) {
            SlotWardrobe storage w = wardrobe[raccoonId][slots[i]];
            s.equippedIndexPlus1[i] = w.equippedIndex;
            if (w.equippedIndex > 0) { WardrobeItem storage it = w.items[w.equippedIndex - 1]; s.boundIds[i] = it.boundId; s.baseTypeIds[i] = it.baseTypeId; }
        }
    }

    function _generateBoundId(uint256 typeId, uint256 raccoonId) internal pure returns (uint256) {
        uint256 hashId = uint256(keccak256(abi.encodePacked("BOUND", typeId, raccoonId)));
        return BOUND_ID_OFFSET + (hashId % (type(uint256).max - BOUND_ID_OFFSET));
    }

    function _indexOfBoundId(WardrobeItem[] storage arr, uint256 boundId) internal view returns (uint256) {
        for (uint256 i; i < arr.length; i++) { if (arr[i].boundId == boundId) return i; } return type(uint256).max;
    }

    // Integration functions for external contracts
    function getCosmeticInfo(uint256 typeId) external view returns (string memory name, string memory imageURI, string memory previewLayerURI, uint8 rarity, uint8 slot, uint256 monthlySetId, bool active) {
        require(typeExists[typeId], "Type doesn't exist");
        CosmeticType storage t = cosmeticTypes[typeId];
        return (t.name, t.imageURI, t.previewLayerURI, t.rarity, uint8(t.slot), t.monthlySetId, t.active);
    }

    function isValidRaccoon(uint256 raccoonId) external view returns (bool) {
        if (raccoons == address(0)) return false;
        try IERC721(raccoons).ownerOf(raccoonId) returns (address) {
            return true;
        } catch {
            return false;
        }
    }

    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) internal {
        if (from != address(0) && to != address(0)) { for (uint256 i = 0; i < ids.length; i++) { if (isBound[ids[i]]) revert("BOUND_NON_TRANSFERABLE"); } }
    }

    function uri(uint256 id) public view override returns (string memory) {
        if (id < BOUND_ID_OFFSET && typeExists[id]) { string memory img = cosmeticTypes[id].imageURI; if (bytes(img).length > 0) return img; return string(abi.encodePacked(baseTypeURI, id.toString(), ".json")); }
        if (isBound[id]) { uint256 raccoonId = boundToRaccoon[id]; uint256 baseTypeId = boundBaseType[id]; if (bytes(boundBaseURI).length > 0) { return string(abi.encodePacked(boundBaseURI, baseTypeId.toString(), "?bound=1&raccoon=", raccoonId.toString(), "&boundId=", id.toString())); } }
        return super.uri(id);
    }

    /// @notice Packed ABI-encoded summary for minimal RPC payload.
    // Season Catalog Management - Store reads these
    
    /// @notice Get current cosmetic types available in the store
    /// @dev This is the "Season Catalog" that the store frontend displays
    function getCurrentCosmeticTypes() external view returns (uint256[] memory) {
        return currentCosmeticTypes;
    }
    
    /// @notice Set current cosmetic types for the season
    /// @dev Only owner can update the seasonal catalog
    function setCurrentCosmeticTypes(uint256[] calldata types) external onlyOwner {
        // Validate that all types exist and are active
        for (uint256 i = 0; i < types.length; i++) {
            require(typeExists[types[i]], "Type does not exist");
            require(cosmeticTypes[types[i]].active, "Type is not active");
        }
        currentCosmeticTypes = types;
    }
    
    /// @notice Get cosmetic info for multiple types (for store display)
    function getCosmeticInfoBatch(uint256[] calldata typeIds) 
        external 
        view 
        returns (
            string[] memory names,
            string[] memory imageURIs,
            uint8[] memory rarities,
            Slot[] memory slots,
            bool[] memory actives
        ) 
    {
        uint256 length = typeIds.length;
        names = new string[](length);
        imageURIs = new string[](length);
        rarities = new uint8[](length);
        slots = new Slot[](length);
        actives = new bool[](length);
        
        for (uint256 i = 0; i < length; i++) {
            CosmeticType storage t = cosmeticTypes[typeIds[i]];
            names[i] = t.name;
            imageURIs[i] = t.imageURI;
            rarities[i] = t.rarity;
            slots[i] = t.slot;
            actives[i] = t.active;
        }
    }

    /// @dev Returns abi.encode(boundIds[5], baseTypeIds[5], equippedIndexPlus1[5])
    /// Decode in JS (viem):
    ///   const [bounds, bases, idx] = decodeAbiParameters(
    ///     [{ type: 'uint256[5]' }, { type: 'uint256[5]' }, { type: 'uint256[5]' }],
    ///     packed
    ///   );
    function getEquippedPacked(uint256 raccoonId) external view returns (bytes memory packed) {
        uint256[5] memory boundIds;
        uint256[5] memory baseTypeIds;
        uint256[5] memory equippedIndexPlus1;

        Slot[5] memory slots = [Slot.HEAD, Slot.FACE, Slot.BODY, Slot.FUR, Slot.BACKGROUND];
        for (uint256 i = 0; i < 5; i++) {
            SlotWardrobe storage w = wardrobe[raccoonId][slots[i]];
            equippedIndexPlus1[i] = w.equippedIndex;
            if (w.equippedIndex > 0) {
                WardrobeItem storage it = w.items[w.equippedIndex - 1];
                boundIds[i] = it.boundId;
                baseTypeIds[i] = it.baseTypeId;
            }
        }
        packed = abi.encode(boundIds, baseTypeIds, equippedIndexPlus1);
    }

    /// @notice Batched packed summaries for multiple raccoons.
    function getEquippedPackedMany(uint256[] calldata raccoonIds) external view returns (bytes[] memory packs) {
        packs = new bytes[](raccoonIds.length);
        for (uint256 k = 0; k < raccoonIds.length; k++) {
            uint256 rid = raccoonIds[k];

            uint256[5] memory boundIds;
            uint256[5] memory baseTypeIds;
            uint256[5] memory equippedIndexPlus1;

            Slot[5] memory slots = [Slot.HEAD, Slot.FACE, Slot.BODY, Slot.FUR, Slot.BACKGROUND];
            for (uint256 i = 0; i < 5; i++) {
                SlotWardrobe storage w = wardrobe[rid][slots[i]];
                equippedIndexPlus1[i] = w.equippedIndex;
                if (w.equippedIndex > 0) {
                    WardrobeItem storage it = w.items[w.equippedIndex - 1];
                    boundIds[i] = it.boundId;
                    baseTypeIds[i] = it.baseTypeId;
                }
            }
            packs[k] = abi.encode(boundIds, baseTypeIds, equippedIndexPlus1);
        }
    }

    function getWardrobePagePacked(uint256 raccoonId, Slot slot, uint256 start, uint256 count)
        external
        view
        returns (bytes memory packed, uint256 equippedIndexPlus1, uint256 total)
    {
        SlotWardrobe storage w = wardrobe[raccoonId][slot];
        total = w.items.length;
        equippedIndexPlus1 = w.equippedIndex;
        uint256 end = start + count;
        if (end > total) end = total;
        uint256 n = end > start ? end - start : 0;
        uint256[] memory boundIds = new uint256[](n);
        uint256[] memory baseTypeIds = new uint256[](n);
        uint256[] memory boundAts = new uint256[](n);
        for (uint256 i = 0; i < n; i++) {
            WardrobeItem storage it = w.items[start + i];
            boundIds[i] = it.boundId;
            baseTypeIds[i] = it.baseTypeId;
            boundAts[i] = it.boundAt;
        }
        packed = abi.encode(boundIds, baseTypeIds, boundAts);
    }
}

interface IERC721 { 
    function ownerOf(uint256 tokenId) external view returns (address); 
}
