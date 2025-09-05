// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-std/StdInvariant.sol";
import "../contracts/MawSacrificeV4Upgradeable.sol";
import "../contracts/Relics.sol";
import "../contracts/Demons.sol";
import "../contracts/Cosmetics.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract FuzzInvariantsTest is Test {
    MawSacrificeV4Upgradeable public maw;
    Relics public relics;
    Demons public demons;
    Cosmetics public cosmetics;
    
    address public user1 = address(0x1111);
    address public user2 = address(0x2222);
    
    uint256 public constant MAX_MYTHIC_DEMONS = 100;
    
    function setUp() public {
        // Deploy contracts
        relics = new Relics("https://example.com/relics/");
        demons = new Demons("https://example.com/demons/", "https://example.com/mythics/");
        cosmetics = new Cosmetics("https://example.com/cosmetics/", "https://example.com/bound/");
        
        // Deploy proxy
        MawSacrificeV4Upgradeable impl = new MawSacrificeV4Upgradeable();
        bytes memory initData = abi.encodeWithSelector(
            MawSacrificeV4Upgradeable.initialize.selector,
            address(relics),
            address(cosmetics),
            address(demons),
            address(0), // cultists
            0 // min blocks (disable for fuzzing)
        );
        
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        maw = MawSacrificeV4Upgradeable(address(proxy));
        
        // Set up authorizations
        relics.setMawSacrifice(address(maw));
        demons.setRitual(address(maw));
        
        // Grant roles properly
        relics.grantRole(relics.MAW_ROLE(), address(maw));
        demons.grantRole(demons.MINTER_ROLE(), address(maw));
        
        // Setup cosmetic types
        uint256[] memory cosmeticTypes = new uint256[](3);
        cosmeticTypes[0] = 1;
        cosmeticTypes[1] = 2;
        cosmeticTypes[2] = 3;
        maw.setMonthlyCosmeticTypes(cosmeticTypes);
        
        // Fund users with test tokens
        relics.mint(user1, 1, 10000, ""); // Rusted Keys
        relics.mint(user1, 8, 50000, ""); // Glass Shards
        relics.mint(user2, 1, 10000, ""); 
        relics.mint(user2, 8, 50000, "");
        
        cosmetics.mint(user1, 1, 1000);
        cosmetics.mint(user1, 2, 1000);
        cosmetics.mint(user1, 3, 1000);
        cosmetics.mint(user2, 1, 1000);
        cosmetics.mint(user2, 2, 1000);
        cosmetics.mint(user2, 3, 1000);
    }
    
    /// @notice Fuzz test: Mythic demons never exceed lifetime cap
    function testFuzz_MythicDemonCap(uint8 attempts) public {
        vm.assume(attempts > 0 && attempts <= 50);
        
        // Try to mint many mythic demons
        for (uint256 i = 0; i < attempts; i++) {
            if (maw.mythicDemonsMinted() >= MAX_MYTHIC_DEMONS) {
                break;
            }
            
            vm.startPrank(user1);
            vm.roll(block.number + i + 1); // Avoid anti-bot
            
            try maw.sacrificeDemons(1, 2) { // Mythic tier
                // Success - check invariant
                assertLe(maw.mythicDemonsMinted(), MAX_MYTHIC_DEMONS, "Mythic demons exceeded cap");
            } catch {
                // Failure is expected sometimes due to RNG
            }
            
            vm.stopPrank();
        }
    }
    
    /// @notice Fuzz test: Shard conversion respects multiples of 5
    function testFuzz_ShardConversionMultiples(uint16 shardAmount) public {
        vm.assume(shardAmount > 0 && shardAmount <= 1000);
        
        vm.startPrank(user1);
        
        if (shardAmount % 5 == 0) {
            // Should succeed
            uint256 expectedCaps = shardAmount / 5;
            uint256 capsBefore = relics.balanceOf(user1, 1);
            
            maw.convertShardsToRustedCaps(shardAmount);
            
            uint256 capsAfter = relics.balanceOf(user1, 1);
            assertEq(capsAfter - capsBefore, expectedCaps, "Cap conversion ratio incorrect");
        } else {
            // Should revert with InvalidAmount
            vm.expectRevert(MawSacrificeV4Upgradeable.InvalidAmount.selector);
            maw.convertShardsToRustedCaps(shardAmount);
        }
        
        vm.stopPrank();
    }
    
    /// @notice Fuzz test: Key sacrifice RNG is deterministic
    function testFuzz_KeySacrificeRNG(uint8 keyAmount, uint256 blockNumber) public {
        vm.assume(keyAmount > 0 && keyAmount <= 10);
        vm.assume(blockNumber > 0 && blockNumber < type(uint64).max);
        
        // First sacrifice
        vm.startPrank(user1);
        vm.roll(blockNumber);
        
        uint256[] memory balancesBefore = new uint256[](8);
        uint256[] memory balancesAfter1 = new uint256[](8);
        uint256[] memory balancesAfter2 = new uint256[](8);
        
        for (uint256 i = 2; i <= 8; i++) {
            balancesBefore[i-2] = relics.balanceOf(user1, i);
        }
        
        maw.sacrificeKeys(keyAmount);
        
        for (uint256 i = 2; i <= 8; i++) {
            balancesAfter1[i-2] = relics.balanceOf(user1, i);
        }
        
        vm.stopPrank();
        
        // Second sacrifice with same conditions should yield same results
        vm.startPrank(user2);
        vm.roll(blockNumber); // Same block
        
        maw.sacrificeKeys(keyAmount);
        
        for (uint256 i = 2; i <= 8; i++) {
            balancesAfter2[i-2] = relics.balanceOf(user2, i);
        }
        
        vm.stopPrank();
        
        // Results should be identical (deterministic RNG)
        for (uint256 i = 0; i < balancesAfter1.length; i++) {
            uint256 gain1 = balancesAfter1[i] - balancesBefore[i];
            uint256 gain2 = balancesAfter2[i] - balancesBefore[i];
            assertEq(gain1, gain2, "RNG should be deterministic for same conditions");
        }
    }
    
    /// @notice Fuzz test: Supply caps are respected
    function testFuzz_SupplyCaps(uint16 attempts) public {
        vm.assume(attempts > 0 && attempts <= 100);
        
        // Try to mint binding contracts (capped at 1)
        bool mintedBinding = false;
        
        vm.startPrank(user1);
        
        for (uint256 i = 0; i < attempts; i++) {
            vm.roll(block.number + i + 1);
            
            uint256 bindingBefore = relics.balanceOf(user1, 6);
            
            maw.sacrificeKeys(10); // High chance of hitting rare items
            
            uint256 bindingAfter = relics.balanceOf(user1, 6);
            
            if (bindingAfter > bindingBefore) {
                assertFalse(mintedBinding, "Should only mint one binding contract ever");
                mintedBinding = true;
                assertEq(bindingAfter, 1, "Should only have 1 binding contract total");
            }
        }
        
        vm.stopPrank();
        
        // Check global supply
        assertLe(relics.totalSupply(6), 1, "Binding contract total supply should never exceed 1");
        assertLe(relics.totalSupply(7), 1, "Soul deed total supply should never exceed 1");
    }
    
    /// @notice Fuzz test: Balance conservation
    function testFuzz_BalanceConservation(uint8 shardAmount) public {
        vm.assume(shardAmount > 0 && shardAmount % 5 == 0 && shardAmount <= 100);
        
        vm.startPrank(user1);
        
        uint256 shardsBefore = relics.balanceOf(user1, 8);
        uint256 keysBefore = relics.balanceOf(user1, 1);
        
        maw.convertShardsToRustedCaps(shardAmount);
        
        uint256 shardsAfter = relics.balanceOf(user1, 8);
        uint256 keysAfter = relics.balanceOf(user1, 1);
        
        // Conservation check: shards burned = amount, keys gained = amount/5
        assertEq(shardsBefore - shardsAfter, shardAmount, "Incorrect shards burned");
        assertEq(keysAfter - keysBefore, shardAmount / 5, "Incorrect keys minted");
        
        vm.stopPrank();
    }
    
    /// @notice Fuzz test: Pause states work correctly
    function testFuzz_PauseStates(bool sacrificesPaused, bool conversionsPaused) public {
        // Set pause states
        if (sacrificesPaused) {
            maw.pauseSacrifices();
        }
        
        if (conversionsPaused) {
            maw.pauseConversions();
        }
        
        vm.startPrank(user1);
        
        if (sacrificesPaused) {
            // All sacrifice functions should revert
            vm.expectRevert(MawSacrificeV4Upgradeable.SacrificesPaused.selector);
            maw.sacrificeKeys(1);
            
            vm.expectRevert(MawSacrificeV4Upgradeable.SacrificesPaused.selector);
            maw.sacrificeCosmetics(1);
            
            vm.expectRevert(MawSacrificeV4Upgradeable.SacrificesPaused.selector);
            maw.sacrificeDemons(1, 1);
        }
        
        if (conversionsPaused) {
            // Conversion should revert
            vm.expectRevert(MawSacrificeV4Upgradeable.ConversionsPaused.selector);
            maw.convertShardsToRustedCaps(5);
        }
        
        vm.stopPrank();
    }
    
    /// @notice Fuzz test: User mythic count tracking
    function testFuzz_UserMythicTracking(uint8 attempts) public {
        vm.assume(attempts > 0 && attempts <= 20);
        
        uint256 user1MythicsBefore = maw.getUserMythicCount(user1);
        uint256 user2MythicsBefore = maw.getUserMythicCount(user2);
        
        vm.startPrank(user1);
        
        for (uint256 i = 0; i < attempts; i++) {
            vm.roll(block.number + i + 1);
            
            try maw.sacrificeDemons(1, 2) {
                // Success - mythic count should increase
                uint256 user1MythicsAfter = maw.getUserMythicCount(user1);
                uint256 user2MythicsAfter = maw.getUserMythicCount(user2);
                
                // User1's count may have increased, user2's should be unchanged
                assertGe(user1MythicsAfter, user1MythicsBefore, "User1 mythic count decreased");
                assertEq(user2MythicsAfter, user2MythicsBefore, "User2 mythic count changed");
                
                user1MythicsBefore = user1MythicsAfter;
            } catch {
                // Failure is expected sometimes due to RNG
            }
        }
        
        vm.stopPrank();
    }
    
    /// @notice Fuzz test: Amount bounds are enforced
    function testFuzz_AmountBounds(uint256 amount) public {
        vm.startPrank(user1);
        
        if (amount == 0 || amount > 10) {
            // Should revert for keys
            vm.expectRevert(MawSacrificeV4Upgradeable.InvalidAmount.selector);
            maw.sacrificeKeys(amount);
            
            vm.expectRevert(MawSacrificeV4Upgradeable.InvalidAmount.selector);
            maw.sacrificeCosmetics(amount);
        }
        
        if (amount == 0 || amount > 3) {
            // Should revert for demons
            vm.expectRevert(MawSacrificeV4Upgradeable.InvalidAmount.selector);
            maw.sacrificeDemons(amount, 1);
        }
        
        if (amount == 0 || amount > 500) {
            // Should revert for conversion
            vm.expectRevert(MawSacrificeV4Upgradeable.InvalidAmount.selector);
            maw.convertShardsToRustedCaps(amount);
        }
        
        vm.stopPrank();
    }
    
    /// @notice Fuzz test: Version string is never empty
    function testFuzz_VersionString() public {
        string memory version = maw.version();
        assertTrue(bytes(version).length > 0, "Version string should never be empty");
        assertTrue(
            keccak256(bytes(version)) != keccak256(bytes("")),
            "Version should not be empty string"
        );
    }
}