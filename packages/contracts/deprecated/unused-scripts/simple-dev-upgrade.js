const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    console.log("🔧 Simple Dev Upgrade (Remove Timelock)");
    
    const [signer] = await ethers.getSigners();
    console.log("Using account:", signer.address);
    
    const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
    console.log("Proxy address:", PROXY_ADDRESS);
    
    // Use existing Dev implementation to avoid gas issues
    const EXISTING_DEV_IMPL = "0x1f9D52D93c34Ad73B47B98ca50A96BEc38cd6AE5"; // From previous run
    console.log("Using existing Dev implementation:", EXISTING_DEV_IMPL);
    
    // Connect to proxy as owner
    const proxy = await ethers.getContractAt("MawSacrificeV4Upgradeable", PROXY_ADDRESS);
    
    // Verify ownership
    const owner = await proxy.owner();
    console.log("Proxy owner:", owner);
    
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
        throw new Error("You are not the owner!");
    }
    
    // Try the direct upgrade first
    console.log("\n⚡ Attempting direct upgrade to Dev implementation...");
    try {
        const tx = await proxy.upgradeToAndCall(EXISTING_DEV_IMPL, "0x", {
            gasLimit: 500000  // Set explicit gas limit
        });
        const receipt = await tx.wait();
        console.log("✅ Upgrade successful!");
        console.log("Transaction hash:", receipt.hash);
        
        // Now test if we can upgrade again (no timelock)
        console.log("\n🧪 Testing immediate re-upgrade capability...");
        const tx2 = await proxy.upgradeToAndCall(EXISTING_DEV_IMPL, "0x", {
            gasLimit: 500000
        });
        await tx2.wait();
        console.log("✅ Second upgrade successful - timelock removed!");
        
    } catch (error) {
        console.error("❌ Direct upgrade failed:", error.message);
        
        if (error.message.includes("Use announceUpgrade")) {
            console.log("\n🔍 Current implementation enforces timelock.");
            console.log("We need to create a custom implementation that bypasses this.");
            
            // Deploy a minimal bypass implementation
            console.log("\n📦 Deploying bypass implementation...");
            
            // Create a simple contract that just allows upgrades
            const bypassCode = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./MawSacrificeV4Upgradeable.sol";

contract MawSacrificeV4Bypass is MawSacrificeV4Upgradeable {
    function _authorizeUpgrade(address) internal override onlyOwner {
        // Allow immediate upgrades - no timelock
    }
    
    function emergencyUpgrade(address newImplementation) external onlyOwner {
        _upgradeToAndCallUUPS(newImplementation, "", false);
    }
}`;
            
            console.log("Need to create bypass contract manually...");
            throw new Error("Timelock is enforced at implementation level");
        }
        
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });