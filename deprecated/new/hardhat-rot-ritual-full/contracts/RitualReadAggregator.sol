// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract RitualReadAggregator {
    ICosmeticsV2 public immutable cosmetics;
    IRaccoons public immutable raccoons;
    IRelics public immutable relics;

    constructor(address _cosmetics, address _raccoons, address _relics) {
        cosmetics = ICosmeticsV2(_cosmetics);
        raccoons = IRaccoons(_raccoons);
        relics = IRelics(_relics);
    }

    function getEquippedPackedMany(uint256[] calldata raccoonIds) external view returns (bytes[] memory packs) {
        return cosmetics.getEquippedPackedMany(raccoonIds);
    }

    function getOwners(uint256[] calldata raccoonIds) external view returns (address[] memory owners) {
        owners = new address[](raccoonIds.length);
        for (uint256 i = 0; i < raccoonIds.length; i++) {
            owners[i] = raccoons.ownerOf(raccoonIds[i]);
        }
    }

    function getRelicBalances(address user, uint256[] calldata ids) external view returns (uint256[] memory balances) {
        address[] memory users = new address[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) users[i] = user;
        try relics.balanceOfBatch(users, ids) returns (uint256[] memory res) {
            return res;
        } catch {
            balances = new uint256[](ids.length);
            for (uint256 i = 0; i < ids.length; i++) {
                balances[i] = relics.balanceOf(user, ids[i]);
            }
        }
    }

    function batchEverythingPacked(
        address user,
        uint256[] calldata raccoonIds,
        uint256[] calldata relicIds
    ) external view returns (bytes memory packed) {
        bytes[] memory equipPacks = cosmetics.getEquippedPackedMany(raccoonIds);

        address[] memory owners = new address[](raccoonIds.length);
        for (uint256 i = 0; i < raccoonIds.length; i++) {
            owners[i] = raccoons.ownerOf(raccoonIds[i]);
        }

        uint256[] memory relicBalances;
        {
            address[] memory users = new address[](relicIds.length);
            for (uint256 i = 0; i < relicIds.length; i++) users[i] = user;
            try relics.balanceOfBatch(users, relicIds) returns (uint256[] memory res) {
                relicBalances = res;
            } catch {
                relicBalances = new uint256[](relicIds.length);
                for (uint256 i = 0; i < relicIds.length; i++) {
                    relicBalances[i] = relics.balanceOf(user, relicIds[i]);
                }
            }
        }

        packed = abi.encode(equipPacks, relicBalances, owners);
    }
}

interface ICosmeticsV2 {
    function getEquippedPackedMany(uint256[] calldata raccoonIds) external view returns (bytes[] memory packs);
}

interface IRaccoons {
    function ownerOf(uint256 tokenId) external view returns (address);
}

interface IRelics {
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids) external view returns (uint256[] memory);
}
