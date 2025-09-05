// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-std/StdUtils.sol";
import "../contracts/MawSacrificeV4Upgradeable.sol";
import "../contracts/Relics.sol";
import "../contracts/Demons.sol";
import "../contracts/Cosmetics.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract GasSnapshotsTest is Test {
    MawSacrificeV4Upgradeable public maw;
    Relics public relics;
    Demons public demons;
    Cosmetics public cosmetics;
    
    address public user = address(0x1234);
    
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
            1 // min blocks
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
        
        // Fund user with test tokens
        relics.mint(user, 1, 100, ""); // Rusted Keys
        relics.mint(user, 8, 500, ""); // Glass Shards
        cosmetics.mint(user, 1, 50);   // Cosmetics
        cosmetics.mint(user, 2, 50);
        cosmetics.mint(user, 3, 50);
        
        vm.deal(user, 1 ether);
    }
    
    /// @notice Test gas costs for key sacrifice (hot path)
    function testGas_SacrificeKeys_Single() public {
        vm.startPrank(user);
        
        uint256 gasStart = gasleft();
        maw.sacrificeKeys(1);
        uint256 gasUsed = gasStart - gasleft();
        
        vm.stopPrank();
        
        // Store snapshot
        vm.writeFile(
            "./gas-snapshots/sacrifice-keys-1.txt",
            vm.toString(gasUsed)
        );
        
        console.log("SacrificeKeys(1) gas used:", gasUsed);
        assertLt(gasUsed, 150000, "Single key sacrifice should use < 150k gas");
    }
    
    /// @notice Test gas costs for multiple key sacrifice
    function testGas_SacrificeKeys_Multiple() public {
        vm.startPrank(user);
        
        uint256 gasStart = gasleft();
        maw.sacrificeKeys(5);
        uint256 gasUsed = gasStart - gasleft();
        
        vm.stopPrank();
        
        vm.writeFile(
            "./gas-snapshots/sacrifice-keys-5.txt",
            vm.toString(gasUsed)
        );
        
        console.log("SacrificeKeys(5) gas used:", gasUsed);
        assertLt(gasUsed, 400000, "5 key sacrifice should use < 400k gas");
    }
    
    /// @notice Test gas costs for shard conversion (hot path)
    function testGas_ConvertShardsToRustedCaps() public {
        vm.startPrank(user);
        
        uint256 gasStart = gasleft();
        maw.convertShardsToRustedCaps(25); // 25 shards → 5 caps
        uint256 gasUsed = gasStart - gasleft();
        
        vm.stopPrank();
        
        vm.writeFile(
            "./gas-snapshots/convert-shards-25.txt",
            vm.toString(gasUsed)
        );
        
        console.log("ConvertShards(25) gas used:", gasUsed);
        assertLt(gasUsed, 100000, "Shard conversion should use < 100k gas");
    }
    
    /// @notice Test gas costs for cosmetic sacrifice (hot path)
    function testGas_SacrificeCosmetics() public {
        vm.startPrank(user);
        
        uint256 gasStart = gasleft();
        maw.sacrificeCosmetics(3);
        uint256 gasUsed = gasStart - gasleft();
        
        vm.stopPrank();
        
        vm.writeFile(
            "./gas-snapshots/sacrifice-cosmetics-3.txt", 
            vm.toString(gasUsed)
        );
        
        console.log("SacrificeCosmetics(3) gas used:", gasUsed);
        assertLt(gasUsed, 350000, "Cosmetic sacrifice should use < 350k gas");
    }
    
    /// @notice Test gas costs for demon sacrifice (rare path)
    function testGas_SacrificeDemons() public {
        vm.startPrank(user);
        
        // Skip blocks to avoid antiBot
        vm.roll(block.number + 10);
        
        uint256 gasStart = gasleft();
        maw.sacrificeDemons(2, 1); // 2 demons, tier 1
        uint256 gasUsed = gasStart - gasleft();
        
        vm.stopPrank();
        
        vm.writeFile(
            "./gas-snapshots/sacrifice-demons-2.txt",
            vm.toString(gasUsed)
        );
        
        console.log("SacrificeDemons(2) gas used:", gasUsed);
        assertLt(gasUsed, 400000, "Demon sacrifice should use < 400k gas");
    }
    
    /// @notice Baseline gas cost for proxy calls
    function testGas_ProxyOverhead() public {
        uint256 gasStart = gasleft();
        maw.version();
        uint256 gasUsed = gasStart - gasleft();
        
        vm.writeFile(
            "./gas-snapshots/proxy-overhead.txt",
            vm.toString(gasUsed)
        );
        
        console.log("Proxy overhead gas used:", gasUsed);
        assertLt(gasUsed, 5000, "Proxy overhead should be < 5k gas");
    }
    
    /// @notice Test that gas usage doesn't spike by more than 20% from baseline
    function testGas_RegressionCheck() public {
        // Read previous snapshots and compare
        string memory prevKeys1 = vm.readFile("./gas-snapshots/sacrifice-keys-1.txt");
        string memory prevConvert = vm.readFile("./gas-snapshots/convert-shards-25.txt");
        
        // Run current tests
        vm.startPrank(user);
        
        uint256 gasStart = gasleft();
        maw.sacrificeKeys(1);
        uint256 currentKeys = gasStart - gasleft();
        
        vm.roll(block.number + 10);
        
        gasStart = gasleft();
        maw.convertShardsToRustedCaps(25);
        uint256 currentConvert = gasStart - gasleft();
        
        vm.stopPrank();
        
        // Compare against baselines (allow 20% increase)
        if (bytes(prevKeys1).length > 0) {
            uint256 prevKeysGas = vm.parseUint(prevKeys1);
            uint256 maxAllowed = prevKeysGas * 120 / 100; // 20% increase
            assertLt(currentKeys, maxAllowed, "Key sacrifice gas increased by > 20%");
        }
        
        if (bytes(prevConvert).length > 0) {
            uint256 prevConvertGas = vm.parseUint(prevConvert);
            uint256 maxAllowed = prevConvertGas * 120 / 100;
            assertLt(currentConvert, maxAllowed, "Shard conversion gas increased by > 20%");
        }
    }
    
    /// @notice Test gas costs scale linearly with amount
    function testGas_LinearScaling() public {
        vm.startPrank(user);
        
        // Test 1 key
        uint256 gasStart = gasleft();
        maw.sacrificeKeys(1);
        uint256 gas1 = gasStart - gasleft();
        
        vm.roll(block.number + 10);
        
        // Test 5 keys
        gasStart = gasleft();
        maw.sacrificeKeys(5);
        uint256 gas5 = gasStart - gasleft();
        
        vm.stopPrank();
        
        // Gas should scale roughly linearly (allow some overhead)
        uint256 expectedGas5 = gas1 * 5;
        uint256 tolerance = expectedGas5 * 30 / 100; // 30% tolerance for overhead
        
        assertLt(gas5, expectedGas5 + tolerance, "Gas scaling is not linear");
        assertGt(gas5, expectedGas5 - tolerance, "Gas scaling is suspiciously low");
        
        console.log("Linear scaling check - 1 key:", gas1, "5 keys:", gas5);
    }
}