const hre = require("hardhat");
const { ethers } = hre;

async function main() {
    console.log("🚀 Performing direct upgrade with RNG fix...");
    
    const [signer] = await ethers.getSigners();
    console.log("Using account:", signer.address);
    
    // Deploy the Dev RNG fix implementation
    console.log("\n📦 Deploying MawSacrificeV4DevRNGFix...");
    const MawV4DevRNGFix = await ethers.getContractFactory("MawSacrificeV4DevRNGFix");
    const newImplementation = await MawV4DevRNGFix.deploy();
    await newImplementation.waitForDeployment();
    const newImplAddress = await newImplementation.getAddress();
    console.log("✅ New implementation deployed at:", newImplAddress);
    
    // Connect to proxy using the Dev ABI (which should have _authorizeUpgrade allowing immediate upgrades)
    const PROXY_ADDRESS = "0xC6542a6c227Bc4C674E17dbEfc2AEc851f962456";
    console.log("\n🔗 Connecting to proxy at:", PROXY_ADDRESS);
    
    // Try connecting as Dev contract first
    const mawDev = await ethers.getContractAt("MawSacrificeV4Dev", PROXY_ADDRESS);
    
    console.log("\n🎯 Attempting direct upgrade using Dev contract's upgradeToAndCall...");
    try {
        const tx = await mawDev.upgradeToAndCall(newImplAddress, "0x");
        const receipt = await tx.wait();
        console.log("✅ Direct upgrade successful!");
        console.log("Transaction hash:", receipt.hash);
        console.log("New implementation is now active at proxy:", PROXY_ADDRESS);
        
        // Test the new RNG function
        console.log("\n🧪 Testing new RNG function...");
        try {
            const testResult = await mawDev.testRNG(1);
            console.log("RNG test result:", testResult.toString());
        } catch {
            console.log("RNG test function not available (expected if not in Dev mode)");
        }
        
        return;
    } catch (error) {
        console.log("❌ Dev upgrade failed:", error.message);
    }
    
    // If that fails, try UUPSUpgradeable approach
    console.log("\n🔄 Trying standard UUPS upgrade...");
    const mawUUPS = await ethers.getContractAt("UUPSUpgradeable", PROXY_ADDRESS);
    
    try {
        const tx = await mawUUPS.upgradeToAndCall(newImplAddress, "0x");
        const receipt = await tx.wait();
        console.log("✅ UUPS upgrade successful!");
        console.log("Transaction hash:", receipt.hash);
        console.log("New implementation is now active at proxy:", PROXY_ADDRESS);
    } catch (error) {
        console.error("❌ UUPS upgrade also failed:", error.message);
        
        // Check ownership
        const maw = await ethers.getContractAt("MawSacrificeV4Upgradeable", PROXY_ADDRESS);
        const owner = await maw.owner();
        console.log("\n📊 Debug info:");
        console.log("Contract owner:", owner);
        console.log("Your address:", signer.address);
        console.log("Are you the owner?", owner.toLowerCase() === signer.address.toLowerCase());
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });