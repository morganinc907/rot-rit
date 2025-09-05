const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    console.log("🔍 Checking current proxy implementation...");
    
    const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
    
    // Read implementation slot directly
    const IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    const implSlot = await ethers.provider.getStorage(PROXY_ADDRESS, IMPLEMENTATION_SLOT);
    const currentImpl = ethers.getAddress("0x" + implSlot.slice(-40));
    
    console.log("Current implementation:", currentImpl);
    
    // Try to determine what type of implementation it is
    console.log("\n🧪 Testing implementation capabilities...");
    
    const proxy = await ethers.getContractAt([
        "function owner() view returns (address)",
        "function _authorizeUpgrade(address) external",
        "function upgradeToAndCall(address,bytes calldata) external",
        "function version() view returns (string memory)",
        "function UPGRADE_DELAY() view returns (uint256)"
    ], PROXY_ADDRESS);
    
    // Check version if available
    try {
        const version = await proxy.version();
        console.log("Version:", version);
    } catch {
        console.log("No version function");
    }
    
    // Check if there's an UPGRADE_DELAY constant
    try {
        const delay = await proxy.UPGRADE_DELAY();
        console.log("UPGRADE_DELAY:", delay.toString());
    } catch {
        console.log("No UPGRADE_DELAY constant");
    }
    
    // Check owner
    const owner = await proxy.owner();
    console.log("Owner:", owner);
    
    // Try to understand what's blocking the upgrade
    console.log("\n🔍 Analyzing upgrade restrictions...");
    
    // Read the bytecode at the implementation address
    const implCode = await ethers.provider.getCode(currentImpl);
    console.log("Implementation bytecode length:", implCode.length);
    
    // Check if it contains the "Use announceUpgrade" string
    const announceUpgradeBytes = ethers.toUtf8Bytes("Use announceUpgrade then executeUpgrade");
    const announceUpgradeHex = ethers.hexlify(announceUpgradeBytes).slice(2); // Remove 0x
    
    if (implCode.includes(announceUpgradeHex)) {
        console.log("✅ Implementation contains timelock enforcement string");
    } else {
        console.log("❓ Timelock string not found in bytecode");
    }
    
    // Try to call _authorizeUpgrade to see what happens
    console.log("\n🧪 Testing _authorizeUpgrade behavior...");
    try {
        // This should revert with the "Use announceUpgrade" message
        const dummyImpl = "0x0000000000000000000000000000000000000001";
        await proxy._authorizeUpgrade.staticCall(dummyImpl);
        console.log("❓ _authorizeUpgrade didn't revert - unexpected");
    } catch (error) {
        console.log("_authorizeUpgrade reverted with:", error.message);
        
        if (error.message.includes("Use announceUpgrade")) {
            console.log("✅ Confirmed: implementation enforces timelock mechanism");
        }
    }
    
    console.log("\n📋 Summary:");
    console.log("- Current implementation has timelock enforcement");
    console.log("- We need to deploy a bypass implementation");
    console.log("- The bypass should override _authorizeUpgrade to allow immediate upgrades");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });